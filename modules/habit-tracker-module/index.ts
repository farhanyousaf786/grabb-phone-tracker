import { requireNativeModule } from 'expo';

interface HabitTrackerModuleType {
  syncStats: (count: number, limit: number) => void;
  getWidgetCount: () => number;
  setWidgetCount: (count: number) => void;
}

let HabitTrackerModule: HabitTrackerModuleType | null = null;
try {
  HabitTrackerModule = requireNativeModule('HabitTrackerModule') as HabitTrackerModuleType;
} catch (e) {
  console.log("HabitTrackerModule not found (normal in Expo Go).");
}

export default HabitTrackerModule;
