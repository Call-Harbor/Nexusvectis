import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FuturisticGlobe from "./FuturisticGlobe";

const AI_LEARNING_PHASES = [
  'Ingesting fleet telemetry…',
  'Running predictive maintenance scoring…',
  'Executing ACO swarm optimization…',
  'Running PSO particle convergence…',
  'Marking AI-optimized routes…',
  'Detecting statistical anomalies…',
  'Generating strategic AI briefing…',
];

export default function DashboardGlobeFrame({
  vehicles = [],
  routes = [],
  resources = [],
  digitalTwins = [],
  buses = [],
  busRoutes = [],
  busStops = [],
  orgId,
  onSelectVehicle,
  onSelectResource,
  className = "",
}) {
  const [aiMode, setAiMode] = useState('active');
  const [aiLearningProgress, setAiLearningProgress] = useState(0);
  const [aiLearningPhase, setAiLearningPhase] = useState(0);
  const [retrainResults, setRetrainResults] = useState(null);

  const isLearning = aiMode === 'learning';

  // Learning mode: call real backend + animate progress
  useEffect(() => {
    if (aiMode !== 'learning') { setAiLearningProgress(0); setAiLearningPhase(0); return; }
    if (!orgId) return;

    setRetrainResults(null);
    let progress = 0;
    let done = false;

    const interval = setInterval(() => {
      if (done) return;
      progress = Math.min(progress + 0.5, 92);
      setAiLearningProgress(progress);
      setAiLearningPhase(Math.floor((progress / 100) * AI_LEARNING_PHASES.length));
    }, 80);

    base44.functions.invoke('neuralRetrainEngine', { organization_id: orgId })
      .then(res => {
        done = true;
        clearInterval(interval);
        setAiLearningProgress(100);
        setAiLearningPhase(AI_LEARNING_PHASES.length - 1);
        setRetrainResults(res.data);
        setTimeout(() => setAiMode('active'), 1800);
      })
      .catch(() => {
        done = true;
        clearInterval(interval);
        setAiLearningProgress(100);
        setTimeout(() => setAiMode('active'), 1000);
      });

    return () => clearInterval(interval);
  }, [aiMode, orgId]);

  return (
    <div className={`relative ${className}`}>
      {/* Retrain AI Button — top-right corner */}
      <div className="absolute top-3 right-3 z-30">
        <motion.button
          onClick={() => !isLearning && setAiMode('learning')}
          whileHover={!isLearning ? { scale: 1.05 } : {}}
          whileTap={!isLearning ? { scale: 0.95 } : {}}
          className={`relative px-3 py-1.5 rounded-xl font-medium text-xs transition-all overflow-hidden ${
            isLearning
              ? 'bg-gradient-to-r from-violet-600/40 to-pink-600/40 text-violet-300 border border-violet-400/60 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-cyan-400 border border-cyan-400/50 cursor-pointer'
          }`}
        >
          {isLearning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-violet-500/20"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div className="relative flex items-center gap-1.5">
            {isLearning ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Brain className="w-3 h-3 text-violet-300" />
              </motion.div>
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{isLearning ? `Training… ${Math.round(aiLearningProgress)}%` : 'Retrain AI'}</span>
          </div>
        </motion.button>
      </div>

      {/* Globe */}
      <FuturisticGlobe
        vehicles={vehicles}
        routes={routes}
        resources={resources}
        digitalTwins={digitalTwins}
        onSelectVehicle={onSelectVehicle}
        onSelectResource={onSelectResource}
      />

      {/* Learning Mode Overlay */}
      <AnimatePresence>
        {isLearning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-violet-500/30"
                style={{ width: 120 + i * 80, height: 120 + i * 80 }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-2 border-t-violet-400 border-violet-500/30 mb-6"
            />
            <p className="text-violet-300 font-bold text-sm tracking-widest uppercase mb-1">Neural Retraining</p>
            <p className="text-slate-400 text-xs font-mono mb-4 min-h-[16px]">
              {AI_LEARNING_PHASES[Math.min(aiLearningPhase, AI_LEARNING_PHASES.length - 1)]}
            </p>
            <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-pink-400 to-violet-500 rounded-full"
                animate={{ width: `${aiLearningProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-violet-400 text-xs font-mono mt-2">{Math.round(aiLearningProgress)}%</p>
            <p className="text-[10px] text-slate-500 mt-4 font-mono">Live data polling paused · Writing to database…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retrain Results Banner */}
      <AnimatePresence>
        {retrainResults && aiMode === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-black/90 border-t border-violet-500/40 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neural Retrain Complete</span>
                  <span className="text-[9px] text-slate-500 font-mono">{retrainResults.duration_ms}ms</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
                  {[
                    { label: 'Health', value: `${retrainResults.fleet_health_score}/100`, color: 'text-cyan-400' },
                    { label: 'Maint.', value: retrainResults.summary?.maintenance_orders_created, color: 'text-amber-400' },
                    { label: 'Eff. ↑', value: retrainResults.summary?.efficiency_updates, color: 'text-violet-400' },
                    { label: 'Routes', value: retrainResults.summary?.routes_optimized, color: 'text-emerald-400' },
                    { label: 'CO₂ -kg', value: retrainResults.summary?.co2_saved_kg, color: 'text-green-400' },
                    { label: 'Anomalies', value: retrainResults.summary?.anomalies_detected, color: 'text-pink-400' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-1.5 rounded bg-slate-900/60 border border-slate-700/40">
                      <p className={`text-sm font-black ${item.color}`}>{item.value ?? '—'}</p>
                      <p className="text-[8px] text-slate-500 uppercase">{item.label}</p>
                    </div>
                  ))}
                </div>
                {retrainResults.summary?.ai_summary && (
                  <p className="text-[9px] text-slate-300 italic leading-relaxed line-clamp-2">
                    {retrainResults.summary.ai_summary}
                  </p>
                )}
              </div>
              <button onClick={() => setRetrainResults(null)} className="text-slate-500 hover:text-slate-300 text-xs p-1">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}