import React, { useState } from "react";
import { Copy, Key, Zap, TrendingUp, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function APIDocumentation() {
  const [selectedExample, setSelectedExample] = useState("route-optimization");
  const [showApiKey, setShowApiKey] = useState(false);

  const apiEndpoints = [
    // Fleet AI Calculations
    {
      id: "route-optimization",
      name: "Route Optimization",
      method: "POST",
      endpoint: "/api/v1/calculate",
      description: "Calculate optimal routes with cost, time, and emissions analysis",
      params: {
        calculation_type: "ROUTE_OPTIMIZATION",
        params: {
          origin: "Copenhagen",
          destination: "Aarhus",
          vehicle_type: "truck",
          constraints: { fuel_price: 1.5, hourly_rate: 25 },
        },
      },
      response: {
        distance_km: 284.5,
        duration_hours: 3.56,
        fuel_cost_eur: 342.6,
        total_cost_eur: 432.1,
        co2_kg: 34.14,
        efficiency_score: 78.5,
      },
    },
    // Vehicle Management
    {
      id: "track-vehicle",
      name: "Track Vehicle",
      method: "POST",
      endpoint: "/api/v1/track/vehicle",
      description: "Get real-time location and status of a vehicle",
      params: {
        vehicle_id: "SHIP-001",
        include_history: true,
        history_hours: 24,
      },
      response: {
        vehicle_id: "SHIP-001",
        latitude: 55.6761,
        longitude: 12.5683,
        status: "active",
        speed_kmh: 45,
        fuel_level: 87,
        eta: "2026-02-14T14:30:00Z",
        location_history: [],
      },
    },
    {
      id: "batch-update-vehicles",
      name: "Batch Update Vehicles",
      method: "PUT",
      endpoint: "/api/v1/vehicles/batch",
      description: "Update multiple vehicles at once",
      params: {
        updates: [
          { vehicle_id: "TRUCK-001", status: "maintenance", fuel_level: 50 },
          { vehicle_id: "TRUCK-002", status: "active", destination: "Aarhus" },
        ],
      },
      response: {
        updated_count: 2,
        success: true,
        updated_vehicles: [],
      },
    },
    // Shipment Management
    {
      id: "create-shipment",
      name: "Create Shipment",
      method: "POST",
      endpoint: "/api/v1/shipments",
      description: "Create a new shipment",
      params: {
        tracking_number: "SHIP-AUTO",
        origin: "Copenhagen",
        destination: "Hamburg",
        cargo_type: "general",
        weight_kg: 5000,
        priority: "high",
      },
      response: {
        tracking_number: "SHIP-20260213-001",
        status: "pending",
        created_date: "2026-02-13T10:00:00Z",
        eta: "2026-02-14T16:00:00Z",
      },
    },
    {
      id: "track-shipment",
      name: "Track Shipment",
      method: "GET",
      endpoint: "/api/v1/shipments/{tracking_number}",
      description: "Get detailed shipment tracking information",
      params: {
        tracking_number: "SHIP-20260213-001",
      },
      response: {
        tracking_number: "SHIP-20260213-001",
        status: "in_transit",
        current_location: { lat: 55.6761, lng: 12.5683 },
        eta: "2026-02-14T16:00:00Z",
        eta_confidence: 92,
        temperature: 18,
        humidity: 65,
      },
    },
    {
      id: "update-shipment",
      name: "Update Shipment",
      method: "PUT",
      endpoint: "/api/v1/shipments/{tracking_number}",
      description: "Update shipment status or details",
      params: {
        tracking_number: "SHIP-20260213-001",
        status: "delivered",
        delivery_date: "2026-02-14",
      },
      response: {
        success: true,
        tracking_number: "SHIP-20260213-001",
        status: "delivered",
      },
    },
    // Route Management
    {
      id: "plan-route",
      name: "Plan Route",
      method: "POST",
      endpoint: "/api/v1/routes/plan",
      description: "Plan an optimized route for vehicle transport",
      params: {
        origin: "Copenhagen",
        destination: "Stockholm",
        vehicle_type: "truck",
        waypoints: ["Malmö", "Helsingborg"],
      },
      response: {
        route_id: "ROUTE-001",
        distance_km: 650,
        duration_hours: 8.5,
        waypoints: [],
        co2_estimate: 78,
      },
    },
    {
      id: "assign-vehicle-to-route",
      name: "Assign Vehicle to Route",
      method: "POST",
      endpoint: "/api/v1/assignments",
      description: "Assign a vehicle to a specific route",
      params: {
        vehicle_id: "TRUCK-001",
        route_id: "ROUTE-001",
        driver: "John Doe",
      },
      response: {
        assignment_id: "ASSIGN-001",
        vehicle_id: "TRUCK-001",
        route_id: "ROUTE-001",
        status: "assigned",
      },
    },
    // Analytics & Reporting
    {
      id: "fleet-analytics",
      name: "Fleet Analytics",
      method: "GET",
      endpoint: "/api/v1/analytics/fleet",
      description: "Get comprehensive fleet performance analytics",
      params: {
        period_days: 30,
        include_metrics: ["efficiency", "cost", "emissions"],
      },
      response: {
        period: "30_days",
        total_vehicles: 45,
        active_vehicles: 38,
        total_distance_km: 125000,
        avg_efficiency: 82,
        total_fuel_cost: 45000,
        total_co2_kg: 15000,
      },
    },
    {
      id: "route-performance",
      name: "Route Performance",
      method: "GET",
      endpoint: "/api/v1/analytics/routes",
      description: "Analyze performance metrics for routes",
      params: {
        period_days: 30,
        include_delays: true,
      },
      response: {
        total_routes: 120,
        on_time_percent: 94,
        avg_delay_minutes: 8.5,
        cost_per_route: 450,
        efficiency_score: 85,
      },
    },
    {
      id: "shipment-metrics",
      name: "Shipment Metrics",
      method: "GET",
      endpoint: "/api/v1/analytics/shipments",
      description: "Get shipment delivery metrics and KPIs",
      params: {
        period_days: 30,
        status_filter: "delivered",
      },
      response: {
        total_shipments: 850,
        delivered_on_time: 799,
        on_time_percent: 94,
        avg_transit_time_hours: 36,
        temperature_compliance: 99.5,
      },
    },
    {
      id: "calculate-kpis",
      name: "Calculate KPIs",
      method: "POST",
      endpoint: "/api/v1/analytics/kpis",
      description: "Calculate custom KPIs for your logistics operations",
      params: {
        metrics: ["on_time_delivery", "cost_per_km", "efficiency", "sustainability"],
        period_days: 30,
      },
      response: {
        on_time_delivery: 94,
        cost_per_km: 1.23,
        efficiency_score: 82,
        sustainability_score: 78,
      },
    },
    // Alerts & Monitoring
    {
      id: "get-alerts",
      name: "Get Alerts",
      method: "GET",
      endpoint: "/api/v1/alerts",
      description: "Retrieve active alerts and issues",
      params: {
        status: "unresolved",
        category: "all",
        limit: 50,
      },
      response: {
        alerts: [
          { id: "ALERT-001", title: "Fuel Low", type: "warning", vehicle_id: "TRUCK-001" },
        ],
        total: 5,
        unresolved: 5,
      },
    },
    {
      id: "create-alert",
      name: "Create Alert",
      method: "POST",
      endpoint: "/api/v1/alerts",
      description: "Create a new alert or issue",
      params: {
        title: "Emergency Maintenance Required",
        message: "Vehicle requires immediate attention",
        type: "critical",
        vehicle_id: "TRUCK-001",
      },
      response: {
        alert_id: "ALERT-NEW-001",
        created_date: "2026-02-13T10:00:00Z",
        status: "open",
      },
    },
    // Fleet AI Chat
    {
      id: "fleet-ai-chat",
      name: "Fleet AI Chat",
      method: "POST",
      endpoint: "/api/v1/ai/chat",
      description: "Chat with Fleet AI — ask questions, get insights and logistics recommendations in natural language",
      params: {
        message: "Which vehicles need maintenance soon?",
        conversation_history: [
          { role: "user", content: "How many active vehicles do I have?" },
          { role: "assistant", content: "You currently have 38 active vehicles out of 45 total." }
        ],
        context: {
          vehicles_count: 45,
          alerts_count: 3
        }
      },
      response: {
        reply: "Based on your fleet data, 3 vehicles are flagged for upcoming maintenance: TRUCK-004 (brake pads due in 800 km), SHIP-002 (engine oil overdue), and DRONE-01 (battery calibration needed). I recommend scheduling SHIP-002 immediately to avoid downtime.",
        role: "assistant",
        model: "mistral-large-latest",
        usage: { prompt_tokens: 210, completion_tokens: 64, total_tokens: 274 }
      }
    },
    // Data Export
    {
      id: "export-data",
      name: "Export Data",
      method: "POST",
      endpoint: "/api/v1/export",
      description: "Export fleet data in various formats",
      params: {
        format: "csv",
        data_type: "shipments",
        period_days: 30,
      },
      response: {
        file_url: "https://api.nexusvectis.com/files/export-123.csv",
        format: "csv",
        records: 850,
      },
    },
    {
      id: "cost-analysis",
      name: "Cost Analysis",
      method: "POST",
      endpoint: "/api/v1/calculate",
      description: "Comprehensive vehicle cost analysis including maintenance and depreciation",
      params: {
        calculation_type: "COST_ANALYSIS",
        params: {
          vehicle_type: "truck",
          annual_miles: 50000,
          age_years: 3,
          maintenance_records: [],
        },
      },
      response: {
        fuel_cost_eur: 60000,
        maintenance_cost_eur: 8500,
        insurance_cost_eur: 2000,
        depreciation_eur: 4000,
        total_annual_cost_eur: 74500,
        cost_per_km_eur: 0.93,
      },
    },
    {
      id: "maintenance-prediction",
      name: "Predictive Maintenance",
      method: "POST",
      endpoint: "/api/v1/predict",
      description: "Predict maintenance needs with failure probability and recommendations",
      params: {
        prediction_type: "failure",
        data: {
          vehicle_sensors: { vibration_level: 0.45, temperature: 95 },
          maintenance_history: [],
          vehicle_age_years: 5,
        },
      },
      response: {
        fault_probability_percent: 65,
        days_until_failure: 187,
        next_maintenance_date: "2026-09-10",
        recommended_inspections: "WEEKLY",
        estimated_repair_cost_eur: 12500,
        critical_alert: false,
      },
    },
    {
      id: "inventory-forecast",
      name: "Inventory Forecasting",
      method: "POST",
      endpoint: "/api/v1/predict",
      description: "Forecast inventory levels and optimize stock management",
      params: {
        prediction_type: "demand",
        data: {
          current_level: 5000,
          consumption_rate: 200,
          lead_time_days: 7,
          safety_stock: 1000,
        },
      },
      response: {
        current_inventory: 5000,
        daily_consumption: 6.67,
        forecast_days: 14,
        forecasted_level: 4906,
        reorder_point: 1047,
        should_reorder: false,
      },
    },
    {
      id: "co2-emissions",
      name: "CO₂ Emissions Calculation",
      method: "POST",
      endpoint: "/api/v1/calculate",
      description: "Calculate carbon emissions with sustainability scoring",
      params: {
        calculation_type: "CO2_EMISSIONS",
        params: {
          vehicle_type: "ship",
          distance_km: 1500,
          routes: [],
          shipments: [{ weight_kg: 50000 }],
        },
      },
      response: {
        base_emissions_kg: 30,
        weight_adjusted_emissions_kg: 37.5,
        emissions_per_km: 0.025,
        equivalent_trees_needed: 2,
        carbon_offset_cost_eur: 1.88,
        sustainability_score: 87.5,
      },
    },
    {
      id: "fleet-performance",
      name: "Fleet Performance Analysis",
      method: "POST",
      endpoint: "/api/v1/analyze",
      description: "Analyze overall fleet performance metrics and KPIs",
      params: {
        analysis_type: "performance",
        data: {
          vehicles: [],
          routes: [],
          shipments: [],
          time_period_days: 30,
        },
      },
      response: {
        fleet_size: 45,
        active_vehicles: 38,
        utilization_percent: 84,
        average_efficiency_score: 82,
        completed_shipments: 1250,
        on_time_delivery_percent: 94,
        performance_trend: "EXCELLENT",
      },
    },
  ];

  const codeExamples = {
    curl: (endpoint) => `curl -X POST https://api.nexusvectis.com${endpoint.endpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_YOUR_API_KEY" \\
  -d '${JSON.stringify(endpoint.params, null, 2)}'`,
    python: (endpoint) => `import requests

api_key = "sk_live_YOUR_API_KEY"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": api_key
}

data = ${JSON.stringify(endpoint.params, null, 2)}

response = requests.post(
    "https://api.nexusvectis.com${endpoint.endpoint}",
    json=data,
    headers=headers
)

print(response.json())`,
    javascript: (endpoint) => `const apiKey = "sk_live_YOUR_API_KEY";
const data = ${JSON.stringify(endpoint.params, null, 2)};

fetch("https://api.nexusvectis.com${endpoint.endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`,
  };

  const selected = apiEndpoints.find((e) => e.id === selectedExample);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">Fleet AI API Documentation</h1>
          <p className="text-slate-400 text-lg">Advanced logistics calculations and AI-powered optimization endpoints</p>
        </div>

        {/* Quick Start */}
        <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Key className="w-5 h-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Your API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value="sk_live_1234567890abcdefghijk"
                  readOnly
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("sk_live_1234567890abcdefghijk");
                    toast.success("API key copied");
                  }}
                  className="bg-slate-900 border-slate-700 text-cyan-400"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="bg-slate-900 border-slate-700"
                >
                  {showApiKey ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-slate-400">API Version</div>
                <div className="text-lg font-mono text-cyan-400">v1</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-slate-400">Billing</div>
                <div className="text-lg font-mono text-emerald-400">Pay-as-you-go</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-slate-400">Base URL</div>
                <div className="text-lg font-mono text-violet-400">api.nexusvectis.com</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Available Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiEndpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => setSelectedExample(endpoint.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected?.id === endpoint.id
                    ? "bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800/50 border-slate-700 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{endpoint.name}</h3>
                  <span className="px-2 py-1 bg-violet-500/20 rounded text-xs text-violet-400 font-mono">
                    {endpoint.method}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{endpoint.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Endpoint Details */}
        {selected && (
          <Card className="bg-slate-800/50 border-cyan-500/30 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400">{selected.name}</CardTitle>
                  <CardDescription className="text-slate-400">{selected.description}</CardDescription>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 rounded text-sm text-emerald-400 font-mono">
                  {selected.method}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Endpoint</label>
                <code className="block bg-slate-900 p-3 rounded-lg text-cyan-400 font-mono text-sm overflow-x-auto">
                  {selected.endpoint}
                </code>
              </div>

              {/* Code Examples */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Code Examples</label>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="bg-slate-900/50 border-slate-700">
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  </TabsList>
                  {Object.keys(codeExamples).map((lang) => (
                    <TabsContent key={lang} value={lang} className="mt-2">
                      <div className="relative">
                        <pre className="bg-slate-900 p-4 rounded-lg text-slate-300 font-mono text-xs overflow-x-auto max-h-80">
                          {codeExamples[lang](selected)}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(codeExamples[lang](selected));
                            toast.success("Code copied");
                          }}
                          className="absolute top-2 right-2 text-cyan-400 hover:bg-slate-800"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Request/Response */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">Request Body</label>
                  <pre className="bg-slate-900 p-3 rounded-lg text-slate-400 font-mono text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selected.params, null, 2)}
                  </pre>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">Response</label>
                  <pre className="bg-slate-900 p-3 rounded-lg text-slate-400 font-mono text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selected.response, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Handling */}
        <Card className="bg-slate-800/50 border-amber-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              Error Handling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="font-mono text-sm text-red-400 mb-1">400 Bad Request</div>
                <p className="text-sm text-slate-400">Invalid parameters or missing required fields</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="font-mono text-sm text-red-400 mb-1">401 Unauthorized</div>
                <p className="text-sm text-slate-400">Missing or invalid API key</p>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="font-mono text-sm text-red-400 mb-1">500 Server Error</div>
                <p className="text-sm text-slate-400">Internal server error. Our team has been notified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Real-time Calculations", desc: "Instant results for all logistics computations" },
            { icon: TrendingUp, title: "Predictive Analytics", desc: "ML-powered forecasting and optimization" },
            { icon: CheckCircle2, title: "99.9% Uptime", desc: "Enterprise-grade reliability and support" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}