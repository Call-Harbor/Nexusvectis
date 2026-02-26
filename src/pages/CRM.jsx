import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Brain, TrendingUp, DollarSign, Users, Target, BarChart3, 
  Plus, Search, Sparkles, RefreshCw, LayoutGrid, List,
  AlertTriangle, CheckCircle, Clock, MessageSquare, Satellite
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CRMPipeline from "../components/crm/CRMPipeline";
import CRMAIInsights from "../components/crm/CRMAIInsights";
import CRMDealEditor from "../components/crm/CRMDealEditor";
import NexusSatelliteChat from "../components/crm/NexusSatelliteChat";

export default function CRM() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("pipeline"); // pipeline | insights | chat
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [newDealStage, setNewDealStage] = useState("lead");
  const [bulkScoring, setBulkScoring] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: deals = [], isLoading, refetch } = useQuery({
    queryKey: ['crm-deals', user?.organization_id],
    queryFn: () => base44.entities.CRMDeal.filter({ organization_id: user.organization_id }, '-created_date', 500),
    enabled: !!user?.organization_id
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', user?.organization_id],
    queryFn: () => base44.entities.Customer.filter({ organization_id: user.organization_id }, '-created_date', 200),
    enabled: !!user?.organization_id
  });

  // Computed stats
  const pipelineValue = deals.filter(d => !['won','lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === 'won').reduce((s, d) => s + (d.value || 0), 0);
  const atRisk = deals.filter(d => ['high','critical'].includes(d.ai_risk_level) && !['won','lost'].includes(d.stage)).length;
  const avgScore = deals.filter(d => d.ai_score != null).length > 0
    ? Math.round(deals.filter(d => d.ai_score != null).reduce((s, d) => s + d.ai_score, 0) / deals.filter(d => d.ai_score != null).length)
    : null;

  const filteredDeals = deals.filter(d => {
    const matchSearch = !searchTerm ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = stageFilter === 'all' || d.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const bulkAIScore = async () => {
    const unscored = deals.filter(d => d.ai_score == null && !['won','lost'].includes(d.stage)).slice(0, 10);
    if (unscored.length === 0) { toast.info("All active deals already have AI scores"); return; }
    setBulkScoring(true);
    toast.info(`AI scoring ${unscored.length} deals...`);
    await Promise.all(unscored.map(async (deal) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Score this sales deal: "${deal.title}" | Stage: ${deal.stage} | Value: €${deal.value} | Company: ${deal.company_name} | Source: ${deal.source}. Return JSON with ai_score (0-100), probability (0-100), ai_risk_level (low/medium/high/critical), ai_next_action (string), ai_insights (string).`,
        response_json_schema: {
          type: "object",
          properties: {
            ai_score: { type: "number" },
            probability: { type: "number" },
            ai_risk_level: { type: "string" },
            ai_next_action: { type: "string" },
            ai_insights: { type: "string" }
          }
        }
      }).catch(() => null);
      if (result) {
        await base44.entities.CRMDeal.update(deal.id, result);
      }
    }));
    queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    setBulkScoring(false);
    toast.success(`AI scored ${unscored.length} deals!`);
  };

  const handleAddDeal = (stage = "lead") => {
    setNewDealStage(stage);
    setSelectedDeal(null);
    setShowEditor(true);
  };

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setShowEditor(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-full px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/40">
                <Target className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  CRM & Sales Pipeline
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">AI-POWERED</Badge>
                </h1>
                <p className="text-slate-400 text-sm">{deals.length} deals · €{pipelineValue.toLocaleString()} pipeline</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={bulkAIScore}
                disabled={bulkScoring}
                variant="outline"
                size="sm"
                className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
              >
                {bulkScoring ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
                AI Score All
              </Button>
              <div className="flex border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView("pipeline")}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all ${view === 'pipeline' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
                </button>
                <button
                  onClick={() => setView("insights")}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all ${view === 'insights' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Insights
                </button>
                <button
                  onClick={() => setView("chat")}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all ${view === 'chat' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Satellite className="w-3.5 h-3.5" /> Satellite Chat
                </button>
              </div>
              <Button onClick={() => handleAddDeal()} className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-700 hover:to-violet-700" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Deal
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pipeline Value", value: `€${pipelineValue.toLocaleString()}`, icon: DollarSign, color: "cyan", sub: `${deals.filter(d => !['won','lost'].includes(d.stage)).length} active deals` },
            { label: "Won Revenue", value: `€${wonValue.toLocaleString()}`, icon: CheckCircle, color: "emerald", sub: `${deals.filter(d => d.stage === 'won').length} closed` },
            { label: "At Risk", value: atRisk, icon: AlertTriangle, color: "red", sub: "high/critical risk deals" },
            { label: "Avg AI Score", value: avgScore != null ? avgScore : "—", icon: Brain, color: "violet", sub: `${deals.filter(d => d.ai_score != null).length} scored` },
          ].map((stat, i) => {
            const Icon = stat.icon;
            const colors = {
              cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
              emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
              red: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-400",
              violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400"
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-br ${colors[stat.color]} border rounded-2xl p-4`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-slate-400 text-xs font-medium">{stat.label}</p>
                  <Icon className={`w-4 h-4 ${colors[stat.color].split(' ').find(c => c.startsWith('text-'))}`} />
                </div>
                <p className={`text-2xl font-bold ${colors[stat.color].split(' ').find(c => c.startsWith('text-'))}`}>{stat.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Search + Stage filter */}
        {view === 'pipeline' && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search deals..."
                className="pl-9 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['all','lead','qualified','proposal','negotiation','won','lost'].map(s => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${stageFilter === s ? 'bg-cyan-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'}`}
                >
                  {s === 'all' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Views */}
        {view === 'pipeline' && (
          isLoading ? (
            <div className="text-slate-400 text-center py-20">Loading pipeline...</div>
          ) : (
            <CRMPipeline
              deals={filteredDeals}
              onDealClick={handleDealClick}
              onAddDeal={handleAddDeal}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['crm-deals'] })}
            />
          )
        )}

        {view === 'insights' && (
          <CRMAIInsights deals={deals} customers={customers} />
        )}

        {view === 'chat' && (
          <NexusSatelliteChat user={user} orgId={user?.organization_id} customers={customers} />
        )}
      </div>

      {/* Deal Editor Modal */}
      {showEditor && (
        <CRMDealEditor
          deal={selectedDeal ? selectedDeal : { stage: newDealStage }}
          orgId={user?.organization_id}
          onClose={() => { setShowEditor(false); setSelectedDeal(null); }}
          onSave={() => { setShowEditor(false); setSelectedDeal(null); refetch(); }}
        />
      )}
    </div>
  );
}