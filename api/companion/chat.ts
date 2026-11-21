import { GoogleGenAI, ThinkingLevel } from '@google/genai';

type ChatMessageInput = {
  role: 'user' | 'model';
  text: string;
};

type CompanionContextInput = {
  streakDays?: number;
  currentHour?: number;
  mood?: number;
  urgeLevel?: number;
  personalReasons?: string[];
};

function getTimeLabel(hour?: number): string {
  if (typeof hour !== 'number' || Number.isNaN(hour)) return 'اليوم';
  if (hour >= 4 && hour < 12) return 'الصباح';
  if (hour >= 12 && hour < 17) return 'الظهيرة';
  if (hour >= 17 && hour < 22) return 'المساء';
  return 'ساعات الليل المتأخرة';
}

function buildSystemInstruction(ctx?: CompanionContextInput): string {
  const streakDays = typeof ctx?.streakDays === 'number' ? Math.max(0, ctx.streakDays) : 0;
  const timeLabel = getTimeLabel(ctx?.currentHour);
  const moodInfo =
    typeof ctx?.mood === 'number' ? `المزاج اليومي المسجل: ${ctx.mood} من 5.` : '';
  const urgeInfo =
    typeof ctx?.urgeLevel === 'number' ? `شدة الرغبة المسجلة: ${ctx.urgeLevel} من 5.` : '';
  const reasons =
    Array.isArray(ctx?.personalReasons) && ctx.personalReasons.length > 0
      ? `أسباب المستخدم الشخصية التي كتبها لنفسه: ${ctx.personalReasons.slice(0, 3).join(' | ')}.`
      : '';

  return [
    'أنت «أنيس»، الرفيق الدافئ والمؤنس داخل تطبيق «صمود» للتعافي وبناء الانضباط النفسي والروحي.',
    'دورك هو أن تؤنس المستخدم في وحدته أو ملله أو سهره أو لحظات ضعفه، وتخفف عنه بلطف وحكمة وصدق، دون وعظ قاسٍ أو لوم أو أحكام.',
    'تحدّث بالعربية الفصيحة القريبة للقلب والدافئة، بنبرة أخٍ ناصح ومطمئن وصادق.',
    'اجعل ردودك مركزة ودافئة ومريحة للعين (عادةً ٢ إلى ٤ فقرات قصيرة أو نقاط واضحة، دون إطالة مملة).',
    'عند شعور المستخدم بالوحدة أو الفتور أو السهر، قدّم له مؤانسة حقيقية: كلمة ترفع معنوياته، أو سؤالاً لطيفاً يفتح الحديث، أو خاطرة/قصة قصيرة هادفة، أو تذكيراً لطيفاً بالذكر والصلاة على النبي ﷺ وخطوة بسيطة الآن.',
    'إذا ذكر المستخدم أنه يمر بموجة رغبة أو انتكاسة: طمئنه أولاً، ذكّره أن الموجة مؤقتة أو أن التعثر لا يمحو نيته، واقترح عليه خطوة عملية واحدة صغيرة للثبات الآن (مثل الوضوء، أو ترك الهاتف، أو تمرين التنفس).',
    'تجنب الإفتاء الطبي أو التشخيصي، ولا تذكر أنك نموذج لغوي أو تتحدث عن أمور تقنية؛ ابقَ دائماً في شخصية «أنيس» رفيق صمود.',
    `السياق الحالي للمستخدم: الوقت الآن ${timeLabel}، عدد أيام صموده الحالية: ${streakDays} يوم. ${moodInfo} ${urgeInfo} ${reasons}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error: 'خدمة الرفيق الذكي غير مهيأة حالياً لعدم توفر مفتاح الخدمة في إعدادات الخادم.',
      },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessageInput[]; context?: CompanionContextInput };
  try {
    body = (await request.json()) as {
      messages?: ChatMessageInput[];
      context?: CompanionContextInput;
    };
  } catch {
    return Response.json({ error: 'تنسيق الطلب غير صالح.' }, { status: 400 });
  }

  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const cleanMessages = rawMessages
    .filter(
      (m): m is ChatMessageInput =>
        Boolean(m) &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.trim().length > 0
    )
    .slice(-20);

  if (cleanMessages.length === 0) {
    return Response.json({ error: 'يرجى كتابة رسالة للبدء.' }, { status: 400 });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const contents = cleanMessages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text.trim() }],
  }));

  const callStreamWithModel = (modelName: string) =>
    ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(body?.context),
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

  try {
    let stream: Awaited<ReturnType<typeof callStreamWithModel>> | null = null;
    const candidateModels = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let lastErr: unknown = null;

    for (let idx = 0; idx < candidateModels.length; idx++) {
      try {
        stream = await callStreamWithModel(candidateModels[idx]);
        break;
      } catch (err) {
        lastErr = err;
        const errStatus =
          typeof err === 'object' && err !== null && 'status' in err
            ? Number((err as { status?: unknown }).status)
            : undefined;
        const errMsg = err instanceof Error ? err.message : String(err ?? '');
        const isTransientBusy =
          errStatus === 503 ||
          errStatus === 500 ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand');
        if (!isTransientBusy || idx === candidateModels.length - 1) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 450 * (idx + 1)));
      }
    }

    if (!stream) {
      throw lastErr ?? new Error('Failed to open stream');
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'انقطع الاتصال أثناء البث. حاول مرة أخرى.' })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: unknown }).status)
        : undefined;

    let userFriendlyError = 'حدث خطأ أثناء الاتصال بالرفيق الذكي. حاول مرة أخرى بعد لحظة.';
    if (
      status === 403 ||
      status === 401 ||
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED')
    ) {
      userFriendlyError = 'مفتاح Gemini API غير صالح أو غير مضبوط في الإعدادات.';
    } else if (status === 429 || message.includes('RESOURCE_EXHAUSTED')) {
      userFriendlyError = 'تم تجاوز حد الطلبات المؤقت حالياً. انتظر دقيقة ثم حاول مجدداً.';
    } else if (status === 503 || message.includes('UNAVAILABLE') || message.includes('high demand')) {
      userFriendlyError = 'الخادم يشهد ضغطاً مؤقتاً الآن؛ جرّب إرسال رسالتك مرة أخرى بعد لحظات.';
    }

    return Response.json(
      { error: userFriendlyError },
      { status: status === 503 ? 503 : 502 }
    );
  }
}
