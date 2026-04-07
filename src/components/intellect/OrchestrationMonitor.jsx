import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, Eye, Zap } from 'lucide-react';

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden backdrop-blur-lg border"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(139,92,246,0.02) 100%), rgba(8,12,28,0.95)',
        borderColor: 'rgba(6,182,212,0.2)',
        boxShadow: '0 0 30px rgba(6,182,212,0.08), inset 0 0.5px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div className="relative px-6 py-5 border-b" style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'linear-gradient(180deg, rgba(6,182,212,0.03), transparent)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 flex items-center justify-center"
              style={{ color: '#06b6d4' }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
            <div>
              <h3 className="text-xs font-black font-mono tracking-wider uppercase" style={{ color: '#06b6d4', letterSpacing: '0.1em' }}>
                Orchestration
              </h3>
              <p className="text-[10px] text-slate-500 font-light mt-0.5">
                {done}/{total} • {running > 0 ? `${running} active` : 'idle'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">{formatTime(elapsedTime)}</span>
            <div className="text-right">
              <span className="text-sm font-black" style={{ color: '#06b6d4' }}>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'linear-gradient(90deg, rgba(6,182,212,0.6), rgba(139,92,246,0.6))',
              boxShadow: '0 0 15px rgba(6,182,212,0.3)',
            }}
          />
        </div>
      </div>

      {/* Workers */}
      <div className="px-4 py-3 space-y-2 max-h-96 overflow-y-auto" style={{ background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.01))' }}>
        {orchestration.workers.map((worker, idx) => {
          const task = orchestration.tasks.find(t => t.workerId === worker.workerId);
          const output = orchestration.outputs[worker.id];
          const isExpanded = expandedWorker === worker.id;

          const statusConfig = {
            done: { icon: CheckCircle2, color: '#10b981', label: 'Done', bg: 'rgba(16,185,129,0.08)' },
            running: { icon: Loader2, color: '#06b6d4', label: 'Running', bg: 'rgba(6,182,212,0.08)' },
            queued: { icon: Clock, color: '#f59e0b', label: 'Queued', bg: 'rgba(245,158,11,0.05)' },
            error: { icon: AlertCircle, color: '#ef4444', label: 'Failed', bg: 'rgba(239,68,68,0.05)' },
          };

          const config = statusConfig[worker.status] || statusConfig.queued;
          const Icon = config.icon;

          return (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group rounded-xl transition-all cursor-pointer"
              style={{
                background: isExpanded ? `linear-gradient(135deg, ${config.bg}, transparent)` : config.bg,
                border: `1px solid ${isExpanded ? config.color + '30' : 'rgba(100,116,139,0.1)'}`,
                borderLeft: `2px solid ${config.color}`,
              }}
              onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
            >
              {/* Header */}
              <div className="p-3 flex items-center gap-3">
                <motion.div
                  animate={worker.status === 'running' ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {worker.status === 'running' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </motion.div>
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs truncate" style={{ color: config.color }}>
                      {worker.emoji} {worker.name}
                    </span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: config.bg, color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  {task && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-light">{task.prompt}</p>}
                </div>

                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: config.color }} />
                </motion.div>
              </div>

              {/* Expanded */}
              {isExpanded && output && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t px-3 py-3"
                  style={{ borderColor: config.color + '20', background: 'rgba(0,0,0,0.3)' }}
                >
                  <div className="space-y-2">
                    <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <p className="text-[8px] font-mono uppercase tracking-wider text-slate-500 mb-2">Output</p>
                      <div className="text-[10px] text-slate-400 font-light leading-relaxed max-h-32 overflow-y-auto font-mono">
                        {typeof output === 'string'
                          ? output.split('\n').slice(0, 6).join('\n')
                          : JSON.stringify(output, null, 2).split('\n').slice(0, 6).join('\n')}
                        {(typeof output === 'string' ? output.split('\n').length : JSON.stringify(output).split('\n').length) > 6 && (
                          <span className="text-slate-600"> […]</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); onViewOutput(worker, output); }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-mono font-semibold transition-all"
                        style={{ background: config.color + '15', color: config.color, border: `0.5px solid ${config.color}30` }}
                      >
                        <Eye className="w-3 h-3" /> View Full Output
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex items-center justify-between text-[10px] font-mono" style={{ borderColor: 'rgba(6,182,212,0.1)', background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.02))' }}>
        <div className="flex gap-3 text-slate-500">
          <span><span style={{ color: '#10b981' }}>●</span> {done}</span>
          {running > 0 && <span><motion.span style={{ color: '#06b6d4' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>●</motion.span> {running}</span>}
          {errors > 0 && <span><span style={{ color: '#ef4444' }}>●</span> {errors}</span>}
        </div>
        <span style={{ color: '#64748b' }}>⏱ {formatTime(elapsedTime)}</span>
      </div>
    </motion.div>
  );
}