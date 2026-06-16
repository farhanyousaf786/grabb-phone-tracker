import ExpoModulesCore
import WidgetKit

public class HabitTrackerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HabitTrackerModule")

    // Push app count + limit → widget (App → Widget)
    Function("syncStats") { (count: Int, limit: Int) in
      let defaults = UserDefaults(suiteName: "group.com.jamesonsinger.habittracker.widget")
      let todayStr = Self.todayString()
      defaults?.set(count, forKey: "grab_count_\(todayStr)")
      defaults?.set(limit, forKey: "grab_limit")
      WidgetCenter.shared.reloadAllTimelines()
    }

    // Read what the widget has stored for today (Widget → App)
    Function("getWidgetCount") { () -> Int in
      let defaults = UserDefaults(suiteName: "group.com.jamesonsinger.habittracker.widget")
      let todayStr = Self.todayString()
      return defaults?.integer(forKey: "grab_count_\(todayStr)") ?? 0
    }

    // Overwrite the widget count directly (used after syncing to prevent double-sync)
    Function("setWidgetCount") { (count: Int) in
      let defaults = UserDefaults(suiteName: "group.com.jamesonsinger.habittracker.widget")
      let todayStr = Self.todayString()
      defaults?.set(count, forKey: "grab_count_\(todayStr)")
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  private static func todayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(abbreviation: "UTC")
    return formatter.string(from: Date())
  }
}
