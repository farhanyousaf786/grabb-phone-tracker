export const DAILY_LIMIT_DEFAULT = 40;

export const WEEK_DATA = [32, 45, 38, 51, 29, 44, 0];

export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const TIPS = [
  { icon: '🌅', title: 'Wait before you look', body: "Your dopamine resets overnight — you have the most self-control in the first hour after waking. Don't spend it scrolling." },
  { icon: '📵', title: 'Phone face-down = fewer grabs', body: 'When your phone is visible, your brain is already partly distracted. Face it down and pickups drop by ~30%.' },
  { icon: '🧠', title: 'Name the feeling', body: "The moment before you grab your phone — pause for 2 seconds and ask what you're actually feeling. That pause is the whole practice." },
  { icon: '⏱', title: 'The 90-second rule', body: "Any urge to check your phone will naturally fade in 90 seconds if you don't act on it. Try waiting it out once today." },
  { icon: '🛏', title: 'No phones in the bedroom', body: "Charging your phone outside the bedroom improves sleep quality and stops the 'doomscroll' before you even start." },
  { icon: '🚶', title: 'Physical distance is power', body: "If you need to focus, put your phone in another room. The 'out of sight, out of mind' rule is your best defense." },
  { icon: '🔇', title: 'Kill the red dots', body: "Turn off all non-human notifications. If it's not a person reaching out, it can probably wait until you choose to check." },
  { icon: '🖐', title: 'The speed bump rule', body: "Put a rubber band around your phone. It's a physical reminder that makes you pause and think before each unlock." },
  { icon: '🌈', title: 'Go Grayscale', body: "Colorful icons are designed to trigger your brain. Turn on grayscale mode in settings to make your phone feel less 'magnetic'." },
  { icon: '📅', title: 'Batch your checks', body: "Set specific times (e.g., 10am, 2pm, 6pm) to check apps. Outside those times, keep the phone away." },
  { icon: '🌳', title: 'The digital detox walk', body: "Try a 10-minute walk without your phone. Notice the difference in your thoughts when you aren't being constantly stimulated." },
  { icon: '🍽', title: 'Device-free meals', body: "Keep the phone off the table during meals. Use that time to either enjoy your food or talk to the people around you." },
  { icon: '📖', title: 'Physical alternatives', body: "Carry a pocket book or a physical notebook. Next time you're bored, reach for that instead of your phone." },
  { icon: '💤', title: 'The evening wind-down', body: "Put your phone away 30 minutes before bed. This helps your brain produce melatonin for deeper, better sleep." },
  { icon: '🚦', title: 'Stop at the red light', body: "When waiting in line or at a red light, resist the urge to pull out your phone. Practice being bored for just 60 seconds." },
  { icon: '💬', title: 'Call instead of text', body: "Try a 5-minute phone call instead of a 20-minute texting thread. It's more personal and saves digital energy." },
  { icon: '🔋', title: 'Charge it elsewhere', body: "Don't charge your phone where you sit. Moving the charger makes it harder to use the phone while it's plugged in." },
  { icon: '🏗', title: 'Delete the infinite scroll', body: "Access social media through your mobile browser instead of apps. The friction makes you check it less often." },
  { icon: '🔍', title: 'Audit your apps', body: "If you haven't opened an app in 30 days, delete it. Less clutter means fewer triggers to stay on the screen." },
  { icon: '🎖', title: 'Celebrate the silence', body: "When your phone doesn't buzz for an hour, don't worry about what you're missing. Enjoy the focus you're gaining." },
];

export const TRIGGERS = ['Habit', 'Anxious', 'Boredom', 'Notif', 'Avoidance', 'Widget'] as const;

export const TRIGGER_COLORS = {
  Habit:     { bg: '#F0F7FF', color: '#5588CC' },
  Anxious:   { bg: '#FFF0F0', color: '#CC5555' },
  Boredom:   { bg: '#F5F0FF', color: '#8855CC' },
  Notif:     { bg: '#FFFBF0', color: '#CC8833' },
  Avoidance: { bg: '#F0FFF8', color: '#33AA77' },
  Widget:    { bg: '#FFF0F0', color: '#EF4444' }, // Red to indicate it needs attention
};

export const TRIGGER_EMOJI = {
  Habit:     '🔄',
  Anxious:   '😰',
  Boredom:   '😑',
  Notif:     '🔔',
  Avoidance: '🙈',
  Widget:    '⚠️',
};

// Each intention maps to the trigger it most closely relates to
export const INTENTIONS = [
  { key: 'hour',     icon: 'flash-sharp',         label: 'Go one hour without checking',      triggerMatch: 'Habit' },
  { key: 'anxious',  icon: 'heart-sharp',         label: 'Pause before grabbing when anxious', triggerMatch: 'Anxious' },
  { key: 'bored',    icon: 'cafe-sharp',          label: 'Find something else when bored',     triggerMatch: 'Boredom' },
  { key: 'notif',    icon: 'notifications-sharp', label: 'Let notifications wait',             triggerMatch: 'Notif' },
  { key: 'present',  icon: 'people-sharp',        label: 'Stay present with people around me', triggerMatch: 'Avoidance' },
];

export const BADGES = [
  { id: 'first', icon: '🌱', label: 'First Log', earned: true },
  { id: 'aware', icon: '👁', label: 'Self Aware', earned: true },
  { id: 'under', icon: '🎯', label: 'Under Limit', earned: true },
  { id: 'morning', icon: '🌅', label: 'Clear Morning', earned: false },
  { id: 'streak3', icon: '🔥', label: '3-Day Streak', earned: false },
  { id: 'half', icon: '✂️', label: 'Cut in Half', earned: false },
  { id: 'week', icon: '📅', label: 'Week Strong', earned: false },
  { id: 'zen', icon: '🧘', label: 'Phone Free', earned: false },
  { id: 'grnd', icon: '🏆', label: 'Grounded', earned: false },
];

export const INIT_LOG = [
  { time: '8:04', trigger: 'habit' },
  { time: '8:19', trigger: 'anxious' },
  { time: '8:31', trigger: 'notif' },
  { time: '8:47', trigger: 'reflex' },
  { time: '9:02', trigger: 'bored' },
  { time: '9:15', trigger: 'habit' },
  { time: '9:28', trigger: 'anxious' },
  { time: '9:41', trigger: 'habit' },
  { time: '9:55', trigger: 'Avoidance' },
  { time: '10:08', trigger: 'Habit' },
  { time: '10:22', trigger: 'Boredom' },
  { time: '10:37', trigger: 'Habit' },
];

export type TriggerName = keyof typeof TRIGGER_COLORS;
