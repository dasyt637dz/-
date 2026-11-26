export type ThemeMode = 'light' | 'dark';

export type NavTab = 'dashboard' | 'guide' | 'sos' | 'journal' | 'habits' | 'privacy';

export type WarriorTipCategory = 'morning' | 'free_time' | 'night' | 'mindset';

export interface WarriorTip {
  id: string;
  category: WarriorTipCategory;
  categoryLabel: string;
  title: string;
  detail: string;
}

export interface WarriorPsychStage {
  id: string;
  stageNumber: number;
  dayRange: string;
  minDay: number;
  maxDay: number | null;
  title: string;
  psychExplanation: string;
  warriorRule: string;
}

export interface WarriorPsychNote {
  id: string;
  question: string;
  explanation: string;
}

export type LogEntryType = 'victory' | 'relapse';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type WeaknessId =
  | 'boredom'
  | 'loneliness'
  | 'stress'
  | 'fatigue'
  | 'phone'
  | 'sadness'
  | 'anger'
  | 'alone_time'
  | 'unsure';

export type OnboardingIntent = 'quit' | 'curious';

export interface OnboardingProfile {
  completed: boolean;
  age: number | null;
  discoveryMethod: string;
  discoveryCustom: string;
  intent: OnboardingIntent | null;
}

export interface WeaknessSolution {
  title: string;
  detail: string;
}

export interface WeaknessPlan {
  id: WeaknessId;
  label: string;
  triggerMatch: string;
  whyItHappens: string;
  solutions: WeaknessSolution[];
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO string
  type: LogEntryType;
  triggers: string[];
  timeOfDay: TimeOfDay;
  intensity: number; // 1 to 5
  notes: string;
  actionTaken?: string;
}

export interface DailyCheckIn {
  date: string; // YYYY-MM-DD local date
  mood: number; // 1 to 5
  urgeLevel: number; // 1 to 5
  note: string;
  tags?: string[];
  checkedInAt?: string;
  completedHabitIds: string[];
  status: 'clean' | 'relapse';
}

export interface ReplacementHabit {
  id: string;
  title: string;
  category: string;
}

export interface SafeguardItem {
  id: string;
  title: string;
  summary: string;
  steps: string[];
}

export interface MilestoneInfo {
  days: number;
  title: string;
  subtitle: string;
  scienceNote: string;
}

export interface StreakTitleTier {
  days: number;
  title: string;
}

export interface NotificationPreferences {
  salawatBannerEnabled: boolean;
  salawatPeriodicNotifications: boolean;
  steadfastCheckEveryTwoHours: boolean;
  promptDismissed: boolean;
}

export interface RecoveryState {
  streakStartedAt: string; // ISO timestamp
  bestStreakSeconds: number;
  theme: ThemeMode;
  pinCode: string | null; // 4-digit PIN or null
  onboarding: OnboardingProfile;
  selectedWeakness: WeaknessId | null;
  weaknessCustomNote: string;
  appliedSolutionDates: string[]; // YYYY-MM-DD
  personalReasons: string[];
  journal: JournalEntry[];
  checkIns: Record<string, DailyCheckIn>;
  habits: ReplacementHabit[];
  completedSafeguards: string[];
  previousStreaksDays: number[]; // track past completed streaks in days
  notifications: NotificationPreferences;
}
