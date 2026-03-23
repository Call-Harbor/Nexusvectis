import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cloud, Zap, Users, Music, Trophy, Play, TrendingUp, AlertTriangle,
  Clock, DollarSign, Leaf, BarChart3, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const scenarioTemplates = [
  {
    type: "storm_weather",
    name: "Storm Weather",
    icon: Cloud,
    color: "cyan",
    description: "Simulate severe weather with 30% speed reduction and 15% cancellations",
    impact: "high"
  },
  {
    type: "metro_breakdown",
    name: "Metro Breakdown",
    icon: Zap,
    color: "amber",
    description: "Metro service disrupted - simulate 40% passenger overflow to bus network",
    impact: "critical"
  },
  {
    type: "strike",
    name: "Driver Strike",
    icon: AlertTriangle,
    color: "rose",
    description: "Partial strike with only 60% driver availability",
    impact: "critical"
  },
  {
    type: "tourist_spike",
    name: "Tourist Season",
    icon: Users,
    color: "violet",
    description: "Summer tourist spike - 40% increase in demand on key routes",
    impact: "medium"
  },
  {
    type: "event_concert",
    name: "Concert Event",
    icon: Music,
    color: "fuchsia",
    description: "Major concert ending at 22:00 - 15,000 attendees dispersing",
    impact: "high"
  },
  {
    type: "event_sports",
    name: "Stadium Event",
    icon: Trophy,
    color: "emerald",
    description: "Football match with 50,000 attendees - concentrated demand spike",
    impact: "high"
  }
];

