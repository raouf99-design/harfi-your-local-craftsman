export const CATEGORIES = [
  { id: "plumber", name: "سباك", icon: "🔧", color: "from-blue-500/20 to-blue-700/10" },
  { id: "electrician", name: "كهربائي", icon: "⚡", color: "from-yellow-500/20 to-amber-700/10" },
  { id: "painter", name: "دهان", icon: "🎨", color: "from-pink-500/20 to-rose-700/10" },
  { id: "carpenter", name: "نجار", icon: "🪚", color: "from-amber-600/20 to-orange-800/10" },
  { id: "blacksmith", name: "حداد", icon: "⚒️", color: "from-zinc-500/20 to-zinc-700/10" },
  { id: "tiler", name: "بلاط", icon: "🧱", color: "from-orange-500/20 to-red-700/10" },
  { id: "ac", name: "فني تكييف", icon: "❄️", color: "from-cyan-500/20 to-sky-700/10" },
  { id: "general", name: "أعمال عامة", icon: "🛠️", color: "from-emerald-500/20 to-green-700/10" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];
