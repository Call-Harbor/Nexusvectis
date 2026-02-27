import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, CalendarDays, TrendingUp, Briefcase,
  Network, Search, Filter, Download, RefreshCw,
  Building2, CheckCircle2, AlertCircle, Clock, ChevronDown, Brain, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EmployeeCard from "../components/hr/EmployeeCard";
import EmployeeEditor from "../components/hr/EmployeeEditor";
import LeaveManager from "../components/hr/LeaveManager";
import RecruitmentPipeline from "../components/hr/RecruitmentPipeline";
import PerformancePanel from "../components/hr/PerformancePanel";
import OrgChart from "../components/hr/OrgChart";
import CandidateMatcher from "../components/hr/CandidateMatcher";
import LearningDevelopment from "../components/hr/LearningDevelopment";

const TABS = [
  { key: "employees",    label: "Medarbejdere",        icon: Users },
  { key: "leave",        label: "Orlov & Fravær",      icon: CalendarDays },
  { key: "recruitment",  label: "Rekruttering",        icon: Briefcase },
  { key: "performance",  label: "Performance",         icon: TrendingUp },
  { key: "career",       label: "Karriere & Matching", icon: Brain },
  { key: "learning",     label: "Uddannelse & Udvikling", icon: GraduationCap },
  { key: "orgchart",     label: "Organisationsdiagram",icon: Network },
];

export default function HRManagement() {
  const [activeTab, setActiveTab]       = useState("employees");
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState(null);
  const [orgId, setOrgId]               = useState(null);
  const [showEditor, setShowEditor]     = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch]             = useState("");
  const [deptFilter, setDeptFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      const oid = u?.organization_id || u?.data?.organization_id;
      setOrgId(oid);
      if (oid) loadEmployees(oid);
    });
  }, []);

  const loadEmployees = async (oid) => {
    setLoading(true);
    const data = await base44.entities.Employee.filter({ organization_id: oid }, "-created_date", 200);
    setEmployees(data);
    setLoading(false);
  };

  const handleSave = () => {
    setShowEditor(false);
    setEditingEmployee(null);
    if (orgId) loadEmployees(orgId);
  };

  const filtered = employees.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      if (![e.first_name, e.last_name, e.email, e.job_title, e.department].some(v => v?.toLowerCase().includes(q))) return false;
    }
    if (deptFilter !== "all" && e.department !== deptFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const stats = {
    total:     employees.length,
    active:    employees.filter(e => e.status === "active").length,
    on_leave:  employees.filter(e => e.status === "on_leave").length,
    probation: employees.filter(e => e.status === "probation").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900/70 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/30 to-violet-500/30 border border-pink-500/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-400" />
              </div>
              HR Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Medarbejdere, rekruttering, orlov og performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => orgId && loadEmployees(orgId)}
              className="text-slate-400 hover:text-white h-9 w-9"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={() => { setEditingEmployee(null); setShowEditor(true); }}
              className="bg-pink-600 hover:bg-pink-500 h-9 text-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Ny medarbejder
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Ansatte i alt",   value: stats.total,     icon: Users,        color: "text-white",        bg: "bg-slate-800/60" },
            { label: "Aktive",          value: stats.active,    icon: CheckCircle2, color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "På orlov",        value: stats.on_leave,  icon: CalendarDays, color: "text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Prøvetid",        value: stats.probation, icon: Clock,        color: "text-blue-400",     bg: "bg-blue-500/10 border-blue-500/20" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`${s.bg} border border-slate-700/40 rounded-xl p-4 flex items-center gap-3`}>
                <Icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "employees" && (
              <div className="space-y-4">
                {/* Search & filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Søg medarbejder..."
                      className="pl-9 bg-slate-900/60 border-slate-700/60 text-white h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <FilterSelect value={deptFilter} onChange={setDeptFilter} options={[["all", "Alle afdelinger"], ...depts.map(d => [d, d])]} />
                    <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[["all", "Alle statusser"], ["active", "Aktive"], ["on_leave", "På orlov"], ["probation", "Prøvetid"], ["terminated", "Fratrådte"]]} />
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-40 bg-slate-800/40 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <Users className="w-10 h-10 mb-3 text-slate-700" />
                    <p className="text-sm">Ingen medarbejdere fundet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(emp => (
                      <EmployeeCard
                        key={emp.id}
                        employee={emp}
                        onEdit={() => { setEditingEmployee(emp); setShowEditor(true); }}
                        onView={() => { setEditingEmployee(emp); setShowEditor(true); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "leave" && (
              <LeaveManager orgId={orgId} employees={employees} />
            )}

            {activeTab === "recruitment" && (
              <RecruitmentPipeline orgId={orgId} />
            )}

            {activeTab === "performance" && (
              <PerformancePanel orgId={orgId} employees={employees} />
            )}

            {activeTab === "career" && (
              <CandidateMatcher employees={employees} orgId={orgId} />
            )}

            {activeTab === "learning" && (
              <LearningDevelopment orgId={orgId} employees={employees} />
            )}

            {activeTab === "orgchart" && (
              <OrgChart employees={employees} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <EmployeeEditor
          employee={editingEmployee}
          orgId={orgId}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingEmployee(null); }}
        />
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-slate-900/60 border border-slate-700/60 text-sm text-white rounded-lg px-3 pr-8 py-2 h-9 focus:outline-none focus:border-pink-500/50 cursor-pointer"
      >
        {options.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
    </div>
  );
}