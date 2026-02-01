import { useState, useEffect, useCallback, useRef } from 'react';

// Realistic route waypoints for different vehicle types
const routeTemplates = {
  truck: [
    { lat: 55.6761, lng: 12.5683 },
    { lat: 55.7, lng: 12.3 },
    { lat: 55.8, lng: 11.8 },
    { lat: 55.9, lng: 11.2 },
    { lat: 56.0, lng: 10.8 },
    { lat: 56.1629, lng: 10.2039 },
  ],
  ship: [
    { lat: 57.0, lng: 10.0 },
    { lat: 56.5, lng: 8.0 },
    { lat: 55.5, lng: 6.0 },
    { lat: 54.0, lng: 4.5 },
    { lat: 52.5, lng: 4.0 },
    { lat: 51.9, lng: 4.5 },
  ],
  aircraft: [
    { lat: 55.618, lng: 12.656 },
    { lat: 54.5, lng: 11.5 },
    { lat: 53.5, lng: 10.5 },
    { lat: 52.5, lng: 9.5 },
    { lat: 51.5, lng: 9.0 },
    { lat: 50.033, lng: 8.570 },
  ],
  train: [
    { lat: 55.6761, lng: 12.5683 },
    { lat: 55.5, lng: 11.5 },
    { lat: 55.4, lng: 10.4 },
    { lat: 55.5, lng: 9.5 },
  ],
  drone: [
    { lat: 55.68, lng: 12.55 },
    { lat: 55.69, lng: 12.54 },
    { lat: 55.70, lng: 12.53 },
    { lat: 55.71, lng: 12.52 },
    { lat: 55.72, lng: 12.51 },
    { lat: 55.73, lng: 12.50 },
  ],
};

const speedRanges = {
  truck: { min: 60, max: 100 },
  ship: { min: 15, max: 30 },
  aircraft: { min: 400, max: 900 },
  train: { min: 100, max: 180 },
  drone: { min: 30, max: 60 },
};

function calculateHeading(from, to) {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let heading = Math.atan2(y, x) * 180 / Math.PI;
  return (heading + 360) % 360;
}

function interpolatePosition(waypoints, progress) {
  if (waypoints.length < 2) return waypoints[0] || { lat: 55.6761, lng: 12.5683 };
  
  const totalSegments = waypoints.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const segmentFraction = segmentProgress - currentSegment;
  
  const start = waypoints[currentSegment];
  const end = waypoints[currentSegment + 1];
  
  return {
    lat: start.lat + (end.lat - start.lat) * segmentFraction,
    lng: start.lng + (end.lng - start.lng) * segmentFraction,
    heading: calculateHeading(start, end),
  };
}

export function useVehicleSimulation(initialVehicles, updateInterval = 2000) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [vehicleTrails, setVehicleTrails] = useState({});
  const vehicleStateRef = useRef({});

  useEffect(() => {
    const states = {};
    initialVehicles.forEach(vehicle => {
      if (!vehicleStateRef.current[vehicle.id]) {
        states[vehicle.id] = {
          progress: Math.random(),
          direction: 1,
          route: routeTemplates[vehicle.type] || routeTemplates.truck,
          lastUpdate: Date.now(),
        };
      }
    });
    vehicleStateRef.current = { ...vehicleStateRef.current, ...states };
  }, [initialVehicles]);

  const updateVehicles = useCallback(() => {
    setVehicles(prevVehicles => {
      return prevVehicles.map(vehicle => {
        if (vehicle.status !== 'active') {
          return vehicle;
        }

        const state = vehicleStateRef.current[vehicle.id];
        if (!state) return vehicle;

        const speedRange = speedRanges[vehicle.type] || speedRanges.truck;
        const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
        
        const progressIncrement = (speed / 10000) * state.direction;
        let newProgress = state.progress + progressIncrement;
        
        if (newProgress >= 1) {
          newProgress = 1;
          state.direction = -1;
        } else if (newProgress <= 0) {
          newProgress = 0;
          state.direction = 1;
        }
        
        state.progress = newProgress;
        
        const position = interpolatePosition(state.route, newProgress);
        
        const noise = {
          lat: (Math.random() - 0.5) * 0.001,
          lng: (Math.random() - 0.5) * 0.001,
        };
        
        const fuelConsumption = (speed / 1000) * (Math.random() * 0.5 + 0.5);
        const newFuel = Math.max(5, (vehicle.fuel_level || 100) - fuelConsumption);
        
        return {
          ...vehicle,
          latitude: position.lat + noise.lat,
          longitude: position.lng + noise.lng,
          heading: Math.round(position.heading),
          speed: Math.round(speed),
          fuel_level: Math.round(newFuel * 10) / 10,
        };
      });
    });

    setVehicleTrails(prevTrails => {
      const newTrails = { ...prevTrails };
      vehicles.forEach(vehicle => {
        if (vehicle.status === 'active' && vehicle.latitude && vehicle.longitude) {
          const trail = newTrails[vehicle.id] || [];
          const newPosition = [vehicle.latitude, vehicle.longitude];
          
          if (trail.length === 0 || 
              trail[trail.length - 1][0] !== newPosition[0] || 
              trail[trail.length - 1][1] !== newPosition[1]) {
            newTrails[vehicle.id] = [...trail.slice(-50), newPosition];
          }
        }
      });
      return newTrails;
    });
  }, [vehicles]);

  useEffect(() => {
    const interval = setInterval(updateVehicles, updateInterval);
    return () => clearInterval(interval);
  }, [updateVehicles, updateInterval]);

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  return { vehicles, vehicleTrails };
}