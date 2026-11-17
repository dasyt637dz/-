import { BookOpen, CheckSquare, Compass, Home, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { NavTab } from '../types/recovery';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const MOBILE_TABS: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'guide', label: 'المحارب', icon: Compass },
  { id: 'journal', label: 'السجل', icon: BookOpen },
  { id: 'habits', label: 'العادات', icon: CheckSquare },
  { id: 'sos', label: 'الطوارئ', icon: ShieldCheck },
  { id: 'privacy', label: 'الإعدادات', icon: SlidersHorizontal },
];

export function MobileNav({ activeTab, onSelectTab }: MobileNavProps) {
  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#FCFDF7]/95 dark:bg-[#192315]/95 backdrop-blur-md border-t border-[#D5DEC0] dark:border-[#2C3B24]"
    >
      <div className="grid grid-cols-6 h-full">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'text-[#9A6B06] dark:text-[#ECC93B]'
                  : 'text-[#556442] dark:text-[#A2B193]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-medium mt-1 whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
