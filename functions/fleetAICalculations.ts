import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CALCULATION_CONFIGS = {
  FUEL_COSTS: { truck: 0.8, ship: 0.15, drone: 0.2, train: 0.25, aircraft: 2.5 },
  MAINTENANCE_HOURS: { truck: 500, ship: 2000, drone: 50, train: 1000, aircraft: 1500 },
  CO2_PER_KM: { truck: 0.12, ship: 0.02, drone: 0.08, train: 0.04, aircraft: 0.25 },
  DEPRECIATION_YEARLY: { truck: 12000, ship: 150000, drone: 3000, train: 50000, aircraft: 200000 },
  INSURANCE_YEARLY: { truck: 2000, ship: 15000, drone: 500, train: 8000, aircraft: 50000 },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store user's organization for security filtering
    const userOrganizationId = user.organization_id;

    const { calculation_type, params } = await req.json();

    let result = {};

    // Pass user organization for security filtering
    const secureParams = { ...params, _userOrganizationId: userOrganizationId };

    switch (calculation_type) {
      case 'ROUTE_OPTIMIZATION':
        result = calculateRouteOptimization(secureParams);
        break;
      case 'COST_ANALYSIS':
        result = calculateCostAnalysis(secureParams);
        break;
      case 'MAINTENANCE_PREDICTION':
        result = calculateMaintenancePrediction(secureParams);
        break;
      case 'INVENTORY_FORECAST':
        result = calculateInventoryForecast(secureParams);
        break;
      case 'CO2_EMISSIONS':
        result = calculateCO2Emissions(secureParams);
        break;
      case 'ETA_PREDICTION':
        result = calculateETAPrediction(secureParams);
        break;
      case 'FUEL_EFFICIENCY':
        result = calculateFuelEfficiency(secureParams);
        break;
      case 'SHIPMENT_OPTIMIZATION':
        result = calculateShipmentOptimization(secureParams);
        break;
      case 'FLEET_PERFORMANCE':
        result = calculateFleetPerformance(secureParams);
        break;
      case 'PREDICTIVE_MAINTENANCE':
        result = calculatePredictiveMaintenance(secureParams);
        break;
      default:
        return Response.json({ error: 'Unknown calculation type' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateRouteOptimization(params) {
  const { origin, destination, vehicle_type, constraints = {} } = params;
  const distance = Math.sqrt(Math.pow(params.lat_diff || 100, 2) + Math.pow(params.long_diff || 100, 2));
  
  const speeds = { truck: 80, ship: 25, drone: 60, train: 100, aircraft: 500 };
  const speed = speeds[vehicle_type] || 80;
  const duration_hours = distance / speed;
  
  const fuel_cost = distance * CALCULATION_CONFIGS.FUEL_COSTS[vehicle_type] * (constraints.fuel_price || 1.5);
  const driver_cost = duration_hours * (constraints.hourly_rate || 25);
  const total_cost = fuel_cost + driver_cost;
  const co2 = distance * CALCULATION_CONFIGS.CO2_PER_KM[vehicle_type];

  return {
    distance_km: Math.round(distance * 10) / 10,
    duration_hours: Math.round(duration_hours * 100) / 100,
    fuel_cost_eur: Math.round(fuel_cost * 100) / 100,
    driver_cost_eur: Math.round(driver_cost * 100) / 100,
    total_cost_eur: Math.round(total_cost * 100) / 100,
    co2_kg: Math.round(co2 * 100) / 100,
    cost_per_km: Math.round((total_cost / distance) * 100) / 100,
    efficiency_score: Math.max(0, Math.min(100, 100 - (total_cost / distance))),
  };
}

function calculateCostAnalysis(params) {
  const { vehicle_type, annual_miles, age_years, maintenance_records = [] } = params;
  const annual_km = annual_miles * 1.609;
  
  const fuel_cost = annual_km * CALCULATION_CONFIGS.FUEL_COSTS[vehicle_type] * 1.5;
  const maintenance_cost = (maintenance_records.length * 500) + (annual_km / 20000 * 2000);
  const insurance = CALCULATION_CONFIGS.INSURANCE_YEARLY[vehicle_type];
  const depreciation = CALCULATION_CONFIGS.DEPRECIATION_YEARLY[vehicle_type] / (age_years + 1);
  
  const total_cost = fuel_cost + maintenance_cost + insurance + depreciation;
  const cost_per_km = total_cost / annual_km;

  return {
    fuel_cost_eur: Math.round(fuel_cost * 100) / 100,
    maintenance_cost_eur: Math.round(maintenance_cost * 100) / 100,
    insurance_cost_eur: Math.round(insurance * 100) / 100,
    depreciation_eur: Math.round(depreciation * 100) / 100,
    total_annual_cost_eur: Math.round(total_cost * 100) / 100,
    cost_per_km_eur: Math.round(cost_per_km * 100) / 100,
    roi_months: Math.round((depreciation / (total_cost / 12)) * 10) / 10,
  };
}

function calculateMaintenancePrediction(params) {
  const { vehicle_type, current_age_years, maintenance_history = [], mileage = 0 } = params;
  const hours_between_services = CALCULATION_CONFIGS.MAINTENANCE_HOURS[vehicle_type];
  const next_service_km = (hours_between_services / 80) * 1000;
  const risk_score = (mileage % next_service_km) / next_service_km * 100;

  return {
    next_service_due_km: Math.round(next_service_km - (mileage % next_service_km)),
    estimated_service_cost_eur: Math.round((hours_between_services / 10) * 50),
    predicted_failure_date: new Date(Date.now() + risk_score * 86400000).toISOString().split('T')[0],
    risk_score: Math.round(risk_score),
    maintenance_history_count: maintenance_history.length,
    recommended_action: risk_score > 70 ? 'URGENT: Schedule immediately' : risk_score > 40 ? 'Schedule within 2 weeks' : 'Monitor',
  };
}

function calculateInventoryForecast(params) {
  const { current_level, consumption_rate, lead_time_days, safety_stock = 0 } = params;
  const daily_consumption = consumption_rate / 30;
  const forecast_days = lead_time_days + 7;
  const forecasted_level = current_level - (daily_consumption * forecast_days);
  const reorder_point = (daily_consumption * lead_time_days) + safety_stock;

  return {
    current_inventory: Math.round(current_level),
    daily_consumption: Math.round(daily_consumption * 100) / 100,
    forecast_days: forecast_days,
    forecasted_level: Math.round(forecasted_level),
    reorder_point: Math.round(reorder_point),
    should_reorder: forecasted_level <= reorder_point,
    recommended_order_qty: Math.max(0, reorder_point - forecasted_level),
    stockout_risk_percent: Math.max(0, Math.min(100, (reorder_point - forecasted_level) / reorder_point * 100)),
  };
}

function calculateCO2Emissions(params) {
  const { vehicle_type, distance_km, routes = [], shipments = [] } = params;
  const base_co2 = distance_km * CALCULATION_CONFIGS.CO2_PER_KM[vehicle_type];
  const total_weight = shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0);
  const weight_factor = Math.min(1.5, 1 + (total_weight / 10000));
  const adjusted_co2 = base_co2 * weight_factor;

  return {
    base_emissions_kg: Math.round(base_co2 * 100) / 100,
    weight_adjusted_emissions_kg: Math.round(adjusted_co2 * 100) / 100,
    emissions_per_km: Math.round((adjusted_co2 / distance_km) * 100) / 100,
    equivalent_trees_needed: Math.round(adjusted_co2 / 21),
    carbon_offset_cost_eur: Math.round(adjusted_co2 * 0.05 * 100) / 100,
    sustainability_score: Math.max(0, 100 - (adjusted_co2 / distance_km * 10)),
  };
}

function calculateETAPrediction(params) {
  const { origin, destination, current_position = {}, historical_times = [], traffic_factor = 1 } = params;
  const distance = Math.sqrt(Math.pow(params.lat_diff || 100, 2) + Math.pow(params.long_diff || 100, 2));
  const avg_speed = 80 * traffic_factor;
  const remaining_distance = distance - (params.covered_distance || 0);
  const remaining_hours = remaining_distance / avg_speed;
  const base_eta = new Date(Date.now() + remaining_hours * 3600000);

  return {
    remaining_distance_km: Math.round(remaining_distance * 10) / 10,
    estimated_time_hours: Math.round(remaining_hours * 100) / 100,
    eta_datetime: base_eta.toISOString(),
    confidence_percent: Math.max(50, Math.min(95, 70 + (historical_times.length * 2))),
    traffic_impact: Math.round((traffic_factor - 1) * 100),
    buffer_minutes: Math.round(remaining_hours * 60 * 0.15),
  };
}

function calculateFuelEfficiency(params) {
  const { distance_km, fuel_consumed_liters, vehicle_type, cargo_weight_kg = 0 } = params;
  const efficiency = fuel_consumed_liters / distance_km;
  const loaded_efficiency = fuel_consumed_liters / (distance_km + cargo_weight_kg / 100);
  const benchmark = 1 / CALCULATION_CONFIGS.FUEL_COSTS[vehicle_type] * 0.5;

  return {
    liters_per_km: Math.round(efficiency * 1000) / 1000,
    loaded_efficiency: Math.round(loaded_efficiency * 1000) / 1000,
    benchmark_liters_per_km: Math.round(benchmark * 1000) / 1000,
    efficiency_vs_benchmark: Math.round(((benchmark - efficiency) / benchmark) * 100),
    cost_per_km_eur: Math.round(efficiency * 1.5 * 100) / 100,
    improvement_potential_percent: Math.max(0, Math.round(((efficiency - benchmark) / efficiency) * 100)),
  };
}

function calculateShipmentOptimization(params) {
  const { shipments = [], vehicles = [], routes = [] } = params;
  const total_weight = shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0);
  const total_volume = shipments.reduce((sum, s) => sum + (s.volume_m3 || 0), 0);
  const vehicle_capacity = vehicles.reduce((sum, v) => sum + (v.cargo_capacity || 1000), 0);
  
  const utilization_weight = (total_weight / vehicle_capacity) * 100;
  const optimal_routes = Math.ceil(shipments.length / 10);
  const estimated_cost = optimal_routes * 500;

  return {
    total_shipments: shipments.length,
    total_weight_kg: Math.round(total_weight),
    total_volume_m3: Math.round(total_volume * 100) / 100,
    vehicle_utilization_percent: Math.round(Math.min(100, utilization_weight)),
    recommended_vehicles: Math.ceil(total_weight / (vehicle_capacity / vehicles.length)),
    optimal_route_count: optimal_routes,
    estimated_cost_eur: Math.round(estimated_cost * 100) / 100,
    optimization_savings_percent: Math.round((routes.length - optimal_routes) / routes.length * 100),
  };
}

function calculateFleetPerformance(params) {
  const { vehicles = [], routes = [], shipments = [], time_period_days = 30 } = params;
  const active_vehicles = vehicles.filter(v => v.status === 'active').length;
  const avg_efficiency = vehicles.reduce((sum, v) => sum + (v.efficiency_score || 0), 0) / vehicles.length;
  const completed_shipments = shipments.filter(s => s.status === 'delivered').length;
  const on_time_percent = (completed_shipments / (shipments.length || 1)) * 100;

  return {
    fleet_size: vehicles.length,
    active_vehicles: active_vehicles,
    utilization_percent: Math.round((active_vehicles / vehicles.length) * 100),
    average_efficiency_score: Math.round(avg_efficiency),
    completed_shipments: completed_shipments,
    on_time_delivery_percent: Math.round(on_time_percent),
    total_routes_completed: routes.filter(r => r.status === 'completed').length,
    average_cost_per_shipment: Math.round(routes.length > 0 ? (routes.length * 500) / completed_shipments : 0),
    performance_trend: on_time_percent > 90 ? 'EXCELLENT' : on_time_percent > 75 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
  };
}

function calculatePredictiveMaintenance(params) {
  const { vehicle_id, sensors = {}, maintenance_history = [], vehicle_age_years = 0 } = params;
  const fault_probability = (sensors.vibration_level || 0) * 0.3 + (sensors.temperature || 0) * 0.2 + (vehicle_age_years * 5);
  const maintenance_intervals = maintenance_history.length > 0 ? 
    maintenance_history.reduce((sum, m) => sum + (m.days_between || 365), 0) / maintenance_history.length : 365;

  return {
    fault_probability_percent: Math.round(Math.min(100, fault_probability)),
    days_until_failure: Math.max(1, Math.round(365 - fault_probability * 3.65)),
    next_maintenance_date: new Date(Date.now() + (maintenance_intervals * 86400000)).toISOString().split('T')[0],
    sensor_health_score: Math.round(Math.max(0, 100 - (sensors.vibration_level || 0) * 20)),
    recommended_inspections: fault_probability > 60 ? 'WEEKLY' : fault_probability > 30 ? 'MONTHLY' : 'QUARTERLY',
    estimated_repair_cost_eur: Math.round(Math.min(50000, fault_probability * 500)),
    critical_alert: fault_probability > 80,
  };
}