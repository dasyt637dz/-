import { CheckSquare, Compass, Home, SlidersHorizontal } from 'lucide-react';
import { getTranslations } from '../i18n/translations';
import { AppLanguage, NavTab } from '../types/recovery';

interface MobileNavProps {
  activeTab: NavTab;
  language: AppLanguage;
  onSelectTab: (tab: NavTab) => void;
}

export function MobileNav({ activeTab, language, onSelectTab }: MobileNavProps) {
  const t = getTranslations(language);

  const mobileTabs: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: Home },
    { id: 'guide', label: t.navGuide, icon: Compass },
    { id: 'habits', label: t.navHabits, icon: CheckSquare },
    { id: 'privacy', label: t.navSettings, icon: SlidersHorizontal },
  ];

  return (
    <nav
      aria-label={t.navDashboard}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#FCFDF7]/95 dark:bg-[#192315]/95 backdrop-blur-md border-t border-[#D5DEC0] dark:border-[#2C3B24]"
    >
      <div className="grid grid-cols-4 h-full">
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] px-1 transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'text-[#9A6B06] dark:text-[#ECC93B]'
                  : 'text-[#556442] dark:text-[#A2B193]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-medium mt-1 whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
