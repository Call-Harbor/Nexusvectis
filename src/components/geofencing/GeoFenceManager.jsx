import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, useMapEvents } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Plus, X, MapPin, Edit, Trash2, Save, Circle as CircleIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DrawingHandler({ isDrawing, onPointAdd, drawingMode }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onPointAdd(e.latlng);
      }
    },
  });
  return null;
}

export default function GeoFenceManager({ org, onClose }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState("polygon"); // polygon or circle
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [editingZone, setEditingZone] = useState(null);
  const [newZone, setNewZone] = useState({
    name: "",
    description: "",
    zone_type: "checkpoint",
    notify_on_entry: true,
    notify_on_exit: true,
    entry_message: "You have entered the zone",
    exit_message: "You have left the zone"
  });
  const queryClient = useQueryClient();

  const { data: geofences = [] } = useQuery({
    queryKey: ["geofences", org?.id],
    queryFn: () => org?.id ? base44.entities.GeoFence.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GeoFence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["geofences"]);
      toast.success("Geofence created!");
      resetDrawing();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GeoFence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["geofences"]);
      toast.success("Geofence deleted");
    },
  });

  const handlePointAdd = (latlng) => {
    if (drawingMode === "circle") {
      if (drawingPoints.length === 0) {
        setDrawingPoints([latlng]);
        toast.info("Click again to set radius");
      } else {
        const center = drawingPoints[0];
        const radius = center.distanceTo(latlng);
        saveCircleZone(center, radius);
      }
    } else {
      setDrawingPoints([...drawingPoints, latlng]);
    }
  };

  const saveCircleZone = (center, radius) => {
    if (!newZone.name.trim()) {
      toast.error("Please enter a zone name first");
      return;
    }

    createMutation.mutate({
      organization_id: org.id,
      ...newZone,
      center: { lat: center.lat, lng: center.lng },
      radius: Math.round(radius),
      coordinates: [] // Empty for circle zones
    });
  };

  const finishPolygon = () => {
    if (drawingPoints.length < 3) {
      toast.error("Need at least 3 points for a polygon");
      return;
    }
    if (!newZone.name.trim()) {
      toast.error("Please enter a zone name first");
      return;
    }

    const coords = drawingPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    const center = {
      lat: coords.reduce((sum, p) => sum + p.lat, 0) / coords.length,
      lng: coords.reduce((sum, p) => sum + p.lng, 0) / coords.length
    };

    createMutation.mutate({
      organization_id: org.id,
      ...newZone,
      coordinates: coords,
      center
    });
  };

  const resetDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
    setNewZone({
      name: "",
      description: "",
      zone_type: "checkpoint",
      notify_on_entry: true,
      notify_on_exit: true,
      entry_message: "You have entered the zone",
      exit_message: "You have left the zone"
    });
  };

  const zoneColors = {
    loading: "#22d3ee",
    unloading: "#a78bfa",
    warehouse: "#f59e0b",
    checkpoint: "#10b981",
    restricted: "#ef4444",
    service_area: "#8b5cf6"
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-700/50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-white font-bold text-lg">Geofence Manager</h2>
                <p className="text-slate-400 text-xs">Draw zones and manage notifications</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            {/* Create New Zone */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <h3 className="text-white font-bold mb-3 text-sm">Create New Zone</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Zone name"
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-sm"
                />
                <select
                  value={newZone.zone_type}
                  onChange={(e) => setNewZone({...newZone, zone_type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-sm"
                >
                  <option value="loading">Loading Zone</option>
                  <option value="unloading">Unloading Zone</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="checkpoint">Checkpoint</option>
                  <option value="restricted">Restricted Area</option>
                  <option value="service_area">Service Area</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDrawingMode("polygon");
                      setIsDrawing(true);
                      setDrawingPoints([]);
                    }}
                    disabled={isDrawing && drawingMode === "polygon"}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isDrawing && drawingMode === "polygon"
                        ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                        : "bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Draw Polygon
                  </button>
                  <button
                    onClick={() => {
                      setDrawingMode("circle");
                      setIsDrawing(true);
                      setDrawingPoints([]);
                    }}
                    disabled={isDrawing && drawingMode === "circle"}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isDrawing && drawingMode === "circle"
                        ? "bg-violet-500/30 border border-violet-500/50 text-violet-300"
                        : "bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    Draw Circle
                  </button>
                </div>

                {isDrawing && (
                  <div className="space-y-2">
                    <p className="text-cyan-400 text-xs">
                      {drawingMode === "polygon" 
                        ? `${drawingPoints.length} points • Click map to add points`
                        : drawingPoints.length === 0 
                          ? "Click map to set center"
                          : "Click map to set radius"}
                    </p>
                    {drawingMode === "polygon" && drawingPoints.length >= 3 && (
                      <button
                        onClick={finishPolygon}
                        className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30"
                      >
                        <Save className="w-4 h-4 inline mr-2" />
                        Save Zone
                      </button>
                    )}
                    <button
                      onClick={resetDrawing}
                      className="w-full py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Zones */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <h3 className="text-white font-bold mb-3 text-sm">Active Geofences ({geofences.length})</h3>
              <div className="space-y-2">
                {geofences.map((fence) => (
                  <div key={fence.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{fence.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{backgroundColor: zoneColors[fence.zone_type]}}
                          />
                          <span className="text-slate-400 text-xs">{fence.zone_type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(fence.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {fence.description && (
                      <p className="text-slate-500 text-xs">{fence.description}</p>
                    )}
                  </div>
                ))}
                {geofences.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">No geofences yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-700/50">
            <MapContainer
              center={[55.6761, 12.5683]} // Copenhagen
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <DrawingHandler 
                isDrawing={isDrawing} 
                onPointAdd={handlePointAdd}
                drawingMode={drawingMode}
              />

              {/* Existing geofences */}
              {geofences.map((fence) => {
                const color = zoneColors[fence.zone_type] || "#22d3ee";
                if (fence.radius && fence.center) {
                  return (
                    <Circle
                      key={fence.id}
                      center={[fence.center.lat, fence.center.lng]}
                      radius={fence.radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold">{fence.name}</p>
                          <p className="text-slate-600">{fence.zone_type}</p>
                          <p className="text-slate-500 text-[10px] mt-1">Radius: {fence.radius}m</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                } else if (fence.coordinates?.length > 0) {
                  const positions = fence.coordinates.map(c => [c.lat, c.lng]);
                  return (
                    <Polygon
                      key={fence.id}
                      positions={positions}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold">{fence.name}</p>
                          <p className="text-slate-600">{fence.zone_type}</p>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                }
                return null;
              })}

              {/* Drawing preview */}
              {isDrawing && drawingMode === "polygon" && drawingPoints.length > 0 && (
                <>
                  {drawingPoints.map((point, i) => (
                    <Marker key={i} position={[point.lat, point.lng]} />
                  ))}
                  {drawingPoints.length > 1 && (
                    <Polygon
                      positions={drawingPoints.map(p => [p.lat, p.lng])}
                      pathOptions={{ color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.2 }}
                    />
                  )}
                </>
              )}
              {isDrawing && drawingMode === "circle" && drawingPoints.length > 0 && (
                <Marker position={[drawingPoints[0].lat, drawingPoints[0].lng]} />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}