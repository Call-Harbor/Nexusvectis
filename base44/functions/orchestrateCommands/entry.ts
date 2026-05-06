import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { prompt } = await req.json();

    // Route through HARBOR Core Engine
    const harborResp = await base44.functions.invoke('harborCore', {
      prompt: `You are a task orchestration engine. Analyze this user request and break it into ordered tasks with dependencies.

User Request: "${prompt}"

Return a JSON object with a "tasks" array. Each task must have:
- id: unique string
- type: one of "plan_route", "assign_driver", "send_notification", "create_shipment", "optimize_route", "schedule_maintenance"
- description: what this task does
- params: required parameters as object
- dependsOn: array of task IDs that must complete first (empty array if none)`,
      mode: 'command',
    });

    const orchestrationResponse = harborResp.data?.reply || { tasks: [] };

    // Extract tasks from response
    let tasks = [];
    if (Array.isArray(orchestrationResponse)) {
      tasks = orchestrationResponse;
    } else if (orchestrationResponse.tasks) {
      tasks = orchestrationResponse.tasks;
    }

    // Validate and order tasks topologically
    const orderedTasks = topologicalSort(tasks);

    return nvJson(requestId, { tasks: orderedTasks, totalTasks: orderedTasks.length });

  } catch (error) {
    console.error('Orchestration error:', error);
    return nvError(requestId, String(error.message), 500);

  }
});

// Topological sort to order tasks by dependencies
function topologicalSort(tasks) {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(taskId) {
    if (visited.has(taskId)) return;
    if (visiting.has(taskId)) throw new Error('Circular dependency detected');

    visiting.add(taskId);
    const task = taskMap.get(taskId);
    
    if (task?.dependsOn) {
      for (const depId of task.dependsOn) {
        visit(depId);
      }
    }

    visiting.delete(taskId);
    visited.add(taskId);
    sorted.push(task);
  }

  for (const task of tasks) {
    visit(task.id);
  }

  return sorted;
}