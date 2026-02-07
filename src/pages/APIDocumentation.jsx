import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Key, Zap, BookOpen, Copy, Check, ExternalLink, Shield, Clock, TrendingUp, Activity, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const apiEndpoints = [
  {
    category: "Analytics & KPIs",
    description: "Comprehensive metrics and performance indicators",
    endpoints: [
      {
        name: "Calculate KPIs",
        method: "POST",
        path: "/api/functions/calculateKPIs",
        description: "Get all key performance indicators for your organization",
        params: { organization_id: "string", period: "string (month/week/day)" },
        response: { success: true, kpis: { fleet_utilization: 85.2, on_time_delivery_rate: 92.5, "...": "..." } }
      },
      {
        name: "Fleet Analytics",
        method: "POST",
        path: "/api/functions/getFleetAnalytics",
        description: "Detailed fleet performance and utilization metrics",
        params: { organization_id: "string", transport_type: "string (optional)" },
        response: { success: true, analytics: { total_fleet_size: 150, by_transport_type: {}, "...": "..." } }
      },
      {
        name: "Route Performance",
        method: "POST",
        path: "/api/functions/getRoutePerformance",
        description: "Route efficiency and optimization metrics",
        params: { organization_id: "string" },
        response: { success: true, performance: { total_routes: 85, ai_optimization_rate: 67.5, "...": "..." } }
      },
      {
        name: "Shipment Metrics",
        method: "POST",
        path: "/api/functions/getShipmentMetrics",
        description: "Delivery performance and shipment statistics",
        params: { organization_id: "string" },
        response: { success: true, metrics: { total_shipments: 1250, on_time_rate: 93.2, "...": "..." } }
      },
      {
        name: "Resource Utilization",
        method: "POST",
        path: "/api/functions/getResourceUtilization",
        description: "Warehouse and resource capacity metrics",
        params: { organization_id: "string" },
        response: { success: true, utilization: { total_resources: 25, overall_utilization_rate: 78.3, "...": "..." } }
      },
      {
        name: "Cost Analysis",
        method: "POST",
        path: "/api/functions/getCostAnalysis",
        description: "Financial analysis and cost breakdown",
        params: { organization_id: "string", currency: "string (EUR/USD)" },
        response: { success: true, analysis: { total_costs: { total: "125450.00", "...": "..." }, "...": "..." } }
      }
    ]
  },
  {
    category: "Vehicle Management",
    description: "Track and manage your fleet in real-time",
    endpoints: [
      {
        name: "Track Vehicle",
        method: "POST",
        path: "/api/functions/trackVehicle",
        description: "Get real-time position and status of a vehicle",
        params: { vehicle_id: "string", organization_id: "string (optional)" },
        response: { success: true, vehicle: { id: "...", position: { latitude: 55.6761, longitude: 12.5683 }, "...": "..." } }
      },
      {
        name: "Batch Update Vehicles",
        method: "POST",
        path: "/api/functions/batchUpdateVehicles",
        description: "Update multiple vehicles in a single request",
        params: { vehicles: [{ id: "string", latitude: "number", longitude: "number", "...": "..." }] },
        response: { success: true, total: 10, succeeded: 9, failed: 1, results: {} }
      },
      {
        name: "Assign Vehicle to Route",
        method: "POST",
        path: "/api/functions/assignVehicleToRoute",
        description: "Assign a vehicle to a specific route",
        params: { vehicle_id: "string", route_id: "string", driver_name: "string (optional)" },
        response: { success: true, assignment: { vehicle: {}, route: {}, eta: "..." } }
      }
    ]
  },
  {
    category: "Shipment Operations",
    description: "Create, track and manage shipments",
    endpoints: [
      {
        name: "Create Shipment",
        method: "POST",
        path: "/api/functions/createShipment",
        description: "Create a new shipment",
        params: { origin: "string", destination: "string", cargo_type: "string", weight_kg: "number", "...": "..." },
        response: { success: true, shipment: { id: "...", tracking_number: "TRK123456", status: "pending" } }
      },
      {
        name: "Update Shipment",
        method: "POST",
        path: "/api/functions/updateShipment",
        description: "Update shipment status or details",
        params: { shipment_id: "string OR tracking_number", status: "string", "...": "..." },
        response: { success: true, shipment: { id: "...", status: "in_transit", "...": "..." } }
      },
      {
        name: "Track Shipment",
        method: "POST",
        path: "/api/functions/trackShipment",
        description: "Track shipment by tracking number",
        params: { tracking_number: "string" },
        response: { success: true, tracking: { status: "in_transit", vehicle: {}, eta: "...", "...": "..." } }
      }
    ]
  },
  {
    category: "Route Optimization",
    description: "AI-powered route planning and optimization",
    endpoints: [
      {
        name: "Optimize Route",
        method: "POST",
        path: "/api/functions/optimizeRoute",
        description: "Get AI-optimized route with real-time conditions",
        params: { origin: "string", destination: "string", transport_type: "truck/ship/train/aircraft/drone" },
        response: { success: true, route: { waypoints: [], distance_km: 450, estimated_duration_hours: 5.5, "...": "..." } }
      }
    ]
  },
  {
    category: "Alerts & Monitoring",
    description: "Real-time alerts and notifications",
    endpoints: [
      {
        name: "Get Alerts",
        method: "POST",
        path: "/api/functions/getAlerts",
        description: "Retrieve alerts with optional filters",
        params: { type: "info/warning/critical (optional)", is_resolved: "boolean (optional)", limit: "number" },
        response: { success: true, count: 15, alerts: [{ id: "...", title: "...", type: "critical", "...": "..." }] }
      },
      {
        name: "Create Alert",
        method: "POST",
        path: "/api/functions/createAlert",
        description: "Create a new alert",
        params: { title: "string", message: "string", type: "info/warning/critical", category: "string" },
        response: { success: true, alert: { id: "...", title: "...", created_date: "..." } }
      }
    ]
  },
  {
    category: "Data Export",
    description: "Export data in various formats",
    endpoints: [
      {
        name: "Export Data",
        method: "POST",
        path: "/api/functions/exportData",
        description: "Export entity data in JSON or CSV format",
        params: { entity_type: "Vehicle/Route/Shipment/Alert/...", format: "json/csv", filters: {} },
        response: { success: true, count: 100, data: "Array of entities" }
      }
    ]
  }
];

