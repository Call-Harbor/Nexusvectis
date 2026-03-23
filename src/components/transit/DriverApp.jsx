import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Navigation, MapPin, Clock, Users, AlertTriangle, 
  MessageSquare, CheckCircle2, Battery, Fuel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DriverApp({ driverId }) {
  const [currentTrip, setCurrentTrip] = useState(null);

  const { data: driver } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => base44.entities.BusDriver.filter({ driver_id: driverId }),
  });

  const { data: assignedTrips = [] } = useQuery({
    queryKey: ['driverTrips', driverId],
    queryFn: () => base44.entities.BusTrip.filter({ 
      assigned_driver_id: driverId,
      status: { $in: ['scheduled', 'in_progress'] }
    }),
    refetchInterval: 10000,
  });

  const { data: bus } = useQuery({
    queryKey: ['driverBus', currentTrip?.assigned_bus_id],
    queryFn: () => currentTrip ? base44.entities.Bus.filter({ id: currentTrip.assigned_bus_id }) : null,
    enabled: !!currentTrip?.assigned_bus_id,
  });

  useEffect(() => {
    const inProgress = assignedTrips.find(t => t.status === 'in_progress');
    if (inProgress) setCurrentTrip(inProgress);
  }, [assignedTrips]);

  const driverData = driver?.[0];
  const busData = bus?.[0];

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Driver: {driverData?.first_name} {driverData?.last_name}
        </h1>
        <p className="text-slate-400 text-sm">Employee #{driverData?.employee_number}</p>
      </div>

      {/* Current Trip Card */}
      {currentTrip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Current Trip</h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Active
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">Line {currentTrip.line_id}</span>
              </div>

              {busData && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Battery/Fuel</p>
                    <Progress value={busData.battery_level || busData.fuel_level || 0} className="h-2" />
                    <p className="text-sm text-white mt-1">{busData.battery_level || busData.fuel_level || 0}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Passengers</p>
                    <p className="text-2xl font-bold text-white">{busData.passenger_count || 0}</p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <p className="text-amber-300 text-sm">Next stop: Copenhagen Central</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">ETA: 2 minutes • On time</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Recommendations */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50 mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          AI Driving Recommendations
        </h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-300 text-sm">✓ Maintain eco-driving mode - good fuel efficiency</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-sm">⚠ Traffic ahead - slow down, use buffer time</p>
          </div>
        </div>
      </Card>

      {/* Quick Report */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-violet-400" />
          Report Issue
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="border-slate-600">
            <MapPin className="w-4 h-4 mr-2" />
            Dangerous Stop
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Users className="w-4 h-4 mr-2" />
            Overcrowding
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Clock className="w-4 h-4 mr-2" />
            Traffic Delay
          </Button>
          <Button variant="outline" className="border-slate-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Other
          </Button>
        </div>
      </Card>

      {/* Upcoming Trips */}
      <div className="mt-6">
        <h3 className="text-white font-semibold mb-3">Upcoming Trips</h3>
        <div className="space-y-2">
          {assignedTrips.filter(t => t.status === 'scheduled').slice(0, 3).map(trip => (
            <div key={trip.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Line {trip.line_id}</p>
                  <p className="text-xs text-slate-400">{trip.scheduled_departure}</p>
                </div>
                <Badge variant="outline" className="text-violet-400 border-violet-500/30">
                  Scheduled
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}