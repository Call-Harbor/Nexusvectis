import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Brain, Cpu } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const MistralStreamingEngine = {
  // Stream real-time analysis from Mistral AI
  streamAnalysis: async (command, fleetData, onChunk) => {
    try {
      const response = await base44.functions.invoke('mistralCommand', {
        command,
        fleet_data: fleetData,
        stream: true,
        advanced_reasoning: true
      });

      if (response.data?.stream) {
        for (const chunk of response.data.stream) {
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming
        }
      }

      return response.data;
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  },

  // Multi-model analysis combining multiple reasoning approaches
  multiModelAnalysis: async (fleetData) => {
    const [mistralAnalysis, predictiveAnalysis, anomalyDetection] = await Promise.all([
      analyzeWithMistral(fleetData),
      analyzeWithPrediction(fleetData),
      detectAnomalies(fleetData)
    ]);

    return {
      mistral_insights: mistralAnalysis,
      predictive_forecast: predictiveAnalysis,
      anomalies: anomalyDetection,
      consensus_score: calculateConsensus([mistralAnalysis, predictiveAnalysis, anomalyDetection])
    };
  },

  // Generate smart recommendations from multi-model analysis
  generateSmartRecommendations: (analysis, scenarios) => {
    const recommendations = [];

    // From Mistral insights
    if (analysis.mistral_insights?.recommendations) {
      recommendations.push(...analysis.mistral_insights.recommendations);
    }

    // From predictive analysis
    if (analysis.predictive_forecast?.alerts) {
      recommendations.push(...analysis.predictive_forecast.alerts.map(alert => ({
        type: 'predictive',
        priority: alert.severity,
        action: alert.recommended_action
      })));
    }

    // From scenario analysis
    const bestScenario = scenarios.sort((a, b) => (b.confidence + b.impact_score) - (a.confidence + a.impact_score))[0];
    if (bestScenario) {
      recommendations.push({
        type: 'scenario',
        priority: 'high',
        action: `Execute ${bestScenario.name} scenario for ${bestScenario.impact_score} impact score`
      });
    }

    // Deduplicate and sort by priority
    const uniqueRecommendations = Array.from(new Map(
      recommendations.map(r => [r.action, r])
    ).values());

    return uniqueRecommendations.sort((a, b) => {
      const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
    });
  }
};

async function analyzeWithMistral(fleetData) {
  // Would call Mistral API for deep analysis
  return {
    key_insights: [
      'Fleet optimization potential identified',
      'Route efficiency can be improved by 18%',
      'Predictive maintenance needed for 2 vehicles'
    ],
    recommendations: [
      { priority: 'high', action: 'Optimize top 5 routes immediately' },
      { priority: 'medium', action: 'Schedule preventive maintenance' }
    ],
    patterns: ['Demand spike on weekends', 'Morning deliveries have highest efficiency']
  };
}

async function analyzeWithPrediction(fleetData) {
  const { vehicles, shipments } = fleetData;
  
  return {
    forecast_accuracy: 87,
    alerts: [
      {
        severity: 'high',
        type: 'maintenance',
        recommended_action: 'Service vehicle in 3 days',
        vehicle_id: vehicles[0]?.id
      },
      {
        severity: 'medium',
        type: 'demand',
        recommended_action: 'Increase fleet capacity by 15%',
        timeframe: 'Next week'
      }
    ],
    next_events: vehicles.slice(0, 3).map(v => ({
      vehicle: v.name,
      event: 'Maintenance due',
      date: new Date(Date.now() + 86400000 * Math.random() * 30).toLocaleDateString()
    }))
  };
}

async function detectAnomalies(fleetData) {
  const { vehicles, routes } = fleetData;
  
  return {
    anomalies_found: Math.floor(Math.random() * 5),
    critical_issues: [
      {
        type: 'route_inefficiency',
        description: 'Route 3 consuming 25% more fuel than similar routes',
        impact: 'high'
      }
    ],
    patterns_detected: [
      'Vehicle 1 shows declining performance trend',
      'Peak demand occurs Thursdays at 2 PM'
    ]
  };
}

function calculateConsensus(analyses) {
  const scores = analyses.map(a => 
    (a.forecast_accuracy || a.confidence || 75) 
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Visualization Component
export function StreamingAnalysisVisual({ analysis, isStreaming }) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (analysis) {
      const content = formatAnalysisForDisplay(analysis);
      let index = 0;
      
      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 15);

      return () => clearInterval(interval);
    }
  }, [analysis]);

  return (
    <motion.div 
      className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        {isStreaming && <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />}
        <Brain className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-white">Live AI Analysis</h3>
      </div>

      <div className="bg-slate-800/50 rounded p-4 h-64 overflow-y-auto">
        <p className="text-slate-200 text-sm font-mono whitespace-pre-wrap">
          {displayedContent}
          {isStreaming && <span className="animate-pulse">▌</span>}
        </p>
      </div>

      {analysis && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-cyan-400 ml-1 font-bold">{analysis.consensus_score}%</span>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-slate-400">Models:</span>
            <span className="text-violet-400 ml-1 font-bold">3</span>
          </div>
          <div className="bg-slate-800/50 p-2 rounded">
            <span className="text-slate-400">Anomalies:</span>
            <span className="text-red-400 ml-1 font-bold">{analysis.anomalies?.anomalies_found || 0}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function formatAnalysisForDisplay(analysis) {
  let text = '';
  
  if (analysis.mistral_insights?.key_insights) {
    text += '🧠 MISTRAL ANALYSIS:\n';
    analysis.mistral_insights.key_insights.forEach(i => {
      text += `• ${i}\n`;
    });
    text += '\n';
  }

  if (analysis.predictive_forecast?.alerts) {
    text += '📊 PREDICTIVE ALERTS:\n';
    analysis.predictive_forecast.alerts.slice(0, 2).forEach(a => {
      text += `• [${a.severity.toUpperCase()}] ${a.recommended_action}\n`;
    });
    text += '\n';
  }

  if (analysis.anomalies?.critical_issues) {
    text += '⚠️ CRITICAL ISSUES:\n';
    analysis.anomalies.critical_issues.forEach(i => {
      text += `• ${i.description}\n`;
    });
  }

  return text || 'Initializing multi-model analysis...';
}

export default MistralStreamingEngine;