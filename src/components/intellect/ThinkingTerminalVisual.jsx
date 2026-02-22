import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Minimize2, Zap, Brain, Activity, TrendingUp, 
  CheckCircle2, AlertCircle, Clock, Sparkles 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ThinkingTerminalVisual = ({ isActive, logs, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (logs.length > 0) {
      const data = logs.map((log, idx) => ({
        step: idx + 1,
        percentage: log.percentage || 0,
        duration: log.duration || 0,
        type: log.type
      }));
      setChartData(data);
    }
  }, [logs]);

  const getLogIcon = (type) => {
    switch(type) {
      case 'parse': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'analyze': return <Brain className="w-4 h-4 text-violet-400" />;
      case 'think': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'calculate': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'execute': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'result': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      parse: 'border-cyan-500/30 bg-cyan-500/5',
      analyze: 'border-violet-500/30 bg-violet-500/5',
      think: 'border-amber-500/30 bg-amber-500/5',
      calculate: 'border-emerald-500/30 bg-emerald-500/5',
      execute: 'border-blue-500/30 bg-blue-500/5',
      result: 'border-emerald-500/30 bg-emerald-500/5',
      error: 'border-red-500/30 bg-red-500/5'
    };
    return colors[type] || 'border-slate-500/30 bg-slate-500/5';
  };

  const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const completionPercentage = logs.length > 0 ? Math.max(...logs.map(l => l.percentage || 0)) : 0;

  if (!isActive) return null;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 right-4 z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 backdrop-blur-xl shadow-lg shadow-cyan-500/20 hover:from-cyan-500/40 hover:to-violet-500/40 transition-all"
        >
          <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-white text-sm font-medium">AI Thinking...</span>
          <span className="text-cyan-400 text-xs font-mono">{completionPercentage}%</span>
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMinimized(true)}
        />

        {/* Terminal Window */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border-2 border-cyan-500/50 bg-slate-950/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-500/20"
        >
          {/* Holographic Effects */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/50 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/50 rounded-br-2xl" />

          <div className="relative flex flex-col h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-slate-900/40 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
                  <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2">
                    AI Thinking Terminal
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">Live</span>
                  </h2>
                  <p className="text-slate-400 text-sm">Processing {logs.length} steps • {totalDuration}ms total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-lg hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                  {/* Overall Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Overall Progress</span>
                      <span className="text-cyan-400 font-mono text-sm">{completionPercentage}%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Processing Time Chart */}
                  {chartData.length > 3 && (
                    <div className="bg-slate-900/30 border border-cyan-500/20 rounded-xl p-4">
                      <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Processing Timeline
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="step" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#f1f5f9' }}
                          />
                          <Area type="monotone" dataKey="duration" stroke="#06b6d4" fillOpacity={1} fill="url(#colorDuration)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Processing Steps */}
                  <div className="space-y-2">
                    <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      Processing Steps ({logs.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {logs.map((log, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-4 rounded-lg border-2 ${getTypeColor(log.type)} backdrop-blur transition-all`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-0.5">{getLogIcon(log.type)}</div>
                              <div className="flex-1">
                                <div className="text-white font-semibold text-sm mb-1">
                                  Step {idx + 1}: {log.message}
                                </div>
                                
                                {/* Details Grid */}
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="mb-2 space-y-2">
                                    {Object.entries(log.details).map(([key, value], i) => {
                                      const displayValue = (() => {
                                        if (value === null || value === undefined) return 'N/A';
                                        if (typeof value === 'object') {
                                          return Array.isArray(value) 
                                            ? `[${value.join(', ')}]`
                                            : Object.entries(value)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(' • ');
                                        }
                                        return String(value);
                                      })();
                                      
                                      return (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs bg-slate-800/40 p-2 rounded border border-slate-700/50">
                                          <span className="text-slate-400 font-semibold min-w-fit">{key}:</span>
                                          <span className="text-cyan-300 font-mono break-all">{displayValue}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Duration & Progress */}
                                <div className="flex items-center gap-4 text-xs">
                                  {log.duration && (
                                    <span className="text-slate-400">
                                      ⏱️ {log.duration}ms
                                    </span>
                                  )}
                                  {log.percentage !== null && log.percentage !== undefined && (
                                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${log.percentage}%` }}
                                          transition={{ duration: 0.4 }}
                                        />
                                      </div>
                                      <span className="text-cyan-400 font-semibold">{log.percentage}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex-shrink-0">
                              {log.type === 'error' ? (
                                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">
                                  ERROR
                                </span>
                              ) : log.type === 'result' ? (
                                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                                  DONE
                                </span>
                              ) : idx === logs.length - 1 ? (
                                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs font-semibold">
                                  DONE
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/50">
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <p className="text-cyan-400 text-xs font-semibold">Total Steps</p>
                      <p className="text-white text-lg font-bold">{logs.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                      <p className="text-violet-400 text-xs font-semibold">Total Time</p>
                      <p className="text-white text-lg font-bold">{totalDuration}ms</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-emerald-400 text-xs font-semibold">Avg Per Step</p>
                      <p className="text-white text-lg font-bold">{logs.length > 0 ? Math.round(totalDuration / logs.length) : 0}ms</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-amber-400 text-xs font-semibold">Progress</p>
                      <p className="text-white text-lg font-bold">{completionPercentage}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThinkingTerminalVisual;