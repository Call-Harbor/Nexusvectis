import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Loader2, Zap, BarChart2, Users, Leaf, Cpu, CheckCircle, AlertTriangle, Activity, RefreshCw, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from "recharts";
import moment from "moment";
import jsPDF from "jspdf";

const ENERGY_SYSTEMS = [
  { id: "hvac", label: "HVAC", base_kwh: 1200, color: "#06b6d4" },
  { id: "lighting", label: "Lighting", base_kwh: 480, color: "#f59e0b" },
  { id: "baggage", label: "Baggage Systems", base_kwh: 320, color: "#8b5cf6" },
  { id: "escalators", label: "Escalators", base_kwh: 210, color: "#10b981" },
  { id: "apron", label: "Apron", base_kwh: 890, color: "#f97316" },
  { id: "groundvehicles", label: "Ground Vehicles", base_kwh: 640, color: "#ec4899" },
];

function KPICard({ label, val, sub, color, icon: IconComp }) {
  return (
    <div className="rounded-2xl p-4" style={{ border: `1px solid ${color}25`, background: `${color}08` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${color}80` }}>{label}</p>
          <p className="text-2xl font-black" style={{ color }}>{val}</p>
          {sub && <p className="text-[9px] mt-1" style={{ color: `${color}60` }}>{sub}</p>}
        </div>
        {IconComp && <IconComp className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: `${color}60` }} />}
      </div>
    </div>
  );
}

export default function AirportReports() {
  const [orgId, setOrgId] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));

  // Load org
  useQuery({
    queryKey: ["report_org"],
    queryFn: async () => {
      const user = await base44.auth.me();
      setOrgId(user?.organization_id || null);
      return user;
    }
  });

  const { data: flights = [], isLoading: flightsLoading } = useQuery({
    queryKey: ["report_flights", orgId, selectedDate],
    queryFn: () => orgId ? base44.entities.Flight.filter({ organization_id: orgId }, "-created_date", 300) : [],
    enabled: !!orgId,
  });

  const { data: securityLanes = [] } = useQuery({
    queryKey: ["report_security", orgId],
    queryFn: () => orgId ? base44.entities.SecurityLane.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId,
  });

  const { data: gates = [] } = useQuery({
    queryKey: ["report_gates", orgId],
    queryFn: () => orgId ? base44.entities.AirportGate.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["report_tasks", orgId],
    queryFn: () => orgId ? base44.entities.GroundHandlingTask.filter({ organization_id: orgId }, "-created_date", 200) : [],
    enabled: !!orgId,
  });

  const { data: bags = [] } = useQuery({
    queryKey: ["report_bags", orgId],
    queryFn: () => orgId ? base44.entities.BaggageItem.filter({ organization_id: orgId }, "-created_date", 300) : [],
    enabled: !!orgId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["report_staff", orgId],
    queryFn: () => orgId ? base44.entities.AirportStaff.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId,
  });

  // ---- Aggregated metrics ----
  const metrics = useMemo(() => {
    const today = moment(selectedDate);
    const todayFlights = flights.filter(f => moment(f.scheduled_departure || f.scheduled_arrival || f.created_date).isSame(today, "day"));

    const delayed = todayFlights.filter(f => (f.delay_minutes || 0) > 0);
    const cancelled = todayFlights.filter(f => f.status === "cancelled");
    const onTime = todayFlights.filter(f => (f.delay_minutes || 0) === 0 && f.status !== "cancelled");
    const avgDelay = delayed.length > 0 ? Math.round(delayed.reduce((s, f) => s + (f.delay_minutes || 0), 0) / delayed.length) : 0;
    const totalPax = todayFlights.reduce((s, f) => s + (f.pax_total || 0), 0);
    const avgPax = todayFlights.length > 0 ? Math.round(totalPax / todayFlights.length) : 0;
    const onTimeRate = todayFlights.length > 0 ? Math.round((onTime.length / todayFlights.length) * 100) : 100;

    const avgSecWait = securityLanes.length > 0 ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : 0;
    const maxSecWait = securityLanes.reduce((m, l) => Math.max(m, l.wait_minutes || 0), 0);
    const openLanes = securityLanes.filter(l => l.status === "open").length;

    const totalEnergy = ENERGY_SYSTEMS.reduce((s, e) => s + e.base_kwh, 0);
    const totalCO2 = todayFlights.reduce((s, f) => s + (f.co2_kg || 0), 0);
    const totalFuel = todayFlights.reduce((s, f) => s + (f.fuel_uplift_kg || 0), 0);

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const mishandledBags = bags.filter(b => b.status === "mishandled").length;
    const mishandledRate = bags.length > 0 ? ((mishandledBags / bags.length) * 100).toFixed(1) : "0.0";
    const staffUtil = staff.length > 0 ? Math.round((staff.filter(s => ["on_duty", "assigned"].includes(s.status)).length / staff.length) * 100) : 0;

    return {
      todayFlights, delayed, cancelled, onTime, avgDelay, totalPax, avgPax, onTimeRate,
      avgSecWait, maxSecWait, openLanes,
      totalEnergy, totalCO2, totalFuel,
      completedTasks, taskRate, mishandledBags, mishandledRate, staffUtil,
    };
  }, [flights, securityLanes, tasks, bags, staff, selectedDate]);

  // Hourly pax flow (simulated from flight schedule)
  const hourlyFlow = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const hour = 5 + i;
      const hFlights = metrics.todayFlights.filter(f => {
        const t = f.scheduled_departure || f.scheduled_arrival;
        return t && moment(t).hour() === hour;
      });
      return {
        time: `${String(hour).padStart(2, "0")}:00`,
        pax: hFlights.reduce((s, f) => s + (f.pax_total || 0), 0),
        flights: hFlights.length,
      };
    });
  }, [metrics.todayFlights]);

  // Status breakdown for pie
  const statusBreakdown = useMemo(() => {
    const counts = {};
    metrics.todayFlights.forEach(f => { counts[f.status || "unknown"] = (counts[f.status || "unknown"] || 0) + 1; });
    const COLORS = { on_time: "#10b981", boarding: "#06b6d4", delayed: "#f59e0b", cancelled: "#f43f5e", departed: "#8b5cf6", landed: "#22d3ee", scheduled: "#475569" };
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v, color: COLORS[k] || "#64748b" }));
  }, [metrics.todayFlights]);

  const generateAIReport = async () => {
    setLoadingAI(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er Airport Operations Rapport AI. Generer en professionel dansk daglig driftsrapport.

Data for ${moment(selectedDate).format("DD. MMMM YYYY")}:

FLY:
- Total fly: ${metrics.todayFlights.length}
- Til tiden: ${metrics.onTime.length} (${metrics.onTimeRate}%)
- Forsinkede: ${metrics.delayed.length}, gns. forsinkelse ${metrics.avgDelay} min
- Aflyst: ${metrics.cancelled.length}
- Total passagerer: ${metrics.totalPax.toLocaleString()}
- Gns. pax/fly: ${metrics.avgPax}

SECURITY:
- Åbne baner: ${metrics.openLanes}/${securityLanes.length}
- Gns. ventetid: ${metrics.avgSecWait} min
- Max ventetid: ${metrics.maxSecWait} min

ENERGI:
- Samlet forbrug: ${metrics.totalEnergy} kWh/t
- Fly CO₂: ${(metrics.totalCO2 / 1000).toFixed(1)} t
- Brændstof uplift: ${(metrics.totalFuel / 1000).toFixed(1)} t

GROUND HANDLING:
- Opgaver gennemført: ${metrics.completedTasks}/${tasks.length} (${metrics.taskRate}%)
- Mishandlet bagage: ${metrics.mishandledBags} (${metrics.mishandledRate}%)
- Personale udnyttelse: ${metrics.staffUtil}%

Return JSON:
- executive_summary: string (3-4 sætninger, professionel tone)
- performance_rating: "Fremragende"|"God"|"Acceptabel"|"Under standard"
- top_achievements: array of 3 strings (dagens succeser)
- key_issues: array of 3 strings (problemer der kræver opmærksomhed)
- ai_recommendations: array of 5 {category: string, recommendation: string, priority: "høj"|"medium"|"lav", impact: string}
- tomorrow_focus: array of 3 strings (prioriteter til i morgen)
- benchmark_vs_industry: string (sammenligning med branchestandard)`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            performance_rating: { type: "string" },
            top_achievements: { type: "array", items: { type: "string" } },
            key_issues: { type: "array", items: { type: "string" } },
            ai_recommendations: { type: "array", items: { type: "object", properties: { category: { type: "string" }, recommendation: { type: "string" }, priority: { type: "string" }, impact: { type: "string" } } } },
            tomorrow_focus: { type: "array", items: { type: "string" } },
            benchmark_vs_industry: { type: "string" }
          }
        }
      });
      setAiReport(res);
    } catch (e) { console.error(e); }
    setLoadingAI(false);
  };

  const exportPDF = async () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 15;
      const col = pageW - margin * 2;
      let y = 20;

      // Header
      doc.setFillColor(0, 8, 20);
      doc.rect(0, 0, pageW, 35, "F");
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AIRPORT OPS CENTER", margin, 16);
       doc.setFontSize(10);
       doc.setTextColor(148, 163, 184);
       doc.text(`Daily Operations Report — ${moment(selectedDate).format("DD. MMMM YYYY")}`, margin, 24);
       doc.setTextColor(100, 116, 139);
       doc.text(`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`, margin, 30);
      y = 45;

      // Performance rating
      if (aiReport?.performance_rating) {
        doc.setFillColor(139, 92, 246);
        doc.roundedRect(margin, y, col, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Overall Rating: ${aiReport.performance_rating}`, margin + 5, y + 6.5);
        y += 16;
      }

      // Executive summary
      if (aiReport?.executive_summary) {
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Executive Summary", margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(aiReport.executive_summary, col);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 8;
      }

      // KPI Grid
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Key Performance Indicators", margin, y);
      y += 7;

      const kpis = [
        ["Total Flights", metrics.todayFlights.length, "On-time", `${metrics.onTimeRate}%`],
        ["Delayed", metrics.delayed.length, "Avg Delay", `${metrics.avgDelay} min`],
        ["Total PAX", metrics.totalPax.toLocaleString(), "Sec. Wait", `${metrics.avgSecWait} min`],
        ["Energy", `${metrics.totalEnergy} kWh/h`, "Ground Tasks", `${metrics.taskRate}%`],
        ["Mishandled Baggage", `${metrics.mishandledBags} (${metrics.mishandledRate}%)`, "Staff Util.", `${metrics.staffUtil}%`],
      ];

      kpis.forEach(row => {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, col / 2 - 2, 9, "F");
        doc.rect(margin + col / 2 + 2, y, col / 2 - 2, 9, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(row[0], margin + 3, y + 4);
        doc.text(row[2], margin + col / 2 + 5, y + 4);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text(String(row[1]), margin + col / 2 - 20, y + 4, { align: "right" });
        doc.text(String(row[3]), pageW - margin - 3, y + 4, { align: "right" });
        y += 11;
      });
      y += 5;

      // AI Recommendations
      if (aiReport?.ai_recommendations?.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("AI Recommendations", margin, y);
        y += 7;

        aiReport.ai_recommendations.forEach(r => {
          if (y > 250) { doc.addPage(); y = 20; }
          const priorityColor = r.priority === "high" ? [244, 63, 94] : r.priority === "medium" ? [245, 158, 11] : [16, 185, 129];
          doc.setFillColor(...priorityColor);
          doc.roundedRect(margin, y, 18, 6, 1, 1, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text(r.priority.toUpperCase(), margin + 1, y + 4);
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.setFont("helvetica", "bold");
          doc.text(`[${r.category}] ${r.recommendation}`, margin + 21, y + 4);
          y += 7;
          if (r.impact) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            const impLines = doc.splitTextToSize(`→ ${r.impact}`, col - 22);
            doc.text(impLines, margin + 21, y);
            y += impLines.length * 4 + 2;
          }
          y += 2;
        });
      }

      // Tomorrow focus
      if (aiReport?.tomorrow_focus?.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Tomorrow's Focus", margin, y);
        y += 7;
        aiReport.tomorrow_focus.forEach((t, i) => {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(`${i + 1}. ${t}`, margin, y);
          y += 6;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`NexusVectis Airport Ops Center · ${moment(selectedDate).format("DD/MM/YYYY")} · Page ${i} of ${totalPages}`, pageW / 2, 290, { align: "center" });
      }

      doc.save(`AirportReport_${selectedDate}.pdf`);
    } catch (e) { console.error(e); }
    setExportingPDF(false);
  };

  const exportExcel = () => {
    setExportingExcel(true);
    try {
      const rows = [
        ["AIRPORT OPS CENTER — Daily Operations Report"],
        [`Date: ${moment(selectedDate).format("DD. MMMM YYYY")}`],
        [`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`],
        [],
        ["=== Key Indicators ==="],
        ["Metric", "Value"],
        ["Total Flights", metrics.todayFlights.length],
        ["On-time", `${metrics.onTimeRate}%`],
        ["Delayed Flights", metrics.delayed.length],
        ["Avg Delay (min)", metrics.avgDelay],
        ["Cancelled", metrics.cancelled.length],
        ["Total Passengers", metrics.totalPax],
        ["Avg PAX per Flight", metrics.avgPax],
        ["Security Avg Wait (min)", metrics.avgSecWait],
        ["Security Max Wait (min)", metrics.maxSecWait],
        ["Open Security Lanes", metrics.openLanes],
        ["Terminal Energy (kWh/h)", metrics.totalEnergy],
        ["Flight CO2 Today (kg)", metrics.totalCO2],
        ["Fuel Uplift (kg)", metrics.totalFuel],
        ["Ground Tasks Completed", `${metrics.completedTasks}/${tasks.length} (${metrics.taskRate}%)`],
        ["Mishandled Baggage", `${metrics.mishandledBags} (${metrics.mishandledRate}%)`],
        ["Staff Utilization", `${metrics.staffUtil}%`],
        [],
        ["=== Energy Consumption by System ==="],
        ["System", "kWh/h", "Savings Potential (kWh/h)"],
        ...ENERGY_SYSTEMS.map(e => [e.label, e.base_kwh, Math.round(e.base_kwh * 0.18)]),
        [],
        ["=== Hourly Passenger Flow ==="],
        ["Time", "Passengers", "Flights"],
        ...hourlyFlow.map(h => [h.time, h.pax, h.flights]),
        [],
        ["=== Flight Status Distribution ==="],
        ["Status", "Count"],
        ...statusBreakdown.map(s => [s.name, s.value]),
        [],
      ];

      if (aiReport) {
        rows.push(["=== AI Report ==="], []);
        rows.push(["Overall Rating", aiReport.performance_rating || "N/A"]);
        rows.push(["Executive Summary", aiReport.executive_summary || ""]);
        rows.push([]);
        if (aiReport.top_achievements?.length) {
          rows.push(["Top Achievements"]);
          aiReport.top_achievements.forEach((a, i) => rows.push([`${i+1}.`, a]));
          rows.push([]);
        }
        if (aiReport.key_issues?.length) {
          rows.push(["Key Issues"]);
          aiReport.key_issues.forEach((a, i) => rows.push([`${i+1}.`, a]));
          rows.push([]);
        }
        if (aiReport.ai_recommendations?.length) {
          rows.push(["AI Recommendations", "", "", ""]);
          rows.push(["Category", "Recommendation", "Priority", "Impact"]);
          aiReport.ai_recommendations.forEach(r => rows.push([r.category, r.recommendation, r.priority, r.impact || ""]));
          rows.push([]);
        }
        if (aiReport.tomorrow_focus?.length) {
          rows.push(["Tomorrow's Focus"]);
          aiReport.tomorrow_focus.forEach((a, i) => rows.push([`${i+1}.`, a]));
        }
      }

      const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AirportReport_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setExportingExcel(false);
  };

  const ratingColor = { "Excellent": "#10b981", "Good": "#06b6d4", "Acceptable": "#f59e0b", "Below Standard": "#f43f5e" };
  const prioColor = { "high": "#f43f5e", "medium": "#f59e0b", "low": "#10b981" };
  const isLoading = flightsLoading;

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "linear-gradient(135deg, #000814 0%, #0a0f1e 100%)" }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-black tracking-widest text-white uppercase">Airport Operations Report</h1>
            </div>
            <p className="text-[10px] text-slate-500">Aggregated data from all terminals • PDF & Excel export</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date picker */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.5)" }}>
            <Calendar className="w-4 h-4 text-slate-500" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-sm outline-none" max={moment().format("YYYY-MM-DD")} />
            </div>
            <button onClick={generateAIReport} disabled={loadingAI || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(139,92,246,0.15)", border: "1.5px solid rgba(139,92,246,0.4)", color: "#8b5cf6" }}>
            {loadingAI ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating AI...</> : <><Cpu className="w-3.5 h-3.5" />Generate AI Report</>}
          </button>
          <button onClick={exportPDF} disabled={exportingPDF || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(244,63,94,0.12)", border: "1.5px solid rgba(244,63,94,0.4)", color: "#f43f5e" }}>
            {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}PDF
          </button>
          <button onClick={exportExcel} disabled={exportingExcel || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: "rgba(16,185,129,0.12)", border: "1.5px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
            {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Excel / CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" /><span>Loading operations data...</span>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Total Flights", val: metrics.todayFlights.length, color: "#8b5cf6", sub: moment(selectedDate).format("DD/MM"), icon: Activity },
              { label: "On-Time", val: `${metrics.onTimeRate}%`, color: "#10b981", sub: `${metrics.onTime.length} flights`, icon: CheckCircle },
              { label: "Delayed", val: metrics.delayed.length, color: metrics.delayed.length > 0 ? "#f59e0b" : "#10b981", sub: `⌀ ${metrics.avgDelay}m`, icon: AlertTriangle },
              { label: "Total PAX", val: metrics.totalPax.toLocaleString(), color: "#06b6d4", sub: `⌀ ${metrics.avgPax}/flight`, icon: Users },
              { label: "Sec. Wait", val: `${metrics.avgSecWait}m`, color: metrics.avgSecWait > 15 ? "#f43f5e" : "#10b981", sub: `max ${metrics.maxSecWait}m`, icon: Activity },
              { label: "Energy/h", val: `${(metrics.totalEnergy / 1000).toFixed(1)}MWh`, color: "#f59e0b", sub: "terminal total", icon: Leaf },
              { label: "Ground Tasks", val: `${metrics.taskRate}%`, color: "#10b981", sub: `${metrics.completedTasks}/${tasks.length}`, icon: CheckCircle },
              { label: "Mishandled", val: metrics.mishandledBags, color: metrics.mishandledBags > 0 ? "#f43f5e" : "#10b981", sub: `${metrics.mishandledRate}%`, icon: AlertTriangle },
            ].map(k => <KPICard key={k.label} {...k} />)}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Hourly pax flow */}
            <div className="col-span-2 rounded-2xl p-4" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(0,8,20,0.95)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-cyan-400 mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />Hourly Passenger Flow
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={hourlyFlow}>
                  <defs>
                    <linearGradient id="paxFlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10, color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="pax" stroke="#06b6d4" fill="url(#paxFlowGrad)" strokeWidth={2} name="PAX" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.6)", background: "rgba(0,8,20,0.95)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" />Flight Status Distribution
              </p>
              {statusBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={22}>
                        {statusBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {statusBreakdown.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-[8px] text-slate-400 flex-1 capitalize">{s.name}</span>
                        <span className="text-[8px] font-black" style={{ color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-slate-600 text-xs text-center py-8">No flight data</p>}
            </div>
          </div>

          {/* Energy breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(0,8,20,0.95)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-amber-400 mb-3 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5" />Energy Consumption by System (kWh/h)
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={ENERGY_SYSTEMS.map(e => ({ name: e.label, kwh: e.base_kwh, color: e.color }))}>
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10, color: "#e2e8f0" }} />
                  <Bar dataKey="kwh" radius={[3, 3, 0, 0]} name="kWh/t">
                    {ENERGY_SYSTEMS.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Delay distribution */}
            <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,8,20,0.95)" }}>
              <p className="text-[9px] font-black tracking-widest uppercase text-violet-400 mb-4 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />Operations Performance Overview
              </p>
              <div className="space-y-3">
                {[
                  { label: "On-time Rate", val: metrics.onTimeRate, max: 100, color: "#10b981", unit: "%" },
                  { label: "Ground Task Rate", val: metrics.taskRate, max: 100, color: "#06b6d4", unit: "%" },
                  { label: "Staff Utilization", val: metrics.staffUtil, max: 100, color: "#8b5cf6", unit: "%" },
                  { label: "Security Load", val: Math.min(100, metrics.avgSecWait * 4), max: 100, color: metrics.avgSecWait > 15 ? "#f43f5e" : "#f59e0b", unit: "%" },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-slate-400">{m.label}</span>
                      <span className="text-[9px] font-black" style={{ color: m.color }}>{m.val}{m.unit}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, m.val)}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Report */}
          {!aiReport && !loadingAI && (
            <div className="rounded-2xl p-8 text-center" style={{ border: "1.5px dashed rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.03)" }}>
              <Cpu className="w-10 h-10 mx-auto mb-3 text-violet-500/40" />
              <p className="text-sm font-black text-slate-500">Click "Generate AI Report" for a complete AI-driven summary</p>
              <p className="text-[10px] text-slate-600 mt-1">Includes performance rating, recommendations and focus points for tomorrow</p>
            </div>
          )}

          {loadingAI && (
            <div className="rounded-2xl p-8 flex items-center justify-center gap-3" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,8,20,0.95)" }}>
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              <span className="text-violet-400 font-black text-sm">AI analyzing today's operations...</span>
            </div>
          )}

          {aiReport && (
            <div className="space-y-4">
              {/* Rating + summary */}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${ratingColor[aiReport.performance_rating] || "#64748b"}40`, background: "rgba(0,8,20,0.97)" }}>
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800/50" style={{ background: `${ratingColor[aiReport.performance_rating] || "#64748b"}10` }}>
                  <div className="text-center flex-shrink-0">
                    <p className="text-[7px] uppercase tracking-widest text-slate-600">Overall Rating</p>
                    <p className="text-xl font-black" style={{ color: ratingColor[aiReport.performance_rating] }}>{aiReport.performance_rating}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-800" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">{aiReport.executive_summary}</p>
                </div>
                {aiReport.benchmark_vs_industry && (
                  <div className="px-6 py-3">
                    <p className="text-[9px] text-slate-500 italic">{aiReport.benchmark_vs_industry}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Achievements */}
                <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.95)" }}>
                  <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />Top Achievements
                  </p>
                  {(aiReport.top_achievements || []).map((a, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>{i+1}</span>
                      <p className="text-[10px] text-slate-300">{a}</p>
                    </div>
                  ))}
                </div>

                {/* Key issues */}
                <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(0,8,20,0.95)" }}>
                  <p className="text-[9px] font-black tracking-widest uppercase text-red-400 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />Key Issues
                  </p>
                  {(aiReport.key_issues || []).map((k, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="text-red-400 flex-shrink-0 text-xs mt-0.5">▸</span>
                      <p className="text-[10px] text-slate-300">{k}</p>
                    </div>
                  ))}
                </div>

                {/* Tomorrow focus */}
                <div className="rounded-2xl p-4" style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(0,8,20,0.95)" }}>
                  <p className="text-[9px] font-black tracking-widest uppercase text-cyan-400 mb-3 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />Tomorrow's Focus
                  </p>
                  {(aiReport.tomorrow_focus || []).map((t, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.2)", color: "#06b6d4" }}>{i+1}</span>
                      <p className="text-[10px] text-slate-300">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              {aiReport.ai_recommendations?.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(0,8,20,0.95)" }}>
                  <div className="px-4 py-3 border-b border-slate-800/50" style={{ background: "rgba(139,92,246,0.06)" }}>
                    <p className="text-[9px] font-black tracking-widest uppercase text-violet-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />AI Recommendations
                    </p>
                  </div>
                  <div className="divide-y divide-slate-800/30">
                    {aiReport.ai_recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg text-[8px] font-black flex-shrink-0 mt-0.5"
                          style={{ background: `${prioColor[r.priority] || "#64748b"}15`, color: prioColor[r.priority] || "#64748b", border: `1px solid ${prioColor[r.priority] || "#64748b"}25` }}>
                          {(r.priority || "").toUpperCase()}
                        </span>
                        <div className="flex-shrink-0 w-24">
                          <p className="text-[8px] uppercase tracking-widest font-black text-slate-500">{r.category}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] text-white font-bold">{r.recommendation}</p>
                          {r.impact && <p className="text-[9px] text-slate-500 mt-0.5">→ {r.impact}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}