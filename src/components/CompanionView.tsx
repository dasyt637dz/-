import { HeartHandshake, RefreshCw, Send, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getLocalDateKey, getStreakMetrics } from '../hooks/useRecoveryStore';
import { NavTab, RecoveryState } from '../types/recovery';

interface CompanionViewProps {
  state: RecoveryState;
  onNavigate: (tab: NavTab) => void;
}

interface CompanionMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

const CHAT_STORAGE_KEY = 'somoud_companion_chat_v1';

const QUICK_PROMPTS = [
  'أشعر بالوحدة والملل الآن، حدّثني وآنسني',
  'أمرّ بموجة رغبة قوية وأحتاج كلمة تثبّتني',
  'سهران وحدي والليل ثقيل، كيف أهدّئ نفسي؟',
  'أحبطتني نفسي أو تعثرت، كيف أنهض من جديد؟',
  'احكِ لي خاطرة أو قصة قصيرة ترفع همتي',
  'ذكّرني بفضل الصبر والصلاة على النبي ﷺ',
];

function getTimeGreeting(hour: number): string {
  if (hour >= 4 && hour < 12) return 'طاب صباحك — بداية نقية ويوم جديد في صفّك';
  if (hour >= 12 && hour < 17) return 'طاب يومك — أنا هنا أرافقك وأسمعك في أي وقت';
  if (hour >= 17 && hour < 22) return 'مساء السكينة — كيف حال قلبك مع نهاية هذا اليوم؟';
  return 'ساعات الليل تمرّ بسلام، لست وحدك — أنا معك لنعبر هذا الوقت بثبات';
}

function loadSavedMessages(): CompanionMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is CompanionMessage =>
        Boolean(m) &&
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string'
    );
  } catch {
    return [];
  }
}

export function CompanionView({ state, onNavigate }: CompanionViewProps) {
  const [messages, setMessages] = useState<CompanionMessage[]>(loadSavedMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const metrics = getStreakMetrics(state.streakStartedAt);
  const todayCheckIn = state.checkIns[getLocalDateKey()];
  const currentHour = new Date().getHours();
  const greeting = useMemo(() => getTimeGreeting(currentHour), [currentHour]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isStreaming) return;

    setErrorText(null);
    const userMsg: CompanionMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    const modelMsgId = `m_${Date.now() + 1}`;
    const placeholderModelMsg: CompanionMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, placeholderModelMsg]);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          context: {
            streakDays: metrics.days,
            currentHour: new Date().getHours(),
            mood: todayCheckIn?.mood,
            urgeLevel: todayCheckIn?.urgeLevel,
            personalReasons: state.personalReasons,
          },
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let serverError = 'تعذر الوصول إلى رفيق الأُنس حالياً.';
        if (contentType.includes('application/json')) {
          const errJson = (await response.json()) as { error?: string };
          if (errJson?.error) serverError = errJson.error;
        }
        throw new Error(serverError);
      }

      if (!response.body) {
        throw new Error('لم يردّ الخادم ببيانات صالحة.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payloadRaw = line.slice(6).trim();
            if (!payloadRaw) continue;
            const parsed = JSON.parse(payloadRaw) as {
              text?: string;
              error?: string;
              done?: boolean;
            };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m))
              );
            }
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('لم يصل رد واضح، جرّب إرسال رسالتك مرة أخرى.');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const errMessage =
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء الاتصال. تأكد من اتصالك بالإنترنت ثم حاول مجدداً.';
      setErrorText(errMessage);
      // Remove empty model bubble if failed before receiving text
      setMessages((prev) =>
        prev.filter((m) => !(m.id === modelMsgId && m.text.trim().length === 0))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleClearChat = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setErrorText(null);
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    // Drop trailing user message then resend cleanly
    const lastIdx = messages.lastIndexOf(lastUserMsg);
    const trimmed = messages.slice(0, lastIdx);
    setMessages(trimmed);
    setErrorText(null);
    window.setTimeout(() => {
      void sendMessage(lastUserMsg.text);
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FEF4BE] dark:bg-[#26351F] border border-[#D9A714]/60 dark:border-[#ECC93B]/50 flex items-center justify-center shrink-0">
              <HeartHandshake
                className="w-5 h-5 text-[#9A6B06] dark:text-[#ECC93B]"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
                  أنيس — رفيقك للمؤانسة والثبات
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EEF3DF] dark:bg-[#26351F] text-[11px] font-semibold text-[#2F6E1B] dark:text-[#65C449] tabular-nums">
                  {metrics.days} يوم صمود
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] mt-1">
                {greeting}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('sos')}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#C98F0A] dark:text-[#ECC93B]" aria-hidden="true" />
              <span>بروتوكول الطوارئ</span>
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#556442] dark:text-[#A2B193] hover:text-[#DC2626] dark:hover:text-[#F87171] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>محادثة جديدة</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Conversation Container */}
      <section className="bg-[#FCFDF7]/92 dark:bg-[#192315]/92 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl flex flex-col min-h-[520px] max-h-[70vh]">
        {/* Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto py-4 text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FEF4BE]/70 dark:bg-[#26351F] border border-[#D9A714]/40 text-xs font-medium text-[#785204] dark:text-[#ECC93B]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>فضفضة هادئة ومؤانسة بدون أحكام</span>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  بمَ تشعر في هذه اللحظة؟
                </h2>
                <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
                  اكتب ما يدور في بالك بحرية، أو اختر بداية سريعة من الأسفل لنتحدث معاً ونخفف ثقل
                  الوقت أو الملل أو الوحدة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="p-3.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] hover:border-[#C98F0A] dark:hover:border-[#ECC93B] text-xs sm:text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isEmptyStreaming = !isUser && msg.text.length === 0 && isStreaming;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9]'
                      }`}
                    >
                      {!isUser && (
                        <div className="text-[11px] font-semibold text-[#9A6B06] dark:text-[#ECC93B] mb-1">
                          أنيس
                        </div>
                      )}
                      {isEmptyStreaming ? (
                        <span className="text-xs text-[#556442] dark:text-[#A2B193] animate-pulse">
                          يستمع إليك ويكتب كلمات تريح قلبك...
                        </span>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errorText && (
            <div className="rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
              <span>{errorText}</span>
              <button
                type="button"
                onClick={handleRetryLast}
                className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg bg-[#DC2626] text-white font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          <div ref={listEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] bg-[#FCFDF7]/95 dark:bg-[#192315]/95 rounded-b-2xl space-y-2.5"
        >
          {messages.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendMessage(prompt)}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-[11px] text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] disabled:opacity-50 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <label htmlFor="companion-input" className="sr-only">
              اكتب رسالتك إلى أنيس
            </label>
            <textarea
              id="companion-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="تحدث مع أنيس بما في خاطرك الآن..."
              disabled={isStreaming}
              className="flex-1 min-h-[48px] max-h-32 p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A] resize-none"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="إرسال"
              className="min-h-[48px] px-4 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </div>
          <p className="text-[11px] text-[#556442] dark:text-[#A2B193]">
            سجل الحوار محفوظ على جهازك فقط بخصوصية تامة.
          </p>
        </form>
      </section>
    </div>
  );
}
