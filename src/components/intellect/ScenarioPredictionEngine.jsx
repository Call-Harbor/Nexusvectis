import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp, AlertTriangle, Zap, Target, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export const ScenarioPredictionEngine = {
  // Generate multiple future scenarios based on current fleet state
  generateScenarios: (fleetData, commandContext) => {
    const baselineScenario = generateBaseline(fleetData);
    const optimizedScenario = generateOptimized(fleetData);
    const riskScenario = generateRisk(fleetData);
    const hybridScenario = generateHybrid(fleetData);

    return [
      { ...baselineScenario, name: 'Baseline', confidence: 85, color: '#64748b' },
      { ...optimizedScenario, name: 'Optimized', confidence: 78, color: '#06b6d4' },
      { ...riskScenario, name: 'Risk Scenario', confidence: 72, color: '#ef4444' },
      { ...hybridScenario, name: 'Hybrid Smart', confidence: 88, color: '#10b981' }
    ];
  },

  // Score scenarios by impact and probability
  scoreScenarios: (scenarios, fleet) => {
    return scenarios.map(scenario => ({
      ...scenario,
      impact_score: calculateImpact(scenario, fleet),
      probability: calculateProbability(scenario, fleet),
      roi_estimate: calculateROI(scenario),
      risk_level: assessRisk(scenario)
    }));
  },

  // Generate detailed recommendations from scenario analysis
  getRecommendations: (scenarios) => {
    const topScenario = scenarios.sort((a, b) => (b.confidence + b.impact_score) - (a.confidence + a.impact_score))[0];
    
    return {
      primary: topScenario,
      alternatives: scenarios.slice(1, 3),
      actionSteps: generateActionSteps(topScenario),
      expectedOutcome: generateOutcome(topScenario),
      timeToImplement: estimateImplementationTime(topScenario)
    };
  }
};

// Scenario generators
function generateBaseline(fleetData) {
  const { vehicles, shipments, routes } = fleetData;
  const timeline = generateTimeline(14);
  
  return {
    timeline,
    cost_reduction: 8,
    efficiency_gain: 5,
    delivery_improvement: 3,
    resource_utilization: vehicles.length,
    alerts_prevented: Math.floor(shipments.length * 0.15),
    metrics: {
      fuel_cost: calculateFuelCost(vehicles, 'baseline'),
      on_time_delivery: 92,
      vehicle_utilization: 68,
      carbon_footprint: vehicles.length * 2.3
    }
  };
}

function generateOptimized(fleetData) {
  const { vehicles, shipments, routes } = fleetData;
  const timeline = generateTimeline(14);
  
  return {
    timeline,
    cost_reduction: 22,
    efficiency_gain: 18,
    delivery_improvement: 9,
    resource_utilization: Math.ceil(vehicles.length * 0.92),
    alerts_prevented: Math.floor(shipments.length * 0.35),
    metrics: {
      fuel_cost: calculateFuelCost(vehicles, 'optimized'),
      on_time_delivery: 96.5,
      vehicle_utilization: 84,
      carbon_footprint: vehicles.length * 1.7
    }
  };
}

function generateRisk(fleetData) {
  const { vehicles, shipments } = fleetData;
  const timeline = generateTimeline(14);
  
  return {
    timeline,
    cost_reduction: -5,
    efficiency_gain: -8,
    delivery_improvement: -6,
    resource_utilization: Math.floor(vehicles.length * 0.65),
    alerts_prevented: 0,
    risk_factors: ['Weather delays', 'Driver shortage', 'Equipment failure'],
    metrics: {
      fuel_cost: calculateFuelCost(vehicles, 'risk'),
      on_time_delivery: 85,
      vehicle_utilization: 52,
      carbon_footprint: vehicles.length * 3.1
    }
  };
}

function generateHybrid(fleetData) {
  const { vehicles, shipments } = fleetData;
  const timeline = generateTimeline(14);
  
  return {
    timeline,
    cost_reduction: 18,
    efficiency_gain: 14,
    delivery_improvement: 7,
    resource_utilization: Math.ceil(vehicles.length * 0.88),
    alerts_prevented: Math.floor(shipments.length * 0.28),
    metrics: {
      fuel_cost: calculateFuelCost(vehicles, 'hybrid'),
      on_time_delivery: 94.8,
      vehicle_utilization: 80,
      carbon_footprint: vehicles.length * 1.9
    }
  };
}

