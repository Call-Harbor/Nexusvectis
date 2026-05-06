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

    const { tasks } = await req.json();
    const orgId = user.organization_id || user.data?.organization_id;

    if (!orgId || !tasks?.length) {
      return nvError(requestId, String('Invalid input'), 400);

    }

    const results = new Map();
    const executionLog = [];
    const taskStatuses = new Map();

    // Initialize task statuses
    for (const task of tasks) {
      taskStatuses.set(task.id, { status: 'pending', result: null, error: null });
    }

    // Execute tasks with dependency resolution
    while (true) {
      const readyTasks = tasks.filter(t => {
        const status = taskStatuses.get(t.id);
        if (status.status !== 'pending') return false;
        
        // Check if all dependencies are completed
        return !t.dependsOn?.length || t.dependsOn.every(depId => {
          const depStatus = taskStatuses.get(depId);
          return depStatus?.status === 'completed';
        });
      });

      if (readyTasks.length === 0) {
        // Check if all tasks are done
        const allDone = Array.from(taskStatuses.values()).every(s => s.status !== 'pending');
        if (allDone) break;

        // Check for circular dependencies or failed tasks
        const failedTasks = Array.from(taskStatuses.values()).filter(s => s.status === 'failed');
        if (failedTasks.length > 0) {
          throw new Error('Some tasks failed and blocked dependent tasks');
        }
      }

      // Execute ready tasks in parallel
      const execPromises = readyTasks.map(async (task) => {
        try {
          taskStatuses.set(task.id, { ...taskStatuses.get(task.id), status: 'running' });

          // Resolve parameters using previous task results
          const resolvedParams = resolveParameters(task.params, results, tasks);

          // Execute task
          const result = await executeTask(base44, task, resolvedParams, orgId);

          results.set(task.id, result);
          taskStatuses.set(task.id, { status: 'completed', result, error: null });
          
          executionLog.push({
            taskId: task.id,
            type: task.type,
            status: 'completed',
            timestamp: new Date().toISOString(),
            result: result
          });
        } catch (error) {
          const errorMsg = error.message || 'Unknown error';
          taskStatuses.set(task.id, { status: 'failed', result: null, error: errorMsg });
          
          executionLog.push({
            taskId: task.id,
            type: task.type,
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: errorMsg
          });
        }
      });

      await Promise.all(execPromises);
    }

    const finalResults = {};
    for (const [taskId, result] of results.entries()) {
      finalResults[taskId] = result;
    }

    return nvJson(requestId, {
      success: true,
      results: finalResults,
      executionLog,
      taskStatuses: Object.fromEntries(taskStatuses)
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});

// Execute individual task
async function executeTask(base44, task, params, orgId) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      switch (task.type) {
        case 'plan_route':
          return await executeplanRoute(base44, params, orgId);
        case 'assign_driver':
          return await executeAssignDriver(base44, params, orgId);
        case 'send_notification':
          return await executeSendNotification(base44, params, orgId);
        case 'create_shipment':
          return await executeCreateShipment(base44, params, orgId);
        case 'optimize_route':
          return await executeOptimizeRoute(base44, params, orgId);
        case 'schedule_maintenance':
          return await executeScheduleMaintenance(base44, params, orgId);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

// Task executors
async function executeplanRoute(base44, params, orgId) {
  const response = await base44.functions.invoke('planRoute', {
    origin: params.origin,
    destination: params.destination,
    transport_type: params.transport_type || 'truck'
  });
  
  const routeData = response.data.route_data;
  const route = await base44.entities.Route.create({
    organization_id: orgId,
    name: params.route_name || `${params.origin}-${params.destination}`,
    origin: params.origin,
    destination: params.destination,
    waypoints: routeData.waypoints,
    distance_km: routeData.distance_km,
    estimated_duration_hours: routeData.estimated_duration_hours,
    transport_type: params.transport_type || 'truck',
    status: 'planned',
    priority: params.priority || 'normal',
    co2_estimate: routeData.co2_estimate
  });

  return { route_id: route.id, ...routeData };
}

async function executeAssignDriver(base44, params, orgId) {
  const driver = await base44.entities.Driver.filter({
    organization_id: orgId,
    first_name: params.driver_name?.split(' ')[0] || params.driver_name
  });

  if (!driver || driver.length === 0) {
    throw new Error(`Driver "${params.driver_name}" not found`);
  }

  return {
    driver_id: driver[0].id,
    driver_name: `${driver[0].first_name} ${driver[0].last_name}`,
    assigned_to: params.route_id || params.vehicle_id
  };
}

async function executeSendNotification(base44, params, orgId) {
  await base44.integrations.Core.SendEmail({
    to: params.recipient_email || params.driver_email,
    subject: params.subject || 'Fleet Notification',
    body: params.message || 'Task completed'
  });

  return { notification_sent: true, recipient: params.recipient_email };
}

async function executeCreateShipment(base44, params, orgId) {
  const shipment = await base44.entities.Shipment.create({
    organization_id: orgId,
    tracking_number: `SH-${Date.now()}`,
    origin: params.origin,
    destination: params.destination,
    cargo_type: params.cargo_type || 'general',
    weight_kg: params.weight_kg || 0,
    status: 'pending',
    priority: params.priority || 'normal',
    route_id: params.route_id,
    vehicle_id: params.vehicle_id
  });

  return { shipment_id: shipment.id, tracking_number: shipment.tracking_number };
}

async function executeOptimizeRoute(base44, params, orgId) {
  const route = await base44.entities.Route.get(params.route_id);
  
  const response = await base44.functions.invoke('optimizeRoute', {
    route_id: params.route_id,
    waypoints: route.waypoints,
    constraints: params.constraints || {}
  });

  return response.data;
}

async function executeScheduleMaintenance(base44, params, orgId) {
  const maintenance = await base44.entities.Maintenance.create({
    organization_id: orgId,
    vehicle_id: params.vehicle_id,
    type: params.maintenance_type || 'scheduled',
    component: params.component,
    description: params.description,
    scheduled_date: params.scheduled_date,
    priority: params.priority || 'medium',
    status: 'pending'
  });

  return { maintenance_id: maintenance.id };
}

// Resolve task parameters using results from previous tasks
function resolveParameters(params, results, tasks) {
  const resolved = { ...params };
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('task_') && value.includes('_result')) {
      const [taskId] = value.split('_result');
      const result = results.get(taskId);
      
      if (result) {
        // Try to find matching property in result
        const matchKey = Object.keys(result).find(k => k.includes(key.replace(/_id$/, '').toLowerCase()));
        resolved[key] = result[matchKey] || result[`${key}_id`] || result.id;
      }
    }
  }

  return resolved;
}