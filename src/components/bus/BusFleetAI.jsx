import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Network, Settings2, Mic, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import BusFleetSettings from "./BusFleetSettings";

export default function BusFleetAI({ onSetupComplete }) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleVoiceCommand = async () => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    setAiResponse("");
    
    try {
      const user = await base44.auth.me();
      const orgId = user?.organization_id || user?.data?.organization_id;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI transit system architect. The user wants to configure a bus fleet system with this request:
        
"${command}"

Analyze the request and create a complete bus transit network setup including:
1. Bus fleet specifications (how many buses, what types)
2. Route network (major routes, stops along each route)
3. Depot/resource locations

Return ONLY a JSON object with this exact structure - no explanations, no markdown:
{
  "summary": "Brief summary of what you're creating",
  "depots": [{"name": "...", "location": "City, Country", "capacity": number}],
  "buses": [{"bus_number": "...", "bus_type": "city_bus|electric_bus|...", "capacity": number, "depot_name": "..."}],
  "stops": [{"stop_code": "...", "stop_name": "...", "address": "Full address with city and country"}],
  "routes": [{"route_number": "...", "route_name": "...", "stop_codes": ["...", "..."], "frequency_minutes": number}]
}

Make it realistic and properly scaled for the city/area mentioned.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            depots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  capacity: { type: "number" }
                },
                required: ["name", "location", "capacity"]
              }
            },
            buses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bus_number: { type: "string" },
                  bus_type: { type: "string" },
                  capacity: { type: "number" },
                  depot_name: { type: "string" }
                },
                required: ["bus_number", "bus_type", "capacity", "depot_name"]
              }
            },
            stops: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stop_code: { type: "string" },
                  stop_name: { type: "string" },
                  address: { type: "string" }
                },
                required: ["stop_code", "stop_name", "address"]
              }
            },
            routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  route_number: { type: "string" },
                  route_name: { type: "string" },
                  stop_codes: { type: "array", items: { type: "string" } },
                  frequency_minutes: { type: "number" }
                },
                required: ["route_number", "route_name", "stop_codes"]
              }
            }
          },
          required: ["summary", "depots", "buses", "stops", "routes"]
        }
      });

      setAiResponse(result.summary);

      // Create depots/resources
      const depotMap = {};
      for (const depot of result.depots) {
        const geocode = await base44.integrations.Core.InvokeLLM({
          prompt: `Return GPS coordinates for: ${depot.location}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            },
            required: ["latitude", "longitude"]
          }
        });

        const resource = await base44.entities.Resource.create({
          organization_id: orgId,
          name: depot.name,
          type: "warehouse",
          location: depot.location,
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          capacity: depot.capacity,
          current_level: 0,
          status: "operational"
        });
        depotMap[depot.name] = resource;
      }

      // Create stops
      const stopMap = {};
      for (const stop of result.stops) {
        const geocode = await base44.integrations.Core.InvokeLLM({
          prompt: `Return GPS coordinates for: ${stop.address}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              latitude: { type: "number" },
              longitude: { type: "number" }
            },
            required: ["latitude", "longitude"]
          }
        });

        const busStop = await base44.entities.BusStop.create({
          organization_id: orgId,
          stop_code: stop.stop_code,
          stop_name: stop.stop_name,
          address: stop.address,
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          zone: "1",
          stop_type: "standard",
          accessibility: true,
          status: "active"
        });
        stopMap[stop.stop_code] = busStop;
      }

      // Create buses
      for (const busData of result.buses) {
        const depot = depotMap[busData.depot_name];
        await base44.entities.Bus.create({
          organization_id: orgId,
          bus_number: busData.bus_number,
          bus_type: busData.bus_type,
          capacity: busData.capacity,
          status: "idle",
          fuel_level: 100,
          latitude: depot?.latitude || 0,
          longitude: depot?.longitude || 0,
          heading: 0,
          speed: 0,
          resource_id: depot?.id
        });
      }

      // Create routes
      for (const route of result.routes) {
        const stops = route.stop_codes.map((code, idx) => ({
          stop_id: stopMap[code]?.id,
          sequence: idx + 1,
          travel_time_from_previous: idx === 0 ? 0 : 5
        })).filter(s => s.stop_id);

        await base44.entities.BusRoute.create({
          organization_id: orgId,
          route_number: route.route_number,
          route_name: route.route_name,
          route_type: "urban",
          stops: stops,
          frequency_minutes: route.frequency_minutes || 15,
          status: "active",
          start_stop_id: stops[0]?.stop_id,
          end_stop_id: stops[stops.length - 1]?.stop_id
        });
      }

      toast.success("Fleet system configured successfully!");
      setCommand("");
      
      if (onSetupComplete) {
        onSetupComplete();
      }
      
    } catch (error) {
      console.error("AI setup failed:", error);
      toast.error("Failed to configure fleet system");
      setAiResponse("Failed to process request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSettings) {
    return <BusFleetSettings onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-violet-950/20" />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 14, repeat: Infinity }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <Brain className="w-12 h-12 text-cyan-400" />
            </motion.div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
              Fleet AI Architect
            </h1>
            <p className="text-xl text-slate-400">
              Describe your transit vision — AI builds the complete system
            </p>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2">AI Configuration</h3>
                  <p className="text-slate-300">{aiResponse}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Command Input */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <Network className="w-8 h-8 text-violet-400 mt-1" />
              <div className="flex-1">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleVoiceCommand();
                    }
                  }}
                  placeholder="Example: Create a bus network for Copenhagen with 20 electric buses, 5 major routes covering downtown, suburbs, and the airport..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-32 resize-none"
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500">Press Ctrl + Enter to execute</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceCommand}
                    disabled={isProcessing || !command.trim()}
                    className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Building System...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Fleet
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCommand("Create a modern bus network for a mid-size European city with 15 electric buses, 4 routes connecting residential areas, city center, university and business district")}
              className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-left"
            >
              <Mic className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Mid-Size City Template</h3>
              <p className="text-sm text-slate-400">15 electric buses, 4 major routes</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettings(true)}
              className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30 hover:border-violet-500/50 transition-all text-left"
            >
              <Settings2 className="w-8 h-8 text-violet-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Manual Configuration</h3>
              <p className="text-sm text-slate-400">Fine-tune individual settings</p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}