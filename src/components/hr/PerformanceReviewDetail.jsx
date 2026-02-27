import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, Award, Edit2, CheckCircle2, Circle, Target, MessageSquare,
  TrendingUp, Lightbulb, ClipboardList, Calendar, ChevronRight
} from "lucide-react";
import { COMPETENCIES, STATUS_CONFIG, StarRating } from "./PerformancePanel";

export default function PerformanceReviewDetail({ review, onClose, onEdit, onStatusChange }) {
  const sc = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft;
  const goalsAchieved = (review.goals || []).filter(g => g.achieved).length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{review.employee_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{review.review_period} · {review.review_date}
                </span>
                <Badge className={`text-[10px] ${sc.cls}`}>{sc.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8 text-slate-400 hover:text-amber-400">
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Overall rating */}
          <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-300">Overall Rating</span>
            <div className="flex items-center gap-3">
              <StarRating value={review.overall_rating || 0} size="lg" />
              <span className="text-2xl font-bold text-amber-400">{review.overall_rating || "—"}<span className="text-sm text-slate-500">/5</span></span>
            </div>
          </div>

          {/* Competencies */}
          {review.competencies && Object.values(review.competencies).some(v => v > 0) && (
            <Section icon={TrendingUp} title="Competencies" color="text-cyan-400">
              <div className="space-y-2">
                {COMPETENCIES.map(c => {
                  const val = review.competencies[c.key] || 0;
                  return (
                    <div key={c.key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-36 flex-shrink-0">{c.label}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                          style={{ width: `${(val / 5) * 100}%` }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <StarRating value={val} />
                        <span className="text-xs text-slate-500 w-3">{val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Goals */}
          {review.goals?.length > 0 && (
            <Section icon={Target} title={`Goals (${goalsAchieved}/${review.goals.length} achieved)`} color="text-emerald-400">
              <div className="space-y-2">
                {review.goals.map((goal, i) => (
                  <div key={goal.id || i} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border ${goal.achieved ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-800/40 border-slate-700/40"}`}>
                    {goal.achieved
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      : <Circle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className={`text-sm ${goal.achieved ? "line-through text-slate-500" : "text-white"}`}>{goal.title}</p>
                      {goal.description && <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>}
                      {goal.target_date && <p className="text-[10px] text-slate-600 mt-0.5">Target date: {goal.target_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Feedback */}
          {review.strengths && (
            <Section icon={Lightbulb} title="Strengths" color="text-amber-400">
              <p className="text-sm text-slate-300 leading-relaxed">{review.strengths}</p>
            </Section>
          )}

          {review.areas_for_improvement && (
            <Section icon={TrendingUp} title="Areas for Improvement" color="text-blue-400">
              <p className="text-sm text-slate-300 leading-relaxed">{review.areas_for_improvement}</p>
            </Section>
          )}

          {review.development_plan && (
            <Section icon={ClipboardList} title="Development Plan" color="text-violet-400">
              <p className="text-sm text-slate-300 leading-relaxed">{review.development_plan}</p>
            </Section>
          )}

          {review.manager_comments && (
            <Section icon={MessageSquare} title="Manager Comments" color="text-pink-400">
              <p className="text-sm text-slate-300 leading-relaxed">{review.manager_comments}</p>
            </Section>
          )}
        </div>

        {/* Footer — status flow */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <div className="flex gap-2">
            {review.status === "draft" && (
              <Button size="sm" onClick={() => onStatusChange(review.id, "submitted")}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-500">
                Submit Review
              </Button>
            )}
            {review.status === "submitted" && (
              <Button size="sm" onClick={() => onStatusChange(review.id, "completed")}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500">
                Complete Review
              </Button>
            )}
            {review.status === "completed" && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(review.id, "archived")}
                className="h-8 text-xs border-slate-700 text-slate-400">
                Archive
              </Button>
            )}
          </div>
          <Button size="sm" onClick={onEdit} variant="ghost" className="h-8 text-xs text-amber-400 hover:text-amber-300">
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div>
      <p className={`text-xs uppercase font-semibold tracking-wide mb-2 flex items-center gap-1.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />{title}
      </p>
      {children}
    </div>
  );
}