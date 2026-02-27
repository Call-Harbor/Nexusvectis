import { useMemo } from "react";
import { Users, User } from "lucide-react";

const deptColors = {
  Operations: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
  Logistics:  "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
  Fleet:      "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400",
  Finance:    "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  HR:         "from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400",
  IT:         "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
  Sales:      "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
  Management: "from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-300",
};

export default function OrgChart({ employees }) {
  const grouped = useMemo(() => {
    const g = {};
    employees.forEach(e => {
      if (!g[e.department]) g[e.department] = [];
      g[e.department].push(e);
    });
    return g;
  }, [employees]);

  const depts = Object.keys(grouped).sort();

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Users className="w-10 h-10 mb-3 text-slate-700" />
        <p>No employees yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {depts.map(dept => {
          const color = deptColors[dept] || deptColors.Management;
          const emps = grouped[dept];
          return (
            <div key={dept} className={`bg-gradient-to-br ${color} border rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">{dept}</p>
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded-full">{emps.length}</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {emps.map(e => (
                  <div key={e.id} className="flex items-center gap-2 bg-black/20 rounded-lg p-1.5">
                    <div className="w-6 h-6 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
                      {e.first_name?.[0]}{e.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{e.first_name} {e.last_name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{e.job_title || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Distribution by Department</p>
        <div className="space-y-2">
          {depts.map(dept => {
            const pct = Math.round((grouped[dept].length / employees.length) * 100);
            const color = deptColors[dept] || deptColors.Management;
            return (
              <div key={dept} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-24 flex-shrink-0">{dept}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color.split(" ")[0].replace("from-", "from-").replace("/20", "")} to-transparent`}
                    style={{ width: `${pct}%`, background: `var(--${dept.toLowerCase()}-color, #06b6d4)` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{grouped[dept].length}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}