import { useState } from "react";
import { base44 } from "@/api/base44Client";
import CRMDealCard from "./CRMDealCard";
import { Plus } from "lucide-react";

const STAGES = [
  { key: "lead", label: "Lead", color: "border-slate-500/50", bg: "bg-slate-500/10", dot: "bg-slate-400" },
  { key: "qualified", label: "Qualified", color: "border-blue-500/50", bg: "bg-blue-500/10", dot: "bg-blue-400" },
  { key: "proposal", label: "Proposal", color: "border-violet-500/50", bg: "bg-violet-500/10", dot: "bg-violet-400" },
  { key: "negotiation", label: "Negotiation", color: "border-amber-500/50", bg: "bg-amber-500/10", dot: "bg-amber-400" },
  { key: "won", label: "Won", color: "border-emerald-500/50", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  { key: "lost", label: "Lost", color: "border-red-500/50", bg: "bg-red-500/10", dot: "bg-red-400" },
];

export default function CRMPipeline({ deals, onDealClick, onAddDeal, onRefresh }) {
  const [dragOverStage, setDragOverStage] = useState(null);
  const [draggingDeal, setDraggingDeal] = useState(null);

  const handleDrop = async (stageKey) => {
    if (!draggingDeal || draggingDeal.stage === stageKey) return;
    await base44.entities.CRMDeal.update(draggingDeal.id, { stage: stageKey });
    onRefresh();
    setDraggingDeal(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter(d => d.stage === stage.key);
        const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

        return (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-64 rounded-2xl border-2 ${stage.color} ${dragOverStage === stage.key ? stage.bg : 'bg-slate-900/40'} transition-all flex flex-col`}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.key); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => handleDrop(stage.key)}
          >
            {/* Column Header */}
            <div className={`p-3 border-b border-slate-700/50 ${stage.bg} rounded-t-2xl`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-white font-semibold text-sm">{stage.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>
                <button
                  onClick={() => onAddDeal(stage.key)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-1 rounded transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {totalValue > 0 && (
                <p className="text-xs text-slate-400">€{totalValue.toLocaleString()}</p>
              )}
            </div>

            {/* Deals */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
              {stageDeals.map(deal => (
                <CRMDealCard
                  key={deal.id}
                  deal={deal}
                  onClick={() => onDealClick(deal)}
                  onDragStart={() => setDraggingDeal(deal)}
                />
              ))}
              {stageDeals.length === 0 && (
                <div
                  className="h-20 border-2 border-dashed border-slate-700/40 rounded-xl flex items-center justify-center cursor-pointer hover:border-slate-600/60 transition-all"
                  onClick={() => onAddDeal(stage.key)}
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}