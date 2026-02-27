import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RefreshCw, BookOpen, Users, Sparkles, BarChart3 } from "lucide-react";
import LearningCatalog from "./LearningCatalog";
import LearningEnrollments from "./LearningEnrollments";
import LearningAIRecommender from "./LearningAIRecommender";

const SUBTABS = [
  { key: "catalog",      label: "Course Catalog",      icon: BookOpen },
  { key: "enrollments",  label: "Enrollments",         icon: Users },
  { key: "ai",           label: "AI Recommendations",  icon: Sparkles },
];

export default function LearningDevelopment({ orgId, employees }) {
  const [sub, setSub]         = useState("catalog");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCourses = async () => {
    if (!orgId) return;
    setLoading(true);
    const data = await base44.entities.TrainingCourse.filter({ organization_id: orgId }, "-created_date", 100);
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, [orgId]);

  // Quick stats
  const activeCourses = courses.filter(c => c.status === "active").length;
  const totalEnrollments = courses.reduce((s, c) => s + (c.enrollments || []).filter(e => e.status !== "cancelled").length, 0);
  const completed = courses.reduce((s, c) => s + (c.enrollments || []).filter(e => e.status === "completed").length, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeCourses}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active Courses</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalEnrollments}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Enrollments</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{completed}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Sub-tabs + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
          {SUBTABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setSub(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  sub === t.key ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={loadCourses} disabled={loading}
          className="h-8 w-8 text-slate-400 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      {sub === "catalog" && (
        <LearningCatalog courses={courses} orgId={orgId} onRefresh={loadCourses} />
      )}
      {sub === "enrollments" && (
        <LearningEnrollments courses={courses} employees={employees} onRefresh={loadCourses} />
      )}
      {sub === "ai" && (
        <LearningAIRecommender employees={employees} courses={courses} orgId={orgId} />
      )}
    </div>
  );
}