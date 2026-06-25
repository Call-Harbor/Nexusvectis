/**
 * Get Fleet Analytics — Real-time fleet performance dashboard data
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  if (req.method === 'OPTIONS') {
    return nvOptions(requestId);
  }

  if (req.method !== 'POST') {
    return nvError(requestId, String('Method not allowed'), 405);

  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return nvError(requestId, String('Unauthorized'), 401);


    const body = await req.json().catch(() => ({}));
    const { organization_id, transport_type } = body;
    const orgId = organization_id || user.organization_id || user.id;

    const filters = { organization_id: orgId };
    if (transport_type) filters.type = transport_type;

    // Fetch all fleet data in parallel
    const [vehicles, routes, shipments, alerts, maintenance] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter(filters),
      base44.asServiceRole.entities.Route.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }).catch(() => []),
      base44.asServiceRole.entities.Alert.filter({ organization_id: orgId, is_resolved: false }).catch(() => []),
      base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }).catch(() => []),
    ]);

    // Analytics by transport type
    const byType = vehicles.reduce((acc, v) => {
      if (!acc[v.type]) {
        acc[v.type] = { count: 0, active: 0, maintenance: 0, idle: 0, offline: 0, total_emissions: 0, total_efficiency: 0, avg_efficiency: 0 };
      }
      acc[v.type].count++;
      acc[v.type][v.status] = (acc[v.type][v.status] || 0) + 1;
      acc[v.type].total_emissions += v.co2_emissions || 0;
      acc[v.type].total_efficiency += v.efficiency_score || 0;
      return acc;
    }, {});

    Object.keys(byType).forEach(type => {
      const t = byType[type];
      t.avg_efficiency = round1(t.total_efficiency / t.count);
      t.utilization_rate = round1((t.active / t.count) * 100);
      t.total_emissions_kg = Math.round(t.total_emissions);
      delete t.total_efficiency;
      delete t.total_emissions;
    });

    // Status distribution
    const statusDistribution = vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    // Signal quality analysis
    const signalAnalysis = {};
    for (const v of vehicles) {
      if (v.signal_type) {
        if (!signalAnalysis[v.signal_type]) signalAnalysis[v.signal_type] = { count: 0, total_strength: 0 };
        signalAnalysis[v.signal_type].count++;
        signalAnalysis[v.signal_type].total_strength += v.signal_strength || 0;
      }
    }
    Object.keys(signalAnalysis).forEach(sig => {
      signalAnalysis[sig].avg_strength = round1(signalAnalysis[sig].total_strength / signalAnalysis[sig].count);
      delete signalAnalysis[sig].total_strength;
    });

    // Fuel analysis
    const vehiclesWithFuel = vehicles.filter(v => v.fuel_level != null);
    const avg_fuel = vehiclesWithFuel.length > 0
      ? round1(vehiclesWithFuel.reduce((s, v) => s + v.fuel_level, 0) / vehiclesWithFuel.length)
      : null;

    // Cargo utilization
    const vehiclesWithCargo = vehicles.filter(v => v.cargo_capacity > 0);
    const cargo_utilization = vehiclesWithCargo.length > 0
      ? round1(vehiclesWithCargo.reduce((s, v) => s + ((v.cargo_used || 0) / v.cargo_capacity), 0) / vehiclesWithCargo.length * 100)
      : null;

    // Shipment KPIs
    const shipment_kpis = {
      total: shipments.length,
      in_transit: shipments.filter(s => s.status === 'in_transit').length,
      delayed: shipments.filter(s => s.status === 'delayed').length,
      delivered: shipments.filter(s => s.status === 'delivered').length,
      on_time_rate_percent: shipments.length > 0
        ? round1((shipments.filter(s => s.status === 'delivered').length / shipments.length) * 100)
        : null,
    };

    // Alert summary
    const alert_summary = {
      total_open: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      by_category: alerts.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {}),
    };

    // Maintenance summary
    const maintenance_summary = {
      pending: maintenance.filter(m => m.status === 'pending').length,
      critical: maintenance.filter(m => m.priority === 'critical').length,
      overdue: maintenance.filter(m => {
        if (!m.scheduled_date) return false;
        return new Date(m.scheduled_date) < new Date() && m.status === 'pending';
      }).length,
    };

    // Fleet health score (0-100)
    const active_pct = vehicles.length > 0 ? (statusDistribution.active || 0) / vehicles.length : 0;
    const avg_eff = vehicles.length > 0 ? vehicles.reduce((s, v) => s + (v.efficiency_score || 70), 0) / vehicles.length : 70;
    const alert_penalty = Math.min(20, alert_summary.critical * 5);
    const fleet_health_score = Math.max(0, Math.min(100, Math.round(active_pct * 40 + avg_eff * 0.4 + 20 - alert_penalty)));

    return nvJson(requestId, {
      success: true,
      analytics: {
        fleet_health_score,
        total_fleet_size: vehicles.length,
        by_transport_type: byType,
        status_distribution: statusDistribution,
        signal_quality: signalAnalysis,
        average_fuel_level_percent: avg_fuel,
        low_fuel_vehicles: vehicles.filter(v => (v.fuel_level || 100) < 20).length,
        total_cargo_capacity_tons: round1(vehicles.reduce((s, v) => s + (v.cargo_capacity || 0), 0)),
        cargo_utilization_percent: cargo_utilization,
        total_co2_kg: Math.round(vehicles.reduce((s, v) => s + (v.co2_emissions || 0), 0)),
        average_efficiency_score: round1(avg_eff),
        shipments: shipment_kpis,
        alerts: alert_summary,
        maintenance: maintenance_summary,
        routes: {
          total: routes.length,
          active: routes.filter(r => r.status === 'active').length,
          ai_optimized: routes.filter(r => r.ai_optimized).length,
          delayed: routes.filter(r => r.status === 'delayed').length,
        },
      },
      generated_at: new Date().toISOString(),
    });


  } catch (error) {
    console.error('Fleet analytics error:', error);
    return nvError(requestId, String(error.message), 500);

  }
});

function round1(n) { return Math.round(n * 10) / 10; }