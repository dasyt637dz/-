import {
  Bell,
  Check,
  Download,
  Globe,
  Lock,
  Moon,
  Share2,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { DISCOVERY_METHODS, WEAKNESS_PLANS } from '../data/recoveryContent';
import { BrowserNotificationStatus } from '../hooks/useSpiritualReminders';
import { getTranslations, LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
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
  onSetLanguage: (language: AppLanguage) => void;
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

type SettingsTab = 'general' | 'journey' | 'privacy';

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
  onSetLanguage,
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
  const t = getTranslations(state.language);
  const [activeSection, setActiveSection] = useState<SettingsTab>('general');

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
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Clean Settings Header + Segmented Navigation */}
      <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
            {t.settingsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] mt-1">
            {t.settingsSub}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={t.settingsTitle}
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] shrink-0"
        >
          {[
            { id: 'general' as SettingsTab, label: t.settingsTabGeneral, icon: Globe },
            { id: 'journey' as SettingsTab, label: t.settingsTabJourney, icon: Sliders },
            { id: 'privacy' as SettingsTab, label: t.settingsTabPrivacy, icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSection(tab.id)}
                className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                    : 'text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: Language, Appearance & Install */}
      {activeSection === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Language Selector Card (7 cols) */}
          <section className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#C98F0A] dark:text-[#ECC93B] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  {t.languageLabel}
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193]">
                  {t.languageSub}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = state.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onSetLanguage(lang.code)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9] hover:border-[#C98F0A]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    {selected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Theme + App Install & Share (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                {t.themeLabel}
              </h2>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
                <button
                  type="button"
                  onClick={() => onSetTheme('light')}
                  className={`min-h-[42px] rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    state.theme === 'light'
                      ? 'bg-[#FCFDF7] text-[#1C2912] shadow-xs'
                      : 'text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  <Sun className="w-4 h-4" aria-hidden="true" />
                  <span>{t.lightMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetTheme('dark')}
                  className={`min-h-[42px] rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    state.theme === 'dark'
                      ? 'bg-[#192315] text-[#F3F6E9] shadow-xs'
                      : 'text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  <Moon className="w-4 h-4" aria-hidden="true" />
                  <span>{t.darkMode}</span>
                </button>
              </div>
            </section>

            <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                تثبيت التطبيق ومشاركته
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] leading-relaxed">
                يعمل بدون إنترنت وبخصوصية كاملة على جهازك.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <PWAInstallButton variant="settings" />
                <button
                  type="button"
                  onClick={() => void handleShareApp()}
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] hover:border-[#C98F0A] cursor-pointer"
                >
                  {shareFeedback ? (
                    <Check className="w-4 h-4 text-[#2F6E1B] dark:text-[#65C449]" aria-hidden="true" />
                  ) : (
                    <Share2 className="w-4 h-4 text-[#C98F0A] dark:text-[#ECC93B]" aria-hidden="true" />
                  )}
                  <span>{shareFeedback || 'مشاركة رابط التطبيق'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: Journey & Spiritual Notifications */}
      {activeSection === 'journey' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Streak Start Date + Weakness + Profile (6 cols) */}
          <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                ضبط تاريخ بداية الصمود
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                عدّل وقت البداية إذا كنت قد بدأت رحلتك قبل استخدام التطبيق.
              </p>
              <form onSubmit={handleSaveStartDate} className="mt-3 flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  dir="ltr"
                  className="flex-1 min-w-[200px] min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] focus:outline-2 focus:outline-[#C98F0A]"
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  {startSaved ? 'تم التحديث' : 'حفظ التاريخ'}
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
              <h2 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                نقطة الضعف الأساسية
              </h2>
              <select
                aria-label="نقطة الضعف الأساسية"
                value={state.selectedWeakness ?? ''}
                onChange={(e) =>
                  onSelectWeakness((e.target.value || null) as WeaknessId | null)
                }
                className="mt-2.5 w-full min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
              >
                <option value="">لم يتم الاختيار بعد</option>
                {WEAKNESS_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3"
            >
              <div className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                بياناتك الشخصية
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
                    className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
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
                    className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9]"
                  >
                    {DISCOVERY_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIntentDraft('quit')}
                  className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium cursor-pointer ${
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
                  className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium cursor-pointer ${
                    intentDraft === 'curious'
                      ? 'bg-[#FEF4BE]/60 border-[#D97706] text-[#92400E] dark:bg-[#78350F]/30 dark:border-[#F59E0B] dark:text-[#F8DF6B]'
                      : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  بدافع الفضول فقط
                </button>
              </div>

              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold cursor-pointer"
              >
                {profileSaved ? 'تم تحديث بياناتك' : 'حفظ التعديلات'}
              </button>
            </form>
          </section>

          {/* Spiritual & Periodic Notifications (6 cols) */}
          <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
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
                <span className="text-xs font-semibold text-[#2F6E1B] dark:text-[#65C449]">
                  الإشعارات مفعّلة
                </span>
              )}

              {notificationPermission === 'denied' && (
                <span className="text-xs font-medium text-[#DC2626] dark:text-[#F87171]">
                  محظورة من المتصفح
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-[#1C2912] dark:text-[#F3F6E9]">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
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

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
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

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] cursor-pointer">
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
          </section>
        </div>
      )}

      {/* TAB 3: Privacy PIN, Backup & Data Reset */}
      {activeSection === 'privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PIN Lock (6 cols) */}
          <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  قفل الخصوصية برمز سري (٤ أرقام)
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                  {state.pinCode
                    ? 'القفل مفعّل لحماية التطبيق عند الفتح'
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
                  <span>{t.lockApp}</span>
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
                placeholder={state.pinCode ? 'أدخل رمزاً جديداً' : 'مثال: 2580'}
                className="flex-1 min-w-[160px] min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
              />
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold whitespace-nowrap cursor-pointer"
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
                  className="min-h-[42px] px-3.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#556442] dark:text-[#A2B193] hover:text-[#DC2626] whitespace-nowrap cursor-pointer"
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
          </section>

          {/* Backup & Danger Zone (6 cols) */}
          <section className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-5">
            <div className="space-y-3">
              <h2 className="font-display text-base sm:text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                النسخ الاحتياطي ونقل البيانات
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] leading-relaxed">
                احتفظ بنسخة احتياطية من تقدمك أو انقلها لجهاز آخر بخصوصية كاملة.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>تصدير نسخة احتياطية (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] whitespace-nowrap cursor-pointer"
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
                  className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#DC2626]/30 text-xs sm:text-sm font-medium text-[#DC2626] dark:text-[#F87171] hover:bg-[#DC2626]/5 whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>مسح جميع البيانات والبدء من الصفر</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 space-y-3">
                  <p className="text-xs font-medium text-[#DC2626] dark:text-[#FCA5A5]">
                    هل أنت متأكد؟ سيتم حذف التقييمات والعداد نهائياً من هذا المتصفح.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllData();
                        setConfirmReset(false);
                      }}
                      className="min-h-[38px] px-4 rounded-lg bg-[#DC2626] text-white text-xs font-medium cursor-pointer"
                    >
                      نعم، امسح كل شيء
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="min-h-[38px] px-4 rounded-lg bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
