import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Monitor, Zap, MousePointer, X, Maximize2, Minimize2 } from 'lucide-react';

const HOLOGRAM_MODES = [
  { id: 'intellect_mode', name: 'IntellectMode', icon: '🧠', description: 'Full AI workspace environment' },
  { id: 'fleet_hologram', name: 'Fleet Hologram', icon: '🚀', description: '3D fleet visualization' },
  { id: 'port_hologram', name: 'Port Command', icon: '⛴️', description: 'Port operations center' },
  { id: 'airport_hologram', name: 'Airport Ops', icon: '✈️', description: 'Airport operations center' },
];

export default function WorkerHologramControl({ worker, task, isActive, onComplete }) {
  const [hologramMode, setHologramMode] = useState('intellect_mode');
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isActive && isExecuting) {
      executeWorkerActions();
    }
  }, [isActive, isExecuting]);

  const executeWorkerActions = async () => {
    try {
      // Simulate worker interactions in hologram
      const actions = [
        { type: 'navigate', target: hologramMode, delay: 500 },
        { type: 'analyze', data: task, delay: 1000 },
        { type: 'interact', selector: '[data-worker-interactive]', delay: 800 },
      ];

      for (const action of actions) {
        setSteps(prev => [...prev, { ...action, status: 'executing' }]);
        await simulateAction(action);
        setSteps(prev => prev.map(s => s === steps[steps.length - 1] ? { ...s, status: 'completed' } : s));
      }

      onComplete({ worker: worker || {}, results: steps, mode: hologramMode });
      setIsExecuting(false);
    } catch (error) {
      console.error('Worker hologram execution failed:', error);
      setIsExecuting(false);
    }
  };

  const simulateAction = async (action) => {
    return new Promise(resolve => setTimeout(resolve, action.delay || 500));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-2xl overflow-hidden backdrop-blur-xl transition-all ${isMaximized ? 'fixed inset-4 z-50' : 'relative'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(139,92,246,0.05) 100%), rgba(10,15,35,0.95)',
        border: '1px solid rgba(6,182,212,0.3)',
        boxShadow: '0 0 40px rgba(6,182,212,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <Monitor className="w-4 h-4" style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <p className="text-xs font-mono font-bold" style={{ color: '#06b6d4' }}>🤖 {worker?.name || 'Worker'} — HOLOGRAM MODE</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Interactive workspace</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsMaximized(!isMaximized)}
            whileHover={{ scale: 1.1 }}
            className="p-2 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            onClick={() => onComplete({ worker: worker || {}, cancelled: true })}
            whileHover={{ scale: 1.1 }}
            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-5 py-3 border-b flex gap-2" style={{ borderColor: 'rgba(6,182,212,0.1)' }}>
        {HOLOGRAM_MODES.map(mode => (
          <motion.button
            key={mode.id}
            onClick={() => setHologramMode(mode.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
              hologramMode === mode.id
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              background: hologramMode === mode.id ? 'rgba(6,182,212,0.2)' : 'rgba(100,116,139,0.08)',
              border: hologramMode === mode.id ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(100,116,139,0.2)',
            }}
          >
            <span className="mr-1">{mode.icon}</span> {mode.name}
          </motion.button>
        ))}
      </div>

      {/* Hologram Canvas */}
      <div className="p-5 bg-gradient-to-b from-slate-900/50 to-slate-950/50 min-h-96 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        </div>

        <div className="relative z-10 space-y-4">
          {/* Worker Task Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">TASK</p>
            <p className="text-sm text-white leading-relaxed font-light">{task}</p>
          </motion.div>

          {/* Action Steps */}
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 p-4 rounded-xl"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#06b6d4' }}>ACTIONS</p>
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs text-slate-300"
                >
                  {step.status === 'completed' ? (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'rgba(6,182,212,0.2)' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#06b6d4' }} />
                    </div>
                  )}
                  <span className="font-mono text-[11px]">{step.type}</span>
                  {step.status === 'completed' && <span className="text-green-400 ml-auto text-[10px]">✓ Done</span>}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Start Execution Button */}
          {!isExecuting && steps.length === 0 && (
            <motion.button
              onClick={() => setIsExecuting(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.2))',
                color: '#06b6d4',
                border: '1px solid rgba(6,182,212,0.5)',
                boxShadow: '0 0 20px rgba(6,182,212,0.2)',
              }}
            >
              <Zap className="w-4 h-4" /> Execute in Hologram
            </motion.button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(6,182,212,0.1)', background: 'rgba(6,182,212,0.02)' }}>
        <div className="flex items-center gap-2 text-xs font-mono">
          {isExecuting ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-3 h-3 border border-cyan-400 rounded-full" />
              <span style={{ color: '#06b6d4' }}>Executing in {HOLOGRAM_MODES.find(m => m.id === hologramMode)?.name}...</span>
            </>
          ) : steps.length > 0 ? (
            <span style={{ color: '#10b981' }}>✓ Hologram interaction complete</span>
          ) : (
            <span style={{ color: '#64748b' }}>Ready to interact</span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">{steps.length} actions</div>
      </div>
    </motion.div>
  );
}