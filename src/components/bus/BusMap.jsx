import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bus, MapPin } from "lucide-react";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function BusMap({ buses = [], routes = [], stops = [], selectedBus, onSelectBus }) {
  const mapRef = useRef(null);

  // Default center (Copenhagen)
  const center = [55.6761, 12.5683];

  // Custom bus icon
  const busIcon = (bus) => L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full ${
          bus.status === 'active' ? 'bg-emerald-500' : 
          bus.status === 'delayed' ? 'bg-amber-500' : 'bg-slate-500'
        } flex items-center justify-center shadow-lg border-2 border-white">
          <span class="text-white text-xs font-bold">${bus.bus_number || '?'}</span>
        </div>
        ${bus.delay_minutes > 5 ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>' : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Custom stop icon
  const stopIcon = L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg"></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude && mapRef.current) {
      mapRef.current.setView([selectedBus.latitude, selectedBus.longitude], 15);
    }
  }, [selectedBus]);

  return (
    <div className="relative h-[calc(100vh-16rem)] rounded-2xl overflow-hidden border border-slate-700">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Stops */}
        {stops.map(stop => (
          stop.latitude && stop.longitude && (
            <CircleMarker
              key={stop.id}
              center={[stop.latitude, stop.longitude]}
              radius={6}
              pathOptions={{
                fillColor: '#06b6d4',
                color: 'white',
                weight: 2,
                fillOpacity: 0.8
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-cyan-600">{stop.stop_name}</div>
                  <div className="text-slate-600">{stop.stop_code}</div>
                  {stop.routes_serving && stop.routes_serving.length > 0 && (
                    <div className="mt-1 text-xs text-slate-500">
                      Routes: {stop.routes_serving.join(', ')}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Route paths */}
        {routes.map(route => (
          route.waypoints && route.waypoints.length > 1 && (
            <Polyline
              key={route.id}
              positions={route.waypoints.map(w => [w.lat, w.lng])}
              pathOptions={{
                color: '#8b5cf6',
                weight: 3,
                opacity: 0.5,
                dashArray: '5, 10'
              }}
            />
          )
        ))}

        {/* Buses */}
        {buses.map(bus => (
          bus.latitude && bus.longitude && (
            <Marker
              key={bus.id}
              position={[bus.latitude, bus.longitude]}
              icon={busIcon(bus)}
              eventHandlers={{
                click: () => onSelectBus(bus)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-emerald-600">Bus {bus.bus_number}</div>
                  <div className="text-slate-600">{bus.bus_type?.replace('_', ' ')}</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passengers:</span>
                      <span className="font-semibold">{bus.current_passengers || 0}/{bus.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speed:</span>
                      <span className="font-semibold">{bus.speed || 0} km/h</span>
                    </div>
                    {bus.delay_minutes !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delay:</span>
                        <span className={`font-semibold ${bus.delay_minutes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {bus.delay_minutes > 0 ? '+' : ''}{bus.delay_minutes} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-lg p-4 text-sm">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span className="text-slate-300">Active Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-slate-300">Delayed Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
            <span className="text-slate-300">Bus Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-violet-500" style={{ opacity: 0.5 }}></div>
            <span className="text-slate-300">Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}