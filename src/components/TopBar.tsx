import { ShieldAlert } from 'lucide-react';
import { getTranslations } from '../i18n/translations';
import { AppLanguage, NavTab } from '../types/recovery';
import { SomoudEmblem } from './SomoudEmblem';

interface TopBarProps {
  activeTab: NavTab;
  language: AppLanguage;
  onSelectTab: (tab: NavTab) => void;
}

export function TopBar({ activeTab, language, onSelectTab }: TopBarProps) {
  const t = getTranslations(language);

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: t.navDashboard },
    { id: 'guide', label: t.navGuide },
    { id: 'habits', label: t.navHabits },
    { id: 'privacy', label: t.navSettings },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#F4F6E8]/90 dark:bg-[#11180E]/90 backdrop-blur-md border-b border-[#D5DEC0] dark:border-[#2C3B24]">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Emblem + Single-line Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C98F0A]"
        >
          <SomoudEmblem size="sm" />
          <span className="font-display text-xl font-bold tracking-tight text-[#1C2912] dark:text-[#F3F6E9]">
            {t.brandName}
          </span>
        </button>

        {/* Zone 2: Clean single-line text nav links (Journal removed) */}
        <nav className="hidden md:flex items-center gap-6" aria-label={t.navDashboard}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C98F0A] ${
                  isActive
                    ? 'text-[#9A6B06] dark:text-[#ECC93B]'
                    : 'text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#C98F0A] dark:bg-[#ECC93B]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action (Emergency Mode) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('sos')}
            className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C98F0A] ${
              activeTab === 'sos'
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#2F6318] text-white hover:bg-[#244F12] dark:bg-[#ECC93B] dark:text-[#11180E] dark:hover:bg-[#F4D658]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.emergencyLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