function generateTimeline(days) {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    data.push({
      day: date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
      efficiency: 60 + Math.random() * 35,
      cost_saved: i * (Math.random() * 500 + 200),
      deliveries_on_time: 88 + Math.random() * 8
    });
  }
  
  return data;
}

function calculateFuelCost(vehicles, scenario) {
  const baseCost = vehicles.length * 500;
  const scenarios = {
    baseline: baseCost * 0.95,
    optimized: baseCost * 0.65,
    risk: baseCost * 1.15,
    hybrid: baseCost * 0.75
  };
  return Math.round(scenarios[scenario] || baseCost);
}

function calculateImpact(scenario, fleet) {
  return Math.round((scenario.cost_reduction * 0.4 + scenario.efficiency_gain * 0.3 + scenario.delivery_improvement * 0.3));
}

function calculateProbability(scenario, fleet) {
  const baseProb = Math.random() * 20 + 70;
  return Math.round(baseProb);
}

function calculateROI(scenario) {
  return Math.round((scenario.cost_reduction * 1000 + scenario.efficiency_gain * 500) / 10000 * 100) / 100;
}

function assessRisk(scenario) {
  if (scenario.cost_reduction < 0) return 'HIGH';
  if (scenario.efficiency_gain < 5) return 'MEDIUM';
  return 'LOW';
}

function generateActionSteps(scenario) {
  const steps = [
    `Analyze ${scenario.name} scenario metrics`,
    'Configure route optimization parameters',
    'Allocate resources based on forecast',
    'Set up real-time monitoring',
    'Execute gradual implementation'
  ];
  
  if (scenario.name === 'Optimized' || scenario.name === 'Hybrid Smart') {
    steps.push('Deploy AI driver assistance');
  }
  
  return steps;
}

function generateOutcome(scenario) {
  return {
    cost_savings: scenario.cost_reduction + '%',
    efficiency_improvement: scenario.efficiency_gain + '%',
    on_time_delivery: scenario.metrics.on_time_delivery + '%',
    carbon_reduction: Math.round((1 - scenario.metrics.carbon_footprint / 2.3) * 100) + '%'
  };
}

function estimateImplementationTime(scenario) {
  const base = 7; // days
  const adjustments = {
    'Baseline': 0,
    'Optimized': 14,
    'Risk Scenario': 3,
    'Hybrid Smart': 10
  };
  
  return base + (adjustments[scenario.name] || 0);
}

// Visualization Component
export function ScenarioVisualization({ scenarios }) {
  return (
    <div className="space-y-6">
      {/* Timeline Comparison */}
      <motion.div 
        className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">14-Day Performance Forecast</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={scenarios[1]?.timeline || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Legend />
            <Area type="monotone" dataKey="efficiency" fill="#06b6d4" stroke="#0891b2" fillOpacity={0.2} />
            <Line type="monotone" dataKey="cost_saved" stroke="#10b981" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario, idx) => (
          <motion.div
            key={idx}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-all"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-white">{scenario.name}</h4>
              <span className="text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded">{scenario.confidence}%</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Cost Reduction:</span>
                <span className={scenario.cost_reduction > 0 ? 'text-green-400' : 'text-red-400'}>
                  {scenario.cost_reduction > 0 ? '+' : ''}{scenario.cost_reduction}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efficiency Gain:</span>
                <span className={scenario.efficiency_gain > 0 ? 'text-blue-400' : 'text-red-400'}>
                  {scenario.efficiency_gain > 0 ? '+' : ''}{scenario.efficiency_gain}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">On-Time Delivery:</span>
                <span className="text-cyan-400">{scenario.metrics.on_time_delivery}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Carbon Reduction:</span>
                <span className="text-green-400">
                  {Math.round((1 - scenario.metrics.carbon_footprint / 2.3) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ScenarioPredictionEngine;