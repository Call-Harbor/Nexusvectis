export default function AirportKPIBanner({ flights, securityLanes, gates, tasks }) {
  const totalFlights = flights.length;
  const onTime = flights.filter(f => (f.delay_minutes || 0) <= 5).length;
  const otp = totalFlights > 0 ? Math.round((onTime / totalFlights) * 100) : 0;
  const avgSecurity = securityLanes.length > 0
    ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
    : 0;
  const activeGates = gates.filter(g => g.status === "occupied").length;
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "delayed").length;
  const criticalFlights = flights.filter(f => (f.ai_risk_score || 0) > 70).length;
  const missedBags = flights.reduce((s, f) => s + Math.max(0, (f.bags_total || 0) - (f.bags_loaded || 0)), 0);

  const kpis = [
    { label: "OTP", value: `${otp}%`, color: otp >= 80 ? "#10b981" : otp >= 60 ? "#f59e0b" : "#f43f5e" },
    { label: "Avg Security Wait", value: `${avgSecurity}m`, color: avgSecurity <= 10 ? "#10b981" : avgSecurity <= 20 ? "#f59e0b" : "#f43f5e" },
    { label: "Active Gates", value: activeGates, color: "#06b6d4" },
    { label: "Pending Tasks", value: pendingTasks, color: pendingTasks > 10 ? "#f43f5e" : "#f59e0b" },
    { label: "High Risk Flights", value: criticalFlights, color: criticalFlights > 0 ? "#f43f5e" : "#10b981" },
    { label: "Bag Risk", value: missedBags, color: missedBags > 20 ? "#f43f5e" : "#10b981" },
  ];

  return (
    <div className="flex items-stretch border-b border-slate-800/60 divide-x divide-slate-800/60">
      {kpis.map(k => (
        <div key={k.label} className="flex-1 px-4 py-2.5 text-center" style={{ background: `${k.color}06` }}>
          <p className="text-[8px] tracking-widest uppercase mb-0.5" style={{ color: `${k.color}88` }}>{k.label}</p>
          <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
        </div>
      ))}
    </div>
  );
}