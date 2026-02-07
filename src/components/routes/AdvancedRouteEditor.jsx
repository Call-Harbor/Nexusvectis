import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import L from 'leaflet';

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
            
            {waypoints.length > 1 && (
              <Polyline
                positions={waypoints.map(w => [w.lat, w.lng])}
                color="#06b6d4"
                weight={3}
              />
            )}
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