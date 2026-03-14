import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimatePresence } from "framer-motion";
import RouteHologramCard from "./RouteHologramCard";
import ResourceHologramCard from "./ResourceHologramCard";
import VehicleHologramCard from "./VehicleHologramCard";

const STATUS_COLORS = {
  active:      { int: 0x00ffff, hex: "#00ffff", glow: 0x00ccff },
  idle:        { int: 0xffaa00, hex: "#ffaa00", glow: 0xff8800 },
  maintenance: { int: 0xff6600, hex: "#ff6600", glow: 0xff4400 },
  offline:     { int: 0x444466, hex: "#444466", glow: 0x333355 },
};

function latLngToVec3(lat, lng, r = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function createHolographicArc(lat1, lng1, lat2, lng2, color = 0x00ffff) {
  const r = 1.03;
  const a = latLngToVec3(lat1, lng1, r);
  const b = latLngToVec3(lat2, lng2, r);
  const mid = a.clone().add(b).normalize().multiplyScalar(r + 0.2);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const points = curve.getPoints(100);
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.7,
    linewidth: 2
  });
  
  return new THREE.Line(geometry, material);
}

export default function FuturisticGlobe({ vehicles = [], routes = [], resources = [], digitalTwins = [], onSelectVehicle, onSelectResource }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [visibleRoutes, setVisibleRoutes] = useState([]);
  const [visibleResources, setVisibleResources] = useState([]);
  const [visibleVehicles, setVisibleVehicles] = useState([]);
  const lastVisibleCountRef = useRef(0);
  const lastVisibleResourcesCountRef = useRef(0);
  const lastVisibleVehiclesCountRef = useRef(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 800;
    const H = el.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0.5, 3.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe group
    const globe = new THREE.Group();
    scene.add(globe);

    // ══════════════════════════════════════════════════════════════
    // HOLOGRAPHIC EARTH SPHERE
    // ══════════════════════════════════════════════════════════════
    const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
    
    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
      () => {
        renderer.render(scene, camera);
      }
    );
    
    // Main holographic material with texture - high contrast
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      color: 0xffffff,
      emissive: 0x004477,
      emissiveIntensity: 0.3,
      specular: 0x00ffff,
      shininess: 60,
      transparent: false,
      opacity: 1.0,
      wireframe: false
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    globe.add(earth);

    // Glowing holographic grid overlay - more subtle
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.02,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const gridSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 48, 24),
      gridMaterial
    );
    globe.add(gridSphere);

    // Pulsing latitude rings (equator, tropics, polar circles)
    const latitudes = [0, 23.5, -23.5, 66.5, -66.5];
    const latRings = [];
    latitudes.forEach((lat, idx) => {
      const y = Math.sin(lat * Math.PI / 180);
      const r = Math.cos(lat * Math.PI / 180) * 1.006;
      const points = [];
      for (let i = 0; i <= 256; i++) {
        const angle = (i / 256) * Math.PI * 2;
        points.push(new THREE.Vector3(
          r * Math.cos(angle),
          y,
          r * Math.sin(angle)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: lat === 0 ? 0x00ffff : 0x0088ff,
        transparent: true,
        opacity: lat === 0 ? 0.6 : 0.3
      });
      const ring = new THREE.Line(geometry, material);
      ring.userData = { baseLat: lat, phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      latRings.push(ring);
    });

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 15) {
      const points = [];
      for (let i = 0; i <= 128; i++) {
        const lat = -90 + (i / 128) * 180;
        points.push(latLngToVec3(lat, lng, 1.004));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x0066aa,
        transparent: true,
        opacity: 0.15
      });
      globe.add(new THREE.Line(geometry, material));
    }

    // ══════════════════════════════════════════════════════════════
    // HOLOGRAPHIC ATMOSPHERE LAYERS
    // ══════════════════════════════════════════════════════════════
    const atmosphereLayers = [
      { radius: 1.08, color: 0x00ffff, opacity: 0.1 },
      { radius: 1.14, color: 0x0088ff, opacity: 0.06 },
      { radius: 1.22, color: 0x0044ff, opacity: 0.03 },
    ];

    atmosphereLayers.forEach(layer => {
      const atmoGeometry = new THREE.SphereGeometry(layer.radius, 64, 64);
      const atmoMaterial = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      const atmo = new THREE.Mesh(atmoGeometry, atmoMaterial);
      scene.add(atmo);
    });

    // ══════════════════════════════════════════════════════════════
    // HOLOGRAPHIC STARS
    // ══════════════════════════════════════════════════════════════
    const starCount = 4000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 60 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        starColors[i * 3] = 0.5 + Math.random() * 0.5;
        starColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 0.8 + Math.random() * 0.2;
        starColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        starColors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      }
    }
    
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ══════════════════════════════════════════════════════════════
    // ADVANCED LIGHTING - BRIGHTER FOR VISIBILITY
    // ══════════════════════════════════════════════════════════════
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3.5);
    mainLight.position.set(5, 3, 5);
    scene.add(mainLight);

    const backLight = new THREE.DirectionalLight(0x88ddff, 2.0);
    backLight.position.set(-5, -2, -5);
    scene.add(backLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 2.5, 50);
    pointLight1.position.set(3, 2, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x88ccff, 1.8, 50);
    pointLight2.position.set(-3, -2, -3);
    scene.add(pointLight2);

    // ══════════════════════════════════════════════════════════════
    // RESOURCE MARKERS - PORTS, WAREHOUSES, HUBS
    // ══════════════════════════════════════════════════════════════
    const resourceMarkers = [];
    
    resources.forEach(resource => {
      if (!resource.latitude || !resource.longitude) return;
      
      const pos = latLngToVec3(resource.latitude, resource.longitude, 1.04);
      
      // Resource marker (glowing cube)
      const markerGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(pos);
      marker.userData = { resource, type: 'resource' };
      globe.add(marker);
      resourceMarkers.push(marker);
      
      // Resource glow ring
      const ringGeometry = new THREE.RingGeometry(0.04, 0.06, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize()
      );
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
    });

    // ══════════════════════════════════════════════════════════════
    // DIGITAL TWIN MARKERS - AI ENTITIES
    // ══════════════════════════════════════════════════════════════
    const twinMarkers = [];
    
    digitalTwins.forEach(twin => {
      if (!twin.latitude || !twin.longitude) return;
      
      const pos = latLngToVec3(twin.latitude, twin.longitude, 1.06);
      
      // Twin marker (glowing octahedron)
      const markerGeometry = new THREE.OctahedronGeometry(0.025, 0);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.9,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(pos);
      marker.userData = { digitalTwin: twin, type: 'twin' };
      globe.add(marker);
      twinMarkers.push(marker);
      
      // Spinning holographic ring
      const ringGeometry = new THREE.TorusGeometry(0.035, 0.005, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        pos.clone().normalize()
      );
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      twinMarkers.push(ring);
    });

    // ══════════════════════════════════════════════════════════════
    // VEHICLE MARKERS - HOLOGRAPHIC STYLE
    // ══════════════════════════════════════════════════════════════
    const vehicleMarkers = [];
    const vehiclePulses = [];
    const vehicleBeams = [];

    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) return;
      
      const status = vehicle.status || 'offline';
      const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
      const pos = latLngToVec3(vehicle.latitude, vehicle.longitude, 1.025);

      // Main marker (glowing pyramid)
      const markerGeometry = new THREE.ConeGeometry(0.015, 0.05, 4);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: color.int,
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(pos);
      marker.lookAt(0, 0, 0);
      marker.rotateX(Math.PI / 2);
      marker.userData = { vehicle, status };
      globe.add(marker);
      vehicleMarkers.push(marker);

      // Pulsing holographic ring
      const ringGeometry = new THREE.RingGeometry(0.022, 0.038, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color.int,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(pos.clone().multiplyScalar(1.002));
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        pos.clone().normalize()
      );
      ring.userData = { phase: Math.random() * Math.PI * 2, baseColor: color.int };
      globe.add(ring);
      vehiclePulses.push(ring);

      // Vertical holographic beam
      const beamHeight = 0.3;
      const beamGeometry = new THREE.CylinderGeometry(0.003, 0.008, beamHeight, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: color.int,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      const beamPos = pos.clone().normalize().multiplyScalar(1 + beamHeight / 2);
      beam.position.copy(beamPos);
      beam.lookAt(0, 0, 0);
      beam.rotateX(Math.PI / 2);
      beam.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(beam);
      vehicleBeams.push(beam);

      // Speed trail
      if (vehicle.speed > 0 && vehicle.heading !== undefined) {
        const trailLength = 1.2;
        const backLat = vehicle.latitude - Math.cos(vehicle.heading * Math.PI / 180) * trailLength;
        const backLng = vehicle.longitude - Math.sin(vehicle.heading * Math.PI / 180) * trailLength;
        const trailPoints = [];
        
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const lat = backLat + (vehicle.latitude - backLat) * t;
          const lng = backLng + (vehicle.longitude - backLng) * t;
          trailPoints.push(latLngToVec3(lat, lng, 1.024));
        }
        
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        const trailMaterial = new THREE.LineBasicMaterial({
          color: color.int,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending
        });
        globe.add(new THREE.Line(trailGeometry, trailMaterial));
      }
    });

    // ══════════════════════════════════════════════════════════════
    // ROUTE ARCS - HOLOGRAPHIC PATHS
    // ══════════════════════════════════════════════════════════════
    const routeArcs = [];
    routes.forEach(route => {
      const waypoints = (route.waypoints || []).filter(w => w.lat && w.lng);
      for (let i = 0; i < waypoints.length - 1; i++) {
        const arc = createHolographicArc(
          waypoints[i].lat,
          waypoints[i].lng,
          waypoints[i + 1].lat,
          waypoints[i + 1].lng,
          0x00ffff
        );
        // Only mark first arc segment for hologram display
        arc.userData = { 
          routeId: route.id, 
          route,
          isFirstSegment: i === 0
        };
        globe.add(arc);
        routeArcs.push(arc);
      }
    });

    // ══════════════════════════════════════════════════════════════
    // INTERACTION - RAYCASTER
    // ══════════════════════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      // Check vehicle clicks
      const vehicleIntersects = raycaster.intersectObjects(vehicleMarkers);
      if (vehicleIntersects.length > 0) {
        const vehicle = vehicleIntersects[0].object.userData.vehicle;
        onSelectVehicle?.(vehicle);
        return;
      }
      
      // Check resource clicks
      const resourceIntersects = raycaster.intersectObjects(resourceMarkers);
      if (resourceIntersects.length > 0) {
        const resource = resourceIntersects[0].object.userData.resource;
        onSelectResource?.(resource);
        return;
      }
    };

    // ══════════════════════════════════════════════════════════════
    // ORBIT CONTROLS
    // ══════════════════════════════════════════════════════════════
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const onMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x = Math.max(-1.4, Math.min(1.4, globe.rotation.x + deltaY * 0.005));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => {
      camera.position.z = Math.max(2, Math.min(7, camera.position.z + e.deltaY * 0.005));
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('click', handleClick);
    el.addEventListener('wheel', onWheel, { passive: true });

    // ══════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ══════════════════════════════════════════════════════════════
    let time = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;

      // Auto-rotate when not dragging
      if (!isDragging) {
        globe.rotation.y += 0.0005;
      }

      // Animate grid overlay
      gridSphere.rotation.y = time * 0.2;
      gridMaterial.opacity = 0.05 + 0.03 * Math.sin(time * 2);

      // Pulse latitude rings
      latRings.forEach(ring => {
        const phase = ring.userData.phase + time * 1.5;
        ring.material.opacity = ring.userData.baseLat === 0 
          ? 0.4 + 0.2 * Math.sin(phase)
          : 0.2 + 0.1 * Math.sin(phase);
      });

      // Pulse vehicle rings
      vehiclePulses.forEach(pulse => {
        const phase = pulse.userData.phase + time * 2;
        pulse.material.opacity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(phase));
        pulse.scale.setScalar(1 + 0.3 * (0.5 + 0.5 * Math.sin(phase * 0.8)));
      });

      // Animate vehicle beams
      vehicleBeams.forEach(beam => {
        const phase = beam.userData.phase + time * 1.5;
        beam.material.opacity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(phase));
      });

      // Rotate digital twin markers
      twinMarkers.forEach((twin, i) => {
        if (i % 2 === 0) {
          twin.rotation.y = time * 2;
          twin.rotation.x = Math.sin(time * 1.5) * 0.3;
        }
      });

      // Pulse resource markers
      resourceMarkers.forEach(resource => {
        resource.rotation.y = time * 0.5;
        resource.scale.setScalar(1 + 0.1 * Math.sin(time * 3));
      });

      // Rotate point lights
      pointLight1.position.x = Math.cos(time * 0.5) * 4;
      pointLight1.position.z = Math.sin(time * 0.5) * 4;
      pointLight2.position.x = Math.cos(time * 0.3 + Math.PI) * 3;
      pointLight2.position.z = Math.sin(time * 0.3 + Math.PI) * 3;

      // Update visible routes with 2D screen positions using advanced spatial visibility
      const newVisibleRoutes = [];
      const seenRouteIds = new Set();
      
      // Get camera view frustum for advanced culling
      const frustum = new THREE.Frustum();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      
      // Only process routes marked as first segment
      const firstSegmentArcs = routeArcs.filter(arc => arc.userData.isFirstSegment);
      
      firstSegmentArcs.forEach((arc, index) => {
        const route = arc.userData.route;
        
        // Ensure unique route ID
        if (seenRouteIds.has(route.id)) return;
        seenRouteIds.add(route.id);
        
        // Get center point of arc in local coordinates
        const geometry = arc.geometry;
        const positions = geometry.attributes.position.array;
        const midIndex = Math.floor(positions.length / 2 / 3) * 3;
        const arcLocalPos = new THREE.Vector3(
          positions[midIndex],
          positions[midIndex + 1],
          positions[midIndex + 2]
        );
        
        // Transform to world space (apply globe rotation)
        const arcWorldPos = arcLocalPos.clone().applyMatrix4(globe.matrixWorld);
        
        // === VISIBILITY CHECK 1: Frustum Culling ===
        if (!frustum.containsPoint(arcWorldPos)) return;
        
        // === VISIBILITY CHECK 2: Hemisphere Check ===
        // Get the surface normal at arc position (pointing outward from globe center)
        const globeCenter = new THREE.Vector3();
        globe.getWorldPosition(globeCenter);
        const surfaceNormal = new THREE.Vector3().subVectors(arcWorldPos, globeCenter).normalize();
        
        // Get camera direction
        const cameraWorldPos = new THREE.Vector3();
        camera.getWorldPosition(cameraWorldPos);
        const cameraDirection = new THREE.Vector3().subVectors(arcWorldPos, cameraWorldPos).normalize();
        
        // Dot product: positive means arc faces camera
        const visibility = surfaceNormal.dot(cameraDirection.negate());
        if (visibility < 0.15) return; // Threshold to avoid edge cases
        
        // === VISIBILITY CHECK 3: Screen Projection ===
        const screenPos = arcWorldPos.clone().project(camera);
        
        // Depth check (NDC z: -1 is near plane, 1 is far plane)
        if (screenPos.z < -1 || screenPos.z > 1) return;
        
        // Screen bounds with margin
        const margin = 1.3;
        if (screenPos.x < -margin || screenPos.x > margin || 
            screenPos.y < -margin || screenPos.y > margin) return;
        
        // Convert to pixel coordinates
        let x = (screenPos.x * 0.5 + 0.5) * el.clientWidth;
        let y = (-(screenPos.y * 0.5) + 0.5) * el.clientHeight;
        
        // Calculate depth (distance from camera) for z-index ordering
        const depth = arcWorldPos.distanceTo(cameraWorldPos);
        
        newVisibleRoutes.push({
          route,
          x,
          y,
          index,
          visibility,
          worldPos: arcWorldPos.clone(),
          depth
        });
      });
      
      // Double-check for duplicates before setting state
      const uniqueRoutes = [];
      const finalSeenIds = new Set();
      newVisibleRoutes.forEach(routeData => {
        if (!finalSeenIds.has(routeData.route.id)) {
          finalSeenIds.add(routeData.route.id);
          uniqueRoutes.push(routeData);
        }
      });
      
      // Perfect collision avoidance - dynamic sizing and spacing (MUST be before any collision logic)
      const cardWidth = 400;
      const cardHeight = 500;
      const padding = 50;
      
      // Create spatial grid for faster collision detection
      const gridCellSize = Math.max(cardWidth, cardHeight) * 2;
      const spatialGrid = new Map();
      
      const getGridKey = (x, y) => {
        const col = Math.floor(x / gridCellSize);
        const row = Math.floor(y / gridCellSize);
        return `${col},${row}`;
      };
      
      const checkGridCollision = (x, y, excludeIndex) => {
        const centerKey = getGridKey(x, y);
        const neighbors = [
          centerKey,
          getGridKey(x - gridCellSize, y),
          getGridKey(x + gridCellSize, y),
          getGridKey(x, y - gridCellSize),
          getGridKey(x, y + gridCellSize),
          getGridKey(x - gridCellSize, y - gridCellSize),
          getGridKey(x + gridCellSize, y - gridCellSize),
          getGridKey(x - gridCellSize, y + gridCellSize),
          getGridKey(x + gridCellSize, y + gridCellSize)
        ];
        
        for (const key of neighbors) {
          const items = spatialGrid.get(key) || [];
          for (const item of items) {
            if (item.index === excludeIndex) continue;
            
            // Check if rectangles overlap (with minimum distance = their size)
            const halfW1 = cardWidth / 2;
            const halfH1 = cardHeight / 2;
            const halfW2 = cardWidth / 2;
            const halfH2 = cardHeight / 2;
            
            const dx = Math.abs((x + halfW1) - (item.x + halfW2));
            const dy = Math.abs((y + halfH1) - (item.y + halfH2));
            
            // Minimum distance is the sum of half-widths + full width (to ensure no overlap)
            if (dx < (halfW1 + halfW2 + cardWidth) && dy < (halfH1 + halfH2 + cardHeight)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Sort by visibility score (most visible first get priority placement)
      uniqueRoutes.sort((a, b) => b.visibility - a.visibility);
      
      uniqueRoutes.forEach((routeA, i) => {
        let bestX = routeA.x;
        let bestY = routeA.y;
        let bestScore = Infinity;
        
        // Try multiple positioning strategies with larger offsets
        const strategies = [
          // Original position
          { x: routeA.x, y: routeA.y },
          // Radial offsets from original - LARGER RADIUS
          ...Array.from({ length: 8 }, (_, angle) => ({
            x: routeA.x + Math.cos(angle * Math.PI / 4) * 250,
            y: routeA.y + Math.sin(angle * Math.PI / 4) * 250
          })),
          // Grid-aligned positions
          { x: Math.round(routeA.x / gridCellSize) * gridCellSize, y: Math.round(routeA.y / gridCellSize) * gridCellSize },
          // Edge-aware positions with more spacing
          { x: padding + 100, y: routeA.y },
          { x: el.clientWidth - cardWidth - padding - 100, y: routeA.y },
          { x: routeA.x, y: padding + 100 },
          { x: routeA.x, y: el.clientHeight - cardHeight - padding - 100 }
        ];
        
        for (const strategy of strategies) {
          let testX = strategy.x;
          let testY = strategy.y;
          
          // Clamp to valid screen area
          testX = Math.max(padding, Math.min(testX, el.clientWidth - cardWidth - padding));
          testY = Math.max(padding, Math.min(testY, el.clientHeight - cardHeight - padding));
          
          // Check collision
          if (!checkGridCollision(testX, testY, i)) {
            // Score based on distance from original position
            const distFromOriginal = Math.sqrt(
              Math.pow(testX - routeA.x, 2) + Math.pow(testY - routeA.y, 2)
            );
            
            if (distFromOriginal < bestScore) {
              bestX = testX;
              bestY = testY;
              bestScore = distFromOriginal;
              if (distFromOriginal < 50) break; // Good enough, stop searching
            }
          }
        }
        
        // If still colliding, use comprehensive spiral search with LARGER steps
        if (bestScore === Infinity) {
          let found = false;
          for (let radius = 300; radius < 1500 && !found; radius += 120) {
            for (let angle = 0; angle < Math.PI * 2 && !found; angle += Math.PI / 6) {
              const testX = Math.max(padding, Math.min(
                routeA.x + Math.cos(angle) * radius,
                el.clientWidth - cardWidth - padding
              ));
              const testY = Math.max(padding, Math.min(
                routeA.y + Math.sin(angle) * radius,
                el.clientHeight - cardHeight - padding
              ));
              
              if (!checkGridCollision(testX, testY, i)) {
                bestX = testX;
                bestY = testY;
                found = true;
              }
            }
          }
        }
        
        routeA.x = bestX;
        routeA.y = bestY;
        
        // Add to spatial grid with dimensions
        const gridKey = getGridKey(bestX, bestY);
        if (!spatialGrid.has(gridKey)) spatialGrid.set(gridKey, []);
        spatialGrid.get(gridKey).push({ x: bestX, y: bestY, index: i, width: cardWidth, height: cardHeight });
      });
      
      // Only update state if there's a change - with forced cleanup
      const currentCount = uniqueRoutes.length;
      const hasChanged = currentCount !== lastVisibleCountRef.current ||
                         !uniqueRoutes.every((nr, i) => visibleRoutes[i]?.route.id === nr.route.id);
      
      if (hasChanged) {
        lastVisibleCountRef.current = currentCount;
        setVisibleRoutes(uniqueRoutes);
      }
      
      // Force cleanup if we went from showing routes to showing none
      if (currentCount === 0 && visibleRoutes.length > 0) {
        setVisibleRoutes([]);
      }

      // Update visible resources with same logic
      const newVisibleResources = [];
      const seenResourceIds = new Set();
      
      resourceMarkers.forEach((marker, index) => {
        const resource = marker.userData.resource;
        if (seenResourceIds.has(resource.id)) return;
        seenResourceIds.add(resource.id);
        
        const markerWorldPos = marker.position.clone().applyMatrix4(globe.matrixWorld);
        
        if (!frustum.containsPoint(markerWorldPos)) return;
        
        const globeCenter = new THREE.Vector3();
        globe.getWorldPosition(globeCenter);
        const surfaceNormal = new THREE.Vector3().subVectors(markerWorldPos, globeCenter).normalize();
        const cameraWorldPos = new THREE.Vector3();
        camera.getWorldPosition(cameraWorldPos);
        const cameraDirection = new THREE.Vector3().subVectors(markerWorldPos, cameraWorldPos).normalize();
        const visibility = surfaceNormal.dot(cameraDirection.negate());
        if (visibility < 0.15) return;
        
        const screenPos = markerWorldPos.clone().project(camera);
        if (screenPos.z < -1 || screenPos.z > 1) return;
        const margin = 1.3;
        if (screenPos.x < -margin || screenPos.x > margin || screenPos.y < -margin || screenPos.y > margin) return;
        
        let x = (screenPos.x * 0.5 + 0.5) * el.clientWidth;
        let y = (-(screenPos.y * 0.5) + 0.5) * el.clientHeight;
        
        const depth = markerWorldPos.distanceTo(cameraWorldPos);
        
        newVisibleResources.push({ resource, x, y, index, visibility, worldPos: markerWorldPos.clone(), depth });
      });
      
      const uniqueResources = [];
      const finalSeenResourceIds = new Set();
      newVisibleResources.forEach(data => {
        if (!finalSeenResourceIds.has(data.resource.id)) {
          finalSeenResourceIds.add(data.resource.id);
          uniqueResources.push(data);
        }
      });

      // Update visible vehicles with same logic
      const newVisibleVehicles = [];
      const seenVehicleIds = new Set();
      
      vehicleMarkers.forEach((marker, index) => {
        const vehicle = marker.userData.vehicle;
        if (seenVehicleIds.has(vehicle.id)) return;
        seenVehicleIds.add(vehicle.id);
        
        const markerWorldPos = marker.position.clone().applyMatrix4(globe.matrixWorld);
        
        if (!frustum.containsPoint(markerWorldPos)) return;
        
        const globeCenter = new THREE.Vector3();
        globe.getWorldPosition(globeCenter);
        const surfaceNormal = new THREE.Vector3().subVectors(markerWorldPos, globeCenter).normalize();
        const cameraWorldPos = new THREE.Vector3();
        camera.getWorldPosition(cameraWorldPos);
        const cameraDirection = new THREE.Vector3().subVectors(markerWorldPos, cameraWorldPos).normalize();
        const visibility = surfaceNormal.dot(cameraDirection.negate());
        if (visibility < 0.15) return;
        
        const screenPos = markerWorldPos.clone().project(camera);
        if (screenPos.z < -1 || screenPos.z > 1) return;
        const margin = 1.3;
        if (screenPos.x < -margin || screenPos.x > margin || screenPos.y < -margin || screenPos.y > margin) return;
        
        let x = (screenPos.x * 0.5 + 0.5) * el.clientWidth;
        let y = (-(screenPos.y * 0.5) + 0.5) * el.clientHeight;
        
        const depth = markerWorldPos.distanceTo(cameraWorldPos);
        
        newVisibleVehicles.push({ vehicle, x, y, index, visibility, worldPos: markerWorldPos.clone(), depth });
      });
      
      const uniqueVehicles = [];
      const finalSeenVehicleIds = new Set();
      newVisibleVehicles.forEach(data => {
        if (!finalSeenVehicleIds.has(data.vehicle.id)) {
          finalSeenVehicleIds.add(data.vehicle.id);
          uniqueVehicles.push(data);
        }
      });
      
      // Process resources with same advanced logic, continuing from routes' spatial grid
      const resourceStartIndex = uniqueRoutes.length;
      uniqueResources.sort((a, b) => b.visibility - a.visibility);
      
      uniqueResources.forEach((resA, i) => {
        let bestX = resA.x;
        let bestY = resA.y;
        let bestScore = Infinity;
        
        const strategies = [
          { x: resA.x, y: resA.y },
          ...Array.from({ length: 8 }, (_, angle) => ({
            x: resA.x + Math.cos(angle * Math.PI / 4) * 250,
            y: resA.y + Math.sin(angle * Math.PI / 4) * 250
          })),
          { x: Math.round(resA.x / gridCellSize) * gridCellSize, y: Math.round(resA.y / gridCellSize) * gridCellSize },
          { x: padding + 100, y: resA.y },
          { x: el.clientWidth - cardWidth - padding - 100, y: resA.y }
        ];
        
        for (const strategy of strategies) {
          let testX = Math.max(padding, Math.min(strategy.x, el.clientWidth - cardWidth - padding));
          let testY = Math.max(padding, Math.min(strategy.y, el.clientHeight - cardHeight - padding));
          
          if (!checkGridCollision(testX, testY, resourceStartIndex + i)) {
            const distFromOriginal = Math.sqrt(
              Math.pow(testX - resA.x, 2) + Math.pow(testY - resA.y, 2)
            );
            if (distFromOriginal < bestScore) {
              bestX = testX;
              bestY = testY;
              bestScore = distFromOriginal;
              if (distFromOriginal < 50) break;
            }
          }
        }
        
        if (bestScore === Infinity) {
          let found = false;
          for (let radius = 300; radius < 1500 && !found; radius += 120) {
            for (let angle = 0; angle < Math.PI * 2 && !found; angle += Math.PI / 6) {
              const testX = Math.max(padding, Math.min(
                resA.x + Math.cos(angle) * radius,
                el.clientWidth - cardWidth - padding
              ));
              const testY = Math.max(padding, Math.min(
                resA.y + Math.sin(angle) * radius,
                el.clientHeight - cardHeight - padding
              ));
              
              if (!checkGridCollision(testX, testY, resourceStartIndex + i)) {
                bestX = testX;
                bestY = testY;
                found = true;
              }
            }
          }
        }
        
        resA.x = bestX;
        resA.y = bestY;
        
        const gridKey = getGridKey(bestX, bestY);
        if (!spatialGrid.has(gridKey)) spatialGrid.set(gridKey, []);
        spatialGrid.get(gridKey).push({ x: bestX, y: bestY, index: resourceStartIndex + i, width: cardWidth, height: cardHeight });
      });
      
      const updatedResources = uniqueResources;
      
      const currentResourceCount = updatedResources.length;
      const hasResourceChanged = currentResourceCount !== lastVisibleResourcesCountRef.current ||
                                  !updatedResources.every((nr, i) => visibleResources[i]?.resource.id === nr.resource.id);
      
      if (hasResourceChanged) {
        lastVisibleResourcesCountRef.current = currentResourceCount;
        setVisibleResources(updatedResources);
      }
      
      if (currentResourceCount === 0 && visibleResources.length > 0) {
        setVisibleResources([]);
      }

      // Process vehicles with same advanced logic
      const vehicleStartIndex = resourceStartIndex + updatedResources.length;
      
      uniqueVehicles.forEach((vehA, i) => {
        let bestX = vehA.x;
        let bestY = vehA.y;
        let bestScore = Infinity;
        
        const strategies = [
          { x: vehA.x, y: vehA.y },
          ...Array.from({ length: 8 }, (_, angle) => ({
            x: vehA.x + Math.cos(angle * Math.PI / 4) * 250,
            y: vehA.y + Math.sin(angle * Math.PI / 4) * 250
          })),
          { x: Math.round(vehA.x / gridCellSize) * gridCellSize, y: Math.round(vehA.y / gridCellSize) * gridCellSize },
          { x: padding + 100, y: vehA.y },
          { x: el.clientWidth - cardWidth - padding - 100, y: vehA.y }
        ];
        
        for (const strategy of strategies) {
          let testX = Math.max(padding, Math.min(strategy.x, el.clientWidth - cardWidth - padding));
          let testY = Math.max(padding, Math.min(strategy.y, el.clientHeight - cardHeight - padding));
          
          if (!checkGridCollision(testX, testY, vehicleStartIndex + i)) {
            const distFromOriginal = Math.sqrt(
              Math.pow(testX - vehA.x, 2) + Math.pow(testY - vehA.y, 2)
            );
            if (distFromOriginal < bestScore) {
              bestX = testX;
              bestY = testY;
              bestScore = distFromOriginal;
              if (distFromOriginal < 50) break;
            }
          }
        }
        
        if (bestScore === Infinity) {
          let found = false;
          for (let radius = 300; radius < 1500 && !found; radius += 120) {
            for (let angle = 0; angle < Math.PI * 2 && !found; angle += Math.PI / 6) {
              const testX = Math.max(padding, Math.min(
                vehA.x + Math.cos(angle) * radius,
                el.clientWidth - cardWidth - padding
              ));
              const testY = Math.max(padding, Math.min(
                vehA.y + Math.sin(angle) * radius,
                el.clientHeight - cardHeight - padding
              ));
              
              if (!checkGridCollision(testX, testY, vehicleStartIndex + i)) {
                bestX = testX;
                bestY = testY;
                found = true;
              }
            }
          }
        }
        
        vehA.x = bestX;
        vehA.y = bestY;
        
        const gridKey = getGridKey(bestX, bestY);
        if (!spatialGrid.has(gridKey)) spatialGrid.set(gridKey, []);
        spatialGrid.get(gridKey).push({ x: bestX, y: bestY, index: vehicleStartIndex + i, width: cardWidth, height: cardHeight });
      });
      
      const currentVehicleCount = uniqueVehicles.length;
      const hasVehicleChanged = currentVehicleCount !== lastVisibleVehiclesCountRef.current ||
                                !uniqueVehicles.every((nv, i) => visibleVehicles[i]?.vehicle.id === nv.vehicle.id);
      
      if (hasVehicleChanged) {
        lastVisibleVehiclesCountRef.current = currentVehicleCount;
        setVisibleVehicles(uniqueVehicles);
      }
      
      if (currentVehicleCount === 0 && visibleVehicles.length > 0) {
        setVisibleVehicles([]);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ══════════════════════════════════════════════════════════════
    // RESIZE HANDLER
    // ══════════════════════════════════════════════════════════════
    const handleResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ══════════════════════════════════════════════════════════════
    // CLEANUP
    // ══════════════════════════════════════════════════════════════
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('click', handleClick);
      el.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [vehicles, routes, resources, digitalTwins, onSelectVehicle, onSelectResource]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full bg-black" 
        style={{ cursor: 'grab' }}
      />
      
      {/* Floating Route Holograms */}
      <AnimatePresence mode="popLayout">
        {visibleRoutes.map((routeData, idx) => (
          <RouteHologramCard
            key={`route-hologram-${routeData.route.id}`}
            route={routeData.route}
            x={routeData.x}
            y={routeData.y}
            index={idx}
            depth={routeData.depth}
          />
        ))}
      </AnimatePresence>

      {/* Floating Resource Holograms */}
      <AnimatePresence mode="popLayout">
        {visibleResources.map((resourceData, idx) => (
          <ResourceHologramCard
            key={`resource-hologram-${resourceData.resource.id}`}
            resource={resourceData.resource}
            x={resourceData.x}
            y={resourceData.y}
            index={idx}
            depth={resourceData.depth}
          />
        ))}
      </AnimatePresence>

      {/* Floating Vehicle Holograms */}
      <AnimatePresence mode="popLayout">
        {visibleVehicles.map((vehicleData, idx) => (
          <VehicleHologramCard
            key={`vehicle-hologram-${vehicleData.vehicle.id}`}
            vehicle={vehicleData.vehicle}
            x={vehicleData.x}
            y={vehicleData.y}
            index={idx}
            depth={vehicleData.depth}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}