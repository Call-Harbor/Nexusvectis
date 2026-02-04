import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Box, Zap, Activity, GitBranch, Play, 
  Pause, Settings, Mail, FileText, Bell, CheckCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function WarehouseAutomation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeWorkflows, setActiveWorkflows] = useState({
    email_notifications: true,
    customs_processing: true,
    inventory_alerts: false,
    shipment_tracking: true
  });
  const [workflowLogs, setWorkflowLogs] = useState([]);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list(),
  });

  const roboticUnits = resources.length * 2; // Simulate AMR/cobots per warehouse
  const activeUnits = Math.round(roboticUnits * 0.85);

  const runSimulation = useMutation({
    mutationFn: async () => {
      // Gather real warehouse data
      const utilizationPercent = (activeUnits / roboticUnits) * 100;
      
      const warehouseSummary = resources.map(r => {
        const usage = (r.current_level / r.capacity) * 100;
        return `- ${r.name}: ${r.current_level}/${r.capacity} units (${usage.toFixed(0)}% capacity)`;
      }).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate warehouse automation digital twin based on REAL data:

WAREHOUSE FACILITIES:
${warehouseSummary}

ROBOTIC FLEET:
- Total AMR/Cobot units: ${roboticUnits}
- Active units: ${activeUnits}
- Current utilization: ${utilizationPercent.toFixed(1)}%

Based on this REAL data, generate simulation results:
1. Workflow optimization scenarios (picking, packing, sorting) - consider actual capacity levels
2. Bottleneck identification - flag warehouses above 90% or below 30% capacity
3. Robot fleet coordination - recommend robot allocation per facility
4. ROI analysis for automation expansion (€45k per robot, €28k annual savings per robot)

Provide realistic recommendations based on actual warehouse utilization.`,
        response_json_schema: {
          type: "object",
          properties: {
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  current_throughput: { type: "number" },
                  optimized_throughput: { type: "number" },
                  improvement_percent: { type: "number" }
                }
              }
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  issue: { type: "string" },
                  severity: { type: "string" },
                  solution: { type: "string" }
                }
              }
            },
            fleet_coordination: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  zone: { type: "string" },
                  current_robots: { type: "number" },
                  recommended_robots: { type: "number" },
                  efficiency_gain: { type: "number" }
                }
              }
            },
            roi_analysis: {
              type: "object",
              properties: {
                initial_investment: { type: "number" },
                annual_savings: { type: "number" },
                payback_period_months: { type: "number" },
                five_year_roi: { type: "number" }
              }
            }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      setIsSimulating(false);
    }
  });

  const handleSimulate = () => {
    setIsSimulating(true);
    runSimulation.mutate();
  };

  const executeWorkflow = useMutation({
    mutationFn: async ({ workflow_type, data }) => {
      const response = await base44.functions.invoke('workflowAutomation', {
        workflow_type,
        data
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const log = {
        id: Date.now(),
        workflow: variables.workflow_type,
        timestamp: new Date().toISOString(),
        result: data
      };
      setWorkflowLogs(prev => [log, ...prev].slice(0, 10));
      toast.success(`Workflow executed: ${variables.workflow_type}`);
    },
    onError: (error) => {
      toast.error(`Workflow failed: ${error.message}`);
    }
  });

  const toggleWorkflow = (workflow) => {
    const newState = !activeWorkflows[workflow];
    setActiveWorkflows(prev => ({
      ...prev,
      [workflow]: newState
    }));
    
    if (newState) {
      toast.success(`${workflow.replace(/_/g, ' ')} activated`);
    } else {
      toast.info(`${workflow.replace(/_/g, ' ')} deactivated`);
    }
  };

  const testWorkflow = async (workflowId) => {
    const sampleShipment = shipments[0];
    
    switch (workflowId) {
      case 'email_notifications':
        if (sampleShipment) {
          executeWorkflow.mutate({
            workflow_type: 'email_notifications',
            data: { shipment_id: sampleShipment.id }
          });
        } else {
          toast.error('No shipments available for test');
        }
        break;
      
      case 'customs_processing':
        if (sampleShipment) {
          executeWorkflow.mutate({
            workflow_type: 'customs_processing',
            data: { shipment_id: sampleShipment.id }
          });
        } else {
          toast.error('No shipments available for test');
        }
        break;
      
      case 'inventory_alerts':
        executeWorkflow.mutate({
          workflow_type: 'inventory_alerts',
          data: {}
        });
        break;
      
      case 'shipment_tracking':
        if (sampleShipment) {
          executeWorkflow.mutate({
            workflow_type: 'shipment_tracking',
            data: { shipment_id: sampleShipment.id }
          });
        } else {
          toast.error('No shipments available for test');
        }
        break;
    }
  };

  // Auto-execute active workflows periodically
  useEffect(() => {
    if (!activeWorkflows.inventory_alerts) return;
    
    const interval = setInterval(() => {
      executeWorkflow.mutate({
        workflow_type: 'inventory_alerts',
        data: {}
      });
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [activeWorkflows.inventory_alerts]);

  const workflowConfigs = [
    { id: 'email_notifications', name: 'Email Notifications', icon: Mail, description: 'Automated shipment status emails' },
    { id: 'customs_processing', name: 'Customs Processing', icon: FileText, description: 'Auto-generate customs documents' },
    { id: 'inventory_alerts', name: 'Inventory Alerts', icon: Bell, description: 'Low stock notifications' },
    { id: 'shipment_tracking', name: 'Shipment Tracking', icon: Activity, description: 'Real-time tracking updates' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Warehouse Automation
              </h1>
              <p className="text-slate-400">AMR/Cobot control, digital twins & workflow automation</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-slate-900/50 border border-cyan-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-slate-400">Robotic Units</span>
            </div>
            <p className="text-3xl font-bold text-white">{roboticUnits}</p>
            <p className="text-xs text-cyan-400 mt-1">AMR/Cobots deployed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Active Units</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeUnits}</p>
            <p className="text-xs text-emerald-400 mt-1">{((activeUnits / roboticUnits) * 100).toFixed(1)}% utilization</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-slate-900/50 border border-violet-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Box className="w-5 h-5 text-violet-400" />
              <span className="text-sm text-slate-400">Warehouses</span>
            </div>
            <p className="text-3xl font-bold text-white">{resources.length}</p>
            <p className="text-xs text-violet-400 mt-1">Automated facilities</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-slate-900/50 border border-amber-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">Active Workflows</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {Object.values(activeWorkflows).filter(Boolean).length}
            </p>
            <p className="text-xs text-amber-400 mt-1">Automation bots running</p>
          </motion.div>
        </div>

        <Tabs defaultValue="digital-twin" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-700/50">
            <TabsTrigger value="digital-twin">Digital Twin Simulation</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Automation</TabsTrigger>
            <TabsTrigger value="fleet">Robot Fleet Control</TabsTrigger>
          </TabsList>

          <TabsContent value="digital-twin" className="space-y-6">
            {!simulationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <GitBranch className="w-16 h-16 mx-auto mb-4 text-cyan-400 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">Run Digital Twin Simulation</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Test different warehouse flow scenarios, identify bottlenecks, and optimize robot coordination
                </p>
                <Button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isSimulating ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Simulation
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Optimization Scenarios</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleSimulate} disabled={isSimulating}>
                        Re-run
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {simulationResult.scenarios?.map((scenario, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{scenario.name}</span>
                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              +{scenario.improvement_percent}% throughput
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">{scenario.description}</p>
                          <div className="flex gap-4 text-xs">
                            <div>
                              <span className="text-slate-500">Current:</span>{' '}
                              <span className="text-slate-300">{scenario.current_throughput} units/hr</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Optimized:</span>{' '}
                              <span className="text-emerald-400">{scenario.optimized_throughput} units/hr</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Bottlenecks Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {simulationResult.bottlenecks?.map((bottleneck, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{bottleneck.location}</span>
                              <Badge 
                                variant="outline" 
                                className={
                                  bottleneck.severity === 'high' 
                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                }
                              >
                                {bottleneck.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-1">{bottleneck.issue}</p>
                            <p className="text-xs text-emerald-400">→ {bottleneck.solution}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Fleet Coordination</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {simulationResult.fleet_coordination?.map((zone, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{zone.zone}</span>
                              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                +{zone.efficiency_gain}% efficiency
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-300">
                              {zone.current_robots} robots → {zone.recommended_robots} robots
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border-emerald-500/30">
                  <CardHeader>
                    <CardTitle className="text-white">ROI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          €{simulationResult.roi_analysis?.initial_investment || 0}k
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Initial Investment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          €{simulationResult.roi_analysis?.annual_savings || 0}k
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Annual Savings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-400">
                          {simulationResult.roi_analysis?.payback_period_months || 0}mo
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Payback Period</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-violet-400">
                          {simulationResult.roi_analysis?.five_year_roi || 0}%
                        </div>
                        <div className="text-xs text-slate-400 mt-1">5-Year ROI</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Automated Workflow Bots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflowConfigs.map((workflow) => {
                      const Icon = workflow.icon;
                      const isActive = activeWorkflows[workflow.id];
                      
                      return (
                        <div 
                          key={workflow.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isActive 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : 'bg-slate-800/30 border-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isActive ? 'bg-emerald-500/20' : 'bg-slate-700/30'
                              }`}>
                                <Icon className={`w-5 h-5 ${
                                  isActive ? 'text-emerald-400' : 'text-slate-400'
                                }`} />
                              </div>
                              <div>
                                <div className="font-medium text-white">{workflow.name}</div>
                                <div className="text-sm text-slate-400">{workflow.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isActive && (
                                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => toggleWorkflow(workflow.id)}
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => testWorkflow(workflow.id)}
                            disabled={executeWorkflow.isPending}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Test Workflow
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Workflow Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {workflowLogs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          No workflow activity yet
                        </div>
                      ) : (
                        workflowLogs.map((log) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white text-sm">
                                {log.workflow.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-400">
                              {log.result.message || 'Completed successfully'}
                            </div>
                            {log.result.alerts_created && (
                              <div className="text-xs text-slate-400 mt-1">
                                Alerts created: {log.result.alerts_created}
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Robot Fleet Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((resource, idx) => {
                    const localRobots = 2;
                    const activeLocal = Math.round(localRobots * 0.9);
                    
                    return (
                      <div key={resource.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium text-white">{resource.name}</div>
                            <div className="text-sm text-slate-400">{resource.location}</div>
                          </div>
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {activeLocal}/{localRobots} units
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Play className="w-3 h-3 mr-1" />
                            Start All
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Pause className="w-3 h-3 mr-1" />
                            Pause All
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}