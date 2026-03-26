import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimatePresence } from "framer-motion";
import CombinedHologramCard from "./CombinedHologramCard";
import RouteSimulationPanel from "./RouteSimulationPanel";

const STATUS_COLORS = {
  active:      { int: 0x00ffff, hex: "#00ffff" },
  idle:        { int: 0xffaa00, hex: "#ffaa00" },
  maintenance: { int: 0xff6600, hex: "#ff6600" },
  offline:     { int: 0x334455, hex: "#334455" },
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
  const mid = a.clone().add(b).normalize().multiplyScalar(r + 0.22);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const points = curve.getPoints(120);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
  return { line: new THREE.Line(geometry, material), curve };
}

// ── VERTEX SHADER for Fresnel atmosphere ────────────────────────────────────
const ATMO_VERT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMO_FRAG = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 glowColor;
  uniform float intensity;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(-vPosition)));
    float alpha = pow(rim, 2.8) * intensity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export default function FuturisticGlobe({
  vehicles = [], routes = [], resources = [], digitalTwins = [],
  busLines = [], buses = [], busStops = [],
  onSelectVehicle, onSelectResource
}) {
  const mountRef = useRef(null);
  const [visibleRoutes, setVisibleRoutes] = useState([]);
  const [visibleResources, setVisibleResources] = useState([]);
  const [visibleVehicles, setVisibleVehicles] = useState([]);
  const [simulatingRoute, setSimulatingRoute] = useState(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 600;

    // ── Scene / Camera / Renderer ───────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0.5, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    el.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    // ── EARTH ───────────────────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
      () => renderer.render(scene, camera)
    );
    const cloudsTexture = textureLoader.load(
      'https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png'
    );

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      emissive: 0x001133,
      emissiveIntensity: 0.25,
      specular: 0x004488,
      shininess: 50,
    });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMat));

    // Clouds
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const cloudsLayer = new THREE.Mesh(new THREE.SphereGeometry(1.005, 64, 64), cloudsMat);
    globe.add(cloudsLayer);

    // ── HOLOGRAPHIC GRID OVERLAY ────────────────────────────────────────────
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.018, wireframe: true });
    const gridSphere = new THREE.Mesh(new THREE.SphereGeometry(1.003, 48, 24), gridMat);
    globe.add(gridSphere);

    // ── LATITUDE RINGS ──────────────────────────────────────────────────────
    const latRings = [];
    [0, 23.5, -23.5, 66.5, -66.5].forEach(lat => {
      const y = Math.sin(lat * Math.PI / 180);
      const r = Math.cos(lat * Math.PI / 180) * 1.006;
      const pts = [];
      for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
      }
      const mat = new THREE.LineBasicMaterial({ color: lat === 0 ? 0x00ffff : 0x0088cc, transparent: true, opacity: lat === 0 ? 0.55 : 0.22 });
      const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      ring.userData = { baseLat: lat, phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      latRings.push(ring);
    });

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 15) {
      const pts = [];
      for (let i = 0; i <= 128; i++) pts.push(latLngToVec3(-90 + (i / 128) * 180, lng, 1.004));
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x004488, transparent: true, opacity: 0.12 })
      ));
    }

    // ── RADAR SWEEP ─────────────────────────────────────────────────────────
    const sweepShape = new THREE.Shape();
    sweepShape.moveTo(0, 0);
    const sweepAngle = Math.PI * 0.18;
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * sweepAngle;
      sweepShape.lineTo(Math.cos(a) * 1.01, Math.sin(a) * 1.01);
    }
    sweepShape.lineTo(0, 0);
    const sweepGeo = new THREE.ShapeGeometry(sweepShape);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff, transparent: true, opacity: 0.09,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sweep = new THREE.Mesh(sweepGeo, sweepMat);
    sweep.rotation.x = -Math.PI / 2;
    globe.add(sweep);

    // Radar leading edge glow line
    const sweepEdgePts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      sweepEdgePts.push(new THREE.Vector3(Math.cos(a) * 1.012, 0, Math.sin(a) * 1.012));
    }

    // ── FRESNEL ATMOSPHERE ───────────────────────────────────────────────────
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        glowColor: { value: new THREE.Color(0.0, 0.6, 1.0) },
        intensity: { value: 1.6 }
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 64), atmoMat));

    // Outer thin halo
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        glowColor: { value: new THREE.Color(0.0, 0.3, 0.8) },
        intensity: { value: 0.7 }
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.32, 64, 64), haloMat));

    // ── STARS ────────────────────────────────────────────────────────────────
    const starCount = 6000;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const starSize = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 300;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = radius * Math.sin(p) * Math.cos(t);
      starPos[i * 3 + 1] = radius * Math.cos(p);
      starPos[i * 3 + 2] = radius * Math.sin(p) * Math.sin(t);
      const c = Math.random();
      if (c < 0.25) { starCol[i*3]=0.6; starCol[i*3+1]=0.8; starCol[i*3+2]=1.0; }
      else if (c < 0.4) { starCol[i*3]=1.0; starCol[i*3+1]=0.9; starCol[i*3+2]=0.7; }
      else { starCol[i*3]=1.0; starCol[i*3+1]=1.0; starCol[i*3+2]=1.0; }
      starSize[i] = 0.05 + Math.random() * 0.3;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));
    const starMat = new THREE.PointsMaterial({
      size: 0.2, transparent: true, opacity: 0.85,
      vertexColors: true, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── ORBITING RING + SATELLITE ────────────────────────────────────────────
    const orbitRingGeo = new THREE.TorusGeometry(1.35, 0.0025, 16, 256);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ccff, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI * 0.28;
    orbitRing.rotation.z = Math.PI * 0.08;
    scene.add(orbitRing);

    const satelliteGeo = new THREE.OctahedronGeometry(0.018, 0);
    const satelliteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const satellite = new THREE.Mesh(satelliteGeo, satelliteMat);
    scene.add(satellite);

    // Satellite trail
    const trailPts = new Float32Array(24 * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPts, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00ccff, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const satTrail = new THREE.Line(trailGeo, trailMat);
    scene.add(satTrail);
    const trailHistory = [];

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 4.0);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.5);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);
    const rimLight1 = new THREE.PointLight(0x00ffff, 3.0, 60);
    rimLight1.position.set(3, 2, 3);
    scene.add(rimLight1);
    const rimLight2 = new THREE.PointLight(0x8844ff, 2.0, 60);
    rimLight2.position.set(-3, -2, -3);
    scene.add(rimLight2);

    // ── RESOURCE MARKERS ─────────────────────────────────────────────────────
    const resourceMarkers = [];
    resources.forEach(resource => {
      if (!resource.latitude || !resource.longitude) return;
      const pos = latLngToVec3(resource.latitude, resource.longitude, 1.04);
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.03),
        new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.85 })
      );
      marker.position.copy(pos);
      marker.userData = { resource, type: 'resource' };
      globe.add(marker);
      resourceMarkers.push(marker);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.06, 32),
        new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), pos.clone().normalize());
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
    });

    // ── VEHICLE MARKERS ───────────────────────────────────────────────────────
    const vehicleMarkers = [];
    const vehiclePulses = [];
    const vehicleBeams = [];
    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) return;
      const status = vehicle.status || 'offline';
      const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
      const pos = latLngToVec3(vehicle.latitude, vehicle.longitude, 1.025);

      const marker = new THREE.Mesh(
        new THREE.ConeGeometry(0.015, 0.05, 4),
        new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.9 })
      );
      marker.position.copy(pos);
      marker.lookAt(0,0,0); marker.rotateX(Math.PI/2);
      marker.userData = { vehicle, status };
      globe.add(marker);
      vehicleMarkers.push(marker);

      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.038, 32),
        new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      pulse.position.copy(pos.clone().multiplyScalar(1.002));
      pulse.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), pos.clone().normalize());
      pulse.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(pulse);
      vehiclePulses.push(pulse);

      const beamH = 0.3;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.008, beamH, 8),
        new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
      );
      beam.position.copy(pos.clone().normalize().multiplyScalar(1 + beamH/2));
      beam.lookAt(0,0,0); beam.rotateX(Math.PI/2);
      beam.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(beam);
      vehicleBeams.push(beam);

      if (vehicle.speed > 0 && vehicle.heading !== undefined) {
        const tl = 1.2;
        const bl = vehicle.latitude - Math.cos(vehicle.heading * Math.PI/180) * tl;
        const bLng = vehicle.longitude - Math.sin(vehicle.heading * Math.PI/180) * tl;
        const trailPts2 = Array.from({ length: 21 }, (_, i) => {
          const t = i/20;
          return latLngToVec3(bl+(vehicle.latitude-bl)*t, bLng+(vehicle.longitude-bLng)*t, 1.024);
        });
        globe.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(trailPts2),
          new THREE.LineBasicMaterial({ color: color.int, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
        ));
      }
    });

    // ── DIGITAL TWIN MARKERS ──────────────────────────────────────────────────
    const twinMarkers = [];
    digitalTwins.forEach(twin => {
      if (!twin.latitude || !twin.longitude) return;
      const pos = latLngToVec3(twin.latitude, twin.longitude, 1.06);
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.025, 0),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9 })
      );
      marker.position.copy(pos);
      marker.userData = { digitalTwin: twin, type: 'twin' };
      globe.add(marker);
      twinMarkers.push(marker);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.035, 0.005, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
      );
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), pos.clone().normalize());
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      globe.add(ring);
      twinMarkers.push(ring);
    });

    // ── ROUTE ARCS + DATA-FLOW PARTICLES ─────────────────────────────────────
    const routeArcs = [];
    const routeParticles = [];
    const routeColors = [0x00ffff, 0x8b5cf6, 0x10b981, 0xf59e0b, 0xf43f5e];

    routes.forEach((route, rIdx) => {
      const waypoints = (route.waypoints || []).filter(w => w.lat && w.lng);
      const arcColor = routeColors[rIdx % routeColors.length];
      for (let i = 0; i < waypoints.length - 1; i++) {
        const { line, curve } = createHolographicArc(
          waypoints[i].lat, waypoints[i].lng,
          waypoints[i+1].lat, waypoints[i+1].lng,
          arcColor
        );
        line.userData = { routeId: route.id, route, isFirstSegment: i === 0 };
        globe.add(line);

        // Invisible hit mesh
        const hitGeo = new THREE.TubeGeometry(curve, 20, 0.015, 4, false);
        const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
        hitMesh.userData = { routeId: route.id, route, isFirstSegment: i === 0 };
        globe.add(hitMesh);
        routeArcs.push(hitMesh);

        // Animated data-flow particles (2 per segment)
        for (let p = 0; p < 2; p++) {
          const pGeo = new THREE.SphereGeometry(0.009, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({
            color: arcColor, transparent: true, opacity: 0.95,
            blending: THREE.AdditiveBlending
          });
          const particle = new THREE.Mesh(pGeo, pMat);
          particle.userData = { curve, progress: Math.random(), speed: 0.0025 + Math.random() * 0.0025 };
          globe.add(particle);
          routeParticles.push(particle);
        }
      }
    });

    // ── BUS INFRASTRUCTURE ────────────────────────────────────────────────────
    busStops.forEach(stop => {
      if (!stop.latitude || !stop.longitude) return;
      const pos = latLngToVec3(stop.latitude, stop.longitude, 1.02);
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 })
      );
      m.position.copy(pos);
      globe.add(m);
    });

    const busLineColors = [0x06b6d4, 0x8b5cf6, 0x10b981, 0xf59e0b];
    busLines.forEach((line, lIdx) => {
      if (!line.directions?.length) return;
      const lColor = busLineColors[lIdx % busLineColors.length];
      line.directions.forEach(dir => {
        const stops = (dir.stop_sequence || [])
          .map(seq => busStops.find(s => s.stop_id === seq.stop_id))
          .filter(s => s?.latitude && s?.longitude);
        for (let i = 0; i < stops.length - 1; i++) {
          const { line: arc } = createHolographicArc(stops[i].latitude, stops[i].longitude, stops[i+1].latitude, stops[i+1].longitude, lColor);
          globe.add(arc);
        }
      });
    });

    buses.forEach(bus => {
      if (!bus.latitude || !bus.longitude) return;
      const pos = latLngToVec3(bus.latitude, bus.longitude, 1.03);
      const color = bus.status === 'in_service' ? 0x10b981 : bus.status === 'charging' ? 0xf59e0b : 0x64748b;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.018, 0.018),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      m.position.copy(pos);
      globe.add(m);
    });

    // ── RAYCASTER / INTERACTION ───────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleClick = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const vHit = raycaster.intersectObjects(vehicleMarkers);
      if (vHit.length > 0) { onSelectVehicle?.(vHit[0].object.userData.vehicle); return; }
      const rHit = raycaster.intersectObjects(resourceMarkers);
      if (rHit.length > 0) { onSelectResource?.(rHit[0].object.userData.resource); return; }
      const arcHit = raycaster.intersectObjects(routeArcs);
      if (arcHit.length > 0) { const r = arcHit[0].object.userData.route; if (r) setSimulatingRoute(r); }
    };

    // ── ORBIT CONTROLS ────────────────────────────────────────────────────────
    let isDragging = false, lastX = 0, lastY = 0;
    const onMouseDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      globe.rotation.y += (e.clientX - lastX) * 0.005;
      globe.rotation.x = Math.max(-1.4, Math.min(1.4, globe.rotation.x + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => { camera.position.z = Math.max(2, Math.min(7, camera.position.z + e.deltaY * 0.005)); };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('click', handleClick);
    el.addEventListener('wheel', onWheel, { passive: true });

    // ── ANIMATION LOOP ────────────────────────────────────────────────────────
    let time = 0, animId;

    const checkVisibility = (markerWorldPos, frustum) => {
      if (!frustum.containsPoint(markerWorldPos)) return false;
      const globeCenter = new THREE.Vector3();
      globe.getWorldPosition(globeCenter);
      const normal = new THREE.Vector3().subVectors(markerWorldPos, globeCenter).normalize();
      const camWorld = new THREE.Vector3();
      camera.getWorldPosition(camWorld);
      const camDir = new THREE.Vector3().subVectors(markerWorldPos, camWorld).normalize();
      if (normal.dot(camDir.negate()) < 0.15) return false;
      const sp = markerWorldPos.clone().project(camera);
      if (sp.z < -1 || sp.z > 1) return false;
      if (Math.abs(sp.x) > 1.3 || Math.abs(sp.y) > 1.3) return false;
      return true;
    };

    const toScreen = (worldPos) => {
      const sp = worldPos.clone().project(camera);
      return {
        x: (sp.x * 0.5 + 0.5) * el.clientWidth,
        y: (-(sp.y * 0.5) + 0.5) * el.clientHeight,
      };
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.01;

      if (!isDragging) globe.rotation.y += 0.0004;

      // Clouds slow drift
      cloudsLayer.rotation.y = time * 0.00015;

      // Grid pulse
      gridSphere.rotation.y = time * 0.2;
      gridMat.opacity = 0.04 + 0.02 * Math.sin(time * 2);

      // Radar sweep
      sweep.rotation.z = time * 0.28;
      sweepMat.opacity = 0.07 + 0.04 * Math.sin(time * 3);

      // Latitude rings pulse
      latRings.forEach(ring => {
        const phase = ring.userData.phase + time * 1.5;
        ring.material.opacity = ring.userData.baseLat === 0
          ? 0.35 + 0.2 * Math.sin(phase)
          : 0.15 + 0.1 * Math.sin(phase);
      });

      // Vehicle pulses
      vehiclePulses.forEach(p => {
        const phase = p.userData.phase + time * 2;
        p.material.opacity = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(phase));
        p.scale.setScalar(1 + 0.35 * (0.5 + 0.5 * Math.sin(phase * 0.8)));
      });
      vehicleBeams.forEach(b => {
        b.material.opacity = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(b.userData.phase + time * 1.5));
      });

      // Twin spin
      twinMarkers.forEach((t, i) => {
        if (i % 2 === 0) { t.rotation.y = time * 2; t.rotation.x = Math.sin(time * 1.5) * 0.3; }
      });

      // Resource pulse
      resourceMarkers.forEach(r => {
        r.rotation.y = time * 0.5;
        r.scale.setScalar(1 + 0.12 * Math.sin(time * 3 + r.userData?.phase || 0));
      });

      // Animate data-flow particles along route arcs
      routeParticles.forEach(p => {
        p.userData.progress = (p.userData.progress + p.userData.speed) % 1;
        const pos = p.userData.curve.getPoint(p.userData.progress);
        p.position.copy(pos.clone().applyMatrix4(globe.matrixWorld).applyMatrix4(globe.matrixWorld.clone().invert()));
        // Actually just set it in globe space
        p.position.copy(p.userData.curve.getPoint(p.userData.progress));
      });

      // Satellite orbit
      const satAngle = time * 0.38;
      const orbitTiltX = Math.PI * 0.28;
      const orbitTiltZ = Math.PI * 0.08;
      const sx = Math.cos(satAngle) * 1.35;
      const sy = Math.sin(satAngle) * 1.35;
      const cosX = Math.cos(orbitTiltX), sinX = Math.sin(orbitTiltX);
      const cosZ = Math.cos(orbitTiltZ), sinZ = Math.sin(orbitTiltZ);
      const rx = sx * cosZ - sy * sinX * sinZ;
      const ry = sy * cosX;
      const rz = sx * sinZ + sy * sinX * cosZ;
      satellite.position.set(rx, ry, rz);
      satellite.rotation.y = time * 3;
      satellite.rotation.x = time * 2;

      // Trail
      trailHistory.push(new THREE.Vector3(rx, ry, rz));
      if (trailHistory.length > 24) trailHistory.shift();
      const trailArr = trailGeo.attributes.position.array;
      for (let i = 0; i < 24; i++) {
        const h = trailHistory[i] || satellite.position;
        trailArr[i*3] = h.x; trailArr[i*3+1] = h.y; trailArr[i*3+2] = h.z;
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailMat.opacity = 0.15 + 0.2 * Math.sin(time * 2);

      // Orbit ring shimmer
      orbitRingMat.opacity = 0.15 + 0.12 * Math.sin(time * 1.2);

      // Moving rim lights
      rimLight1.position.x = Math.cos(time * 0.5) * 4;
      rimLight1.position.z = Math.sin(time * 0.5) * 4;
      rimLight2.position.x = Math.cos(time * 0.3 + Math.PI) * 3;
      rimLight2.position.z = Math.sin(time * 0.3 + Math.PI) * 3;

      // ── Update hologram overlays ───────────────────────────────────────────
      const frustum = new THREE.Frustum();
      const projMat = new THREE.Matrix4();
      projMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projMat);
      const camWorld = new THREE.Vector3();
      camera.getWorldPosition(camWorld);

      const toHologram = (worldPos) => {
        const sc = toScreen(worldPos);
        const depth = worldPos.distanceTo(camWorld);
        return { ...sc, depth };
      };

      // Routes
      const newRoutes = [];
      const seenR = new Set();
      routeArcs.filter(a => a.userData.isFirstSegment).forEach((arc, idx) => {
        const route = arc.userData.route;
        if (seenR.has(route.id)) return;
        const geo = arc.geometry;
        const pos2 = geo.attributes.position.array;
        const mid = Math.floor(pos2.length / 2 / 3) * 3;
        const lp = new THREE.Vector3(pos2[mid], pos2[mid+1], pos2[mid+2]);
        const wp = lp.clone().applyMatrix4(globe.matrixWorld);
        if (!checkVisibility(wp, frustum)) return;
        seenR.add(route.id);
        newRoutes.push({ type: 'route', data: route, ...toHologram(wp), index: idx });
      });

      // Resources
      const newRes = [];
      const seenRes = new Set();
      resourceMarkers.forEach((m, idx) => {
        const r = m.userData.resource;
        if (seenRes.has(r.id)) return;
        const wp = m.position.clone().applyMatrix4(globe.matrixWorld);
        if (!checkVisibility(wp, frustum)) return;
        seenRes.add(r.id);
        newRes.push({ type: 'resource', data: r, ...toHologram(wp), index: idx });
      });

      // Vehicles
      const newVeh = [];
      const seenV = new Set();
      vehicleMarkers.forEach((m, idx) => {
        const v = m.userData.vehicle;
        if (seenV.has(v.id)) return;
        const wp = m.position.clone().applyMatrix4(globe.matrixWorld);
        if (!checkVisibility(wp, frustum)) return;
        seenV.add(v.id);
        newVeh.push({ type: 'vehicle', data: v, ...toHologram(wp), index: idx });
      });

      // Cluster nearby items
      const allItems = [...newRoutes, ...newRes, ...newVeh];
      const clusters = [];
      const used = new Set();
      allItems.forEach((item, i) => {
        if (used.has(i)) return;
        const cl = [item]; used.add(i);
        allItems.forEach((other, j) => {
          if (used.has(j)) return;
          if (Math.hypot(item.x - other.x, item.y - other.y) < 280) { cl.push(other); used.add(j); }
        });
        clusters.push(cl);
      });

      const holograms = clusters.map(cl => {
        if (cl.length === 1) return { ...cl[0], items: null };
        const avgX = cl.reduce((s, i) => s + i.x, 0) / cl.length;
        const avgY = cl.reduce((s, i) => s + i.y, 0) / cl.length;
        const avgD = cl.reduce((s, i) => s + i.depth, 0) / cl.length;
        return { type: 'combined', x: avgX, y: avgY, depth: avgD, items: cl };
      });

      setVisibleRoutes(holograms.filter(h => h.type === 'route' || h.type === 'combined'));
      setVisibleResources(holograms.filter(h => h.type === 'resource'));
      setVisibleVehicles(holograms.filter(h => h.type === 'vehicle'));

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('click', handleClick);
      el.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [vehicles, routes, resources, digitalTwins, busLines, buses, busStops, onSelectVehicle, onSelectResource]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full bg-black" style={{ cursor: 'grab' }} />

      {routes.some(r => (r.waypoints || []).length >= 2) && !simulatingRoute && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-400/20 text-[9px] text-cyan-300 font-mono tracking-wider flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Click a route arc to launch 3D simulation
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {[...visibleRoutes, ...visibleResources, ...visibleVehicles].map((h, idx) => (
          <CombinedHologramCard
            key={`h-${idx}`}
            items={h.items || [h]}
            x={h.x} y={h.y}
            index={idx} depth={h.depth}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {simulatingRoute && (
          <RouteSimulationPanel key={simulatingRoute.id} route={simulatingRoute} onClose={() => setSimulatingRoute(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}