import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Point-in-polygon algorithm
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    const intersect = ((yi > point.lng) !== (yj > point.lng))
      && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance between two points (Haversine)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function isPointInCircle(point, center, radius) {
  const distance = getDistance(point.lat, point.lng, center.lat, center.lng);
  return distance <= radius;
}

export function useGeofenceMonitor(currentPosition, geofences, user, org, vehicleId) {
  const insideZonesRef = useRef(new Set());

  useEffect(() => {
    if (!currentPosition || !geofences || geofences.length === 0 || !user || !org) return;

    const checkGeofences = async () => {
      for (const fence of geofences) {
        if (!fence.active) continue;

        let isInside = false;

        // Check if inside zone
        if (fence.radius && fence.center) {
          isInside = isPointInCircle(currentPosition, fence.center, fence.radius);
        } else if (fence.coordinates && fence.coordinates.length > 0) {
          isInside = isPointInPolygon(currentPosition, fence.coordinates);
        }

        const wasInside = insideZonesRef.current.has(fence.id);

        // Entry event
        if (isInside && !wasInside) {
          insideZonesRef.current.add(fence.id);
          
          if (fence.notify_on_entry) {
            toast.success(fence.entry_message || `Entered ${fence.name}`, {
              duration: 5000,
            });

            // Log event
            try {
              await base44.entities.GeoFenceEvent.create({
                organization_id: org.id,
                geofence_id: fence.id,
                geofence_name: fence.name,
                vehicle_id: vehicleId,
                driver_email: user.email,
                event_type: "entry",
                timestamp: new Date().toISOString(),
                location: {
                  lat: currentPosition.lat,
                  lng: currentPosition.lng
                },
                notified: true
              });
            } catch (error) {
              console.error("Failed to log geofence entry:", error);
            }
          }
        }

        // Exit event
        if (!isInside && wasInside) {
          insideZonesRef.current.delete(fence.id);
          
          if (fence.notify_on_exit) {
            toast.info(fence.exit_message || `Left ${fence.name}`, {
              duration: 5000,
            });

            // Log event
            try {
              await base44.entities.GeoFenceEvent.create({
                organization_id: org.id,
                geofence_id: fence.id,
                geofence_name: fence.name,
                vehicle_id: vehicleId,
                driver_email: user.email,
                event_type: "exit",
                timestamp: new Date().toISOString(),
                location: {
                  lat: currentPosition.lat,
                  lng: currentPosition.lng
                },
                notified: true
              });
            } catch (error) {
              console.error("Failed to log geofence exit:", error);
            }
          }
        }
      }
    };

    checkGeofences();
  }, [currentPosition, geofences, user, org, vehicleId]);
}