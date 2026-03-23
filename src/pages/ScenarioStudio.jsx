import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Zap, Users, AlertTriangle, Play, Save, GitBranch } from 'lucide-react';

const PRESETS = [
  { id: 'storm', name: 'Storm Weather', icon: Cloud, color: 'bg-slate-600' },
  { id: 'metro_breakdown', name: 'Metro Breakdown', icon: Zap, color: 'bg-red-600' },
  { id: 'concert', name: 'Concert Event', icon: Users, color: 'bg-purple-600' },
  { id: 'strike', name: 'Strike/Closure', icon: AlertTriangle, color: 'bg-orange-600' }
];

export default function ScenarioStudio() {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);

  const { data: scenarios, refetch } = useQuery({
    queryKey: ['transit-scenarios'],
    queryFn: async () => {
      return await base44.entities.TransitScenario.filter({
        organization_id: 'default'
      }, '-created_at', 20);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (presetId) => {
      const scenario = await base44.entities.TransitScenario.create({
        organization_id: 'default',
        scenario_name: scenarioName || `${presetId}_${Date.now()}`,
        scenario_type: presetId,
        status: 'draft',
        parameters: getPresetParameters(presetId),
        created_at: new Date().toISOString()
      });
      return scenario;
    },
    onSuccess: () => {
      setScenarioName('');
      setSelectedPreset(null);
      refetch();
    }
  });

  const runMutation = useMutation({
    mutationFn: async (scenarioId) => {
      // Simulate scenario run
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await base44.entities.TransitScenario.update(scenarioId, {
        status: 'running',
        run_date: new Date().toISOString(),
        simulation_results: generateMockResults()
      });
    },
    onSuccess: () => refetch()
  });

  const getPresetParameters = (presetId) => {
    const params = {
      storm: { 
        vehicle_reduction: 0.15, 
        frequency_reduction: 0.2,
        passenger_increase: 0.25,
        description: 'Heavy weather reduces capacity and increases demand'
      },
      metro_breakdown: { 
        passenger_diversion: 0.3,
        frequency_increase: 0.4,
        description: 'Metro system down - expect 30% passenger diversion'
      },
      concert: { 
        passenger_spike: 0.5,
        origin_stop: 'venue_area',
        duration_hours: 4,
        description: 'Concert event drives 50% passenger increase'
      },
      strike: { 
        vehicle_reduction: 0.5,
        frequency_reduction: 0.5,
        description: 'Partial strike reduces service'
      }
    };
    return params[presetId] || {};
  };

  const generateMockResults = () => {
    return {
      predicted_delays: Math.floor(Math.random() * 15) + 5,
      passenger_coverage: Math.floor(Math.random() * 20) + 75,
      operating_cost: Math.floor(Math.random() * 5000) + 15000,
      co2_impact: Math.floor(Math.random() * 500) + 1000,
      service_level_score: Math.floor(Math.random() * 25) + 60
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Scenario Studio 2.0</h1>
          <p className="text-slate-400">Plan and simulate operational scenarios</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="create">Create Scenario</TabsTrigger>
            <TabsTrigger value="compare">Compare Scenarios</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Create Scenario */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              {PRESETS.map(preset => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <div className="text-sm font-medium text-white text-left">{preset.name}</div>
                  </button>
                );
              })}
            </div>

            {selectedPreset && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">New Scenario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Scenario name (optional)"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                  <Button
                    onClick={() => createMutation.mutate(selectedPreset)}
                    disabled={createMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? 'Creating...' : 'Create & Run Scenario'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Compare Scenarios */}
          <TabsContent value="compare" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  A/B Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Scenario A</label>
                    <select 
                      onChange={(e) => setScenarioA(scenarios?.find(s => s.id === e.target.value))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select scenario...</option>
                      {scenarios?.map(s => (
                        <option key={s.id} value={s.id}>{s.scenario_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Scenario B</label>
                    <select 
                      onChange={(e) => setScenarioB(scenarios?.find(s => s.id === e.target.value))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                      <option value="">Select scenario...</option>
                      {scenarios?.map(s => (
                        <option key={s.id} value={s.id}>{s.scenario_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {scenarioA && scenarioB && (
                  <div className="grid grid-cols-5 gap-3 mt-6">
                    {['predicted_delays', 'passenger_coverage', 'operating_cost', 'co2_impact', 'service_level_score'].map(metric => {
                      const aVal = scenarioA.simulation_results?.[metric] || 0;
                      const bVal = scenarioB.simulation_results?.[metric] || 0;
                      const diff = bVal - aVal;
                      return (
                        <div key={metric} className="p-3 bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-400 mb-2 font-semibold">{metric.replace(/_/g, ' ')}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-slate-500">A</div>
                              <div className="font-bold text-blue-400">{aVal}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">B</div>
                              <div className="font-bold text-emerald-400">{bVal}</div>
                            </div>
                          </div>
                          <div className={`text-xs mt-1 font-semibold ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Scenario History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scenarios?.map(scenario => (
                    <div key={scenario.id} className="p-3 bg-slate-700 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{scenario.scenario_name}</div>
                          <div className="text-xs text-slate-400">{scenario.scenario_type}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          scenario.status === 'completed' ? 'bg-green-900 text-green-200' :
                          scenario.status === 'running' ? 'bg-blue-900 text-blue-200' :
                          'bg-slate-600 text-slate-200'
                        }`}>
                          {scenario.status}
                        </div>
                      </div>
                      {scenario.simulation_results && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-slate-400">Delays: <span className="text-white font-semibold">{scenario.simulation_results.predicted_delays}m</span></div>
                          <div className="text-slate-400">Coverage: <span className="text-white font-semibold">{scenario.simulation_results.passenger_coverage}%</span></div>
                          <div className="text-slate-400">Cost: <span className="text-white font-semibold">€{scenario.simulation_results.operating_cost}</span></div>
                        </div>
                      )}
                      {scenario.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => runMutation.mutate(scenario.id)}
                          disabled={runMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run Scenario
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}