import { Bell, Check, Download, Lock, Moon, Share2, Sparkles, Sun, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { DISCOVERY_METHODS, WEAKNESS_PLANS } from '../data/recoveryContent';
import { BrowserNotificationStatus } from '../hooks/useSpiritualReminders';
import {
  NotificationPreferences,
  OnboardingIntent,
  OnboardingProfile,
  RecoveryState,
  ThemeMode,
  WeaknessId,
} from '../types/recovery';
import { PWAInstallButton } from './PWAInstallButton';

interface PrivacySettingsViewProps {
  state: RecoveryState;
  notificationPermission: BrowserNotificationStatus;
  onSetTheme: (theme: ThemeMode) => void;
  onSetStartDate: (isoDate: string) => void;
  onSetPin: (pin: string | null) => void;
  onLockNow: () => void;
  onSaveOnboarding: (profile: OnboardingProfile) => void;
  onSelectWeakness: (weaknessId: WeaknessId | null) => void;
  onUpdateNotifications: (partial: Partial<NotificationPreferences>) => void;
  onRequestNotificationPermission: () => void;
  onPreviewSalawatBanner: () => void;
  onPreviewSteadfastCheck: () => void;
  onImportState: (rawJson: string) => boolean;
  onClearAllData: () => void;
}

function toLocalDateTimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function PrivacySettingsView({
  state,
  notificationPermission,
  onSetTheme,
  onSetStartDate,
  onSetPin,
  onLockNow,
  onSaveOnboarding,
  onSelectWeakness,
  onUpdateNotifications,
  onRequestNotificationPermission,
  onPreviewSalawatBanner,
  onPreviewSteadfastCheck,
  onImportState,
  onClearAllData,
}: PrivacySettingsViewProps) {
  const [startInput, setStartInput] = useState(() =>
    toLocalDateTimeInputValue(state.streakStartedAt)
  );
  const [startSaved, setStartSaved] = useState(false);

  const [ageDraft, setAgeDraft] = useState<string>(
    state.onboarding.age ? String(state.onboarding.age) : ''
  );
  const [discoveryDraft, setDiscoveryDraft] = useState<string>(
    state.onboarding.discoveryMethod || DISCOVERY_METHODS[0]
  );
  const [intentDraft, setIntentDraft] = useState<OnboardingIntent>(
    state.onboarding.intent ?? 'quit'
  );
  const [profileSaved, setProfileSaved] = useState(false);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: 'صمود — رفيق التعافي وبناء الانضباط',
      text: 'تطبيق صمود المجاني بخصوصية تامة على جهازك لبناء الانضباط والثبات.',
      url: shareUrl,
    };
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareFeedback('تم فتح قائمة المشاركة');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('تم نسخ رابط التطبيق للمشاركة');
      }
    } catch {
      try {
        await navigator.clipboard?.writeText(shareUrl);
        setShareFeedback('تم نسخ رابط التطبيق للمشاركة');
      } catch {
        setShareFeedback('');
      }
    }
    window.setTimeout(() => setShareFeedback(''), 3000);
  };

  const handleSaveStartDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startInput) return;
    onSetStartDate(new Date(startInput).toISOString());
    setStartSaved(true);
    window.setTimeout(() => setStartSaved(false), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAge = ageDraft.trim() ? Number(ageDraft) : null;
    onSaveOnboarding({
      completed: true,
      age: numericAge && numericAge >= 10 && numericAge <= 99 ? numericAge : null,
      discoveryMethod: discoveryDraft,
      discoveryCustom: state.onboarding.discoveryCustom,
      intent: intentDraft,
    });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('يرجى إدخال ٤ أرقام إنجليزية فقط (مثل 1234)');
      setPinSuccess('');
      return;
    }
    onSetPin(pinInput);
    setPinInput('');
    setPinError('');
    setPinSuccess('تم تفعيل قفل الخصوصية بنجاح');
    window.setTimeout(() => setPinSuccess(''), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `somoud-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const ok = onImportState(content);
      setImportMessage({
        ok,
        text: ok
          ? 'تمت استعادة النسخة الاحتياطية بنجاح.'
          : 'ملف النسخة الاحتياطية غير صالح أو تالف.',
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              الإعدادات والخصوصية
            </h1>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1 leading-relaxed">
              جميع بياناتك محفوظة محلياً داخل متصفح هذا الجهاز فقط ولا تُرسل إلى أي خادم خارجي.
            </p>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3.5"
          >
            <div className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              تعريفك الأول
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="profile-age"
                  className="block text-xs text-[#556442] dark:text-[#A2B193] mb-1"
                >
                  العمر
                </label>
                <input
                  id="profile-age"
                  type="number"
                  min={10}
                  max={99}
                  value={ageDraft}
                  onChange={(e) => setAgeDraft(e.target.value)}
                  placeholder="غير محدد"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-discovery"
                  className="block text-xs text-[#556442] dark:text-[#A2B193] mb-1"
                >
                  بداية التعرّف
                </label>
                <select
                  id="profile-discovery"
                  value={discoveryDraft}
                  onChange={(e) => setDiscoveryDraft(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
                >
                  {DISCOVERY_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="text-xs text-[#556442] dark:text-[#A2B193] mb-1.5">نيتك الحالية</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIntentDraft('quit')}
                  className={`min-h-[42px] px-3 rounded-xl border text-xs font-medium cursor-pointer ${
                    intentDraft === 'quit'
                      ? 'bg-[#C98F0A]/10 border-[#C98F0A] text-[#9A6B06] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B] dark:text-[#ECC93B]'
                      : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  أريد التوقف فعلاً
                </button>
                <button
                  type="button"
                  onClick={() => setIntentDraft('curious')}
                  className={`min-h-[42px] px-3 rounded-xl border text-xs font-medium cursor-pointer ${
                    intentDraft === 'curious'
                      ? 'bg-[#FEF4BE]/60 border-[#D97706] text-[#92400E] dark:bg-[#78350F]/30 dark:border-[#F59E0B] dark:text-[#F8DF6B]'
                      : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  بدافع الفضول فقط
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="min-h-[42px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-medium cursor-pointer"
            >
              {profileSaved ? 'تم تحديث بياناتك' : 'حفظ التعديلات'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
            <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-2.5">
              مظهر التطبيق
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`min-h-[42px] rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  state.theme === 'light'
                    ? 'bg-[#FCFDF7] text-[#1C2912] shadow-xs'
                    : 'text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                <span>الوضع النهاري</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`min-h-[42px] rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  state.theme === 'dark'
                    ? 'bg-[#192315] text-[#F3F6E9] shadow-xs'
                    : 'text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                <span>الوضع الليلي</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">
                  قفل الخصوصية برمز سري (٤ أرقام)
                </div>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                  {state.pinCode
                    ? 'القفل مفعّل لحماية سجلك عند فتح التطبيق'
                    : 'غير مفعّل حالياً'}
                </p>
              </div>
              {state.pinCode && (
                <button
                  type="button"
                  onClick={onLockNow}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] whitespace-nowrap cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>قفل الآن</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSavePin} className="flex flex-wrap gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder={state.pinCode ? 'أدخل رمزاً جديداً لتغييره' : 'مثال: 2580'}
                className="flex-1 min-w-[160px] min-h-[44px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                {state.pinCode ? 'تحديث الرمز' : 'تفعيل القفل'}
              </button>
              {state.pinCode && (
                <button
                  type="button"
                  onClick={() => {
                    onSetPin(null);
                    setPinSuccess('تم إلغاء القفل');
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#556442] dark:text-[#A2B193] hover:text-[#DC2626] whitespace-nowrap cursor-pointer"
                >
                  إلغاء القفل
                </button>
              )}
            </form>

            {pinError && (
              <p className="text-xs text-[#DC2626] dark:text-[#F87171]">{pinError}</p>
            )}
            {pinSuccess && (
              <p className="text-xs text-[#2F6E1B] dark:text-[#65C449]">{pinSuccess}</p>
            )}
          </div>
        </section>

        <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              نقطة الضعف الأساسية
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              تغيّر الحلول اليومية المقترحة في الصفحة الرئيسية
            </p>
            <select
              aria-label="نقطة الضعف الأساسية"
              value={state.selectedWeakness ?? ''}
              onChange={(e) =>
                onSelectWeakness((e.target.value || null) as WeaknessId | null)
              }
              className="mt-3 w-full min-h-[44px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
            >
              <option value="">لم يتم الاختيار بعد</option>
              {WEAKNESS_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
            <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              ضبط تاريخ بداية الصمود
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              إذا كنت قد بدأت رحلتك قبل استخدام التطبيق، يمكنك تعديل وقت البداية هنا.
            </p>
            <form onSubmit={handleSaveStartDate} className="mt-3 flex flex-wrap gap-2">
              <input
                type="datetime-local"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                dir="ltr"
                className="flex-1 min-w-[200px] min-h-[44px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] focus:outline-2 focus:outline-[#C98F0A]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer"
              >
                {startSaved ? 'تم التحديث' : 'حفظ التاريخ'}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              تثبيت التطبيق ومشاركته مع الآخرين
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] leading-relaxed">
              التطبيق مهيّأ للعمل كتطبيق مستقل بشاشة كاملة وبدون إنترنت. ثبّته مباشرة هنا، أو
              شاركه مع من يحتاج إليه، أو انسخ رابط الموقع إلى <span dir="ltr">pwabuilder.com</span> لتحويله إلى ملف APK.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <PWAInstallButton variant="settings" />
              <button
                type="button"
                onClick={() => void handleShareApp()}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] hover:border-[#C98F0A] cursor-pointer"
              >
                {shareFeedback ? (
                  <Check className="w-4 h-4 text-[#2F6E1B] dark:text-[#65C449]" aria-hidden="true" />
                ) : (
                  <Share2 className="w-4 h-4 text-[#C98F0A] dark:text-[#ECC93B]" aria-hidden="true" />
                )}
                <span>{shareFeedback || 'مشاركة رابط التطبيق'}</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  الإشعارات والتذكيرات الروحية
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                  لافتة «صلي على النبي» وإشعارات الثبات الدورية كل ساعتين.
                </p>
              </div>

              {notificationPermission === 'default' && (
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>تفعيل إشعارات الجهاز</span>
                </button>
              )}

              {notificationPermission === 'granted' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF3DF] dark:bg-[#26351F] text-[11px] font-semibold text-[#2F6E1B] dark:text-[#65C449]">
                  <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>الإشعارات مفعّلة</span>
                </span>
              )}

              {notificationPermission === 'denied' && (
                <span className="text-[11px] font-medium text-[#DC2626] dark:text-[#F87171]">
                  الإشعارات محظورة من إعدادات المتصفح
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-[#1C2912] dark:text-[#F3F6E9]">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.notifications.salawatBannerEnabled}
                  onChange={(e) =>
                    onUpdateNotifications({ salawatBannerEnabled: e.target.checked })
                  }
                  className="mt-0.5 accent-[#2F6318] dark:accent-[#ECC93B]"
                />
                <span>
                  <span className="font-semibold block">لافتة «صلي على النبي» (3 ثوانٍ)</span>
                  <span className="text-[#556442] dark:text-[#A2B193]">
                    تظهر عند الدخول إلى التطبيق وفي الساعات 9:00 و 5:00 و 3:00
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.notifications.salawatPeriodicNotifications}
                  onChange={(e) =>
                    onUpdateNotifications({ salawatPeriodicNotifications: e.target.checked })
                  }
                  className="mt-0.5 accent-[#2F6318] dark:accent-[#ECC93B]"
                />
                <span>
                  <span className="font-semibold block">إشعارات متفرقة للصلاة على النبي ﷺ</span>
                  <span className="text-[#556442] dark:text-[#A2B193]">
                    تذكير لطيف يظهر من حين لآخر أثناء اليوم
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.notifications.steadfastCheckEveryTwoHours}
                  onChange={(e) =>
                    onUpdateNotifications({ steadfastCheckEveryTwoHours: e.target.checked })
                  }
                  className="mt-0.5 accent-[#2F6318] dark:accent-[#ECC93B]"
                />
                <span>
                  <span className="font-semibold block">سؤال «هل لا زلت صامداً؟» كل ساعتين</span>
                  <span className="text-[#556442] dark:text-[#A2B193]">
                    تذكير واطمئنان دوري لتثبيت عزمك كل ساعتين
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onPreviewSalawatBanner}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C98F0A] dark:text-[#ECC93B]" aria-hidden="true" />
                <span>معاينة لافتة «صلي على النبي»</span>
              </button>

              <button
                type="button"
                onClick={onPreviewSteadfastCheck}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#2F6318] dark:text-[#65C449]" aria-hidden="true" />
                <span>معاينة سؤال «هل لا زلت صامداً؟»</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              النسخ الاحتياطي ونقل البيانات
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] leading-relaxed">
              التطبيق يعمل بدون خوادم خارجية أو حد زمني (يبقى مجانياً للأبد). يمكنك تصدير نسخة
              احتياطية من سجلاتك والاحتفاظ بها أو نقلها لأي جهاز آخر.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>تصدير نسخة احتياطية (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>استعادة من ملف</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            {importMessage && (
              <p
                className={`text-xs font-medium ${
                  importMessage.ok
                    ? 'text-[#2F6E1B] dark:text-[#65C449]'
                    : 'text-[#DC2626] dark:text-[#F87171]'
                }`}
              >
                {importMessage.text}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-[#DC2626]/30 text-sm font-medium text-[#DC2626] dark:text-[#F87171] hover:bg-[#DC2626]/5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>مسح جميع البيانات والبدء من الصفر</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 space-y-3">
                <p className="text-xs font-medium text-[#DC2626] dark:text-[#FCA5A5]">
                  هل أنت متأكد؟ سيتم حذف السجلات والتقييمات والعداد نهائياً من هذا المتصفح.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllData();
                      setConfirmReset(false);
                    }}
                    className="min-h-[40px] px-4 rounded-lg bg-[#DC2626] text-white text-xs font-medium cursor-pointer"
                  >
                    نعم، امسح كل شيء
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] px-4 rounded-lg bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
