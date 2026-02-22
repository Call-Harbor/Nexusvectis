import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export const IntelligentCommandAgent = {
  // Parse natural language commands and execute with AI
  executeCommand: async (command, fleetData) => {
    const parsed = parseCommand(command);
    const execution = await executeAction(parsed, fleetData);
    
    return {
      parsed,
      execution,
      impact_estimate: estimateImpact(parsed, execution),
      confidence: calculateConfidence(parsed, execution)
    };
  },

  // Suggest next actions based on fleet state
  suggestActions: (fleetData, analysis) => {
    const suggestions = [];

    // Based on fleet status
    if (fleetData.vehicles?.some(v => v.status === 'maintenance')) {
      suggestions.push({
        action: 'Schedule preventive maintenance',
        priority: 'high',
        estimated_time: '2 hours',
        savings: '€2,500'
      });
    }

    // Based on alerts
    if (fleetData.alerts?.length > 0) {
      suggestions.push({
        action: 'Address critical alerts',
        priority: 'critical',
        count: fleetData.alerts.length,
        savings: '€5,000+'
      });
    }

    // Based on analysis
    if (analysis?.anomalies?.anomalies_found > 0) {
      suggestions.push({
        action: 'Optimize anomalous routes',
        priority: 'high',
        improvement: '18%',
        savings: '€1,200'
      });
    }

    return suggestions;
  },

  // Generate command templates for common operations
  getCommandTemplates: () => [
    {
      command: 'Optimize all routes for cost',
      description: 'Minimize fuel consumption',
      icon: 'zap'
    },
    {
      command: 'Schedule maintenance for fleet',
      description: 'Preventive maintenance planning',
      icon: 'wrench'
    },
    {
      command: 'Maximize delivery efficiency',
      description: 'Improve on-time delivery rate',
      icon: 'trending-up'
    },
    {
      command: 'Reduce carbon emissions',
      description: 'Environmental optimization',
      icon: 'leaf'
    },
    {
      command: 'Balance resource allocation',
      description: 'Optimal asset distribution',
      icon: 'balance'
    }
  ]
};

function parseCommand(command) {
  const commandLower = command.toLowerCase();
  
  let intent = 'unknown';
  let targets = [];
  let parameters = {};

  if (commandLower.includes('optimize')) {
    intent = 'optimize';
    if (commandLower.includes('route')) targets.push('routes');
    if (commandLower.includes('cost')) parameters.metric = 'cost';
    if (commandLower.includes('time')) parameters.metric = 'time';
  } else if (commandLower.includes('schedule')) {
    intent = 'schedule';
    if (commandLower.includes('maintenance')) targets.push('maintenance');
  } else if (commandLower.includes('maximize')) {
    intent = 'maximize';
    if (commandLower.includes('delivery')) targets.push('delivery');
    if (commandLower.includes('efficiency')) parameters.metric = 'efficiency';
  } else if (commandLower.includes('reduce')) {
    intent = 'reduce';
    if (commandLower.includes('carbon')) targets.push('emissions');
    if (commandLower.includes('cost')) targets.push('cost');
  } else if (commandLower.includes('allocate') || commandLower.includes('balance')) {
    intent = 'allocate';
    targets.push('resources');
  }

  return {
    original: command,
    intent,
    targets,
    parameters,
    confidence: intent !== 'unknown' ? 85 : 40
  };
}

