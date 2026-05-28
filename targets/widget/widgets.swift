import WidgetKit
import SwiftUI
import AppIntents

// Shared App Group Identifier
private let appGroupId = "group.com.ibneyousaf.habittracker.widget"

// Widget Timeline Entry
struct SimpleEntry: TimelineEntry {
    let date: Date
    let count: Int
    let limit: Int
}

// App Intent for Incrementing count (+ button)
@available(iOS 17.0, *)
struct IncrementIntent: AppIntent {
    static var title: LocalizedStringResource = "Increment Grabs"
    static var isDiscoverable: Bool = false
    
    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: appGroupId)
        let todayStr = getTodayString()
        let countKey = "grab_count_\(todayStr)"
        
        let currentCount = defaults?.integer(forKey: countKey) ?? 0
        defaults?.set(currentCount + 1, forKey: countKey)
        
        // Notify WidgetKit to reload the timeline
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// App Intent for Decrementing count (- button)
@available(iOS 17.0, *)
struct DecrementIntent: AppIntent {
    static var title: LocalizedStringResource = "Decrement Grabs"
    static var isDiscoverable: Bool = false
    
    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: appGroupId)
        let todayStr = getTodayString()
        let countKey = "grab_count_\(todayStr)"
        
        let currentCount = defaults?.integer(forKey: countKey) ?? 0
        if currentCount > 0 {
            defaults?.set(currentCount - 1, forKey: countKey)
        }
        
        // Notify WidgetKit to reload the timeline
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// Helper to get today's date string (yyyy-MM-dd)
private func getTodayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
}

// Timeline Provider
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), count: 12, limit: 30)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let defaults = UserDefaults(suiteName: appGroupId)
        let todayStr = getTodayString()
        let count = defaults?.integer(forKey: "grab_count_\(todayStr)") ?? 0
        let limit = defaults?.integer(forKey: "grab_limit") ?? 30
        
        let entry = SimpleEntry(date: Date(), count: count, limit: limit)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let defaults = UserDefaults(suiteName: appGroupId)
        let todayStr = getTodayString()
        let count = defaults?.integer(forKey: "grab_count_\(todayStr)") ?? 0
        let limit = defaults?.integer(forKey: "grab_limit") ?? 30
        
        let entry = SimpleEntry(date: Date(), count: count, limit: limit)
        
        // Refresh every 15 minutes or when triggered by intent
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// SwiftUI Widget View
struct widgetEntryView : View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(spacing: 8) {
            // Widget Title Header
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.purple)
                    .font(.system(size: 12, weight: .bold))
                Text("GRABB WIDGET")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            Spacer()
            
            // Statistics Display
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(entry.count)")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                        Text("/ \(entry.limit)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.secondary)
                    }
                    Text("pickups today")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Color-coded remaining gauge
                VStack(alignment: .trailing, spacing: 2) {
                    let left = max(0, entry.limit - entry.count)
                    Text("\(left)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(entry.count > entry.limit ? .red : .green)
                    Text(entry.count > entry.limit ? "OVER" : "LEFT")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Interactive Buttons (+ / -) using App Intents
            if #available(iOS 17.0, *) {
                HStack(spacing: 12) {
                    // Minus Button
                    Button(intent: DecrementIntent()) {
                        Image(systemName: "minus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(Color(UIColor.systemGray5))
                            .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                    
                    // Plus Button
                    Button(intent: IncrementIntent()) {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(Color.purple)
                            .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                // Fallback for iOS 16 (Opens app directly)
                Link(destination: URL(string: "habittracker://pages/home/home")!) {
                    Text("Tap to Log")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity, minHeight: 34)
                        .background(Color.purple)
                        .cornerRadius(10)
                }
            }
        }
        .padding(14)
    }
}

// Widget Configuration
struct widget: Widget {
    let kind: String = "HabitTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Grabb Widget")
        .description("Quickly monitor and log phone grabs.")
        .supportedFamilies([.systemSmall])
    }
}
