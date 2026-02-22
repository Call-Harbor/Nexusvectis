import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 400 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { command, context } = await req.json();

    // Route to specialized functions based on command type
    let result;
    
    switch (command.type) {
      case 'analyze_fleet_health':
        result = await analyzeFleetHealth(base44, user, command);
        break;
      case 'optimize_operations':
        result = await optimizeOperations(base44, user, command);
        break;
      case 'predict_issues':
        result = await predictIssues(base44, user, command);
        break;
      case 'generate_insights':
        result = await generateInsights(base44, user, command);
        break;
      case 'match_resources':
        result = await matchResources(base44, user, command);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown command' }), { status: 400 });
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Orchestration error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function analyzeFleetHealth(base44, user, command) {
  const userData = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const orgId = userData?.[0]?.organization_id;
  
  if (!orgId) return { error: 'No organization' };

  // Get all relevant data in parallel
  const [vehicles, alerts, routes, maintenance] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Alert.filter({ organization_id: orgId, is_resolved: false }),
    base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }),
  ]);

  // Call specialized AI analysis functions in parallel
  const [vehicleHealth, alertAnalysis, routeOptimization] = await Promise.all([
    callLLM('Analyze vehicle health metrics', {
      vehicles: vehicles.map(v => ({ id: v.id, fuel_level: v.fuel_level, status: v.status, efficiency_score: v.efficiency_score })),
      summary_only: true
    }),
    callLLM('Categorize and prioritize alerts', {
      alerts: alerts.slice(0, 10).map(a => ({ type: a.type, category: a.category, message: a.message })),
      return_priority_list: true
    }),
    callLLM('Route efficiency assessment', {
      routes: routes.slice(0, 5),
      vehicles_available: vehicles.length
    })
  ]);

  return {
    status: 'success',
    analysis: {
      vehicle_health: vehicleHealth,
      alerts: alertAnalysis,
      routes: routeOptimization,
      timestamp: new Date().toISOString()
    }
  };
}

async function optimizeOperations(base44, user, command) {
  const userData = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const orgId = userData?.[0]?.organization_id;
  
  if (!orgId) return { error: 'No organization' };

  const [vehicles, shipments, resources] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId, status: 'pending' }),
    base44.asServiceRole.entities.Resource.filter({ organization_id: orgId }),
  ]);

  // Parallel AI optimization calls
  const [vehicleAssignment, shipmentPrioritization, resourceAllocation] = await Promise.all([
    callLLM('Optimize vehicle assignment', {
      vehicles: vehicles.slice(0, 20),
      pending_shipments: shipments.length,
      optimize_for: 'fuel_efficiency'
    }),
    callLLM('Prioritize shipments', {
      shipments: shipments.slice(0, 15),
      priority_criteria: ['urgency', 'profitability', 'route_efficiency']
    }),
    callLLM('Allocate resources optimally', {
      resources: resources,
      current_load: shipments.filter(s => s.status === 'in_transit').length
    })
  ]);

  return {
    status: 'success',
    optimizations: {
      vehicle_assignment: vehicleAssignment,
      shipment_prioritization: shipmentPrioritization,
      resource_allocation: resourceAllocation
    }
  };
}

async function predictIssues(base44, user, command) {
  const userData = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const orgId = userData?.[0]?.organization_id;
  
  if (!orgId) return { error: 'No organization' };

  const [vehicles, maintenance, routes] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
  ]);

  // Predictive AI calls in parallel
  const [maintenancePrediction, delayRisk, safetyRisk] = await Promise.all([
    callLLM('Predict maintenance needs', {
      vehicles: vehicles.map(v => ({ id: v.id, fuel_level: v.fuel_level, status: v.status })),
      recent_maintenance: maintenance.slice(-10)
    }),
    callLLM('Assess delivery delay risks', {
      routes: routes.slice(0, 10),
      current_alerts: command.context?.alerts || []
    }),
    callLLM('Identify safety concerns', {
      vehicle_count: vehicles.length,
      problem_areas: command.context?.problem_areas || []
    })
  ]);

  return {
    status: 'success',
    predictions: {
      maintenance: maintenancePrediction,
      delays: delayRisk,
      safety: safetyRisk
    }
  };
}

async function generateInsights(base44, user, command) {
  const userData = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const orgId = userData?.[0]?.organization_id;
  
  if (!orgId) return { error: 'No organization' };

  const [vehicles, shipments, alerts] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Alert.filter({ organization_id: orgId }),
  ]);

  // Insight generation in parallel
  const [performanceInsights, costInsights, efficiencyInsights, strategicInsights] = await Promise.all([
    callLLM('Generate performance insights', {
      vehicles: vehicles.slice(0, 25),
      period: command.context?.period || 'last_7_days'
    }),
    callLLM('Analyze cost trends', {
      shipments: shipments.slice(0, 20),
      focus: ['fuel', 'maintenance', 'labor']
    }),
    callLLM('Efficiency opportunities', {
      fleet_size: vehicles.length,
      active_shipments: shipments.filter(s => s.status === 'in_transit').length
    }),
    callLLM('Strategic recommendations', {
      org_context: command.context?.org_size || 'unknown',
      current_challenges: command.context?.challenges || []
    })
  ]);

  return {
    status: 'success',
    insights: {
      performance: performanceInsights,
      cost: costInsights,
      efficiency: efficiencyInsights,
      strategic: strategicInsights
    }
  };
}

async function matchResources(base44, user, command) {
  const userData = await base44.asServiceRole.entities.User.filter({ email: user.email });
  const orgId = userData?.[0]?.organization_id;
  
  if (!orgId) return { error: 'No organization' };

  const [drivers, assets, routes, shipments] = await Promise.all([
    base44.asServiceRole.entities.Driver.filter({ organization_id: orgId, status: 'active' }),
    base44.asServiceRole.entities.Asset.filter({ organization_id: orgId, status: 'available' }),
    base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId, status: 'pending' }),
  ]);

  // Resource matching in parallel
  const [driverMatching, assetMatching, routeMatching] = await Promise.all([
    callLLM('Match drivers to routes', {
      drivers: drivers.slice(0, 15),
      routes: routes.slice(0, 10),
      criteria: ['experience', 'location', 'availability']
    }),
    callLLM('Allocate assets', {
      assets: assets,
      shipments: shipments.slice(0, 10)
    }),
    callLLM('Optimize route assignment', {
      routes: routes,
      shipments: shipments.slice(0, 10),
      constraints: command.context?.constraints || []
    })
  ]);

  return {
    status: 'success',
    matching: {
      drivers: driverMatching,
      assets: assetMatching,
      routes: routeMatching
    }
  };
}

async function callLLM(task, data) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MISTRAL_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: `${task}. Return concise, actionable analysis. Data: ${JSON.stringify(data)}`
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('LLM call error:', error);
    return { error: error.message };
  }
}