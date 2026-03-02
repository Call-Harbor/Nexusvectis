import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import L from 'leaflet';

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NexusVectis-TMS/1.0' } });
  const data = await res.json();
  return data.map(item => ({
    name: item.display_name.split(',').slice(0, 2).join(',').trim(),
    fullName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

// Draggable Marker Component
function DraggableMarker({ position, index, onDragEnd, onDelete, isFirst, isLast }) {
  const [dragging, setDragging] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.on('dragstart', () => setDragging(true));
      marker.on('dragend', () => {
        setDragging(false);
        const newPos = marker.getLatLng();
        onDragEnd(index, newPos);
      });
    }
  }, [index, onDragEnd]);

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="relative">
      <div class="${dragging ? 'scale-125' : ''} transition-transform w-8 h-8 rounded-full ${
        isFirst ? 'bg-emerald-500' : isLast ? 'bg-red-500' : 'bg-cyan-500'
      } border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm">
        ${index + 1}
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          onDragEnd(index, newPos);
        }
      }}
    />
  );
}

// Click to Add Waypoint
function MapClickHandler({ onMapClick, isAddMode }) {
  useMapEvents({
    click: (e) => {
      if (isAddMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Draggable Midpoint Markers
function EditablePolyline({ waypoints, onAddWaypoint }) {
  const map = useMap();
  const [midpoints, setMidpoints] = useState([]);
  const [hoveredMidpoint, setHoveredMidpoint] = useState(null);

  useEffect(() => {
    if (waypoints.length < 2) {
      setMidpoints([]);
      return;
    }

    const mids = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;
      mids.push({ lat: midLat, lng: midLng, insertIndex: i + 1 });
    }
    setMidpoints(mids);
  }, [waypoints]);

  const createMidpointIcon = (isHovered) => {
    return L.divIcon({
      className: 'midpoint-marker',
      html: `<div class="${isHovered ? 'scale-125' : 'scale-100'} transition-transform w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg opacity-${isHovered ? '100' : '60'}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  return (
    <>
      <Polyline
        positions={waypoints.map(w => [w.lat, w.lng])}
        color="#06b6d4"
        weight={4}
        opacity={0.8}
      />
      {midpoints.map((mid, idx) => (
        <Marker
          key={`mid-${idx}`}
          position={[mid.lat, mid.lng]}
          icon={createMidpointIcon(hoveredMidpoint === idx)}
          draggable={true}
          eventHandlers={{
            mouseover: () => setHoveredMidpoint(idx),
            mouseout: () => setHoveredMidpoint(null),
            dragend: (e) => {
              const pos = e.target.getLatLng();
              onAddWaypoint(mid.insertIndex, pos);
            }
          }}
        />
      ))}
    </>
  );
}

function WaypointSearch({ onSelect, placeholder, className }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const r = await geocodeAddress(val);
      setResults(r);
      setOpen(true);
      setLoading(false);
    }, 400);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />}
        <Input
          value={query}
          onChange={handleChange}
          placeholder={placeholder || "Search location..."}
          className="pl-9 pr-9 bg-slate-800 border-slate-700 text-white text-sm"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
              onClick={() => {
                onSelect(r);
                setQuery(r.name);
                setOpen(false);
                setResults([]);
              }}
            >
              <div className="text-white font-medium">{r.name}</div>
              <div className="text-slate-400 text-xs truncate">{r.fullName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdvancedRouteEditor({ initialWaypoints = [], onSave, onCancel }) {
  const [waypoints, setWaypoints] = useState(
    initialWaypoints.length > 0 ? initialWaypoints : []
  );
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempName, setTempName] = useState('');

  const handleMapClick = (latlng) => {
    const newWaypoint = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Stop ${waypoints.length + 1}`
    };
    setWaypoints([...waypoints, newWaypoint]);
    setIsAddMode(false);
  };

  const handleDragEnd = (index, newPos) => {
    const updated = [...waypoints];
    updated[index] = {
      ...updated[index],
      lat: newPos.lat,
      lng: newPos.lng
    };
    setWaypoints(updated);
  };

  const handleDelete = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const handleAddWaypoint = (insertIndex, latlng) => {
    const newWaypoint = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Stop ${waypoints.length + 1}`
    };
    const updated = [...waypoints];
    updated.splice(insertIndex, 0, newWaypoint);
    setWaypoints(updated);
  };

  const handleNameChange = (index, newName) => {
    const updated = [...waypoints];
    updated[index].name = newName;
    setWaypoints(updated);
  };

  const moveWaypoint = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === waypoints.length - 1)
    ) {
      return;
    }
    const updated = [...waypoints];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setWaypoints(updated);
  };

  const mapCenter = waypoints.length > 0 
    ? [waypoints[0].lat, waypoints[0].lng]
    : [55.6761, 12.5683]; // Copenhagen default

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative">
        <div className="h-96 rounded-lg overflow-hidden border-2 border-cyan-500/30">
          <MapContainer
            center={mapCenter}
            zoom={waypoints.length > 0 ? 6 : 8}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapClickHandler onMapClick={handleMapClick} isAddMode={isAddMode} />
            
            {waypoints.length > 1 && (
              <EditablePolyline 
                waypoints={waypoints} 
                onAddWaypoint={handleAddWaypoint}
              />
            )}
            
            {waypoints.map((waypoint, idx) => (
              <DraggableMarker
                key={idx}
                position={[waypoint.lat, waypoint.lng]}
                index={idx}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
                isFirst={idx === 0}
                isLast={idx === waypoints.length - 1}
              />
            ))}
          </MapContainer>
        </div>
        
        {/* Add Mode Overlay */}
        {isAddMode && (
          <div className="absolute inset-0 bg-cyan-500/10 border-2 border-cyan-500 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900 px-4 py-2 rounded-lg text-cyan-400 font-medium">
              Click on map to add waypoint
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className={cn(
            "flex-1",
            isAddMode 
              ? "bg-cyan-500 hover:bg-cyan-600" 
              : "bg-slate-700 hover:bg-slate-600"
          )}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAddMode ? 'Click Map to Add' : 'Add Waypoint'}
        </Button>
        <Button
          onClick={() => setWaypoints([])}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
          disabled={waypoints.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Waypoints List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <Label className="text-slate-400">Waypoints ({waypoints.length})</Label>
        {waypoints.map((waypoint, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => moveWaypoint(idx, -1)}
                disabled={idx === 0}
              >
                ▲
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => moveWaypoint(idx, 1)}
                disabled={idx === waypoints.length - 1}
              >
                ▼
              </Button>
            </div>
            
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
              idx === 0 ? 'bg-emerald-500' : idx === waypoints.length - 1 ? 'bg-red-500' : 'bg-cyan-500'
            )}>
              {idx + 1}
            </div>
            
            {editingIndex === idx ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  handleNameChange(idx, tempName);
                  setEditingIndex(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleNameChange(idx, tempName);
                    setEditingIndex(null);
                  }
                }}
                className="flex-1 bg-slate-900 border-cyan-500/50 h-8"
                autoFocus
              />
            ) : (
              <div
                className="flex-1 cursor-pointer hover:text-cyan-400 transition-colors"
                onClick={() => {
                  setEditingIndex(idx);
                  setTempName(waypoint.name);
                }}
              >
                <div className="font-medium text-white">{waypoint.name}</div>
                <div className="text-xs text-slate-500">
                  {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                </div>
              </div>
            )}
            
            <Button
              size="icon"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              onClick={() => handleDelete(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        {waypoints.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No waypoints yet. Click "Add Waypoint" and then click on the map.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-700">
        <Button
          onClick={() => onSave(waypoints)}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
          disabled={waypoints.length < 2}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Route ({waypoints.length} waypoints)
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-slate-600"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}