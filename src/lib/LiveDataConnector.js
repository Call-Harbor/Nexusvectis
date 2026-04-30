import { base44 } from '@/api/base44Client';

/**
 * LiveDataConnector - Forbinder hologram-grafer til live-data fra systemet
 * Henter realtids-data fra Vehicle, Route, Shipment, Alert, Resource entities
 */

export class LiveDataConnector {
  constructor(orgId) {
    this.orgId = orgId;
    this.cache = {};
    this.cacheTimeout = 10000; // 10s cache
  }

  async getFleetAnalyticsData() {
    if (this.cache.fleet && Date.now() - this.cache.fleetTime < this.cacheTimeout) {
      return this.cache.fleet;
    }

    try {
      const [vehicles, routes, shipments, alerts, resources] = await Promise.all([
        base44.entities.Vehicle.filter({ organization_id: this.orgId }, '-created_date', 100),
        base44.entities.Route.filter({ organization_id: this.orgId }, '-created_date', 100),
        base44.entities.Shipment.filter({ organization_id: this.orgId }, '-created_date', 100),
        base44.entities.Alert.filter({ organization_id: this.orgId }, '-created_date', 100),
        base44.entities.Resource.filter({ organization_id: this.orgId }, '-created_date', 100),
      ]);

      // Build comprehensive fleet analytics
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      const vehiclesByType = vehicles.reduce((acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      }, {});

      const avgEfficiency = vehicles.length > 0 
        ? vehicles.reduce((sum, v) => sum + (v.efficiency_score || 0), 0) / vehicles.length 
        : 0;

      const avgFuelUsage = vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicles.length
        : 0;

      const data = {
        vehicles: {
          total: vehicles.length,
          active: activeVehicles.length,
          maintenance: vehicles.filter(v => v.status === 'maintenance').length,
          idle: vehicles.filter(v => v.status === 'idle').length,
          byType: vehiclesByType,
          avgEfficiency: Math.round(avgEfficiency),
          avgFuelLevel: Math.round(avgFuelUsage),
          totalCO2: vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0),
          raw: vehicles,
        },
        routes: {
          total: routes.length,
          active: routes.filter(r => r.status === 'active').length,
          completed: routes.filter(r => r.status === 'completed').length,
          delayed: routes.filter(r => r.status === 'delayed').length,
          totalDistance: routes.reduce((sum, r) => sum + (r.distance_km || 0), 0),
          avgEstimatedTime: Math.round(routes.reduce((sum, r) => sum + (r.estimated_duration_hours || 0), 0) / (routes.length || 1)),
          raw: routes,
        },
        shipments: {
          total: shipments.length,
          pending: shipments.filter(s => s.status === 'pending').length,
          inTransit: shipments.filter(s => s.status === 'in_transit').length,
          delivered: shipments.filter(s => s.status === 'delivered').length,
          delayed: shipments.filter(s => s.status === 'delayed').length,
          totalWeight: shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0),
          avgCO2: shipments.length > 0 
            ? Math.round(shipments.reduce((sum, s) => sum + (s.co2_emissions_kg || 0), 0) / shipments.length)
            : 0,
          raw: shipments,
        },
        alerts: {
          total: alerts.length,
          critical: alerts.filter(a => a.type === 'critical').length,
          warning: alerts.filter(a => a.type === 'warning').length,
          info: alerts.filter(a => a.type === 'info').length,
          unresolved: alerts.filter(a => !a.is_resolved).length,
          raw: alerts,
        },
        resources: {
          total: resources.length,
          operational: resources.filter(r => r.status === 'operational').length,
          limited: resources.filter(r => r.status === 'limited').length,
          offline: resources.filter(r => r.status === 'offline').length,
          totalCapacity: resources.reduce((sum, r) => sum + (r.capacity || 0), 0),
          usedCapacity: resources.reduce((sum, r) => sum + (r.current_level || 0), 0),
          raw: resources,
        },
        timestamp: Date.now(),
      };

