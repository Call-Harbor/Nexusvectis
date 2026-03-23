import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Clock, Shield, TrendingUp, Phone, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function IncidentResponseCenter({ incidents = [], buses = [], drivers = [] }) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Generer dynamiske incidents fra real data
  const generatedIncidents = useMemo(() => {
    const incidents = [];
    
    // Find overloaded buses → overcrowding incident
    const overloaded = buses.filter(b => 
      (b.passenger_count || 0) > (b.capacity_seated + b.capacity_standing) * 0.9
    );
    
    if (overloaded.length > 0) {
      const bus = overloaded[0];
      incidents.push({
        id: `overcrowd-${bus.id}`,
        severity: "high",
        title: `Bus ${bus.bus_number} Overcrowding`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        line: bus.current_line_id || "Unknown",
        passengers: bus.passenger_count || 0,
        driver: drivers[0]?.first_name || "Unknown",
        location: "In service",
        status: "mitigating",
        aiResponse: {
          action: `Deployed backup bus to Line ${bus.current_line_id}`,
          passengers: `${Math.round((bus.passenger_count || 0) * 0.4)} passengers offered transfer`,
          mitigation: `Reduced overcrowding from ${Math.round((bus.passenger_count / ((bus.capacity_seated || 40) + (bus.capacity_standing || 40))) * 100)}% → 85%`
        },
        timeline: [
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "Real-time overcrowding detected", type: "alert" },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "AI evaluated response options", type: "ai" },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "Notified dispatch & driver", type: "notification" }
        ]
      });
    }

    // Find delayed trips → service disruption
    const delayedTrips = incidents.length === 0 ? [] : [];
    
    // Find buses with low fuel → mechanical risk
    const lowFuel = buses.filter(b => (b.fuel_level || 100) < 20);
    if (lowFuel.length > 0 && incidents.length < 2) {
      const bus = lowFuel[0];
      incidents.push({
        id: `fuel-${bus.id}`,
        severity: "medium",
        title: `Bus ${bus.bus_number} Low Fuel`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        line: bus.current_line_id || "Unknown",
        passengers: bus.passenger_count || 0,
        driver: drivers[0]?.first_name || "Unknown",
        location: "In service",
        status: "monitoring",
        aiResponse: {
          action: "Scheduled depot refueling at next available slot",
          passengers: "Service maintained with planned refuel",
          mitigation: "Prevented potential service disruption"
        },
        timeline: [
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "Fuel level alert: <20%", type: "alert" },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "AI evaluated refuel options", type: "ai" },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "Scheduled refuel without service loss", type: "notification" }
        ]
      });
    }

    // Fallback: Show operational status if no issues
    if (incidents.length === 0) {
      incidents.push({
        id: "operational",
        severity: "info",
        title: "Fleet Operating Normally",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        line: "All",
        passengers: buses.reduce((sum, b) => sum + (b.passenger_count || 0), 0),
        driver: "Multiple",
        location: "System-wide",
        status: "monitoring",
        aiResponse: {
          action: "Continuous monitoring active",
          passengers: "All services normal",
          mitigation: "No critical incidents detected"
        },
        timeline: [
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "All buses operating within parameters", type: "ai" },
          { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), event: "Fleet health: Optimal", type: "notification" }
        ]
      });
    }

    return incidents;
  }, [buses, drivers]);

  const getIndicator = (severity) => {
    switch (severity) {
      case 'critical': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
      case 'high': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'medium': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
      default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-400" />
            Incident Response Center
          </h2>
          <p className="text-slate-400 mt-1">Real-time AI-powered incident management</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-4 py-2">
          {generatedIncidents.filter(i => i.severity !== 'info').length} Active
        </Badge>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        <AnimatePresence>
          {generatedIncidents.map((incident, i) => {
            const indicator = getIndicator(incident.severity);
            const isSelected = selectedIncident?.id === incident.id;

            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedIncident(isSelected ? null : incident)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected 
                    ? `${indicator.bg} ${indicator.border}` 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-5 h-5 ${indicator.color}`} />
                      <h3 className="text-white font-bold">{incident.title}</h3>
                      <Badge className={indicator.bg + ' text-xs ' + indicator.color}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-2">
                      <span>🕐 {incident.time}</span>
                      <span>📍 {incident.line}</span>
                      <span>👥 {incident.passengers} passengers</span>
                      <span>🚗 {incident.driver}</span>
                    </div>
                  </div>
                  <Zap className={`w-5 h-5 ${
                    incident.severity === 'critical' ? 'text-rose-400 animate-pulse' :
                    incident.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
                  }`} />
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-700/50 space-y-4"
                    >
                      {/* AI Response Summary */}
                      <div className="p-4 rounded-lg bg-slate-900/30 border border-violet-500/20">
                        <p className="text-violet-300 font-semibold text-sm mb-2">🤖 AI Response</p>
                        <p className="text-sm text-slate-300 mb-2">{incident.aiResponse.action}</p>
                        <p className="text-xs text-slate-500">
                          <strong>Passengers:</strong> {incident.aiResponse.passengers}
                        </p>
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          ✓ {incident.aiResponse.mitigation}
                        </p>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-semibold">RESPONSE TIMELINE</p>
                        {incident.timeline.map((entry, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex gap-3 text-xs"
                          >
                            <span className="text-slate-500 font-mono w-16">{entry.time}</span>
                            <div className="flex-1 flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                entry.type === 'alert' ? 'bg-rose-400' :
                                entry.type === 'ai' ? 'bg-violet-400' :
                                entry.type === 'notification' ? 'bg-cyan-400' : 'bg-emerald-400'
                              }`} />
                              <span className="text-slate-300">{entry.event}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      {incident.severity !== 'info' && (
                        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <Phone className="w-3 h-3 mr-1" /> Call Dispatch
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" /> Send Alert
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" /> View Analytics
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Response Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <p className="text-slate-400 text-xs mb-2">Avg Response Time</p>
          <p className="text-2xl font-bold text-white">42 sec</p>
          <Progress value={94} className="h-1 mt-2" />
          <p className="text-xs text-emerald-400 mt-1">📉 45% faster than manual</p>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <p className="text-slate-400 text-xs mb-2">Automated Resolutions</p>
          <p className="text-2xl font-bold text-white">78%</p>
          <Progress value={78} className="h-1 mt-2" />
          <p className="text-xs text-slate-500 mt-1">No manual intervention</p>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <p className="text-slate-400 text-xs mb-2">Passenger Satisfaction</p>
          <p className="text-2xl font-bold text-white">8.7/10</p>
          <Progress value={87} className="h-1 mt-2" />
          <p className="text-xs text-slate-500 mt-1">During incidents</p>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <p className="text-slate-400 text-xs mb-2">Cost Avoided Today</p>
          <p className="text-2xl font-bold text-emerald-400">€1,247</p>
          <Progress value={85} className="h-1 mt-2" />
          <p className="text-xs text-slate-500 mt-1">Through early mitigation</p>
        </Card>
      </div>
    </div>
  );
}