export default function ScenarioSimulator({ organizationId }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: scenarios = [] } = useQuery({
    queryKey: ['transitScenarios', organizationId],
    queryFn: () => base44.entities.TransitScenario.filter({ organization_id: organizationId }, '-created_at', 10),
    enabled: !!organizationId,
  });

  const runScenarioMutation = useMutation({
    mutationFn: async (scenarioType) => {
      setIsRunning(true);
      
      // Create scenario record
      const scenario = await base44.entities.TransitScenario.create({
        organization_id: organizationId,
        scenario_name: `${scenarioType}_${new Date().toISOString().split('T')[0]}`,
        scenario_type: scenarioType,
        status: 'running',
        parameters: { simulated_at: new Date().toISOString() },
        simulation_results: {}
      });

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate realistic simulation results
      const baselineDelays = 45;
      const baselineCoverage = 92;
      const baselineCost = 180000;
      const baselineCO2 = 380;
      const baselineService = 88;

      const impactMultipliers = {
        storm_weather: { delays: 2.2, coverage: 0.85, cost: 1.15, co2: 1.25, service: 0.75 },
        metro_breakdown: { delays: 2.8, coverage: 0.78, cost: 1.35, co2: 1.45, service: 0.65 },
        strike: { delays: 3.5, coverage: 0.60, cost: 0.75, co2: 0.70, service: 0.50 },
        tourist_spike: { delays: 1.4, coverage: 0.95, cost: 1.20, co2: 1.15, service: 0.82 },
        event_concert: { delays: 1.8, coverage: 0.88, cost: 1.25, co2: 1.20, service: 0.78 },
        event_sports: { delays: 2.1, coverage: 0.82, cost: 1.30, co2: 1.28, service: 0.72 }
      };

      const multiplier = impactMultipliers[scenarioType] || { delays: 1, coverage: 1, cost: 1, co2: 1, service: 1 };

      const results = {
        predicted_delays: Math.round(baselineDelays * multiplier.delays),
        passenger_coverage: parseFloat((baselineCoverage * multiplier.coverage).toFixed(1)),
        operating_cost: Math.round(baselineCost * multiplier.cost),
        co2_impact: Math.round(baselineCO2 * multiplier.co2),
        service_level_score: parseFloat((baselineService * multiplier.service).toFixed(1)),
        trips_affected: Math.floor(Math.random() * 80) + 30,
        passengers_impacted: Math.floor(Math.random() * 15000) + 5000,
        recovery_time_hours: Math.floor(Math.random() * 6) + 2
      };

      // Update with results
      await base44.entities.TransitScenario.update(scenario.id, {
        status: 'completed',
        simulation_results: results,
        run_date: new Date().toISOString()
      });

      setIsRunning(false);
      return { scenario, results };
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      toast.success('Scenario simulation complete');
    },
    onError: () => {
      setIsRunning(false);
      toast.error('Simulation failed');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-amber-400" />
            Scenario Simulator
          </h2>
          <p className="text-slate-400 text-lg">Test network resilience against disruptions and demand spikes</p>
        </div>
      </div>

      {/* Scenario Templates */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarioTemplates.map((template, i) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className={`relative p-6 rounded-2xl bg-gradient-to-br from-${template.color}-500/10 to-${template.color}-500/5 border border-${template.color}-500/30 cursor-pointer overflow-hidden group`}
              onClick={() => setSelectedScenario(template)}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`absolute -top-10 -right-10 w-32 h-32 bg-${template.color}-500/20 rounded-full blur-2xl`}
              />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-xl bg-${template.color}-500/20 border border-${template.color}-500/30`}>
                    <Icon className={`w-7 h-7 text-${template.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{template.name}</h3>
                    <Badge className={`text-xs mt-1 ${
                      template.impact === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                      template.impact === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {template.impact} impact
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{template.description}</p>
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    runScenarioMutation.mutate(template.type);
                  }}
                  disabled={isRunning}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Simulation'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Running Animation */}
      {isRunning && (
        <Card className="p-12 bg-slate-800/50 border-slate-700/50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <BarChart3 className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <p className="text-white font-semibold text-xl mb-2">Running Scenario Simulation...</p>
            <p className="text-slate-400">Analyzing network impact and generating predictions</p>
          </div>
        </Card>
      )}

      {/* Simulation Results */}
      <AnimatePresence>
        {simulationResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <Card className="p-8 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border-cyan-500/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-black text-white flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-cyan-400" />
                  Simulation Results
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-4 py-2 text-base">
                  Scenario: {simulationResult.scenario.scenario_type.replace('_', ' ')}
                </Badge>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-rose-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <p className="text-xs text-slate-400">Predicted Delays</p>
                  </div>
                  <p className="text-3xl font-black text-rose-400">{simulationResult.results.predicted_delays}</p>
                  <p className="text-xs text-slate-500">minutes total</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <p className="text-xs text-slate-400">Coverage</p>
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{simulationResult.results.passenger_coverage}%</p>
                  <p className="text-xs text-slate-500">of demand met</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <p className="text-xs text-slate-400">Operating Cost</p>
                  </div>
                  <p className="text-3xl font-black text-amber-400">€{(simulationResult.results.operating_cost / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-slate-500">per month</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-5 h-5 text-violet-400" />
                    <p className="text-xs text-slate-400">CO₂ Impact</p>
                  </div>
                  <p className="text-3xl font-black text-violet-400">{simulationResult.results.co2_impact.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">kg additional</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <p className="text-xs text-slate-400">Service Level</p>
                  </div>
                  <p className="text-3xl font-black text-cyan-400">{simulationResult.results.service_level_score.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">out of 100</p>
                </div>
              </div>

              {/* Impact Details */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-400 mb-1">Trips Affected</p>
                  <p className="text-2xl font-black text-white">{simulationResult.results.trips_affected}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-400 mb-1">Passengers Impacted</p>
                  <p className="text-2xl font-black text-white">{simulationResult.results.passengers_impacted.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50">
                  <p className="text-xs text-slate-400 mb-1">Recovery Time</p>
                  <p className="text-2xl font-black text-white">{simulationResult.results.recovery_time_hours}h</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Mitigation Plan
                </Button>
                <Button variant="outline" onClick={() => setSimulationResult(null)}>
                  Clear Results
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Scenarios */}
      {scenarios.length > 0 && !simulationResult && (
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Previous Simulations</h3>
          <div className="space-y-2">
            {scenarios.map((scenario, i) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => setSimulationResult({ scenario, results: scenario.simulation_results })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{scenario.scenario_name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(scenario.run_date || scenario.created_date).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={
                    scenario.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }>
                    {scenario.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}