async function executeAction(parsed, fleetData) {
  const { vehicles, routes, shipments } = fleetData;

  switch (parsed.intent) {
    case 'optimize':
      return {
        status: 'executing',
        type: 'route_optimization',
        details: {
          routes_optimized: Math.min(5, routes?.length || 0),
          potential_savings: Math.round(Math.random() * 3000 + 1500),
          implementation_time: '4 hours',
          affected_vehicles: Math.min(12, vehicles?.length || 0)
        }
      };

    case 'schedule':
      return {
        status: 'planning',
        type: 'maintenance_scheduling',
        details: {
          vehicles_needing_service: Math.floor(vehicles?.length * 0.2),
          total_downtime_hours: Math.floor(Math.random() * 16 + 8),
          cost: Math.round(Math.random() * 8000 + 3000),
          timeline: 'Next 2 weeks'
        }
      };

    case 'maximize':
      return {
        status: 'executing',
        type: 'efficiency_improvement',
        details: {
          target_metric: 'on-time delivery',
          current_rate: 92,
          projected_rate: 96,
          improvement: '4%',
          actions: ['Route reoptimization', 'Driver coaching', 'Resource balancing']
        }
      };

    case 'reduce':
      return {
        status: 'executing',
        type: 'reduction_plan',
        details: {
          target_metric: parsed.targets[0],
          potential_reduction: Math.round(Math.random() * 25 + 15) + '%',
          monthly_savings: Math.round(Math.random() * 5000 + 2000),
          initiatives: ['Route optimization', 'Fuel efficiency training', 'Load balancing']
        }
      };

    case 'allocate':
      return {
        status: 'calculating',
        type: 'resource_allocation',
        details: {
          vehicles_to_reallocate: Math.floor(vehicles?.length * 0.3),
          routes_affected: Math.min(8, routes?.length || 0),
          optimization_potential: Math.round(Math.random() * 20 + 12) + '%'
        }
      };

    default:
      return { status: 'idle', type: 'unknown' };
  }
}

function estimateImpact(parsed, execution) {
  const impactMap = {
    optimize: { efficiency: 15, cost: 18 },
    schedule: { availability: 8, maintenance_costs: -25 },
    maximize: { delivery_rate: 4, satisfaction: 12 },
    reduce: { cost: 20, emissions: 18 },
    allocate: { efficiency: 12, utilization: 22 }
  };

  const impact = impactMap[parsed.intent] || {};
  
  return {
    efficiency_impact: impact.efficiency || 0,
    cost_impact: impact.cost || 0,
    sustainability_impact: impact.emissions || 0,
    customer_impact: impact.satisfaction || 0,
    summary: formatImpactSummary(impact)
  };
}

function calculateConfidence(parsed, execution) {
  let confidence = parsed.confidence;
  
  if (execution.status === 'executing') confidence += 15;
  if (execution.details?.cost === undefined) confidence -= 10;
  
  return Math.min(100, Math.max(40, confidence));
}

function formatImpactSummary(impact) {
  const items = [];
  
  if (impact.efficiency) items.push(`${impact.efficiency}% efficiency gain`);
  if (impact.cost) items.push(`${impact.cost}% cost reduction`);
  if (impact.emissions) items.push(`${impact.emissions}% emissions reduction`);
  if (impact.satisfaction) items.push(`${impact.satisfaction}% satisfaction improvement`);
  
  return items.join(' + ') || 'Analyzing impact...';
}

// Command Input Component
export function CommandInput({ onSubmit, isProcessing }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.length > 2) {
      const templates = IntelligentCommandAgent.getCommandTemplates();
      setSuggestions(
        templates.filter(t => 
          t.command.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 3)
      );
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Describe what you want the fleet to do..."
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {suggestions.length > 0 && (
        <motion.div 
          className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(suggestion.command);
                setSuggestions([]);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0"
            >
              <div className="text-sm text-white font-medium">{suggestion.command}</div>
              <div className="text-xs text-slate-400">{suggestion.description}</div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Command Execution Visualization
export function CommandExecution({ execution, impact, confidence }) {
  if (!execution || execution.status === 'idle') return null;

  return (
    <motion.div
      className="bg-slate-900/50 border border-slate-800 rounded-lg p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h4 className="font-semibold text-white">{execution.type.replace('_', ' ')}</h4>
        </div>
        <span className="text-xs font-bold text-cyan-400">{confidence}% Confidence</span>
      </div>

      <div className="space-y-3 text-sm">
        {Object.entries(execution.details).map(([key, value]) => (
          <div key={key} className="flex justify-between text-slate-300">
            <span className="text-slate-400">{key.replace('_', ' ')}:</span>
            <span className="font-medium text-cyan-400">{String(value)}</span>
          </div>
        ))}
      </div>

      {impact && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2">Estimated Impact:</p>
          <p className="text-sm text-green-400 font-medium">{impact.summary}</p>
        </div>
      )}

      {execution.status === 'executing' && (
        <div className="mt-4 flex items-center gap-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs">Executing in progress...</span>
        </div>
      )}
    </motion.div>
  );
}

export default IntelligentCommandAgent;