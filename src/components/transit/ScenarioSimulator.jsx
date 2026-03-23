import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Cloud, Zap, Users, Music, Trophy, Play, TrendingUp, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const scenarioTemplates = [
  {
    type: "storm_weather",
    name: "Storm Weather",
    icon: Cloud,
    color: "cyan",
    description: "Simulate severe weather impact on operations"
  },
  {
    type: "metro_breakdown",
    name: "Metro Breakdown",
    icon: Zap,
    color: "amber",
    description: "Simulate metro service disruption and passenger overflow"
  },
  {
    type: "strike",
    name: "Driver Strike",
    icon: AlertTriangle,
    color: "rose",
    description: "Simulate partial driver availability"
  },
  {
    type: "tourist_spike",
    name: "Tourist Spike",
    icon: Users,
    color: "violet",
    description: "Simulate 40% increase in tourist demand"
  },
  {
    type: "event_concert",
    name: "Concert Event",
    icon: Music,
    color: "fuchsia",
    description: "Simulate major concert ending at 22:00"
  },
  {
    type: "event_sports",
    name: "Sports Event",
    icon: Trophy,
    color: "emerald",
    description: "Simulate stadium event with 50,000 attendees"
  }
];

export default function ScenarioSimulator({ organizationId }) {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);

  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioType) => {
      const scenario = await base44.entities.TransitScenario.create({
        organization_id: organizationId,
        scenario_name: `${scenarioType}_${Date.now()}`,
        scenario_type: scenarioType,
        status: 'running',
        parameters: {},
        simulation_results: {}
      });

      // Simulate results (in real implementation, this would call AI simulation)
      const results = {
        predicted_delays: Math.floor(Math.random() * 60) + 10,
        passenger_coverage: 85 + Math.random() * 10,
        operating_cost: 50000 + Math.random() * 20000,
        co2_impact: Math.random() * 500,
        service_level_score: 70 + Math.random() * 20
      };

      await base44.entities.TransitScenario.update(scenario.id, {
        status: 'completed',
        simulation_results: results
      });

      return { scenario, results };
    },
    onSuccess: (data) => {
      setSimulationResult(data);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Scenario Simulator</h2>
        <p className="text-slate-400">Test your network against disruptions and events</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarioTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.type}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`p-6 rounded-2xl bg-${template.color}-500/10 border border-${template.color}-500/30 cursor-pointer`}
              onClick={() => setSelectedScenario(template)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-xl bg-${template.color}-500/20`}>
                  <Icon className={`w-6 h-6 text-${template.color}-400`} />
                </div>
                <h3 className="text-white font-bold">{template.name}</h3>
              </div>
              <p className="text-sm text-slate-400">{template.description}</p>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  createScenarioMutation.mutate(template.type);
                }}
                disabled={createScenarioMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Run Simulation
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              Simulation Results
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Predicted Delays</p>
                <p className="text-3xl font-black text-white">{simulationResult.results.predicted_delays}</p>
                <p className="text-xs text-slate-500">minutes total</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Passenger Coverage</p>
                <p className="text-3xl font-black text-emerald-400">{simulationResult.results.passenger_coverage.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Operating Cost</p>
                <p className="text-3xl font-black text-white">€{(simulationResult.results.operating_cost / 1000).toFixed(0)}k</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">CO₂ Impact</p>
                <p className="text-3xl font-black text-white">{simulationResult.results.co2_impact.toFixed(0)}</p>
                <p className="text-xs text-slate-500">kg additional</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Service Level</p>
                <p className="text-3xl font-black text-cyan-400">{simulationResult.results.service_level_score.toFixed(0)}</p>
                <p className="text-xs text-slate-500">out of 100</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}