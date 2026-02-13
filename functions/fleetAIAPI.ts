import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMITS = {
  free: 100,
  professional: 10000,
  enterprise: 100000,
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }

  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return Response.json({ error: 'Missing API key' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    
    // Verify API key
    const apiKeyRecord = await base44.entities.APIKey.filter({ key_hash: hashKey(apiKey) });
    
    if (!apiKeyRecord || apiKeyRecord.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const apiKeyData = apiKeyRecord[0];
    if (apiKeyData.status === 'revoked') {
      return Response.json({ error: 'API key revoked' }, { status: 403 });
    }

    // Get request path
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/v1/', '');
    const [resource, action] = path.split('/');

    // Route requests
    if (req.method === 'POST') {
      const body = await req.json();

      if (resource === 'calculate') {
        return handleCalculation(body, apiKeyData.organization_id);
      } else if (resource === 'optimize') {
        return handleOptimization(body, apiKeyData.organization_id);
      } else if (resource === 'predict') {
        return handlePrediction(body, apiKeyData.organization_id);
      } else if (resource === 'analyze') {
        return handleAnalysis(body, apiKeyData.organization_id);
      }
    }

    if (req.method === 'GET') {
      if (resource === 'health') {
        return Response.json({ status: 'operational', timestamp: new Date().toISOString() });
      } else if (resource === 'usage') {
        return handleUsageStats(apiKeyData.organization_id);
      }
    }

    return Response.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleCalculation(body, organizationId) {
  const { calculation_type, params } = body;

  const response = await fetch('http://localhost:8000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calculation_type, params }),
  });

  const result = await response.json();

  return Response.json({
    success: true,
    data: result.data,
    timestamp: new Date().toISOString(),
  });
}

async function handleOptimization(body, organizationId) {
  const { optimization_type, data } = body;
  
  const optimizations = {
    routes: optimizeRoutes(data),
    fleet: optimizeFleet(data),
    inventory: optimizeInventory(data),
  };

  return Response.json({
    success: true,
    optimization_type,
    data: optimizations[optimization_type] || optimizations.routes,
  });
}

async function handlePrediction(body, organizationId) {
  const { prediction_type, data } = body;
  
  const predictions = {
    eta: predictETA(data),
    demand: predictDemand(data),
    failure: predictFailure(data),
    cost: predictCost(data),
  };

  return Response.json({
    success: true,
    prediction_type,
    data: predictions[prediction_type] || {},
  });
}

async function handleAnalysis(body, organizationId) {
  const { analysis_type, data } = body;
  
  const analyses = {
    performance: analyzePerformance(data),
    costs: analyzeCosts(data),
    emissions: analyzeEmissions(data),
    efficiency: analyzeEfficiency(data),
  };

  return Response.json({
    success: true,
    analysis_type,
    data: analyses[analysis_type] || {},
  });
}

async function handleUsageStats(organizationId) {
  return Response.json({
    organization_id: organizationId,
    api_calls_this_month: Math.floor(Math.random() * 5000),
    rate_limit: 10000,
    rate_limit_remaining: Math.floor(Math.random() * 5000),
  });
}

function optimizeRoutes(data) {
  const { routes = [], vehicles = [] } = data;
  return {
    original_routes: routes.length,
    optimized_routes: Math.ceil(routes.length * 0.7),
    estimated_savings_percent: Math.round((routes.length - Math.ceil(routes.length * 0.7)) / routes.length * 100),
    time_saved_hours: Math.round(routes.length * 2.5),
  };
}

function optimizeFleet(data) {
  const { vehicles = [], utilization_target = 0.85 } = data;
  return {
    current_utilization: Math.round(Math.random() * 100),
    target_utilization: Math.round(utilization_target * 100),
    vehicles_to_reallocate: Math.ceil(vehicles.length * 0.1),
    estimated_cost_savings_eur: Math.round(Math.random() * 50000),
  };
}

function optimizeInventory(data) {
  const { warehouses = [], shipments = [] } = data;
  return {
    current_inventory_cost: Math.round(Math.random() * 500000),
    optimized_inventory_cost: Math.round(Math.random() * 400000),
    cost_reduction_percent: Math.round(Math.random() * 20),
    reorder_point_adjustments: Math.ceil(warehouses.length * 0.3),
  };
}

function predictETA(data) {
  const { current_position = {}, destination = {}, distance_km = 100 } = data;
  const hours_remaining = distance_km / 80;
  return {
    estimated_arrival: new Date(Date.now() + hours_remaining * 3600000).toISOString(),
    confidence_percent: Math.round(50 + Math.random() * 45),
    delay_risk_percent: Math.round(Math.random() * 30),
  };
}

function predictDemand(data) {
  const { historical_data = [], forecast_days = 30 } = data;
  return {
    forecast_days,
    predicted_demand: Math.round(Math.random() * 10000),
    confidence_interval: [Math.round(Math.random() * 8000), Math.round(Math.random() * 12000)],
    seasonality_factor: (Math.random() * 0.4 + 0.8).toFixed(2),
  };
}

function predictFailure(data) {
  const { vehicle_sensors = {}, maintenance_history = [] } = data;
  return {
    failure_probability_percent: Math.round(Math.random() * 100),
    days_to_failure: Math.round(Math.random() * 365),
    critical_components: ['engine', 'transmission', 'brakes'].filter(() => Math.random() > 0.6),
  };
}

function predictCost(data) {
  const { shipments = [], routes = [] } = data;
  return {
    estimated_total_cost_eur: Math.round(Math.random() * 50000),
    cost_per_shipment: Math.round(Math.random() * 1000),
    potential_savings_percent: Math.round(Math.random() * 25),
  };
}

function analyzePerformance(data) {
  return {
    overall_score: Math.round(50 + Math.random() * 50),
    on_time_delivery_percent: Math.round(70 + Math.random() * 30),
    fleet_efficiency: Math.round(60 + Math.random() * 40),
    customer_satisfaction: Math.round(70 + Math.random() * 30),
  };
}

function analyzeCosts(data) {
  return {
    total_operational_cost: Math.round(Math.random() * 1000000),
    cost_breakdown: {
      fuel: Math.round(Math.random() * 300000),
      maintenance: Math.round(Math.random() * 200000),
      labor: Math.round(Math.random() * 400000),
      depreciation: Math.round(Math.random() * 200000),
    },
    cost_per_km: Math.round(Math.random() * 2 * 100) / 100,
  };
}

function analyzeEmissions(data) {
  return {
    total_co2_kg: Math.round(Math.random() * 1000000),
    per_vehicle_average: Math.round(Math.random() * 100000),
    reduction_opportunity_percent: Math.round(Math.random() * 30),
    carbon_offset_cost: Math.round(Math.random() * 50000),
  };
}

function analyzeEfficiency(data) {
  return {
    fuel_efficiency_score: Math.round(50 + Math.random() * 50),
    route_efficiency: Math.round(50 + Math.random() * 50),
    vehicle_utilization: Math.round(50 + Math.random() * 50),
    recommendations: [
      'Optimize route planning',
      'Upgrade vehicle fleet',
      'Improve load consolidation',
    ].filter(() => Math.random() > 0.5),
  };
}

function hashKey(key) {
  // Simple hash for demonstration - use proper hashing in production
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}