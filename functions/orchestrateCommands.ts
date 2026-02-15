import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();

    // Use Mistral to parse and orchestrate commands
    const orchestrationResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task orchestration AI. Analyze this user request and break it into ordered tasks with dependencies.

User Request: "${prompt}"

Return a JSON array of tasks in execution order. Each task should have:
- id: unique identifier
- type: the command type (e.g., "plan_route", "assign_driver", "send_notification")
- description: what this task does
- params: required parameters
- dependsOn: array of task IDs that must complete first

Example format:
[
  {
    "id": "task_1",
    "type": "plan_route",
    "description": "Plan route from Copenhagen to Aarhus",
    "params": { "origin": "Copenhagen", "destination": "Aarhus" },
    "dependsOn": []
  },
  {
    "id": "task_2",
    "type": "assign_driver",
    "description": "Assign driver John to the route",
    "params": { "route_id": "task_1_result", "driver_name": "John" },
    "dependsOn": ["task_1"]
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`,
      response_json_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                description: { type: 'string' },
                params: { type: 'object' },
                dependsOn: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    // Extract tasks from response
    let tasks = [];
    if (Array.isArray(orchestrationResponse)) {
      tasks = orchestrationResponse;
    } else if (orchestrationResponse.tasks) {
      tasks = orchestrationResponse.tasks;
    }

    // Validate and order tasks topologically
    const orderedTasks = topologicalSort(tasks);

    return Response.json({ tasks: orderedTasks, totalTasks: orderedTasks.length });
  } catch (error) {
    console.error('Orchestration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
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