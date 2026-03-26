import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
        ${isDark
          ? "border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
          : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
        } ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
      <span className="text-xs font-medium hidden sm:block">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}