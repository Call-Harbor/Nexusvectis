import { useState } from "react";
import { motion } from "framer-motion";
import { Bus, User, MapPin, Battery, AlertTriangle, CheckCircle } from "lucide-react";

export default function VehicleDriverAssignment({ buses, routes }) {
  const [assignments, setAssignments] = useState([
    {
      tripId: "T001",
      route: "5A",
      departureTime: "08:00",
      assignedBus: "BUS-101",
      assignedDriver: "DRV-045",
      matchScore: 98,
      factors: ["Optimal range", "Driver certified", "At correct depot"],
      warnings: []
    },
    {
      tripId: "T002",
      route: "12",
      departureTime: "08:15",
      assignedBus: "BUS-203",
      assignedDriver: "DRV-023",
      matchScore: 85,
      factors: ["Driver certified", "Bus available"],
      warnings: ["Low battery - 35%"]
    },
    {
      tripId: "T003",
      route: "7B",
      departureTime: "08:30",
      assignedBus: null,
      assignedDriver: "DRV-067",
      matchScore: 62,
      factors: [],
      warnings: ["No optimal bus available", "Driver approaching rest limit"]
    }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Vehicle & Driver Assignment AI
        </h3>
        <p className="text-slate-400 mt-1">Intelligent matching engine for optimal assignments</p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment, idx) => (
          <motion.div
            key={assignment.tripId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-2xl p-6 border ${
              assignment.matchScore >= 90
                ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
                : assignment.matchScore >= 70
                ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30'
                : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-white">Trip {assignment.tripId}</span>
                  <span className="px-3 py-1 rounded-full text-xs bg-slate-900/50 text-slate-300">
                    Route {assignment.route}
                  </span>
                  <span className="text-sm text-slate-400">Departure: {assignment.departureTime}</span>
                </div>
              </div>
              <div className={`text-3xl font-bold ${
                assignment.matchScore >= 90 ? 'text-emerald-400' :
                assignment.matchScore >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {assignment.matchScore}%
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Assigned Bus</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {assignment.assignedBus || "Not assigned"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Assigned Driver</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {assignment.assignedDriver || "Not assigned"}
                </div>
              </div>
            </div>

            {assignment.factors.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-emerald-400/60 mb-2">Match Factors:</div>
                <div className="flex flex-wrap gap-2">
                  {assignment.factors.map((factor, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assignment.warnings.length > 0 && (
              <div>
                <div className="text-xs text-amber-400/60 mb-2">Warnings:</div>
                <div className="flex flex-wrap gap-2">
                  {assignment.warnings.map((warning, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {warning}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}