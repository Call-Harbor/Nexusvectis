import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Zap, Loader2, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_PARALLEL = 10;

export default function ParallelTaskProcessor({ onClose }) {
  const [inputValue, setInputValue] = useState("");
  const [runningTasks, setRunningTasks] = useState([]);
  const [queuedTasks, setQueuedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const taskIdRef = useRef(0);

  // Process queue when a task completes or we have space
  useEffect(() => {
    if (runningTasks.length >= MAX_PARALLEL || queuedTasks.length === 0) {
      return;
    }

    const nextTask = queuedTasks[0];
    setQueuedTasks(prev => prev.slice(1));
    setRunningTasks(prev => [...prev, { ...nextTask, status: 'running' }]);

    executeTask(nextTask);
  }, [runningTasks.length, queuedTasks]);

  const executeTask = async (task) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: task.prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            findings: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Move to completed
      setRunningTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [...prev, {
        ...task,
        status: 'completed',
        result,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setRunningTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [...prev, {
        ...task,
        status: 'error',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      toast.error("Prompt kan ikke være tom");
      return;
    }

    const newTask = {
      id: taskIdRef.current++,
      prompt: inputValue,
      status: 'queued'
    };

    setQueuedTasks(prev => [...prev, newTask]);
    setInputValue("");
    toast.success("1 prompt tilføjet til køen");
  };

  const addBatchPrompts = () => {
    const lines = inputValue.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      toast.error("Ingen prompts fundet");
      return;
    }

    const newTasks = lines.map(prompt => ({
      id: taskIdRef.current++,
      prompt: prompt.trim(),
      status: 'queued'
    }));

    setQueuedTasks(prev => [...prev, ...newTasks]);
    setInputValue("");
    toast.success(`${lines.length} prompts tilføjet til køen`);
  };

  const totalTasks = runningTasks.length + queuedTasks.length + completedTasks.length;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-bold text-lg">Parallel Task Processor</h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-red-400 hover:bg-red-500/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
            <p className="text-[10px] text-blue-400">Kørende</p>
            <p className="text-white font-bold text-lg">{runningTasks.length}/{MAX_PARALLEL}</p>
          </div>
          <div className="p-2 bg-purple-500/10 rounded border border-purple-500/30">
            <p className="text-[10px] text-purple-400">Kø</p>
            <p className="text-white font-bold text-lg">{queuedTasks.length}</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
            <p className="text-[10px] text-emerald-400">Færdig</p>
            <p className="text-white font-bold text-lg">{completedTasks.length}</p>
          </div>
          <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/30">
            <p className="text-[10px] text-cyan-400">Total</p>
            <p className="text-white font-bold text-lg">{totalTasks}</p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Skriv prompts (en per linje for batch processing)"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-20"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Zap className="w-3 h-3 mr-1.5" />
              Add Single
            </Button>
            <Button
              onClick={() => addBatchPrompts()}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              size="sm"
            >
              <Zap className="w-3 h-3 mr-1.5" />
              Add Batch
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Running Tasks */}
        {runningTasks.length > 0 && (
          <div className="p-4 border-b border-slate-800/50">
            <h4 className="text-cyan-400 font-semibold text-sm mb-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Kørende ({runningTasks.length})
            </h4>
            <div className="space-y-2">
              {runningTasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                  <p className="text-white text-xs mb-2">{task.prompt}</p>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                    <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Queued Tasks */}
        {queuedTasks.length > 0 && (
          <div className="p-4 border-b border-slate-800/50">
            <h4 className="text-purple-400 font-semibold text-sm mb-3 flex items-center gap-2">
              Køen ({queuedTasks.length})
            </h4>
            <div className="space-y-2">
              {queuedTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                >
                  <p className="text-purple-300 text-[10px] font-semibold mb-1">#{idx + 1} i køen</p>
                  <p className="text-white text-xs">{task.prompt}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="p-4">
            <h4 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Færdig ({completedTasks.length})
            </h4>
            <div className="space-y-2">
              {completedTasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs mb-1">{task.prompt}</p>
                      <p className="text-slate-500 text-[10px]">{task.timestamp}</p>
                    </div>
                  </div>
                  
                  {task.status === 'completed' && task.result && (
                    <div className="ml-6 space-y-1 text-[10px] text-slate-300">
                      <p className="font-semibold text-emerald-300">{task.result.summary}</p>
                      {task.result.recommendations?.length > 0 && (
                        <div>
                          <p className="text-emerald-400 font-semibold">Anbefalinger:</p>
                          {task.result.recommendations.slice(0, 2).map((rec, i) => (
                            <p key={i} className="ml-2">• {rec}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {task.status === 'error' && (
                    <div className="ml-6 text-[10px] text-red-300">
                      Fejl: {task.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalTasks === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Skriv en prompt for at starte</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}