      this.cache.fleet = data;
      this.cache.fleetTime = Date.now();
      return data;
    } catch (e) {
      console.error('Failed to fetch fleet data:', e);
      return null;
    }
  }

  async buildVehicleEfficiencyChart() {
    const data = await this.getFleetAnalyticsData();
    if (!data?.vehicles?.raw) return [];

    return data.vehicles.raw.slice(0, 15).map(v => ({
      label: v.name || `Vehicle ${v.id?.slice(0, 6)}`,
      value: v.efficiency_score || 50,
      status: v.status,
      speed: v.speed || 0,
      fuelLevel: v.fuel_level || 0,
      cargoUsed: v.cargo_used || 0,
    }));
  }

  async buildRoutePerformanceChart() {
    const data = await this.getFleetAnalyticsData();
    if (!data?.routes?.raw) return [];

    return data.routes.raw.slice(0, 12).map(r => ({
      label: r.name || `Route ${r.id?.slice(0, 6)}`,
      distance: r.distance_km || 0,
      duration: r.estimated_duration_hours || 0,
      status: r.status,
      priority: r.priority,
    }));
  }

  async buildShipmentMetricsChart() {
    const data = await this.getFleetAnalyticsData();
    if (!data?.shipments?.raw) return [];

    const statusCounts = {
      'pending': data.shipments.pending,
      'in_transit': data.shipments.inTransit,
      'delivered': data.shipments.delivered,
      'delayed': data.shipments.delayed,
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  }

  async buildAlertTimeseries() {
    const data = await this.getFleetAnalyticsData();
    if (!data?.alerts?.raw) return [];

    // Group alerts by type and hour
    const hourly = {};
    data.alerts.raw.forEach(a => {
      const ts = new Date(a.created_date || 0);
      const hour = ts.toISOString().slice(0, 13);
      if (!hourly[hour]) hourly[hour] = { critical: 0, warning: 0, info: 0 };
      hourly[hour][a.type || 'info']++;
    });

    return Object.entries(hourly).map(([hour, counts]) => ({
      time: new Date(hour).toLocaleTimeString('da-DK'),
      critical: counts.critical,
      warning: counts.warning,
      info: counts.info,
    }));
  }

  async buildResourceUtilizationChart() {
    const data = await this.getFleetAnalyticsData();
    if (!data?.resources?.raw) return [];

    return data.resources.raw.map(r => ({
      label: r.name || `Resource ${r.id?.slice(0, 6)}`,
      value: r.current_level || 0,
      max: r.capacity || 100,
      percentage: r.capacity ? Math.round((r.current_level / r.capacity) * 100) : 0,
      status: r.status,
    }));
  }

  async generateFleetAnalysisPrompt() {
    const data = await this.getFleetAnalyticsData();
    if (!data) return "";

    return `Fleet Status Summary:
- ${data.vehicles.total} total vehicles (${data.vehicles.active} active)
- Average efficiency: ${data.vehicles.avgEfficiency}%
- Average fuel level: ${data.vehicles.avgFuelLevel}%
- Total fleet CO₂: ${data.vehicles.totalCO2.toFixed(1)}kg

Routes:
- ${data.routes.total} total routes (${data.routes.active} active)
- Total distance: ${data.routes.totalDistance}km
- ${data.routes.delayed} delayed routes

Shipments:
- ${data.shipments.total} total shipments
- In transit: ${data.shipments.inTransit}
- Delayed: ${data.shipments.delayed}
- Average CO₂/shipment: ${data.shipments.avgCO2}kg

Alerts:
- ${data.alerts.unresolved} unresolved alerts
- ${data.alerts.critical} critical issues

Resources:
- ${data.resources.operational} operational resources
- Capacity utilization: ${Math.round((data.resources.usedCapacity / (data.resources.totalCapacity || 1)) * 100)}%`;
  }

  // Build analysis charts compatible with AnalysisHologram
  async buildAnalysisChartData() {
    const [vehicleEfficiency, routePerf, shipmentMetrics, alerts, resources] = await Promise.all([
      this.buildVehicleEfficiencyChart(),
      this.buildRoutePerformanceChart(),
      this.buildShipmentMetricsChart(),
      this.buildAlertTimeseries(),
      this.buildResourceUtilizationChart(),
    ]);

    return {
      vehicles: vehicleEfficiency,
      routes: routePerf,
      shipments: shipmentMetrics,
      alerts: alerts,
      resources: resources,
    };
  }
}

// Singleton instances by orgId
const connectorCache = {};

export function getLiveDataConnector(orgId) {
  if (!connectorCache[orgId]) {
    connectorCache[orgId] = new LiveDataConnector(orgId);
  }
  return connectorCache[orgId];
}