import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, LayoutGrid, AlertTriangle, TrendingUp, Brain, Shield, Wrench, Leaf, Settings, ChevronLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Operations Center", icon: LayoutGrid, path: "/EnergyOpsCenter" },
  { label: "Grid Management", icon: Settings, path: "/GridManagement" },
];

export default function EnergyLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 ${collapsed ? "w-14" : "w-56"} transition-all duration-200 bg-slate-950/80 border-r border-slate-800 flex flex-col`}>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-slate-800 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-xs font-bold leading-tight truncate">Energy & Utilities</p>
              <p className="text-slate-600 text-[10px] truncate">NexusVectis Ops</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm ${
                  active
                    ? "bg-amber-600/20 text-amber-300 border border-amber-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Back to platform + collapse toggle */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-300 transition-all text-xs ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Back to platform" : undefined}
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Back to platform</span>}
          </Link>
          <button
            onClick={() => setCollapsed(p => !p)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-all text-xs ${collapsed ? "justify-center" : ""}`}
          >
            <ChevronLeft className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}