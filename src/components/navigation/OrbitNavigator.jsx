import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { Navigation, MapPin, ArrowUp, Locate, AlertCircle, Volume2, VolumeX, Compass, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import L from "leaflet";

// Auto-center map on user location
function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

// Get direction instruction based on bearing difference
function getDirectionInstruction(bearingDiff) {
  if (Math.abs(bearingDiff) < 20) return "Continue straight";
  if (bearingDiff > 20 && bearingDiff < 70) return "Turn slight right";
  if (bearingDiff >= 70 && bearingDiff < 110) return "Turn right";
  if (bearingDiff >= 110 && bearingDiff < 160) return "Turn sharp right";
  if (Math.abs(bearingDiff) >= 160) return "Make U-turn";
  if (bearingDiff < -20 && bearingDiff > -70) return "Turn slight left";
  if (bearingDiff <= -70 && bearingDiff > -110) return "Turn left";
  if (bearingDiff <= -110 && bearingDiff > -160) return "Turn sharp left";
  return "Continue";
}

export default function OrbitNavigator({ route, currentPosition, onExit }) {
  const [nextWaypoint, setNextWaypoint] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [instruction, setInstruction] = useState("Optimizing route...");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [optimizedWaypoints, setOptimizedWaypoints] = useState(route?.waypoints || []);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState(Date.now());
  const lastAnnouncedRef = useRef(null);
  const optimizationIntervalRef = useRef(null);

  const waypoints = optimizedWaypoints;
  const routeCoordinates = waypoints.map(wp => [wp.lat, wp.lng]);

  // AI Route Optimization via Harbor Intelligence
  const optimizeRoute = async () => {
    if (!currentPosition || waypoints.length === 0 || isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      const destination = waypoints[waypoints.length - 1];
      
      const response = await base44.functions.invoke('harborIntelligenceAPI', {
        command: "optimize_route",
        origin: {
          lat: currentPosition.lat,
          lng: currentPosition.lng
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          name: destination.name || route.destination
        },
        current_waypoints: waypoints,
        avoid_traffic: true,
        avoid_construction: true,
        real_time_conditions: true
      });

      if (response.data?.optimized_waypoints) {
        setOptimizedWaypoints(response.data.optimized_waypoints);
        setLastOptimization(Date.now());
        toast.success("Route optimized with Harbor AI");
        announceVoice("Route updated to avoid delays");
      }
    } catch (error) {
      console.error("Route optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Initial route optimization on mount
  useEffect(() => {
    if (currentPosition && waypoints.length > 0) {
      optimizeRoute();
    }
  }, []);

  // Re-optimize every 5 minutes or when significantly off course
  useEffect(() => {
    optimizationIntervalRef.current = setInterval(() => {
      optimizeRoute();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, [currentPosition, waypoints]);

  // Calculate total route distance
  useEffect(() => {
    if (waypoints.length > 1) {
      let total = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        total += calculateDistance(
          waypoints[i].lat, waypoints[i].lng,
          waypoints[i + 1].lat, waypoints[i + 1].lng
        );
      }
      setTotalDistance(total);
    }
  }, [waypoints]);

  // Navigation logic
  useEffect(() => {
    if (!currentPosition || waypoints.length === 0) return;

    const target = waypoints[nextWaypoint];
    if (!target) return;

    const dist = calculateDistance(
      currentPosition.lat, currentPosition.lng,
      target.lat, target.lng
    );
    setDistanceToNext(dist);

    const bearing = calculateBearing(
      currentPosition.lat, currentPosition.lng,
      target.lat, target.lng
    );
    setCurrentBearing(bearing);

    // Calculate ETA
    if (currentPosition.speed && currentPosition.speed > 0) {
      const speedKmh = currentPosition.speed * 3.6;
      setAverageSpeed(speedKmh);
      const remainingDistance = dist;
      const etaMinutes = (remainingDistance / speedKmh) * 60;
      const eta = new Date(Date.now() + etaMinutes * 60000);
      setEstimatedArrival(eta);
    }

    // Check if we reached the waypoint (within 50m)
    if (dist < 0.05) {
      if (nextWaypoint < waypoints.length - 1) {
        setNextWaypoint(prev => prev + 1);
        announceVoice(`Waypoint reached. Proceeding to next destination.`);
      } else {
        announceVoice("You have arrived at your destination.");
        setInstruction("🎯 Destination reached!");
      }
      return;
    }

    // Generate turn-by-turn instruction
    if (nextWaypoint < waypoints.length - 1) {
      const nextTarget = waypoints[nextWaypoint + 1];
      const bearingToNext = calculateBearing(target.lat, target.lng, nextTarget.lat, nextTarget.lng);
      const bearingDiff = bearingToNext - bearing;
      const normalizedDiff = ((bearingDiff + 180) % 360) - 180;
      
      const direction = getDirectionInstruction(normalizedDiff);
      
      if (dist < 0.5) {
        setInstruction(`In ${Math.round(dist * 1000)}m, ${direction}`);
        
        // Voice announcement at 300m, 100m, 50m
        if (
          (dist < 0.3 && lastAnnouncedRef.current !== 300) ||
          (dist < 0.1 && lastAnnouncedRef.current !== 100) ||
          (dist < 0.05 && lastAnnouncedRef.current !== 50)
        ) {
          announceVoice(`In ${Math.round(dist * 1000)} meters, ${direction}`);
          lastAnnouncedRef.current = Math.round(dist * 1000);
        }
      } else {
        setInstruction(`Continue for ${dist.toFixed(1)} km`);
      }
    } else {
      setInstruction(`Continue to destination - ${dist.toFixed(1)} km`);
    }
  }, [currentPosition, waypoints, nextWaypoint]);

  const announceVoice = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-bold text-lg">{route?.name}</span>
                  {isOptimizing && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                      <Zap className="w-3 h-3 text-violet-400 animate-pulse" />
                      <span className="text-violet-300 text-[10px] font-semibold">AI Optimizing</span>
                    </div>
                  )}
                </div>
                <p className="text-cyan-300 text-2xl font-black mb-1">{instruction}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                  <span>{distanceToNext > 0 ? `${distanceToNext.toFixed(1)} km ahead` : ""}</span>
                  {estimatedArrival && <span>ETA {formatTime(estimatedArrival)}</span>}
                  {averageSpeed > 0 && <span>{Math.round(averageSpeed)} km/h</span>}
                  <span className="flex items-center gap-1 text-violet-400 text-xs">
                    <Zap className="w-3 h-3" />
                    Harbor AI Active
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg border transition-all ${
                    voiceEnabled
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-500"
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={onExit}
                  className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Compass indicator */}
      <div className="absolute top-32 right-4 z-10 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50">
        <div className="relative">
          <Compass 
            className="w-12 h-12 text-cyan-400" 
            style={{ transform: `rotate(${currentBearing}deg)` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ArrowUp className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">{Math.round(currentBearing)}°</p>
      </div>

      {/* Map */}
      <MapContainer
        center={currentPosition ? [currentPosition.lat, currentPosition.lng] : routeCoordinates[0]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {currentPosition && <MapAutoCenter center={[currentPosition.lat, currentPosition.lng]} />}
        
        {/* Current position with custom icon */}
        {currentPosition && (
          <Marker 
            position={[currentPosition.lat, currentPosition.lng]}
            icon={L.divIcon({
              className: 'custom-location-icon',
              html: `<div style="
                width: 20px;
                height: 20px;
                background: #22d3ee;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 20px rgba(34, 211, 238, 0.6);
                animation: pulse 2s infinite;
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-emerald-600">Your Location</p>
                {currentPosition.speed && <p>Speed: {Math.round(currentPosition.speed * 3.6)} km/h</p>}
                {currentPosition.accuracy && <p className="text-slate-500">±{Math.round(currentPosition.accuracy)}m</p>}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Waypoints */}
        {waypoints.map((wp, i) => (
          <Marker 
            key={i} 
            position={[wp.lat, wp.lng]}
            opacity={i === nextWaypoint ? 1 : 0.4}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-cyan-600">{wp.name || `Waypoint ${i + 1}`}</p>
                {i === nextWaypoint && <p className="text-emerald-600">Next destination</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route line with gradient effect */}
        {routeCoordinates.length > 1 && (
          <>
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: "#8b5cf6", weight: 8, opacity: 0.3 }}
            />
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: "#22d3ee", weight: 5, opacity: 0.9 }}
            />
          </>
        )}
      </MapContainer>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>

      {/* Bottom stats */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3 pointer-events-auto">
          <div className="p-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs mb-1">Total Distance</p>
            <p className="text-white font-bold text-lg">{totalDistance.toFixed(1)} km</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs mb-1">Next Waypoint</p>
            <p className="text-cyan-400 font-bold text-lg">{nextWaypoint + 1}/{waypoints.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs mb-1">AI Route Status</p>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className={`w-4 h-4 text-violet-400 ${isOptimizing ? 'animate-pulse' : ''}`} />
              <span className="text-violet-400 font-bold text-sm">{isOptimizing ? 'Updating' : 'Optimized'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}