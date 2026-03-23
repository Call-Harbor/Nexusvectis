import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Clock, Shield, TrendingUp, Phone, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function IncidentResponseCenter({ incidents, buses, drivers }) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  const mockIncidents = [
    {
      id: 1,
      severity: "critical",
      title: "Bus 42 Mechanical Failure",
      time: "14:23",
      line: "Line 7",
      passengers: 67,
      driver: "Carlos Mendez",
      location: "Hauptstrasse 45",
      status: "escalated",
      aiResponse: {
        action: "Deployed Bus 18 (3min away) to provide replacement service",
        passengers: "Rerouted 67 to Bus 18 at next stop",
        mitigation: "Reduced service disruption from 45min → 8min"
      },
      timeline: [
        { time: "14:23", event: "Mechanical failure detected via IoT sensors", type: "alert" },
        { time: "14:23:15", event: "AI evaluated 8 response scenarios", type: "ai" },
        { time: "14:24", event: "Alerted driver + dispatch team", type: "notification" },
        { time: "14:25", event: "Replacement bus routed (ETA 3min 22sec)", type: "response" },
        { time: "14:28", event: "Passengers transferred, original bus towed", type: "resolved" }
      ]
    },
    {
      id: 2,
      severity: "high",
      title: "Line 5 Massive Overcrowding",
      time: "14:42",
      line: "Line 5",
      passengers: 156,
      driver: "Maria Schmidt",
      location: "Central Station",
      status: "mitigating",
      aiResponse: {
        action: "Inserted express bus + recommended passenger shift",
        passengers: "48 passengers offered free transfer to express Line 5E",
        mitigation: "Reduced overcrowding from 173% → 98% capacity"
      },
      timeline: [
        { time: "14:42", event: "Real-time capacity prediction exceeded threshold", type: "alert" },
        { time: "14:42:30", event: "AI predicted 156 passengers at next 3 stops", type: "ai" },
        { time: "14:43", event: "Notified control center + suggested express solution", type: "notification" },
        { time: "14:44", event: "Express bus deployed (8min ETA)", type: "response" }
      ]
    },
    {
      id: 3,
      severity: "medium",
      title: "Driver Fatigue Warning",
      time: "14:55",
      line: "Line 12",
      passengers: 42,
      driver: "Klaus Mueller",
      location: "Königstrasse",
      status: "monitoring",
      aiResponse: {
        action: "Recommended immediate 20min break + shift relief driver on standby",
        passengers: "Schedule maintained with relief driver",
        mitigation: "Prevented potential safety incident"
      },
      timeline: [
        { time: "14:55", event: "Driver alert system: 7.5h worked, fatigue score 73%", type: "alert" },
        { time: "14:56", event: "AI evaluated break schedule + relief availability", type: "ai" },
        { time: "14:57", event: "Sent break recommendation to driver + control", type: "notification" }
      ]
    }
  ];

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
          <p className="text-slate-400 mt-1">Real-time AI-powered incident management & escalation</p>
        </div>
        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-lg px-4 py-2">
          {mockIncidents.length} Active Incidents
        </Badge>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        <AnimatePresence>
          {mockIncidents.map((incident, i) => {
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
                    incident.status === 'escalated' ? 'text-rose-400 animate-pulse' :
                    incident.status === 'mitigating' ? 'text-amber-400' : 'text-blue-400'
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
                        <p className="text-violet-300 font-semibold text-sm mb-2">🤖 AI Response Executed</p>
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