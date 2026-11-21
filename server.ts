import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

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

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/companion/chat', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'خدمة الرفيق الذكي غير مهيأة حالياً لعدم توفر مفتاح الخدمة في إعدادات الخادم.',
      });
      return;
    }

    const body = req.body as {
      messages?: ChatMessageInput[];
      context?: CompanionContextInput;
    };

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
      res.status(400).json({ error: 'يرجى كتابة رسالة للبدء.' });
      return;
    }

    const contents = cleanMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text.trim() }],
    }));

    try {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: buildSystemInstruction(body?.context),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تعذر التواصل مع الرفيق الذكي الآن.';
      console.error('[companion/chat] error:', message);

      let userFriendlyError = 'حدث خطأ أثناء الاتصال بالرفيق الذكي. حاول مرة أخرى بعد لحظة.';
      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        userFriendlyError = 'مفتاح الخدمة غير صالح أو غير مصرح له. يرجى مراجعة الإعدادات.';
      } else if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        userFriendlyError = 'تم تجاوز حد الطلبات المؤقت حالياً. انتظر دقيقة ثم حاول مجدداً.';
      }

      if (!res.headersSent) {
        res.status(502).json({ error: userFriendlyError });
      } else {
        res.write(`data: ${JSON.stringify({ error: userFriendlyError })}\n\n`);
        res.end();
      }
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Somoud server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
