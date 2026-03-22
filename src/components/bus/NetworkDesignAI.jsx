import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, TrendingUp, DollarSign, Leaf, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NetworkDesignAI({ routes, stops, buses }) {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: "High-Frequency Backbone",
      description: "3 main corridors, 5min frequency, feeder routes every 15min",
      coverage: 92,
      transfers: 1.3,
      cost: 2.1,
      co2: 18,
      status: "simulated"
    },
    {
      id: 2,
      name: "Express + Local Grid",
      description: "Express routes with limited stops + comprehensive local network",
      coverage: 88,
      transfers: 1.1,
      cost: 2.4,
      co2: 22,
      status: "simulated"
    },
    {
      id: 3,
      name: "Current Network",
      description: "Existing route structure",
      coverage: 85,
      transfers: 1.8,
      cost: 2.5,
      co2: 25,
      status: "active"
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Network Design AI
          </h3>
          <p className="text-slate-400 mt-1">AI-generated network optimization scenarios</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
          <Zap className="w-4 h-4 mr-2" />
          Generate New Scenario
        </Button>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario, idx) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-2xl p-6 border transition-all ${
              scenario.status === 'active' 
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30' 
                : 'bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-700/50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-bold text-white">{scenario.name}</h4>
                  {scenario.status === 'active' && (
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{scenario.description}</p>
              </div>
              {scenario.status !== 'active' && (
                <Button variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                  Activate
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Coverage</span>
                </div>
                <div className="text-2xl font-bold text-white">{scenario.coverage}%</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Avg Transfers</span>
                </div>
                <div className="text-2xl font-bold text-white">{scenario.transfers}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Cost (M€/year)</span>
                </div>
                <div className="text-2xl font-bold text-white">{scenario.cost}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">CO₂ (kt/year)</span>
                </div>
                <div className="text-2xl font-bold text-white">{scenario.co2}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}