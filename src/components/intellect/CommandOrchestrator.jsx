import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, AlertCircle, Clock, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createHarborToolTraceDraft,
  harborToolTraceFromOrchestrationExecutionLog,
} from '@/lib/harborToolTrace';

export default function CommandOrchestrator({ prompt, onComplete }) {
  const [orchestrationState, setOrchestrationState] = useState({
    tasks: [],
    execution: null,
    isExecuting: false,
    isPaused: false
  });

  const parseAndOrchestrate = async () => {
    try {
      setOrchestrationState(prev => ({ ...prev, isExecuting: true }));

      // Parse commands
      const parseResponse = await base44.functions.invoke('orchestrateCommands', {
        prompt
      });

      if (parseResponse.data.tasks) {
        const tasks = parseResponse.data.tasks;
        setOrchestrationState(prev => ({
          ...prev,
          tasks
        }));

        const orchCorr = `orch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const planTraces = [
          createHarborToolTraceDraft({
            correlation_id: orchCorr,
            phase: 'plan',
            action: 'functions.orchestrateCommands',
            status: 'success',
            tool_name: 'orchestrateCommands',
            outputs_redacted: { task_count: tasks.length },
          }),
        ];

        // Execute orchestrated tasks
        const execResponse = await base44.functions.invoke('executeOrchestration', {
          tasks
        });

        const execLog = execResponse.data?.executionLog;
        const stepTraces = harborToolTraceFromOrchestrationExecutionLog(
          execLog,
          orchCorr,
        );
        const toolTraces = [...planTraces, ...stepTraces];

        setOrchestrationState(prev => ({
          ...prev,
          execution: execResponse.data,
          isExecuting: false
        }));

        if (onComplete) {
          onComplete({ ...execResponse.data, toolTraces });
        }
      }
    } catch (error) {
      console.error('Orchestration error:', error);
      setOrchestrationState(prev => ({
        ...prev,
        isExecuting: false,
        execution: { error: error.message }
      }));
    }
  };

  const getTaskIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'running':
        return <Clock className="w-5 h-5 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Start/Control */}
      <div className="flex gap-2">
        <Button
          onClick={parseAndOrchestrate}
          disabled={orchestrationState.isExecuting}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white flex-1"
        >
          <Zap className="w-4 h-4 mr-2" />
          {orchestrationState.isExecuting ? 'Executing...' : 'Execute Multi-Task'}
        </Button>
        {orchestrationState.isExecuting && (
          <Button
            onClick={() => setOrchestrationState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
            variant="outline"
          >
            {orchestrationState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Task List */}
      {orchestrationState.tasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">
            {orchestrationState.tasks.length} tasks orchestrated
          </p>
          <AnimatePresence>
            {orchestrationState.tasks.map((task, idx) => {
              const taskStatus = orchestrationState.execution?.taskStatuses?.[task.id] || { status: 'pending' };
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-lg border transition-all ${
                    taskStatus.status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : taskStatus.status === 'failed'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : taskStatus.status === 'running'
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getTaskIcon(taskStatus.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{task.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Type: <code className="bg-slate-800 px-1.5 py-0.5 rounded">{task.type}</code>
                        </p>
                        {taskStatus.error && (
                          <p className="text-xs text-rose-400 mt-1">Error: {taskStatus.error}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Dependencies */}
                    {task.dependsOn?.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Depends on:</p>
                        {task.dependsOn.map(depId => (
                          <div key={depId} className="flex items-center gap-1 text-xs text-slate-500">
                            <ChevronRight className="w-3 h-3" />
                            {depId}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Task Result */}
                  {taskStatus.result && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">Result:</p>
                      <pre className="text-xs bg-slate-950 p-2 rounded overflow-auto max-h-32 text-slate-300">
                        {JSON.stringify(taskStatus.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Summary */}
      {orchestrationState.execution && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-sm font-medium text-white mb-2">Execution Summary</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Total</p>
              <p className="text-white font-semibold">{Object.keys(orchestrationState.execution.taskStatuses || {}).length}</p>
            </div>
            <div>
              <p className="text-emerald-400">Completed</p>
              <p className="text-white font-semibold">
                {Object.values(orchestrationState.execution.taskStatuses || {}).filter(s => s.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-rose-400">Failed</p>
              <p className="text-white font-semibold">
                {Object.values(orchestrationState.execution.taskStatuses || {}).filter(s => s.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}