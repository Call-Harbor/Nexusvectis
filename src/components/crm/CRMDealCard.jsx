import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, Calendar, DollarSign, User, ChevronRight } from "lucide-react";

const riskColors = {
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  critical: "text-red-400 bg-red-500/10 border-red-500/30"
};

const scoreColor = (score) => {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
};

export default function CRMDealCard({ deal, onClick, onDragStart }) {
  const daysUntilClose = deal.expected_close_date
    ? Math.ceil((new Date(deal.expected_close_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white text-sm font-semibold leading-tight flex-1 mr-2 line-clamp-2">{deal.title}</h4>
        {deal.ai_risk_level && (
          <Badge className={`text-[9px] font-bold flex-shrink-0 ${riskColors[deal.ai_risk_level]}`}>
            {deal.ai_risk_level}
          </Badge>
        )}
      </div>

      {/* Company */}
      {deal.company_name && (
        <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
          <User className="w-3 h-3" />
          {deal.company_name}
        </p>
      )}

      {/* Value + Score */}
      <div className="flex items-center justify-between mb-2">
        {deal.value ? (
          <span className="text-cyan-400 text-sm font-bold flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {deal.value.toLocaleString()} {deal.currency || 'EUR'}
          </span>
        ) : <span />}
        {deal.ai_score != null && (
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-violet-400" />
            <span className={`text-xs font-bold ${scoreColor(deal.ai_score)}`}>{deal.ai_score}</span>
          </div>
        )}
      </div>

      {/* AI Next Action */}
      {deal.ai_next_action && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-2 py-1.5 mb-2">
          <p className="text-violet-300 text-[10px] flex items-start gap-1">
            <Brain className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{deal.ai_next_action}</span>
          </p>
        </div>
      )}

      {/* Close date + probability */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        {daysUntilClose != null && (
          <span className={`flex items-center gap-1 ${daysUntilClose < 7 ? 'text-red-400' : daysUntilClose < 30 ? 'text-amber-400' : 'text-slate-500'}`}>
            <Calendar className="w-3 h-3" />
            {daysUntilClose < 0 ? `${Math.abs(daysUntilClose)}d overdue` : `${daysUntilClose}d left`}
          </span>
        )}
        {deal.probability != null && (
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {deal.probability}%
          </span>
        )}
      </div>
    </div>
  );
}