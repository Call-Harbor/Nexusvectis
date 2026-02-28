import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Satellite, Cloud, Wind, AlertTriangle, MapPin, TrendingUp, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function SatelliteWeatherIntelligence({ routes, vehicles, onRouteSelect }) {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [satelliteAnalysis, setSatelliteAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (selectedRoute) {
      analyzeRouteIntelligence();
    }
  }, [selectedRoute]);

  const analyzeRouteIntelligence = async () => {
    setLoading(true);
    try {
      const route = routes?.find(r => r.id === selectedRoute);
      if (!route) return;

      // Get weather and satellite analysis from LLM
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze satellite imagery and weather conditions for logistics route:
        Origin: ${route.origin}
        Destination: ${route.destination}
        Distance: ${route.distance_km}km
        Transport: ${route.transport_type}
        
        Provide:
        1. Current weather conditions and alerts
        2. Satellite imagery insights (cloud cover, terrain, visibility)
        3. Route optimization recommendations
        4. Risk assessment (weather, terrain, visibility)
        5. ETA impact from weather conditions
        
        Format as JSON with: weather, satellite_insights, recommendations, risks, eta_impact`,
        response_json_schema: {
          type: "object",
          properties: {
            weather: {
              type: "object",
              properties: {
                temperature: { type: "number" },
                wind_speed: { type: "number" },
                wind_direction: { type: "string" },
                precipitation: { type: "string" },
                visibility: { type: "number" },
                alerts: { type: "array", items: { type: "string" } }
              }
            },
            satellite_insights: {
              type: "object",
              properties: {
                cloud_cover: { type: "number" },
                terrain_analysis: { type: "string" },
                surface_conditions: { type: "string" },
                visual_quality: { type: "string" }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            eta_impact: { type: "string" }
          }
        },
        add_context_from_internet: true
      });

      setWeatherData(response.weather);
      setSatelliteAnalysis(response.satellite_insights);
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error("Error analyzing route intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-950/40 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Satellite className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Satellite Weather Intelligence</h2>
          </div>
          <p className="text-slate-400">Real-time satellite imagery & weather analysis for route optimization</p>
        </div>

        {/* Route Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Available Routes
            </h3>
            {routes?.map((route) => (
              <motion.button
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedRoute === route.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                    : "bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-slate-600/50"
                }`}
              >
                <p className="font-medium text-sm">{route.origin} → {route.destination}</p>
                <p className="text-xs text-slate-400 mt-1">{route.distance_km}km • {route.transport_type}</p>
              </motion.button>
            ))}
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRoute && !loading && (
              <>
                {/* Weather Data */}
                {weatherData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Cloud className="w-5 h-5 text-blue-400" />
                      <h4 className="text-white font-semibold">Weather Conditions</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Temperature</p>
                        <p className="text-white text-lg font-bold">{weatherData.temperature}°C</p>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Wind Speed</p>
                        <p className="text-white text-lg font-bold">{weatherData.wind_speed} km/h</p>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Visibility</p>
                        <p className="text-white text-lg font-bold">{weatherData.visibility}km</p>
                      </div>
                      <div className="col-span-2 sm:col-span-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Precipitation</p>
                        <p className="text-white font-medium">{weatherData.precipitation}</p>
                      </div>
                    </div>
                    {weatherData.alerts?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {weatherData.alerts.map((alert, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{alert}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Satellite Insights */}
                {satelliteAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Satellite className="w-5 h-5 text-violet-400" />
                      <h4 className="text-white font-semibold">Satellite Imagery Analysis</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Cloud Cover</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-400 to-purple-400" 
                              style={{ width: `${satelliteAnalysis.cloud_cover}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold text-sm">{satelliteAnalysis.cloud_cover}%</span>
                        </div>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Terrain Analysis</p>
                        <p className="text-white text-sm">{satelliteAnalysis.terrain_analysis}</p>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-slate-400 text-xs mb-1">Surface Conditions</p>
                        <p className="text-white text-sm">{satelliteAnalysis.surface_conditions}</p>
                      </div>
                      <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <p className="text-slate-400 text-xs">Visual Quality</p>
                        </div>
                        <p className="text-white text-sm">{satelliteAnalysis.visual_quality}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-white font-semibold">Route Optimization Recommendations</h4>
                    </div>
                    <div className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 text-xs font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-slate-200 text-sm leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin mb-4">
                    <Satellite className="w-8 h-8 text-cyan-400 mx-auto" />
                  </div>
                  <p className="text-slate-300">Analyzing satellite data and weather conditions...</p>
                </div>
              </div>
            )}

            {!selectedRoute && !loading && (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <p>Select a route to analyze satellite imagery and weather conditions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}