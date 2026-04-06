import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Eye } from 'lucide-react';

export default function OrchestrationMonitor({ orchestration, onViewOutput, onOpenHologram }) {
  const [expandedWorker, setExpandedWorker] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (orchestration.status === 'running') {
        setElapsedTime(Math.floor((Date.now() - orchestration.startedAt) / 1000));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [orchestration]);

  const total = orchestration.workers.length;
  const done = orchestration.workers.filter(w => w.status === 'done').length;
  const running = orchestration.workers.filter(w => w.status === 'running').length;
  const errors = orchestration.workers.filter(w => w.status === 'error').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.05) 100%), rgba(10,15,35,0.9)',
        border: '1px solid rgba(6,182,212,0.3)',
        boxShadow: '0 0 40px rgba(6,182,212,0.15)',
      }}
    >
      {/* Header with Timeline */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold font-mono tracking-widest" style={{ color: '#06b6d4' }}>
              ⚡ ORCHESTRATION EXECUTION
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-light">
              {done}/{total} workers completed
              {running > 0 && <span style={{ color: '#06b6d4' }}> • {running} running</span>}
              {errors > 0 && <span style={{ color: '#ef4444' }}> • {errors} failed</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(100,116,139,0.1)' }}>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono text-slate-400">{formatTime(elapsedTime)}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: '#06b6d4' }}>{progress}%</div>
              <div className="text-[10px] font-mono text-slate-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
              boxShadow: '0 0 20px rgba(6,182,212,0.5)',
            }}
          />
        </div>
      </div>

      {/* Workers Grid */}
      <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
        {orchestration.workers.map((worker, idx) => {
          const task = orchestration.tasks.find(t => t.workerId === worker.workerId);
          const output = orchestration.outputs[worker.id];
          const isExpanded = expandedWorker === worker.id;

          const statusConfig = {
            done: { icon: CheckCircle2, color: '#10b981', label: 'Done', spin: false },
            running: { icon: Loader2, color: '#06b6d4', label: 'Running', spin: true },
            queued: { icon: Clock, color: '#f59e0b', label: 'Queued', spin: false },
            error: { icon: AlertCircle, color: '#ef4444', label: 'Failed', spin: false },
          };

          const config = statusConfig[worker.status] || statusConfig.queued;
          const Icon = config.icon;

          return (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl transition-all cursor-pointer group overflow-hidden"
              style={{
                background: isExpanded ? 'rgba(6,182,212,0.12)' : 'rgba(15,23,42,0.6)',
                border: `1px solid ${isExpanded ? 'rgba(6,182,212,0.4)' : 'rgba(100,116,139,0.2)'}`,
                borderLeft: `3px solid ${config.color}`,
              }}
              onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
            >
              {/* Header Row */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={config.spin ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${config.color}20` }}
                  >
                    <Icon className="w-3 h-3" style={{ color: config.color }} />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color: config.color }}>
                      {worker.emoji} {worker.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${config.color}15`, color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  {task && (
                    <p className="text-xs text-slate-400 line-clamp-1 font-light">{task.prompt}</p>
                  )}
                </div>

                <motion.button
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: config.color, background: `${config.color}15` }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Expanded Content */}
              {isExpanded && output && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t px-4 py-4"
                  style={{ borderColor: `${config.color}30` }}
                >
                  <div className="space-y-3">
                    {/* Output Preview */}
                    <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Output</p>
                      <div className="text-sm text-slate-300 font-light leading-relaxed max-h-32 overflow-y-auto">
                        {typeof output === 'string'
                          ? output.split('\n').slice(0, 5).join('\n')
                          : JSON.stringify(output, null, 2)
                              .split('\n')
                              .slice(0, 5)
                              .join('\n')}
                        {(typeof output === 'string' ? output.split('\n').length : JSON.stringify(output).split('\n').length) > 5 && (
                          <span className="text-slate-500"> [...]</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOutput(worker, output);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                        style={{
                          background: `${config.color}20`,
                          color: config.color,
                          border: `1px solid ${config.color}40`,
                        }}
                      >
                        <Eye className="w-3 h-3" /> Full Output
                      </motion.button>
                      {onOpenHologram && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenHologram(worker, task?.prompt);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                          style={{
                            background: 'rgba(139,92,246,0.15)',
                            color: '#a78bfa',
                            border: '1px solid rgba(139,92,246,0.4)',
                          }}
                        >
                          💻 Hologram
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="px-5 py-4 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: 'rgba(6,182,212,0.1)', background: 'rgba(6,182,212,0.02)' }}>
        <div className="flex gap-4 text-slate-400">
          <span><span style={{ color: '#10b981' }}>✓</span> {done} done</span>
          {running > 0 && <span><span style={{ color: '#06b6d4' }} className="animate-pulse">●</span> {running} running</span>}
          {errors > 0 && <span><span style={{ color: '#ef4444' }}>✕</span> {errors} failed</span>}
        </div>
        <span style={{ color: '#64748b' }}>Total time: {formatTime(elapsedTime)}</span>
      </div>
    </motion.div>
  );
}