import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, Eye, Zap, TrendingUp } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-3xl overflow-hidden backdrop-blur-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.08) 100%), rgba(10,15,35,0.95)',
        border: '1px solid rgba(6,182,212,0.4)',
        boxShadow: '0 0 60px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), transparent)' }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2), transparent)' }}
        />
      </div>

      {/* Header Section */}
      <div className="relative p-8 border-b backdrop-blur-sm" style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.05)' }}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))' }}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </motion.div>
              <h3 className="text-lg font-black font-mono tracking-widest" style={{ color: '#06b6d4' }}>
                AI ORCHESTRATION
              </h3>
            </motion.div>
            <p className="text-xs text-slate-400 ml-9 font-light">
              Parallel execution • {done}/{total} workers completed
              {running > 0 && <span style={{ color: '#06b6d4' }}> • {running} live</span>}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Progress Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative w-24 h-24"
            >
              <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="rgba(100,116,139,0.2)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{ strokeDashoffset: [0, -264 * (1 - progress / 100)] }}
                  transition={{ duration: 0.8 }}
                  strokeDasharray="264"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black" style={{ color: '#06b6d4' }}>{progress}%</span>
                <span className="text-[10px] text-slate-500">Complete</span>
              </div>
            </motion.div>

            {/* Time Stats */}
            <div className="flex flex-col justify-center items-center p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Clock className="w-4 h-4 text-violet-400 mb-1" />
              <span className="text-sm font-black text-white">{formatTime(elapsedTime)}</span>
              <span className="text-[9px] text-slate-500">Elapsed</span>
            </div>

            {/* Speed Indicator */}
            <div className="flex flex-col justify-center items-center p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-sm font-black text-white">{running}</span>
              <span className="text-[9px] text-slate-500">Active</span>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)',
              backgroundSize: '200% 100%',
              boxShadow: '0 0 20px rgba(6,182,212,0.6), inset 0 0 8px rgba(255,255,255,0.3)',
            }}
          >
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-full"
              style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Workers List */}
      <div className="relative p-6 space-y-3 max-h-[600px] overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {orchestration.workers.map((worker, idx) => {
          const task = orchestration.tasks.find(t => t.workerId === worker.workerId);
          const output = orchestration.outputs[worker.id];
          const isExpanded = expandedWorker === worker.id;

          const statusConfig = {
            done: { icon: CheckCircle2, color: '#10b981', label: '✓ Done', accent: 'rgba(16,185,129,0.15)' },
            running: { icon: Loader2, color: '#06b6d4', label: '● Running', accent: 'rgba(6,182,212,0.15)' },
            queued: { icon: Clock, color: '#f59e0b', label: '○ Queued', accent: 'rgba(245,158,11,0.1)' },
            error: { icon: AlertCircle, color: '#ef4444', label: '✕ Failed', accent: 'rgba(239,68,68,0.1)' },
          };

          const config = statusConfig[worker.status] || statusConfig.queued;
          const Icon = config.icon;

          return (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group rounded-2xl transition-all cursor-pointer overflow-hidden"
              style={{
                background: isExpanded
                  ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.08))'
                  : 'rgba(15,23,42,0.8)',
                border: `1.5px solid ${isExpanded ? 'rgba(6,182,212,0.5)' : 'rgba(100,116,139,0.25)'}`,
                boxShadow: isExpanded ? `0 0 20px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
              }}
              onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
            >
              {/* Worker Card Header */}
              <div className="p-4 flex items-center gap-4">
                {/* Status Indicator */}
                <motion.div
                  animate={worker.status === 'running' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex-shrink-0"
                >
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: config.accent, border: `1.5px solid ${config.color}40` }}>
                    {worker.status === 'running' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-5 h-5">
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </motion.div>
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    )}
                  </div>
                </motion.div>

                {/* Worker Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color: config.color }}>
                      {worker.emoji} {worker.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: config.accent, color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  {task && <p className="text-xs text-slate-400 line-clamp-1 font-light">{task.prompt}</p>}
                </div>

                {/* Expand Indicator */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="w-4 h-4" style={{ color: config.color }} />
                </motion.div>
              </div>

              {/* Expanded Output Section */}
              {isExpanded && output && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t px-4 py-4"
                  style={{ borderColor: `${config.color}30`, background: 'rgba(0,0,0,0.4)' }}
                >
                  <div className="space-y-3">
                    {/* Output Preview */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${config.color}20` }}>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">OUTPUT</p>
                      <div className="text-xs text-slate-300 font-light leading-relaxed max-h-40 overflow-y-auto font-mono">
                        {typeof output === 'string'
                          ? output.split('\n').slice(0, 8).join('\n')
                          : JSON.stringify(output, null, 2)
                              .split('\n')
                              .slice(0, 8)
                              .join('\n')}
                        {(typeof output === 'string' ? output.split('\n').length : JSON.stringify(output).split('\n').length) > 8 && (
                          <span className="text-slate-600"> […]</span>
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
                          🔮 Hologram
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

      {/* Footer Statistics */}
      <div className="relative p-4 border-t flex items-center justify-between text-xs font-mono backdrop-blur-sm" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'linear-gradient(90deg, rgba(6,182,212,0.05), rgba(139,92,246,0.03))' }}>
        <div className="flex gap-6 text-slate-400">
          <motion.span whileHover={{ scale: 1.1 }} style={{ cursor: 'default' }}>
            <span style={{ color: '#10b981' }}>●</span> {done} Done
          </motion.span>
          {running > 0 && (
            <motion.span whileHover={{ scale: 1.1 }} style={{ cursor: 'default' }}>
              <motion.span style={{ color: '#06b6d4' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                ●
              </motion.span>{' '}
              {running} Running
            </motion.span>
          )}
          {errors > 0 && (
            <motion.span whileHover={{ scale: 1.1 }} style={{ cursor: 'default' }}>
              <span style={{ color: '#ef4444' }}>●</span> {errors} Failed
            </motion.span>
          )}
        </div>
        <span style={{ color: '#64748b' }}>⏱ {formatTime(elapsedTime)}</span>
      </div>
    </motion.div>
  );
}