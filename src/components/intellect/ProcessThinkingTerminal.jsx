import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProcessThinkingTerminal({ processId, processName, thinkingLogs = [], isMinimized, onClose, onToggleMinimize }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thinkingLogs]);

  const getTypeColor = (type) => {
    const colors = {
      parse: 'text-blue-400',
      analyze: 'text-cyan-400',
      think: 'text-violet-400',
      calculate: 'text-yellow-400',
      scenario: 'text-pink-400',
      result: 'text-emerald-400',
      error: 'text-red-400'
    };
    return colors[type] || 'text-slate-400';
  };

  const getTypeIcon = (type) => {
    const icons = {
      parse: '🔍',
      analyze: '📊',
      think: '🧠',
      calculate: '⚡',
      scenario: '🎯',
      result: '✅',
      error: '❌'
    };
    return icons[type] || '•';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-slate-950/50 flex flex-col z-50"
      style={{
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), 0 0 20px rgba(139, 92, 246, 0.1)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 bg-gradient-to-r from-slate-900 to-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold text-white truncate">{processName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs - Only show if not minimized */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto max-h-96 min-h-32 p-3 space-y-2 bg-slate-950/50 font-mono text-xs">
          {thinkingLogs.length === 0 ? (
            <div className="text-slate-500 italic">Waiting for processing...</div>
          ) : (
            thinkingLogs.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <span className="text-slate-500 flex-shrink-0 w-4">
                  {getTypeIcon(log.type)}
                </span>
                <div className="flex-1">
                  <span className={cn('font-semibold', getTypeColor(log.type))}>
                    [{log.type.toUpperCase()}]
                  </span>
                  {' '}
                  <span className="text-slate-300">{log.message}</span>
                  
                  {log.details && (
                    <div className="text-xs text-slate-500 mt-0.5 ml-6">
                      {typeof log.details === 'object' ? (
                        Object.entries(log.details).map(([k, v]) => (
                          <div key={k}>
                            {k}: {Array.isArray(v) ? v.join(', ') : v}
                          </div>
                        ))
                      ) : (
                        log.details
                      )}
                    </div>
                  )}

                  {log.duration !== null && (
                    <div className="text-xs text-cyan-500/70 mt-0.5 ml-6">
                      ⏱ {log.duration}ms
                    </div>
                  )}

                  {log.percentage !== null && (
                    <div className="flex items-center gap-2 mt-1 ml-6">
                      <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all"
                          style={{ width: `${log.percentage}%` }}
                        />
                      </div>
                      <span className="text-cyan-400 text-[10px] w-6 text-right">
                        {log.percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Progress Bar */}
      <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-700/30">
        <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500"
            animate={{
              backgroundPosition: ['0%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            style={{ width: `${Math.min(100, (thinkingLogs.length * 15) % 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}