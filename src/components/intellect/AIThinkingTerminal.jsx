import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Zap, Brain, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIThinkingTerminal({ isActive, logs = [], onClose }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalRef = React.useRef(null);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isActive) return null;

  const categories = {
    parse: { color: 'cyan', icon: '📝', label: 'Parsing' },
    analyze: { color: 'violet', icon: '🔍', label: 'Analysis' },
    calculate: { color: 'emerald', icon: '🧮', label: 'Calculation' },
    optimize: { color: 'amber', icon: '⚡', label: 'Optimization' },
    execute: { color: 'blue', icon: '▶️', label: 'Execute' },
    result: { color: 'green', icon: '✅', label: 'Result' },
    error: { color: 'red', icon: '❌', label: 'Error' },
    think: { color: 'purple', icon: '💭', label: 'Thinking' }
  };

  const getLogColor = (type) => {
    const catInfo = categories[type] || categories.think;
    const colorMap = {
      cyan: 'text-cyan-400',
      violet: 'text-violet-400',
      emerald: 'text-emerald-400',
      amber: 'text-amber-400',
      blue: 'text-blue-400',
      green: 'text-emerald-400',
      red: 'text-red-400',
      purple: 'text-violet-400'
    };
    return colorMap[catInfo.color];
  };

  const getLogBgColor = (type) => {
    const catInfo = categories[type] || categories.think;
    const bgMap = {
      cyan: 'bg-cyan-500/10',
      violet: 'bg-violet-500/10',
      emerald: 'bg-emerald-500/10',
      amber: 'bg-amber-500/10',
      blue: 'bg-blue-500/10',
      green: 'bg-emerald-500/10',
      red: 'bg-red-500/10',
      purple: 'bg-violet-500/10'
    };
    return bgMap[catInfo.color];
  };

  const getBorderColor = (type) => {
    const catInfo = categories[type] || categories.think;
    const borderMap = {
      cyan: 'border-cyan-500/30',
      violet: 'border-violet-500/30',
      emerald: 'border-emerald-500/30',
      amber: 'border-amber-500/30',
      blue: 'border-blue-500/30',
      green: 'border-emerald-500/30',
      red: 'border-red-500/30',
      purple: 'border-violet-500/30'
    };
    return borderMap[catInfo.color];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[60] w-full max-w-2xl h-96 rounded-2xl border-2 border-cyan-500/50 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-cyan-500/30 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 relative overflow-hidden">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              AI Thinking Terminal
              <span className="inline-flex items-center gap-1">
                <Brain className="w-3 h-3 text-violet-400 animate-spin" />
              </span>
            </h3>
            <p className="text-xs text-cyan-400">Real-time processing</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs bg-gradient-to-b from-slate-950/60 to-slate-950/30 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent hover:scrollbar-thumb-cyan-500/40"
      >
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-slate-500"
            >
              <Zap className="w-5 h-5 mr-2 animate-pulse" />
              Waiting for AI processing...
            </motion.div>
          ) : (
            logs.map((log, idx) => {
              const cat = categories[log.type] || categories.think;
              const isRecent = idx === logs.length - 1;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`p-2.5 rounded-lg border ${getLogBgColor(log.type)} ${getBorderColor(log.type)} transition-all ${
                    isRecent ? 'ring-1 ring-cyan-400/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0 mt-0.5">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold uppercase text-[10px] ${getLogColor(log.type)}`}>
                          {cat.label}
                        </span>
                        {log.percentage && (
                          <span className="text-slate-400 text-[10px]">
                            {log.percentage}%
                          </span>
                        )}
                        {log.duration && (
                          <span className="text-slate-500 text-[10px] ml-auto flex-shrink-0">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 break-words leading-tight">{log.message}</p>
                      {log.details && (
                        <div className="mt-1.5 pl-3 border-l border-slate-600/50 space-y-0.5">
                          {Array.isArray(log.details) ? (
                            log.details.map((detail, i) => (
                              <div key={i} className="text-slate-400 text-[11px] leading-tight">
                                {typeof detail === 'object' ? (
                                  <span className="text-cyan-300/70">
                                    {Object.entries(detail)
                                      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                                      .join(' | ')}
                                  </span>
                                ) : (
                                  detail
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 text-[11px]">
                              {typeof log.details === 'object'
                                ? JSON.stringify(log.details, null, 2)
                                : log.details}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isRecent && log.type !== 'result' && log.type !== 'error' && (
                      <motion.div
                        animate={{ opacity: [0.4, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-cyan-500/20 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-3 h-3 text-cyan-500 animate-pulse" />
          <span>{logs.length} operations</span>
          {logs.length > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span>
                {logs.filter(l => l.type === 'error').length > 0
                  ? `${logs.filter(l => l.type === 'error').length} errors`
                  : 'Running...'}
              </span>
            </>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-3 h-3 rounded border-slate-600 bg-slate-800 cursor-pointer"
          />
          <span className="text-xs">Auto-scroll</span>
        </label>
      </div>
    </motion.div>
  );
}