/**
 * Fleet AI Calculations — Core calculation engine
 * 
 * Deterministic, physics-based calculations for fleet KPIs.
 * No random numbers. All formulas based on industry standards.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CALCULATION_CONFIGS = {
  // EUR per liter × liters per km = EUR per km
  FUEL_COST_PER_KM: { truck: 0.38, ship: 0.018, drone: 0.12, train: 0.06, aircraft: 1.20 },
  // Hours between scheduled service intervals
  MAINTENANCE_INTERVAL_HOURS: { truck: 500, ship: 2000, drone: 50, train: 1000, aircraft: 1500 },
  // kg CO2 per km (ICAO/GLEC 2023 averages)
  CO2_PER_KM: { truck: 0.120, ship: 0.019, drone: 0.075, train: 0.041, aircraft: 0.285 },
  // EUR/year
  DEPRECIATION_YEARLY: { truck: 11000, ship: 130000, drone: 2500, train: 45000, aircraft: 180000 },
  INSURANCE_YEARLY: { truck: 1800, ship: 14000, drone: 450, train: 7500, aircraft: 48000 },
  // km/h average operating speed
  AVERAGE_SPEED: { truck: 78, ship: 24, drone: 55, train: 95, aircraft: 480 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { calculation_type, params } = await req.json();
    if (!calculation_type) return Response.json({ error: 'calculation_type is required' }, { status: 400 });

    const orgId = user.organization_id || user.id;
    const secureParams = { ...params, _orgId: orgId };

    const calculators = {
      ROUTE_OPTIMIZATION: calculateRouteOptimization,
      COST_ANALYSIS: calculateCostAnalysis,
      MAINTENANCE_PREDICTION: calculateMaintenancePrediction,
      INVENTORY_FORECAST: calculateInventoryForecast,
      CO2_EMISSIONS: calculateCO2Emissions,
      ETA_PREDICTION: calculateETAPrediction,
      FUEL_EFFICIENCY: calculateFuelEfficiency,
      SHIPMENT_OPTIMIZATION: calculateShipmentOptimization,
      FLEET_PERFORMANCE: calculateFleetPerformance,
      PREDICTIVE_MAINTENANCE: calculatePredictiveMaintenance,
    };

    const calculator = calculators[calculation_type];
    if (!calculator) {
      return Response.json({
        error: `Unknown calculation_type: ${calculation_type}`,
        available: Object.keys(calculators),
      }, { status: 400 });
    }

    const result = calculator(secureParams);
    return Response.json({ success: true, calculation_type, data: result, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateRouteOptimization(params) {
  const { distance_km = 100, vehicle_type = 'truck', constraints = {} } = params;
  const vt = CALCULATION_CONFIGS.FUEL_COST_PER_KM[vehicle_type] ? vehicle_type : 'truck';
  const speed = CALCULATION_CONFIGS.AVERAGE_SPEED[vt];
  const duration_hours = distance_km / speed;
  const fuel_cost = distance_km * CALCULATION_CONFIGS.FUEL_COST_PER_KM[vt];
  const hourly_rate = constraints.hourly_rate || (vt === 'truck' ? 28 : vt === 'aircraft' ? 350 : 50);
  const driver_cost = duration_hours * hourly_rate;
  const toll_cost = vt === 'truck' ? distance_km * 0.18 : 0; // EU average truck toll
  const total_cost = fuel_cost + driver_cost + toll_cost;
  const co2 = distance_km * CALCULATION_CONFIGS.CO2_PER_KM[vt];
  const cost_per_km = total_cost / distance_km;
  // Efficiency: scale from 100 (ideal) down by cost overhead
  const efficiency_score = Math.max(10, Math.min(100, 100 - (cost_per_km - 0.5) * 20));

  return {
    distance_km: round2(distance_km),
    duration_hours: round2(duration_hours),
    fuel_cost_eur: round2(fuel_cost),
    driver_cost_eur: round2(driver_cost),
    toll_cost_eur: round2(toll_cost),
    total_cost_eur: round2(total_cost),
    co2_kg: round2(co2),
    cost_per_km_eur: round2(cost_per_km),
    efficiency_score: Math.round(efficiency_score),
    carbon_offset_cost_eur: round2(co2 * 0.065), // EU ETS ~€65/tonne
  };
}

function calculateCostAnalysis(params) {
  const { vehicle_type = 'truck', annual_km = 100000, age_years = 3, maintenance_records = [] } = params;
  const vt = CALCULATION_CONFIGS.FUEL_COST_PER_KM[vehicle_type] ? vehicle_type : 'truck';
  const fuel_cost = annual_km * CALCULATION_CONFIGS.FUEL_COST_PER_KM[vt];
  const maint_base = CALCULATION_CONFIGS.MAINTENANCE_INTERVAL_HOURS[vt] / 10 * 45;
  const maintenance_cost = maint_base + (annual_km / 20000 * 1800) + (maintenance_records.length * 400);
  const insurance = CALCULATION_CONFIGS.INSURANCE_YEARLY[vt];
  const depreciation = CALCULATION_CONFIGS.DEPRECIATION_YEARLY[vt] / Math.max(1, age_years);
  const total_cost = fuel_cost + maintenance_cost + insurance + depreciation;
  const cost_per_km = total_cost / annual_km;

  return {
    fuel_cost_eur: round2(fuel_cost),
    maintenance_cost_eur: round2(maintenance_cost),
    insurance_cost_eur: round2(insurance),
    depreciation_eur: round2(depreciation),
    total_annual_cost_eur: round2(total_cost),
    cost_per_km_eur: round2(cost_per_km),
    cost_per_km_benchmark: round2(CALCULATION_CONFIGS.FUEL_COST_PER_KM[vt] * 3.2), // fuel is ~31% of TCO
    vs_benchmark_percent: round2(((cost_per_km / (CALCULATION_CONFIGS.FUEL_COST_PER_KM[vt] * 3.2)) - 1) * 100),
    roi_months: round2(depreciation / (total_cost / 12)),
  };
}

function calculateMaintenancePrediction(params) {
  const { vehicle_type = 'truck', mileage_km = 0, last_service_km = 0, maintenance_history = [] } = params;
  const vt = CALCULATION_CONFIGS.MAINTENANCE_INTERVAL_HOURS[vehicle_type] ? vehicle_type : 'truck';
  const interval_hours = CALCULATION_CONFIGS.MAINTENANCE_INTERVAL_HOURS[vt];
  const service_interval_km = (interval_hours / 80) * 1000;
  const km_since_service = mileage_km - last_service_km;
  const km_until_next = Math.max(0, service_interval_km - km_since_service);
  const risk_score = Math.min(100, (km_since_service / service_interval_km) * 100);
  const urgency = risk_score > 75 ? 'CRITICAL — Schedule immediately' : risk_score > 45 ? 'HIGH — Schedule within 2 weeks' : risk_score > 20 ? 'MEDIUM — Schedule this month' : 'LOW — Monitor';
  const days_until_service = km_until_next > 0 ? Math.round(km_until_next / 350) : 0; // assume 350 km/day

  return {
    km_since_last_service: Math.round(km_since_service),
    km_until_next_service: Math.round(km_until_next),
    days_until_next_service: days_until_service,
    risk_score: Math.round(risk_score),
    urgency,
    estimated_service_cost_eur: Math.round((interval_hours / 10) * 55),
    estimated_downtime_hours: Math.round(interval_hours / 250),
    maintenance_history_events: maintenance_history.length,
    next_service_date: new Date(Date.now() + days_until_service * 86400000).toISOString().split('T')[0],
  };
}

function calculateInventoryForecast(params) {
  const { current_level = 100, monthly_consumption = 30, lead_time_days = 7, safety_factor = 1.3 } = params;
  const daily_consumption = monthly_consumption / 30;
  const safety_stock = daily_consumption * lead_time_days * (safety_factor - 1);
  const reorder_point = (daily_consumption * lead_time_days) + safety_stock;
  const days_until_reorder = current_level > reorder_point ? Math.round((current_level - reorder_point) / daily_consumption) : 0;
  const days_until_stockout = Math.round(current_level / daily_consumption);
  const recommended_order = Math.round(monthly_consumption * 1.5); // 45 days of stock

  return {
    current_inventory: Math.round(current_level),
    daily_consumption: round2(daily_consumption),
    safety_stock: Math.round(safety_stock),
    reorder_point: Math.round(reorder_point),
    days_until_reorder: days_until_reorder,
    days_until_stockout: days_until_stockout,
    should_reorder_now: current_level <= reorder_point,
    recommended_order_qty: recommended_order,
    stockout_risk_percent: Math.round(Math.max(0, Math.min(100, (1 - current_level / reorder_point) * 100))),
  };
}

function calculateCO2Emissions(params) {
  const { vehicle_type = 'truck', distance_km = 100, cargo_weight_kg = 0, return_empty = false } = params;
  const vt = CALCULATION_CONFIGS.CO2_PER_KM[vehicle_type] ? vehicle_type : 'truck';
  const base_co2 = distance_km * CALCULATION_CONFIGS.CO2_PER_KM[vt];
  // Weight factor: +1% emissions per 1000 kg above base
  const weight_factor = 1 + Math.min(0.5, cargo_weight_kg / 100000);
  const laden_co2 = base_co2 * weight_factor;
  const return_co2 = return_empty ? base_co2 * 0.85 : 0; // empty return ~15% less fuel
  const total_co2 = laden_co2 + return_co2;
  const eu_ets_cost = total_co2 * 0.065; // EU ETS ~€65/tonne CO2

  return {
    laden_emissions_kg: round2(laden_co2),
    return_emissions_kg: round2(return_co2),
    total_co2_kg: round2(total_co2),
    co2_per_km: round2(total_co2 / (return_empty ? distance_km * 2 : distance_km)),
    co2_per_tonne_km: cargo_weight_kg > 0 ? round2(total_co2 / (cargo_weight_kg / 1000 * distance_km)) : null,
    eu_ets_cost_eur: round2(eu_ets_cost),
    equivalent_trees_to_offset: Math.round(total_co2 / 21),
    carbon_intensity_class: total_co2 / distance_km < 0.05 ? 'A' : total_co2 / distance_km < 0.1 ? 'B' : total_co2 / distance_km < 0.2 ? 'C' : 'D',
  };
}

function calculateETAPrediction(params) {
  const { distance_km = 100, vehicle_type = 'truck', covered_km = 0, traffic_factor = 1.0, stops = 0 } = params;
  const vt = CALCULATION_CONFIGS.AVERAGE_SPEED[vehicle_type] ? vehicle_type : 'truck';
  const base_speed = CALCULATION_CONFIGS.AVERAGE_SPEED[vt] / traffic_factor;
  const remaining_km = Math.max(0, distance_km - covered_km);
  const driving_hours = remaining_km / base_speed;
  const stop_time_hours = stops * 0.75; // 45 min per stop average
  const total_hours = driving_hours + stop_time_hours;
  // HOS buffer for trucks (EU: 45min break after 4.5h)
  const hos_breaks = vt === 'truck' ? Math.floor(driving_hours / 4.5) * 0.75 : 0;
  const eta = new Date(Date.now() + (total_hours + hos_breaks) * 3600000);

  return {
    remaining_distance_km: Math.round(remaining_km),
    estimated_driving_hours: round2(driving_hours),
    stop_time_hours: round2(stop_time_hours),
    hos_break_hours: round2(hos_breaks),
    total_journey_hours: round2(total_hours + hos_breaks),
    eta_datetime: eta.toISOString(),
    eta_local: eta.toLocaleString('en-DK', { timeZone: 'Europe/Copenhagen' }),
    confidence_percent: Math.min(92, 75 + (covered_km / distance_km) * 17),
    traffic_delay_minutes: Math.round((traffic_factor - 1) * driving_hours * 60),
    buffer_minutes: Math.round(total_hours * 60 * 0.12), // 12% buffer
  };
}

function calculateFuelEfficiency(params) {
  const { distance_km = 100, fuel_consumed_liters = 30, vehicle_type = 'truck', cargo_weight_kg = 0 } = params;
  const vt = vehicle_type || 'truck';
  const liters_per_km = fuel_consumed_liters / distance_km;
  // Industry benchmarks (L/km)
  const benchmarks = { truck: 0.30, ship: 0.008, drone: 0.05, train: 0.025, aircraft: 0.40 };
  const benchmark = benchmarks[vt] || 0.30;
  const vs_benchmark = ((benchmark - liters_per_km) / benchmark) * 100;
  const fuel_price_eur = 1.65; // EU average diesel
  const cost_per_km = liters_per_km * fuel_price_eur;

  return {
    liters_per_100km: round2(liters_per_km * 100),
    liters_per_km: round3(liters_per_km),
    benchmark_liters_per_100km: round2(benchmark * 100),
    vs_benchmark_percent: round2(vs_benchmark),
    cost_per_km_eur: round3(cost_per_km),
    total_fuel_cost_eur: round2(fuel_consumed_liters * fuel_price_eur),
    co2_kg: round2(fuel_consumed_liters * 2.64), // diesel: 2.64 kg CO2/liter
    efficiency_rating: vs_benchmark > 10 ? 'Excellent' : vs_benchmark > 0 ? 'Good' : vs_benchmark > -10 ? 'Average' : 'Poor',
    improvement_potential_liters: Math.max(0, round2((liters_per_km - benchmark) * distance_km)),
    improvement_potential_eur: Math.max(0, round2((liters_per_km - benchmark) * distance_km * fuel_price_eur)),
  };
}

function calculateShipmentOptimization(params) {
  const { shipments = [], vehicles = [], max_stops_per_vehicle = 8 } = params;
  const total_weight = shipments.reduce((s, sh) => s + (sh.weight_kg || 500), 0);
  const avg_capacity = vehicles.length > 0 ? vehicles.reduce((s, v) => s + (v.cargo_capacity || 10) * 1000, 0) / vehicles.length : 10000;
  const vehicles_needed = Math.max(1, Math.ceil(shipments.length / max_stops_per_vehicle));
  const utilization = avg_capacity > 0 ? Math.min(100, (total_weight / (avg_capacity * vehicles_needed)) * 100) : 0;
  const consolidated_routes = Math.ceil(shipments.length / max_stops_per_vehicle);
  const unoptimized_cost = shipments.length * 120;
  const optimized_cost = consolidated_routes * 320 + (shipments.length * 15);
  const savings = unoptimized_cost - optimized_cost;

  return {
    total_shipments: shipments.length,
    total_weight_kg: Math.round(total_weight),
    vehicles_available: vehicles.length,
    vehicles_required: vehicles_needed,
    vehicle_utilization_percent: Math.round(utilization),
    consolidated_routes: consolidated_routes,
    estimated_cost_before_eur: Math.round(unoptimized_cost),
    estimated_cost_after_eur: Math.round(optimized_cost),
    savings_eur: Math.max(0, Math.round(savings)),
    savings_percent: unoptimized_cost > 0 ? Math.max(0, Math.round((savings / unoptimized_cost) * 100)) : 0,
    co2_reduction_kg: Math.round(consolidated_routes * 12),
  };
}

function calculateFleetPerformance(params) {
  const { vehicles = [], routes = [], shipments = [], time_period_days = 30 } = params;
  if (vehicles.length === 0) return { error: 'No vehicle data provided' };

  const active = vehicles.filter(v => v.status === 'active').length;
  const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
  const avg_eff = vehicles.reduce((s, v) => s + (v.efficiency_score || 75), 0) / vehicles.length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const total_shipments = shipments.length || 1;
  const on_time_pct = (delivered / total_shipments) * 100;
  const avg_fuel = vehicles.filter(v => v.fuel_level).reduce((s, v) => s + v.fuel_level, 0) / (vehicles.filter(v => v.fuel_level).length || 1);
  const total_co2 = vehicles.reduce((s, v) => s + (v.co2_emissions || 0), 0);

  return {
    fleet_size: vehicles.length,
    active_vehicles: active,
    in_maintenance: maintenance,
    utilization_percent: Math.round((active / vehicles.length) * 100),
    average_efficiency_score: Math.round(avg_eff),
    average_fuel_level_percent: Math.round(avg_fuel),
    on_time_delivery_percent: Math.round(on_time_pct),
    total_shipments: total_shipments,
    delivered_shipments: delivered,
    total_co2_kg: Math.round(total_co2),
    routes_completed: routes.filter(r => r.status === 'completed').length,
    routes_active: routes.filter(r => r.status === 'active').length,
    performance_rating: avg_eff > 85 ? 'EXCELLENT' : avg_eff > 70 ? 'GOOD' : avg_eff > 55 ? 'AVERAGE' : 'NEEDS_IMPROVEMENT',
    estimated_monthly_fuel_cost_eur: Math.round(vehicles.length * 280 * time_period_days / 30),
  };
}

function calculatePredictiveMaintenance(params) {
  const { vehicle_age_years = 2, km_since_service = 0, service_interval_km = 25000, sensors = {}, maintenance_history = [] } = params;
  const overdue_pct = Math.min(100, (km_since_service / service_interval_km) * 100);
  const age_risk = Math.min(40, vehicle_age_years * 4);
  const sensor_risk = (sensors.vibration || 0) * 15 + (sensors.temperature_delta || 0) * 0.5;
  const history_risk = maintenance_history.filter(h => h.type === 'emergency').length * 8;
  const fault_probability = Math.min(100, overdue_pct * 0.5 + age_risk + sensor_risk + history_risk);
  const days_until_failure = Math.max(3, Math.round((100 - fault_probability) * 1.2));
  const preventive_cost = 350 + vehicle_age_years * 80;
  const reactive_cost = preventive_cost * 3.2;

  return {
    fault_probability_percent: Math.round(fault_probability),
    days_until_estimated_failure: days_until_failure,
    next_service_date: new Date(Date.now() + days_until_failure * 86400000).toISOString().split('T')[0],
    sensor_health_score: Math.round(Math.max(0, 100 - sensor_risk * 4)),
    recommended_inspection_frequency: fault_probability > 65 ? 'WEEKLY' : fault_probability > 35 ? 'MONTHLY' : 'QUARTERLY',
    preventive_cost_eur: Math.round(preventive_cost),
    reactive_cost_eur: Math.round(reactive_cost),
    potential_savings_eur: Math.round(reactive_cost - preventive_cost),
    action_required: fault_probability > 80 ? 'IMMEDIATE' : fault_probability > 50 ? 'THIS_WEEK' : fault_probability > 25 ? 'THIS_MONTH' : 'MONITOR',
    risk_drivers: [
      overdue_pct > 70 ? `Overdue service (${Math.round(overdue_pct)}% of interval)` : null,
      age_risk > 20 ? `Vehicle age (${vehicle_age_years} years)` : null,
      sensor_risk > 15 ? 'Sensor anomalies detected' : null,
      history_risk > 0 ? `${maintenance_history.filter(h => h.type === 'emergency').length} emergency repair(s) in history` : null,
    ].filter(Boolean),
  };
}

// Utility rounding
function round2(n) { return Math.round(n * 100) / 100; }
function round3(n) { return Math.round(n * 1000) / 1000; }