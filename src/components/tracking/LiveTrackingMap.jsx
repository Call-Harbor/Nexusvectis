import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Navigation, Maximize2, Minimize2, Layers, Radio, Wifi, WifiOff,
  Ship, Truck, Plane, Train, Satellite, Activity, Zap, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createVehicleIcon = (type, status, heading = 0, isSelected = false) => {
  const colors = {
    active: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    idle: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
    maintenance: { bg: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
    offline: { bg: '#64748b', glow: 'rgba(100, 116, 139, 0.4)' },
  };

  const icons = {
    truck: `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg)"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
    ship: `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg)"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
    drone: `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg)"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/></svg>`,
    train: `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg)"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
    aircraft: `<svg viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${heading}deg)"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/></svg>`,
  };

  const color = colors[status] || colors.offline;
  const size = isSelected ? 52 : 44;

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${status === 'active' ? `
          <div style="
            position: absolute;
            inset: -4px;
            background: ${color.glow};
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
        <div style="
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${color.bg}, ${color.bg}dd);
          border: 2px solid ${isSelected ? '#fff' : color.bg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px ${color.glow}, ${isSelected ? '0 0 0 3px rgba(255,255,255,0.3)' : ''};
          color: white;
        ">
          <div style="width: 22px; height: 22px;">
            ${icons[type] || icons.truck}
          </div>
        </div>
        ${status === 'active' ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #22c55e;
            border: 2px solid #0f172a;
            border-radius: 50%;
            animation: blink 1s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

function MapController({ selectedVehicle, followMode, isFullscreen }) {
  const map = useMap();
  
  useEffect(() => {
    if (followMode && selectedVehicle?.latitude && selectedVehicle?.longitude) {
      map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 10, {
        duration: 1
      });
    }
  }, [selectedVehicle?.latitude, selectedVehicle?.longitude, followMode, map]);

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [isFullscreen, map]);

  return null;
}

function VehicleTrail({ positions, color }) {
  if (!positions || positions.length < 2) return null;
  
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10',
      }}
    />
  );
}

export default function LiveTrackingMap({ 
  vehicles = [], 
  selectedVehicle, 
  onSelectVehicle,
  vehicleTrails = {},
  signalStatus = {}
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [followMode, setFollowMode] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showSignalRange, setShowSignalRange] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState({
    truck: true, ship: true, drone: true, train: true, aircraft: true
  });
  const [mapStyle, setMapStyle] = useState('dark');
  
  const validVehicles = vehicles.filter(v => 
    v?.latitude && v?.longitude && visibleTypes[v.type]
  );
  
  const center = selectedVehicle?.latitude && selectedVehicle?.longitude
    ? [selectedVehicle.latitude, selectedVehicle.longitude]
    : validVehicles.length > 0 
      ? [validVehicles[0].latitude, validVehicles[0].longitude]
      : [55.6761, 12.5683];

  // Don't render map until we have valid data
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="h-[600px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center">
        <div className="text-center">
          <Satellite className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No vehicles to track</p>
        </div>
      </div>
    );
  }

  const mapStyles = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  };

  const typeColors = {
    truck: '#10b981',
    ship: '#3b82f6',
    drone: '#f59e0b',
    train: '#8b5cf6',
    aircraft: '#ef4444',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-slate-900/50 backdrop-blur-xl overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full rounded-2xl border border-slate-700/50'
      }`}
    >
      {/* Top Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Live Tracking</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">LIVE</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <span className="text-xs text-slate-400">{validVehicles.length} units</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800"
            >
              <Layers className="w-4 h-4 mr-2" />
              Layers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-slate-700 text-white">
            <DropdownMenuLabel>Map Style</DropdownMenuLabel>
            <DropdownMenuCheckboxItem 
              checked={mapStyle === 'dark'} 
              onCheckedChange={() => setMapStyle('dark')}
            >
              Dark Mode
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={mapStyle === 'satellite'} 
              onCheckedChange={() => setMapStyle('satellite')}
            >
              Satellite
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={mapStyle === 'light'} 
              onCheckedChange={() => setMapStyle('light')}
            >
              Light Mode
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuLabel>Vehicle Types</DropdownMenuLabel>
            {Object.entries(visibleTypes).map(([type, visible]) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={visible}
                onCheckedChange={(checked) => setVisibleTypes(prev => ({...prev, [type]: checked}))}
              >
                <span className="capitalize">{type}s</span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={showTrails} onCheckedChange={setShowTrails}>
              Show Trails
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showSignalRange} onCheckedChange={setShowSignalRange}>
              Show Signal Range
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="outline"
          className={`bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800 ${followMode ? 'bg-cyan-500/20 border-cyan-500/50' : ''}`}
          onClick={() => setFollowMode(!followMode)}
        >
          <Navigation className={`w-4 h-4 ${followMode ? 'text-cyan-400' : ''}`} />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-slate-900/90 border-slate-700/50 text-white hover:bg-slate-800"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Signal Status Panel */}
      {selectedVehicle && (selectedVehicle.signal_strength || 0) > 0 && (
        <div className="absolute top-20 right-4 z-[1000] w-64">
          <div className="p-4 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Signal Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">GPS Signal</span>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full ${i <= Math.ceil((selectedVehicle.signal_strength || 0) / 20) ? 'bg-emerald-400' : 'bg-slate-600'}`}
                      style={{ height: `${i * 3 + 4}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Data Link</span>
                <Badge variant="outline" className={`${(selectedVehicle.signal_strength || 0) > 50 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'} text-xs`}>
                  {(selectedVehicle.signal_strength || 0) > 50 ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Weak Signal
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Last Update</span>
                <span className="text-xs text-white">2s ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Heading</span>
                <span className="text-xs text-white">{selectedVehicle.heading || 0}°</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {Object.entries(visibleTypes).filter(([_, v]) => v).map(([type]) => {
              const count = vehicles.filter(v => v.type === type && v.status === 'active').length;
              const total = vehicles.filter(v => v.type === type).length;
              return (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="backdrop-blur-xl bg-slate-900/80"
                  style={{ borderColor: typeColors[type], color: typeColors[type] }}
                >
                  <span className="capitalize">{type}</span>: {count}/{total}
                </Badge>
              );
            })}
          </div>
          
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700/50">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Active: {vehicles.filter(v => v.status === 'active').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400">Idle: {vehicles.filter(v => v.status === 'idle').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-400">Offline: {vehicles.filter(v => v.status === 'offline').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#0a0f1c' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url={mapStyles[mapStyle]}
        />
        
        <MapController selectedVehicle={selectedVehicle} followMode={followMode} isFullscreen={isFullscreen} />

        {/* Vehicle Trails */}
        {showTrails && Object.entries(vehicleTrails).map(([vehicleId, positions]) => {
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (!vehicle) return null;
          return (
            <VehicleTrail 
              key={vehicleId} 
              positions={positions} 
              color={typeColors[vehicle.type] || '#10b981'} 
            />
          );
        })}

        {/* Signal Range Circles */}
        {showSignalRange && validVehicles.filter(v => v.status === 'active').map(vehicle => (
          <Circle
            key={`range-${vehicle.id}`}
            center={[vehicle.latitude, vehicle.longitude]}
            radius={vehicle.type === 'ship' ? 50000 : vehicle.type === 'aircraft' ? 100000 : 20000}
            pathOptions={{
              color: typeColors[vehicle.type],
              fillColor: typeColors[vehicle.type],
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '5, 5',
            }}
          />
        ))}

        {/* Vehicle Markers */}
        {validVehicles.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={createVehicleIcon(
              vehicle.type, 
              vehicle.status, 
              vehicle.heading || 0,
              selectedVehicle?.id === vehicle.id
            )}
            eventHandlers={{
              click: () => onSelectVehicle && onSelectVehicle(vehicle)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[250px] bg-slate-900 text-white rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: typeColors[vehicle.type] }}
                  />
                  <h4 className="font-semibold">{vehicle.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Speed:</span>
                    <span className="ml-1 text-white">{vehicle.speed || 0} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Heading:</span>
                    <span className="ml-1 text-white">{vehicle.heading || 0}°</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Fuel:</span>
                    <span className="ml-1 text-white">{vehicle.fuel_level || 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <span className="ml-1 text-white capitalize">{vehicle.status}</span>
                  </div>
                </div>
                {vehicle.destination && (
                  <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                    <span className="text-slate-400">Destination:</span>
                    <span className="ml-1 text-white">{vehicle.destination}</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}