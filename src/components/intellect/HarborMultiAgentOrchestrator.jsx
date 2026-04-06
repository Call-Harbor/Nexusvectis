import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Zap, Play, Square, Trash2, Plus, Eye, Grid3x3, Network, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

const WORKER_TYPES = [
  { id: 'analyzer', name: '📊 Data Analyzer', color: '#06b6d4' },
  { id: 'optimizer', name: '⚡ Route Optimizer', color: '#8b5cf6' },
  { id: 'predictor', name: '🔮 Predictor', color: '#10b981' },
  { id: 'visualizer', name: '🎨 Visualizer', color: '#f59e0b' },
  { id: 'summarizer', name: '📝 Summarizer', color: '#ef4444' },
  { id: 'researcher', name: '🔍 Researcher', color: '#06b6d4' },
  { id: 'validator', name: '✅ Validator', color: '#10b981' },
  { id: 'transformer', name: '🔄 Transformer', color: '#8b5cf6' },
  { id: 'generator', name: '✨ Generator', color: '#f59e0b' },
  { id: 'integrator', name: '🔗 Integrator', color: '#06b6d4' },
];

export default function HarborMultiAgentOrchestrator() {
  const [mode, setMode] = useState('setup'); // setup, executing, monitoring
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [liveOutputs, setLiveOutputs] = useState({});
  const [executionStats, setExecutionStats] = useState(null);
  const orchestrationIdRef = useRef(null);

  // Add worker to orchestration
  const addWorker = useCallback((workerType) => {
    const template = WORKER_TYPES.find(w => w.id === workerType);
    const newWorker = {
      id: `worker_${Date.now()}`,
      type: workerType,
      name: template.name,
      color: template.color,
      status: 'idle',
      progress: 0,
      output: null,
      error: null
    };
    setWorkers(prev => [...prev, newWorker]);
    toast.success(`Added ${template.name}`);
  }, []);

  // Add task to queue
  const addTask = useCallback(() => {
    if (!newTaskInput.trim()) return;
    const newTask = {
      id: `task_${Date.now()}`,
      prompt: newTaskInput,
      assignedWorker: selectedWorker,
      status: 'pending',
      dependencies: [],
      priority: 'normal'
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskInput('');
    toast.success('Task added to queue');
  }, [newTaskInput, selectedWorker]);

  // Execute all tasks in parallel
  const executeOrchestration = useCallback(async () => {
    if (workers.length === 0 || tasks.length === 0) {
      toast.error('Add workers and tasks first');
      return;
    }

    setIsExecuting(true);
    setMode('executing');
    const orchestrationId = `orch_${Date.now()}`;
    orchestrationIdRef.current = orchestrationId;

    try {
      // Start all tasks simultaneously
      const executions = tasks.map(async (task) => {
        const worker = workers.find(w => w.id === task.assignedWorker) || workers[Math.floor(Math.random() * workers.length)];
        
        setWorkers(prev => prev.map(w => 
          w.id === worker.id ? { ...w, status: 'processing', progress: 0 } : w
        ));

        try {
          const response = await base44.functions.invoke('orchestrateMultipleAIs', {
            task: task.prompt,
            workerType: worker.type,
            orchestrationId,
            taskId: task.id
          });

          setWorkers(prev => prev.map(w =>
            w.id === worker.id ? {
              ...w,
              status: 'completed',
              progress: 100,
              output: response.data
            } : w
          ));

          setLiveOutputs(prev => ({
            ...prev,
            [worker.id]: response.data
          }));

          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'completed' } : t
          ));
        } catch (err) {
          setWorkers(prev => prev.map(w =>
            w.id === worker.id ? {
              ...w,
              status: 'failed',
              error: err.message
            } : w
          ));
          setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'failed' } : t
          ));
        }
      });

      await Promise.all(executions);

      // Summary
      const completed = tasks.filter(t => t.status === 'completed').length;
      const failed = tasks.filter(t => t.status === 'failed').length;
      setExecutionStats({
        total: tasks.length,
        completed,
        failed,
        duration: Date.now() - parseInt(orchestrationId.split('_')[1])
      });

      setMode('monitoring');
      toast.success(`Orchestration complete: ${completed}/${tasks.length} tasks`);
    } catch (err) {
      toast.error(`Orchestration failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [workers, tasks]);

  // Cleanup
  const reset = useCallback(() => {
    setWorkers([]);
    setTasks([]);
    setLiveOutputs({});
    setExecutionStats(null);
    setMode('setup');
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-3">
        <motion.button
          onClick={() => setMode('setup')}
          className="px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider"
          style={{
            background: mode === 'setup' ? 'rgba(6,182,212,0.2)' : 'transparent',
            color: mode === 'setup' ? '#06b6d4' : '#64748b',
            border: mode === 'setup' ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(51,65,85,0.5)'
          }}
        >
          SETUP
        </motion.button>
        <motion.button
          onClick={() => setMode('executing')}
          className="px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider"
          style={{
            background: mode === 'executing' ? 'rgba(139,92,246,0.2)' : 'transparent',
            color: mode === 'executing' ? '#a78bfa' : '#64748b',
            border: mode === 'executing' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(51,65,85,0.5)'
          }}
        >
          EXECUTE
        </motion.button>
        <motion.button
          onClick={() => setMode('monitoring')}
          className="px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider"
          style={{
            background: mode === 'monitoring' ? 'rgba(16,185,129,0.2)' : 'transparent',
            color: mode === 'monitoring' ? '#6ee7b7' : '#64748b',
            border: mode === 'monitoring' ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(51,65,85,0.5)'
          }}
        >
          MONITOR
        </motion.button>
      </div>

      {/* SETUP MODE */}
      {mode === 'setup' && (
        <div className="space-y-4">
          {/* Worker Pool */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Available Workers ({workers.length})</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {WORKER_TYPES.map(wt => (
                <motion.button
                  key={wt.id}
                  onClick={() => addWorker(wt.id)}
                  whileHover={{ scale: 1.02 }}
                  className="p-2 rounded-lg border transition-all text-xs"
                  style={{
                    background: `rgba(${parseInt(wt.color.slice(1,3), 16)},${parseInt(wt.color.slice(3,5), 16)},${parseInt(wt.color.slice(5,7), 16)},0.08)`,
                    borderColor: `${wt.color}33`,
                    color: wt.color
                  }}
                >
                  {wt.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Active Workers */}
          {workers.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Active ({workers.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${w.color}33` }}>
                    <span className="text-xs" style={{ color: w.color }}>{w.name}</span>
                    <motion.button onClick={() => setWorkers(prev => prev.filter(x => x.id !== w.id))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Queue */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Task Queue ({tasks.length})</p>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedWorker || ''}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="flex-1 px-2 py-1 rounded text-xs bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="">Auto-assign</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <motion.button
                onClick={addTask}
                disabled={!newTaskInput.trim()}
                className="px-2 py-1 rounded text-xs font-mono disabled:opacity-30"
                style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.5)' }}
              >
                <Plus className="w-3 h-3" />
              </motion.button>
            </div>
            <textarea
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Enter task prompt for AI..."
              className="w-full p-2 rounded text-xs bg-slate-900 border border-slate-700 text-slate-200 resize-none"
              rows={3}
            />
            {tasks.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {tasks.map(t => (
                  <div key={t.id} className="p-2 rounded-lg text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderLeft: '3px solid #06b6d4' }}>
                    <p className="line-clamp-1 text-slate-300">{t.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.button
            onClick={executeOrchestration}
            disabled={isExecuting || workers.length === 0 || tasks.length === 0}
            whileHover={{ scale: 1.02 }}
            className="w-full py-2 rounded-lg font-mono font-bold text-sm disabled:opacity-30 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.2))', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.5)' }}
          >
            <Zap className="w-4 h-4" />
            ORCHESTRATE ({workers.length} WORKERS × {tasks.length} TASKS)
          </motion.button>
        </div>
      )}

      {/* EXECUTING MODE */}
      {mode === 'executing' && (
        <div className="space-y-3">
          <div className="text-center">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#06b6d4' }} />
            <p className="text-xs font-mono uppercase" style={{ color: '#06b6d4' }}>Orchestration Running...</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {workers.map(w => (
              <div key={w.id} className="p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${w.color}33` }}>
                <p className="text-xs font-bold mb-1" style={{ color: w.color }}>{w.name}</p>
                <div className="w-full h-1 rounded-full bg-slate-800 mb-1 overflow-hidden">
                  <motion.div
                    animate={{ width: `${w.progress}%` }}
                    className="h-full"
                    style={{ background: w.color }}
                  />
                </div>
                <p className="text-[10px]" style={{ color: w.status === 'completed' ? '#10b981' : w.status === 'failed' ? '#ef4444' : '#64748b' }}>
                  {w.status.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONITORING MODE */}
      {mode === 'monitoring' && (
        <div className="space-y-3">
          {executionStats && (
            <div className="grid grid-cols-3 gap-2 p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.6)' }}>
              <div>
                <p className="text-[10px] text-slate-400">Completed</p>
                <p className="text-sm font-bold text-green-400">{executionStats.completed}/{executionStats.total}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Failed</p>
                <p className="text-sm font-bold" style={{ color: executionStats.failed > 0 ? '#ef4444' : '#10b981' }}>{executionStats.failed}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Duration</p>
                <p className="text-sm font-bold text-blue-400">{(executionStats.duration / 1000).toFixed(1)}s</p>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {workers.map(w => (
              <div key={w.id} className="p-2 rounded-lg text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderLeft: `3px solid ${w.color}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: w.color }}>{w.name}</span>
                  {w.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {w.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400" />}
                </div>
                {w.output && (
                  <p className="text-slate-300 line-clamp-2">{typeof w.output === 'string' ? w.output : JSON.stringify(w.output).slice(0, 100)}</p>
                )}
                {w.error && <p className="text-red-400">{w.error}</p>}
              </div>
            ))}
          </div>

          <motion.button
            onClick={reset}
            className="w-full py-2 rounded-lg font-mono text-xs"
            style={{ background: 'rgba(15,23,42,0.6)', color: '#64748b', border: '1px solid rgba(51,65,85,0.5)' }}
          >
            RESET & SETUP NEW
          </motion.button>
        </div>
      )}
    </div>
  );
}