import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Calendar, Edit, Briefcase } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  active:     { label: "Aktiv",         className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  on_leave:   { label: "På orlov",      className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  terminated: { label: "Fratrådt",      className: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  probation:  { label: "Prøvetid",      className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const deptColors = {
  Operations: "bg-cyan-500/10 text-cyan-400",
  Logistics:  "bg-violet-500/10 text-violet-400",
  Fleet:      "bg-orange-500/10 text-orange-400",
  Finance:    "bg-emerald-500/10 text-emerald-400",
  HR:         "bg-pink-500/10 text-pink-400",
  IT:         "bg-blue-500/10 text-blue-400",
  Sales:      "bg-amber-500/10 text-amber-400",
  Management: "bg-slate-500/10 text-slate-400",
};

export default function EmployeeCard({ employee, onEdit, onView }) {
  const status = statusConfig[employee.status] || statusConfig.active;
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div
      className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 transition-all cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
          {employee.avatar_url ? (
            <img src={employee.avatar_url} alt={initials} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white text-sm leading-tight">
                {employee.first_name} {employee.last_name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{employee.job_title || "—"}</p>
            </div>
            <Badge className={`text-[10px] flex-shrink-0 ${status.className}`}>{status.label}</Badge>
          </div>

          <div className="mt-2 space-y-1">
            {employee.department && (
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${deptColors[employee.department] || deptColors.Management}`}>
                {employee.department}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.location && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{employee.location}</span>
              </div>
            )}
            {employee.hire_date && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>Ansat {format(new Date(employee.hire_date), "dd MMM yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">#{employee.employee_id || "N/A"}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[11px] text-slate-400 hover:text-white px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Edit className="w-3 h-3 mr-1" /> Rediger
        </Button>
      </div>
    </div>
  );
}