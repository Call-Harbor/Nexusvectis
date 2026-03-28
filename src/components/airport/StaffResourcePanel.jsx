const ROLE_COLOR = {
  security_officer: "#06b6d4",
  gate_agent: "#8b5cf6",
  ground_handler: "#f59e0b",
  baggage_driver: "#f97316",
  cleaning_crew: "#10b981",
  bus_driver: "#64748b",
  supervisor: "#f43f5e",
  dispatcher: "#ec4899",
};

const STATUS_COLOR = {
  on_duty: "#10b981",
  on_break: "#f59e0b",
  off_duty: "#64748b",
  assigned: "#06b6d4",
};

export default function StaffResourcePanel({ staff }) {
  const roleGroups = staff.reduce((acc, s) => {
    if (!acc[s.role]) acc[s.role] = [];
    acc[s.role].push(s);
    return acc;
  }, {});

  const onDuty = staff.filter(s => s.status === "on_duty" || s.status === "assigned").length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(0,10,25,0.6)" }}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#10b981" }}>STAFF & RESOURCES</h2>
        <div className="text-center">
          <p className="text-[8px] text-slate-500 uppercase tracking-widest">On Duty</p>
          <p className="font-bold text-emerald-400">{onDuty} / {staff.length}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {Object.entries(roleGroups).map(([role, members]) => {
          const color = ROLE_COLOR[role] || "#64748b";
          const onDutyCount = members.filter(m => m.status === "on_duty" || m.status === "assigned").length;
          return (
            <div key={role}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold capitalize" style={{ color }}>{role.replace(/_/g, " ")}</p>
                <span className="text-[10px] text-slate-400">{onDutyCount}/{members.length} active</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {members.map(m => (
                  <span key={m.id} className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: `${STATUS_COLOR[m.status] || "#64748b"}18`, color: STATUS_COLOR[m.status] || "#64748b", border: `1px solid ${STATUS_COLOR[m.status] || "#64748b"}30` }}>
                    {m.name}
                    {m.assigned_to && <span className="text-[8px] opacity-60 ml-1">@{m.assigned_to}</span>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {staff.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No staff records found</p>
        )}
      </div>
    </div>
  );
}