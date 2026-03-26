import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const themes = [
  { key: 'dark',     label: 'Dark',     color: '#1e293b', accent: '#94a3b8' },
  { key: 'light',    label: 'Light',    color: '#f1f5f9', accent: '#475569' },
  { key: 'blue',     label: 'Blue',     color: '#0f172a', accent: '#38bdf8' },
  { key: 'green',    label: 'Green',    color: '#052e16', accent: '#4ade80' },
  { key: 'contrast', label: 'Contrast', color: '#000000', accent: '#ffffff' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="px-5 py-3 border-t border-slate-700/50">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono">Theme</p>
      <div className="flex gap-2 flex-wrap">
        {themes.map((t) => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            title={t.label}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className="w-8 h-8 rounded-lg border-2 transition-all"
              style={{
                background: t.color,
                borderColor: theme === t.key ? t.accent : 'rgba(148,163,184,0.2)',
                boxShadow: theme === t.key ? `0 0 8px ${t.accent}80` : 'none',
              }}
            >
              <div className="w-full h-full rounded-md flex items-end justify-end p-1">
                <div className="w-3 h-1.5 rounded-sm" style={{ background: t.accent, opacity: 0.8 }} />
              </div>
            </div>
            <span
              className="text-[9px] font-mono uppercase tracking-wide"
              style={{ color: theme === t.key ? t.accent : '#64748b' }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}