const codeExamples = {
  curl: `curl -X POST https://your-app.base44.com/api/functions/trackVehicle \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vehicle_id": "veh_123456",
    "organization_id": "org_abc"
  }'`,
  javascript: `const response = await fetch('https://your-app.base44.com/api/functions/trackVehicle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vehicle_id: 'veh_123456',
    organization_id: 'org_abc'
  })
});

const data = await response.json();
console.log(data);`,
  python: `import requests

url = 'https://your-app.base44.com/api/functions/trackVehicle'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
payload = {
    'vehicle_id': 'veh_123456',
    'organization_id': 'org_abc'
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(data)`,
  node: `const axios = require('axios');

const trackVehicle = async () => {
  try {
    const response = await axios.post(
      'https://your-app.base44.com/api/functions/trackVehicle',
      {
        vehicle_id: 'veh_123456',
        organization_id: 'org_abc'
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

trackVehicle();`
};

export default function APIDocumentation() {
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [revealedKeys, setRevealedKeys] = useState({});
  
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const userData = await base44.entities.User.filter({ email: user.email });
      if (!userData?.[0]?.organization_id) return [];
      return await base44.entities.APIKey.filter({ organization_id: userData[0].organization_id });
    }
  });

  // Fetch usage stats
  const { data: usageStats, isLoading: statsLoading } = useQuery({
    queryKey: ['api-usage-stats'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAPIUsageStats', {});
      return response.data;
    }
  });

  // Generate API key
  const generateKeyMutation = useMutation({
    mutationFn: async (name) => {
      const response = await base44.functions.invoke('generateAPIKey', { name });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedKey(data);
      queryClient.invalidateQueries(['api-keys']);
      setNewKeyName("");
      toast.success("API key generated successfully");
    }
  });

  // Revoke API key
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await base44.entities.APIKey.update(keyId, { status: 'revoked' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['api-keys']);
      toast.success("API key revoked");
    }
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Code2 className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">API Documentation</h1>
              <p className="text-slate-400 mt-2 text-lg">Complete REST API reference for NexusVectis TMS</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">16</div>
                    <div className="text-sm text-slate-400">Endpoints</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">OAuth 2.0</div>
                    <div className="text-sm text-slate-400">Secure Auth</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-violet-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">Real-time</div>
                    <div className="text-sm text-slate-400">Live Data</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-amber-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">JSON</div>
                    <div className="text-sm text-slate-400">REST API</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* API Key Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    API Keys
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your API authentication keys
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowNewKeyDialog(true)}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {keysLoading ? (
                <div className="text-slate-400 text-center py-4">Loading keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-slate-400 text-center py-8">
                  No API keys yet. Generate your first key to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold">{key.name}</h4>
                          <Badge className={key.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                            {key.status}
                          </Badge>
                        </div>
                        <code className="text-sm text-slate-400">{key.key_prefix}••••••••••••••••••••</code>
                        {key.last_used && (
                          <p className="text-xs text-slate-500 mt-1">Last used: {new Date(key.last_used).toLocaleString()}</p>
                        )}
                      </div>
                      {key.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => revokeKeyMutation.mutate(key.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Generate Key Dialog */}
              {showNewKeyDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">Generate New API Key</h3>
                    {!generatedKey ? (
                      <>
                        <input
                          type="text"
                          placeholder="Key name (e.g., Production API)"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white mb-4"
                        />
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowNewKeyDialog(false);
                              setNewKeyName("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => generateKeyMutation.mutate(newKeyName)}
                            disabled={!newKeyName || generateKeyMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500"
                          >
                            Generate
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                          <p className="text-amber-400 text-sm mb-2">⚠️ Save this key securely - it won't be shown again!</p>
                          <div className="bg-slate-950 p-3 rounded-lg flex items-center justify-between">
                            <code className="text-emerald-400 text-sm break-all">{generatedKey.api_key}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedKey.api_key);
                                toast.success("API key copied!");
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setGeneratedKey(null);
                            setShowNewKeyDialog(false);
                          }}
                          className="w-full"
                        >
                          Done
                        </Button>
                      </>
                    )}
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Statistics */}
        {usageStats?.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  API Usage Statistics
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Monitor your API usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-1">Total Calls</div>
                    <div className="text-2xl font-bold text-white">{usageStats.stats.total_calls.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-1">Error Rate</div>
                    <div className="text-2xl font-bold text-white">{usageStats.stats.error_rate}%</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-1">Avg Response</div>
                    <div className="text-2xl font-bold text-white">{usageStats.stats.avg_response_time_ms}ms</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-1">Errors</div>
                    <div className="text-2xl font-bold text-white">{usageStats.stats.error_count}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Top Endpoints</h4>
                  <div className="space-y-2">
                    {usageStats.stats.top_endpoints.map((endpoint, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                        <code className="text-sm text-slate-400">{endpoint.endpoint}</code>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {endpoint.count} calls
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Getting Started
              </CardTitle>
              <CardDescription className="text-slate-400">
                Authentication and base URL configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Base URL</h3>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                  <code className="text-cyan-400">https://your-app.base44.com</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('https://your-app.base44.com', 'base-url')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'base-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Authentication</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Include your API key in the Authorization header of every request:
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <code className="text-emerald-400">Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-1">Get Your API Key</h4>
                    <p className="text-slate-300 text-sm">
                      Navigate to Dashboard → Settings → API Keys to generate your authentication token.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Quick Start Examples</CardTitle>
              <CardDescription className="text-slate-400">
                Example requests in different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="bg-slate-900/50 border border-slate-700/50">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-700/50">
                        <code className="text-sm text-slate-300">{code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code, `code-${lang}`)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                      >
                        {copiedCode === `code-${lang}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">API Endpoints</h2>
          
          {apiEndpoints.map((category, catIndex) => (
            <Card key={catIndex} className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">{category.category}</CardTitle>
                <CardDescription className="text-slate-400">{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.endpoints.map((endpoint, endIndex) => (
                  <div
                    key={endIndex}
                    className="border border-slate-700/50 rounded-lg p-4 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`
                          ${endpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}
                          ${endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                          ${endpoint.method === 'PUT' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}
                          ${endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                        `}>
                          {endpoint.method}
                        </Badge>
                        <h3 className="text-white font-semibold">{endpoint.name}</h3>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEndpoint(selectedEndpoint === `${catIndex}-${endIndex}` ? null : `${catIndex}-${endIndex}`)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {selectedEndpoint === `${catIndex}-${endIndex}` ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                    
                    <div className="mb-3">
                      <code className="text-sm text-slate-400 bg-slate-950 px-3 py-1.5 rounded">
                        {endpoint.path}
                      </code>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-3">{endpoint.description}</p>

                    {selectedEndpoint === `${catIndex}-${endIndex}` && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 mt-4 pt-4 border-t border-slate-700/50"
                      >
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Parameters</h4>
                          <div className="bg-slate-950 p-3 rounded-lg">
                            <pre className="text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(endpoint.params, null, 2)}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">Response Example</h4>
                          <div className="bg-slate-950 p-3 rounded-lg">
                            <pre className="text-xs text-slate-300 overflow-x-auto">
                              {JSON.stringify(endpoint.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Rate Limits & Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid md:grid-cols-2 gap-6"
        >
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300">
              <div className="flex justify-between">
                <span>Standard API calls:</span>
                <span className="text-white font-semibold">1000 req/hour</span>
              </div>
              <div className="flex justify-between">
                <span>Batch operations:</span>
                <span className="text-white font-semibold">100 req/hour</span>
              </div>
              <div className="flex justify-between">
                <span>Real-time tracking:</span>
                <span className="text-white font-semibold">5000 req/hour</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Error Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-300 text-sm">
              <div><span className="text-emerald-400 font-mono">200</span> - Success</div>
              <div><span className="text-amber-400 font-mono">400</span> - Bad Request</div>
              <div><span className="text-red-400 font-mono">401</span> - Unauthorized</div>
              <div><span className="text-red-400 font-mono">404</span> - Not Found</div>
              <div><span className="text-red-400 font-mono">429</span> - Rate Limit Exceeded</div>
              <div><span className="text-red-400 font-mono">500</span> - Server Error</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Need Help?</h3>
                  <p className="text-slate-400">Contact our developer support team for assistance</p>
                </div>
                <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}