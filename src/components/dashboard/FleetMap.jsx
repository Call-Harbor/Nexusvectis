import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { motion } from "framer-motion";
import { Truck, Ship, Plane, Train, Navigation, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createVehicleIcon = (type, status) => {
  const colors = {
    active: '#10b981',
    idle: '#f59e0b',
    maintenance: '#8b5cf6',
    offline: '#64748b',
  };

  const icons = {
    truck: '🚛',
    ship: '🚢',
    drone: '🚁',
    train: '🚂',
    aircraft: '✈️',
  };

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${colors[status]}40, ${colors[status]}20);
        border: 2px solid ${colors[status]};
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 0 20px ${colors[status]}40;
      ">
        ${icons[type] || '📍'}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function MapController({ selectedVehicle }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedVehicle?.latitude && selectedVehicle?.longitude) {
      map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 8, {
        duration: 1.5
      });
    }
  }, [selectedVehicle, map]);

  return null;
}

export default function FleetMap({ vehicles, selectedVehicle, onSelectVehicle }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const validVehicles = vehicles.filter(v => v.latitude && v.longitude);
  
  const center = selectedVehicle?.latitude && selectedVehicle?.longitude
    ? [selectedVehicle.latitude, selectedVehicle.longitude]
    : validVehicles.length > 0 
      ? [validVehicles[0].latitude, validVehicles[0].longitude]
      : [55.6761, 12.5683]; // Default to Copenhagen

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : 'h-[500px]'
      }`}
    >
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Live Tracking</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          size="sm"
          variant="outline"
          className="bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
        {['active', 'idle', 'maintenance', 'offline'].map(status => {
          const count = vehicles.filter(v => v.status === status).length;
          const colors = {
            active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            idle: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            maintenance: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            offline: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          };
          const labels = { active: 'Aktiv', idle: 'Standby', maintenance: 'Vedligehold', offline: 'Offline' };
          return (
            <Badge key={status} variant="outline" className={`${colors[status]} backdrop-blur-xl`}>
              {labels[status]}: {count}
            </Badge>
          );
        })}
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#0a0f1c' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController selectedVehicle={selectedVehicle} />

        {validVehicles.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createVehicleIcon(vehicle.type, vehicle.status)}
            eventHandlers={{
              click: () => onSelectVehicle && onSelectVehicle(vehicle)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <h4 className="font-semibold text-slate-900">{vehicle.name}</h4>
                <p className="text-sm text-slate-600">{vehicle.destination || 'Ingen destination'}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>Hastighed: {vehicle.speed || 0} km/t</span>
                  <span>•</span>
                  <span>Brændstof: {vehicle.fuel_level || 0}%</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}