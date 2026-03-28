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

const DISPLAY_MODES = [
  { id: 'default',     label: 'STATUS',      icon: '◈', desc: 'Operationel status',   color: '#00ffff' },
  { id: 'energy',      label: 'ENERGI-FLOW', icon: '⚡', desc: 'Brændstof & batteri',  color: '#10b981' },
  { id: 'traffic',     label: 'TRAFIKTÆTHED',icon: '▶', desc: 'Hastighed & flow',     color: '#f59e0b' },
  { id: 'maintenance', label: 'VEDLIGEHOLD', icon: '⚙', desc: 'Vedligeholdsstatus',   color: '#f43f5e' },
];

function getModeColor(mode, vehicle) {
  if (mode === 'energy') {
    const lvl = vehicle.fuel_level ?? 80;
    if (lvl > 60) return 0x10b981;
    if (lvl > 30) return 0xf59e0b;
    return 0xf43f5e;
  }
  if (mode === 'traffic') {
    const spd = vehicle.speed ?? 0;
    if (spd > 80) return 0xf43f5e;
    if (spd > 40) return 0xf59e0b;
    if (spd > 0)  return 0x00ffff;
    return 0x334455;
  }
  if (mode === 'maintenance') {
    const nxt = vehicle.next_maintenance;
    if (!nxt) return 0x10b981;
    const days = (new Date(nxt) - new Date()) / 86400000;
    if (days < 0)  return 0xf43f5e;
    if (days < 14) return 0xf59e0b;
    return 0x10b981;
  }
  return null; // default: keep original
}

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
  const [activeMode, setActiveMode] = useState('default');
  const activeModeRef = useRef('default');

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

    // Second orbit ring (different inclination)
    const orbitRing2Geo = new THREE.TorusGeometry(1.42, 0.0015, 16, 256);
    const orbitRing2Mat = new THREE.MeshBasicMaterial({
      color: 0x8844ff, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const orbitRing2 = new THREE.Mesh(orbitRing2Geo, orbitRing2Mat);
    orbitRing2.rotation.x = Math.PI * 0.55;
    orbitRing2.rotation.z = Math.PI * 0.25;
    scene.add(orbitRing2);

    // ── SATELLITE GROUP ───────────────────────────────────────────────────────
    const satGroup = new THREE.Group();
    scene.add(satGroup);

    // Main body (metallic box)
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.02, 0.02),
      new THREE.MeshPhongMaterial({ color: 0xccddff, emissive: 0x2244aa, emissiveIntensity: 0.6, shininess: 120 })
    );
    satGroup.add(satBody);

    // Solar panel left
    const panelMat = new THREE.MeshBasicMaterial({
      color: 0x1144cc, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const panelGeo = new THREE.PlaneGeometry(0.07, 0.022);
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = -0.055;
    satGroup.add(panelL);

    // Solar panel right
    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.x = 0.055;
    satGroup.add(panelR);

    // Solar panel grid lines
    const panelLinesMat = new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.5 });
    [-0.055, 0.055].forEach(px => {
      // Vertical lines on panel
      [-0.017, 0, 0.017].forEach(lx => {
        const pts = [new THREE.Vector3(px + lx, -0.011, 0.001), new THREE.Vector3(px + lx, 0.011, 0.001)];
        satGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), panelLinesMat));
      });
    });

    // Antenna dish (small cone pointing earth)
    const antenna = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.028, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, wireframe: true })
    );
    antenna.position.y = -0.02;
    satGroup.add(antenna);

    // Satellite glow point light
    const satLight = new THREE.PointLight(0x00ccff, 2.5, 0.8);
    satGroup.add(satLight);

    // Signal beam (cone from satellite to globe)
    const beamGeo = new THREE.CylinderGeometry(0.0005, 0.08, 1.2, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const satBeam = new THREE.Mesh(beamGeo, beamMat);
    satGroup.add(satBeam); // positioned dynamically in animate

    // ── SATELLITE TRAIL (gradient points) ────────────────────────────────────
    const TRAIL_LENGTH = 48;
    const trailPts = new Float32Array(TRAIL_LENGTH * 3);
    const trailColorsArr = new Float32Array(TRAIL_LENGTH * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPts, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColorsArr, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.015, transparent: true, opacity: 0.9,
      vertexColors: true, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const satTrail = new THREE.Points(trailGeo, trailMat);
    scene.add(satTrail);
    const trailHistory = [];

    // Second satellite on different orbit — full satellite body like sat1 but purple
    const sat2Group = new THREE.Group();

    // Main body
    const sat2Body = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.02, 0.02),
      new THREE.MeshPhongMaterial({ color: 0xddaaff, emissive: 0x440088, emissiveIntensity: 0.6, shininess: 120 })
    );
    sat2Group.add(sat2Body);

    // Solar panels
    const panel2Mat = new THREE.MeshBasicMaterial({
      color: 0x5511aa, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const panel2Geo = new THREE.PlaneGeometry(0.07, 0.022);
    const panel2L = new THREE.Mesh(panel2Geo, panel2Mat);
    panel2L.position.x = -0.055;
    sat2Group.add(panel2L);
    const panel2R = new THREE.Mesh(panel2Geo, panel2Mat);
    panel2R.position.x = 0.055;
    sat2Group.add(panel2R);

    // Solar panel grid lines
    const panel2LinesMat = new THREE.LineBasicMaterial({ color: 0xaa66ff, transparent: true, opacity: 0.5 });
    [-0.055, 0.055].forEach(px => {
      [-0.017, 0, 0.017].forEach(lx => {
        const pts = [new THREE.Vector3(px + lx, -0.011, 0.001), new THREE.Vector3(px + lx, 0.011, 0.001)];
        sat2Group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), panel2LinesMat));
      });
    });

    // Antenna
    const antenna2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.028, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.5, wireframe: true })
    );
    antenna2.position.y = -0.02;
    sat2Group.add(antenna2);

    // Signal beam
    const beam2Geo = new THREE.CylinderGeometry(0.0005, 0.08, 1.2, 16, 1, true);
    const beam2Mat = new THREE.MeshBasicMaterial({
      color: 0xaa44ff, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sat2Beam = new THREE.Mesh(beam2Geo, beam2Mat);
    sat2Group.add(sat2Beam);

    const sat2Light = new THREE.PointLight(0xaa44ff, 1.5, 0.6);
    sat2Group.add(sat2Light);
    scene.add(sat2Group);

    const TRAIL2_LENGTH = 32;
    const trail2Pts = new Float32Array(TRAIL2_LENGTH * 3);
    const trail2Colors = new Float32Array(TRAIL2_LENGTH * 3);
    const trail2Geo = new THREE.BufferGeometry();
    trail2Geo.setAttribute('position', new THREE.BufferAttribute(trail2Pts, 3));
    trail2Geo.setAttribute('color', new THREE.BufferAttribute(trail2Colors, 3));
    const trail2Mat = new THREE.PointsMaterial({
      size: 0.01, transparent: true, opacity: 0.8,
      vertexColors: true, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    scene.add(new THREE.Points(trail2Geo, trail2Mat));
    const trail2History = [];

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
      const up = pos.clone().normalize();
      const color = resource.status === 'offline' ? 0x334455 : resource.status === 'limited' ? 0xff8800 : 0xffaa00;
      const colorInt = color;

      const rGroup = new THREE.Group();
      rGroup.position.copy(pos);
      rGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      rGroup.userData = { resource, type: 'resource' };
      rGroup.scale.setScalar(2.5);

      const mat = new THREE.MeshPhongMaterial({ color: colorInt, emissive: colorInt, emissiveIntensity: 0.7, shininess: 140, transparent: true, opacity: 0.95 });
      const wireMat = new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: 0.4, wireframe: true });

      // Point light glow (like satellite)
      const rLight = new THREE.PointLight(colorInt, 3.0, 0.5);
      rLight.position.set(0, 0.04, 0);
      rGroup.add(rLight);

      // Vertical signal beam upward
      const rBeamGeo = new THREE.CylinderGeometry(0.0003, 0.02, 0.18, 12, 1, true);
      const rBeamMat = new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: 0.12, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
      const rBeam = new THREE.Mesh(rBeamGeo, rBeamMat);
      rBeam.position.y = 0.09;
      rGroup.add(rBeam);

      // Top glow sphere
      const rGlow = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
      rGlow.position.y = 0.055;
      rGroup.add(rGlow);

      // Unique material per resource type
      const resTypeColors = {
        warehouse: 0xffcc44, fuel_depot: 0xff6600,
        charging_station: 0x00ffff, maintenance_hub: 0xaa44ff, port: 0x0088ff
      };
      const resAccentColor = resTypeColors[resource.type] || colorInt;
      const resMat = new THREE.MeshPhongMaterial({ color: resAccentColor, emissive: resAccentColor, emissiveIntensity: 0.75, shininess: 160, transparent: true, opacity: 0.97 });
      const resDarkMat = new THREE.MeshPhongMaterial({ color: colorInt, emissive: colorInt, emissiveIntensity: 0.4, shininess: 80, transparent: true, opacity: 0.85 });

      if (resource.type === 'warehouse') {
        rGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.018, 0.04), resDarkMat));
        const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.055, 6), resMat);
        ridge.rotation.z = Math.PI / 2; ridge.position.y = 0.014;
        rGroup.add(ridge);
        // Roof panels
        const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.003, 0.022), resMat);
        roofL.position.set(0, 0.012, -0.009); roofL.rotation.x = 0.3;
        rGroup.add(roofL);
      } else if (resource.type === 'fuel_depot') {
        rGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 20), resDarkMat));
        rGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), resMat));
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.035, 8), resMat);
        pipe.position.set(0.026, 0, 0); pipe.rotation.z = Math.PI / 2;
        rGroup.add(pipe);
        // Hazard stripe ring
        const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 }));
        hRing.position.y = 0.01;
        rGroup.add(hRing);
      } else if (resource.type === 'charging_station') {
        rGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.012), resDarkMat));
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.018, 0.012), resMat);
        head.position.y = 0.036;
        rGroup.add(head);
        const gRing = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.03, 32), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        gRing.rotation.x = -Math.PI / 2; gRing.position.y = -0.025;
        rGroup.add(gRing);
        // Lightning bolt glow
        const bolt = new THREE.Mesh(new THREE.OctahedronGeometry(0.007, 0), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
        bolt.position.y = 0.044;
        rGroup.add(bolt);
      } else if (resource.type === 'maintenance_hub') {
        rGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.022, 0.038), resDarkMat));
        const roofGeo = new THREE.CylinderGeometry(0, 0.042, 0.024, 4);
        const roof = new THREE.Mesh(roofGeo, resMat);
        roof.position.y = 0.023; roof.rotation.y = Math.PI / 4;
        rGroup.add(roof);
        // Tool arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.028, 0.004), resMat);
        arm.position.set(0.025, 0.025, 0);
        rGroup.add(arm);
      } else if (resource.type === 'port') {
        rGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.008, 0.044), resDarkMat));
        const crane = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.048, 0.005), resMat);
        crane.position.set(0.028, 0.028, 0);
        rGroup.add(crane);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.005, 0.005), resMat);
        arm.position.set(0.011, 0.052, 0);
        rGroup.add(arm);
        // Crane cable
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.022, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
        cable.position.set(0.027, 0.04, 0);
        rGroup.add(cable);
      } else {
        rGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.038, 0.038), resMat));
      }

      globe.add(rGroup);
      resourceMarkers.push(rGroup);

      // Double pulse rings
      [0.04, 0.07].forEach((innerR, ri) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(innerR, innerR + 0.016, 32),
          new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: ri === 0 ? 0.5 : 0.25, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
        );
        ring.position.copy(pos);
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), up);
        ring.userData = { phase: Math.random() * Math.PI * 2 + ri * 1.0, isPulse: true };
        globe.add(ring);
      });
    });

    // ── VEHICLE MARKERS ───────────────────────────────────────────────────────
    const vehicleMarkers = [];
    const vehicleMarkerMaterials = []; // track emissive materials for mode switching
    const vehiclePulses = [];
    const vehicleBeams = [];
    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) return;
      const status = vehicle.status || 'offline';
      const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
      const pos = latLngToVec3(vehicle.latitude, vehicle.longitude, 1.025);
      const up = pos.clone().normalize();

      const vMat = new THREE.MeshPhongMaterial({ color: color.int, emissive: color.int, emissiveIntensity: 0.65, shininess: 140, transparent: true, opacity: 0.95 });
      const glassMat = new THREE.MeshPhongMaterial({ color: 0xaaddff, emissive: 0x003366, emissiveIntensity: 0.8, transparent: true, opacity: 0.75, shininess: 220 });
      vehicleMarkerMaterials.push({ vMat, accentMat: null, vehicle, baseColor: color.int });

      // Type needs to be defined first so typeColors can use it
      const type = vehicle.type || 'truck';

      // Type-specific accent colors for better visual distinction
      const typeColors = {
        truck: 0x00e5ff, ship: 0x0055ff, aircraft: 0xff6600,
        drone: 0x00ff88, train: 0xffdd00, bus: 0xff3399
      };
      const accentColor = typeColors[type] || color.int;
      const accentMat = new THREE.MeshPhongMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.9, shininess: 180, transparent: true, opacity: 0.98 });
      vehicleMarkerMaterials[vehicleMarkerMaterials.length - 1].accentMat = accentMat;
      vehicleMarkerMaterials[vehicleMarkerMaterials.length - 1].accentColor = accentColor;

      const vGroup = new THREE.Group();
      vGroup.position.copy(pos);
      vGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      vGroup.userData = { vehicle, status };
      vGroup.scale.setScalar(2.2);

      if (type === 'truck' || type === 'bus') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.016, 0.022), accentMat);
        body.position.y = 0.008;
        vGroup.add(body);
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.02), accentMat);
        cab.position.set(0.017, 0.015, 0);
        vGroup.add(cab);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.01, 0.016), glassMat);
        windshield.position.set(0.027, 0.015, 0);
        vGroup.add(windshield);
        [[-0.014, -0.01], [0.014, -0.01], [-0.014, 0.01], [0.014, 0.01]].forEach(([wx, wz]) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.006, 8), vMat);
          w.position.set(wx, 0, wz); w.rotation.z = Math.PI / 2;
          vGroup.add(w);
        });
      } else if (type === 'ship') {
        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.026), accentMat);
        hull.position.y = 0.007;
        vGroup.add(hull);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.022), accentMat);
        bridge.position.set(-0.018, 0.022, 0);
        vGroup.add(bridge);
        const bWin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.016), glassMat);
        bWin.position.set(-0.018, 0.024, 0);
        vGroup.add(bWin);
        const bow = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.022, 4), accentMat);
        bow.position.set(0.046, 0.007, 0); bow.rotation.z = -Math.PI / 2;
        vGroup.add(bow);
        // Waterline stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.003, 0.028), vMat);
        stripe.position.y = 0.013;
        vGroup.add(stripe);
      } else if (type === 'aircraft') {
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 12), accentMat);
        fuse.rotation.z = Math.PI / 2;
        vGroup.add(fuse);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.065), accentMat);
        vGroup.add(wing);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.018), accentMat);
        tail.position.set(-0.028, 0.008, 0);
        vGroup.add(tail);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.014, 12), glassMat);
        nose.position.set(0.037, 0, 0); nose.rotation.z = Math.PI / 2;
        vGroup.add(nose);
        [-0.018, 0.018].forEach(ez => {
          const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.016, 8), vMat);
          eng.rotation.z = Math.PI / 2; eng.position.set(0.004, -0.006, ez);
          vGroup.add(eng);
        });
      } else if (type === 'drone') {
        vGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.007, 16), accentMat));
        [0, 1, 2, 3].forEach(i => {
          const angle = (i / 4) * Math.PI * 2;
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.003, 0.004), vMat);
          arm.rotation.y = angle;
          vGroup.add(arm);
          const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.002, 16), accentMat);
          rotor.position.set(Math.cos(angle) * 0.016, 0.005, Math.sin(angle) * 0.016);
          vGroup.add(rotor);
          // Rotor ring
          const rRing = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.0015, 8, 24), vMat);
          rRing.position.set(Math.cos(angle) * 0.016, 0.006, Math.sin(angle) * 0.016);
          vGroup.add(rRing);
        });
      } else if (type === 'train') {
        [-0.03, 0, 0.03].forEach((ox, ci) => {
          const car = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.016), ci === 0 ? accentMat : vMat);
          car.position.set(ox, 0.007, 0);
          vGroup.add(car);
        });
        const winStrip = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.005, 0.003), glassMat);
        winStrip.position.set(0, 0.012, 0.009);
        vGroup.add(winStrip);
        // Rail
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.002, 0.002), vMat);
        rail.position.y = -0.001;
        vGroup.add(rail);
      } else {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 6), accentMat);
        cone.rotation.x = Math.PI / 2;
        vGroup.add(cone);
      }

      // Point light glow (like satellite)
      const vLight = new THREE.PointLight(color.int, 2.5, 0.45);
      vLight.position.set(0, 0.035, 0);
      vGroup.add(vLight);

      // Signal beacon beam upward
      const vBeamGeo = new THREE.CylinderGeometry(0.0003, 0.016, 0.14, 12, 1, true);
      const vBeamMat = new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.14, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
      const vBeam = new THREE.Mesh(vBeamGeo, vBeamMat);
      vBeam.position.y = 0.07;
      vGroup.add(vBeam);

      // Top glow dot
      const vGlow = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 16), new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
      vGlow.position.y = 0.042;
      vGroup.add(vGlow);

      // Speed direction indicator (small arrow)
      if (vehicle.speed > 0) {
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.012, 4), new THREE.MeshBasicMaterial({ color: color.int, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
        arrow.position.set(0.04, 0.018, 0);
        vGroup.add(arrow);
      }

      globe.add(vGroup);
      vehicleMarkers.push(vGroup);

      // Speed trail
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
      const vHit = raycaster.intersectObjects(vehicleMarkers, true);
      if (vHit.length > 0) {
        let obj = vHit[0].object;
        while (obj && !obj.userData.vehicle) obj = obj.parent;
        if (obj?.userData.vehicle) { onSelectVehicle?.(obj.userData.vehicle); return; }
      }
      const rHit = raycaster.intersectObjects(resourceMarkers, true);
      if (rHit.length > 0) {
        let obj = rHit[0].object;
        while (obj && !obj.userData.resource) obj = obj.parent;
        if (obj?.userData.resource) { onSelectResource?.(obj.userData.resource); return; }
      }
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

      // ── MODE-BASED COLOR SWITCHING ─────────────────────────────────────────
      const currentMode = activeModeRef.current;
      vehicleMarkerMaterials.forEach(({ vMat, accentMat, accentColor, vehicle, baseColor }) => {
        const modeColor = getModeColor(currentMode, vehicle);
        const c = modeColor ?? baseColor;
        const ac = modeColor ?? accentColor ?? baseColor;
        vMat.color.setHex(c); vMat.emissive.setHex(c);
        if (accentMat) { accentMat.color.setHex(ac); accentMat.emissive.setHex(ac); }
      });

      // Resource pulse + beacon flicker
      resourceMarkers.forEach(r => {
        r.rotation.y = time * 0.5;
        const rLt = r.children.find(c => c.isPointLight);
        if (rLt) rLt.intensity = 2.5 + 1.5 * Math.sin(time * 4 + (r.userData?.resource?.id?.charCodeAt(0) || 0));
      });

      // Animate data-flow particles along route arcs
      routeParticles.forEach(p => {
        p.userData.progress = (p.userData.progress + p.userData.speed) % 1;
        const pos = p.userData.curve.getPoint(p.userData.progress);
        p.position.copy(pos.clone().applyMatrix4(globe.matrixWorld).applyMatrix4(globe.matrixWorld.clone().invert()));
        // Actually just set it in globe space
        p.position.copy(p.userData.curve.getPoint(p.userData.progress));
      });

      // ── SAT 1 ORBIT (cyan, tilted) ───────────────────────────────────────
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

      satGroup.position.set(rx, ry, rz);

      // Face satellite body along orbit tangent
      const nextAngle = satAngle + 0.05;
      const nsx = Math.cos(nextAngle) * 1.35;
      const nsy = Math.sin(nextAngle) * 1.35;
      const nrx = nsx * cosZ - nsy * sinX * sinZ;
      const nry = nsy * cosX;
      const nrz = nsx * sinZ + nsy * sinX * cosZ;
      satGroup.lookAt(nrx, nry, nrz);

      // Solar panels pulse (reflect sun)
      panelMat.opacity = 0.7 + 0.25 * Math.sin(time * 2.5);

      // Signal beam: point from satellite toward globe center
      const satPos3 = new THREE.Vector3(rx, ry, rz);
      const toCenter = satPos3.clone().negate().normalize();
      const beamLen = satPos3.length() - 1.0;
      satBeam.position.copy(toCenter.clone().multiplyScalar(beamLen * 0.5).applyMatrix4(satGroup.matrixWorld.clone().invert()));
      satBeam.scale.y = beamLen;
      satBeam.lookAt(satGroup.position.clone().add(toCenter));
      satBeam.rotateX(Math.PI / 2);
      beamMat.opacity = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(time * 4));

      // Trail 1 — gradient fade
      trailHistory.push(new THREE.Vector3(rx, ry, rz));
      if (trailHistory.length > TRAIL_LENGTH) trailHistory.shift();
      const trailArr = trailGeo.attributes.position.array;
      const trailCols = trailGeo.attributes.color.array;
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const h = trailHistory[i] || new THREE.Vector3(rx, ry, rz);
        trailArr[i*3] = h.x; trailArr[i*3+1] = h.y; trailArr[i*3+2] = h.z;
        // Head = bright cyan, tail = dark blue
        const t2 = i / TRAIL_LENGTH;
        trailCols[i*3]   = t2 * 0.0 + (1-t2) * 0.0;   // R
        trailCols[i*3+1] = t2 * 0.8 + (1-t2) * 0.1;   // G
        trailCols[i*3+2] = t2 * 1.0 + (1-t2) * 0.2;   // B
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.attributes.color.needsUpdate = true;

      // ── SAT 2 ORBIT (purple, polar) ───────────────────────────────────────
      const sat2Angle = time * 0.52 + 1.8;
      const s2x = Math.cos(sat2Angle) * 1.42;
      const s2y = Math.sin(sat2Angle) * 1.42 * Math.cos(Math.PI * 0.55);
      const s2z = Math.sin(sat2Angle) * 1.42 * Math.sin(Math.PI * 0.55);
      sat2Group.position.set(s2x, s2y, s2z);

      // Face sat2 along orbit tangent
      const next2Angle = sat2Angle + 0.05;
      const ns2x = Math.cos(next2Angle) * 1.42;
      const ns2y = Math.sin(next2Angle) * 1.42 * Math.cos(Math.PI * 0.55);
      const ns2z = Math.sin(next2Angle) * 1.42 * Math.sin(Math.PI * 0.55);
      sat2Group.lookAt(ns2x, ns2y, ns2z);

      // Solar panels pulse
      panel2Mat.opacity = 0.7 + 0.25 * Math.sin(time * 2.1 + 1.3);

      // Signal beam toward globe
      const sat2Pos3 = new THREE.Vector3(s2x, s2y, s2z);
      const toCenter2 = sat2Pos3.clone().negate().normalize();
      const beamLen2 = sat2Pos3.length() - 1.0;
      sat2Beam.position.copy(toCenter2.clone().multiplyScalar(beamLen2 * 0.5).applyMatrix4(sat2Group.matrixWorld.clone().invert()));
      sat2Beam.scale.y = beamLen2;
      sat2Beam.lookAt(sat2Group.position.clone().add(toCenter2));
      sat2Beam.rotateX(Math.PI / 2);
      beam2Mat.opacity = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(time * 3.5 + 1));

      trail2History.push(new THREE.Vector3(s2x, s2y, s2z));
      if (trail2History.length > TRAIL2_LENGTH) trail2History.shift();
      const t2Arr = trail2Geo.attributes.position.array;
      const t2Cols = trail2Geo.attributes.color.array;
      for (let i = 0; i < TRAIL2_LENGTH; i++) {
        const h = trail2History[i] || new THREE.Vector3(s2x, s2y, s2z);
        t2Arr[i*3] = h.x; t2Arr[i*3+1] = h.y; t2Arr[i*3+2] = h.z;
        const t3 = i / TRAIL2_LENGTH;
        t2Cols[i*3]   = t3 * 0.6 + (1-t3) * 0.1;  // R
        t2Cols[i*3+1] = t3 * 0.1 + (1-t3) * 0.0;  // G
        t2Cols[i*3+2] = t3 * 1.0 + (1-t3) * 0.1;  // B
      }
      trail2Geo.attributes.position.needsUpdate = true;
      trail2Geo.attributes.color.needsUpdate = true;

      // Orbit ring shimmer
      orbitRingMat.opacity = 0.15 + 0.12 * Math.sin(time * 1.2);
      orbitRing2Mat.opacity = 0.08 + 0.07 * Math.sin(time * 0.9 + 1.2);

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

  const handleSetMode = (id) => {
    setActiveMode(id);
    activeModeRef.current = id;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full bg-black" style={{ cursor: 'grab' }} />

      {/* 3D Control Panel Overlay */}
      <div className="absolute top-4 right-4 z-20 select-none" style={{ pointerEvents: 'auto' }}>
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,8,20,0.85)', border: '1px solid rgba(6,182,212,0.25)', backdropFilter: 'blur(12px)', boxShadow: '0 0 32px rgba(6,182,212,0.08)' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(6,182,212,0.15)' }}>
            <p className="text-[8px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(6,182,212,0.5)' }}>VISNINGSTILSTAND</p>
          </div>
          <div className="p-2 space-y-1">
            {DISPLAY_MODES.map(mode => {
              const active = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleSetMode(mode.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    background: active ? `${mode.color}18` : 'transparent',
                    border: `1px solid ${active ? mode.color + '55' : 'transparent'}`,
                    boxShadow: active ? `0 0 12px ${mode.color}22` : 'none',
                  }}
                >
                  <span className="text-sm" style={{ color: active ? mode.color : 'rgba(148,163,184,0.5)', textShadow: active ? `0 0 8px ${mode.color}` : 'none' }}>{mode.icon}</span>
                  <div>
                    <p className="text-[9px] font-mono font-bold tracking-wider" style={{ color: active ? mode.color : 'rgba(148,163,184,0.6)' }}>{mode.label}</p>
                    <p className="text-[8px] font-mono" style={{ color: 'rgba(100,116,139,0.7)' }}>{mode.desc}</p>
                  </div>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: mode.color, boxShadow: `0 0 6px ${mode.color}` }} />}
                </button>
              );
            })}
          </div>
          {/* Legend for active mode */}
          {activeMode !== 'default' && (
            <div className="px-3 py-2 border-t" style={{ borderColor: 'rgba(6,182,212,0.1)' }}>
              {activeMode === 'energy' && (
                <div className="space-y-0.5">
                  {[['> 60%', '#10b981', 'Fuld'], ['30–60%', '#f59e0b', 'Lav'], ['< 30%', '#f43f5e', 'Kritisk']].map(([r, c, l]) => (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span className="text-[8px] font-mono" style={{ color: 'rgba(148,163,184,0.6)' }}>{r} — {l}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeMode === 'traffic' && (
                <div className="space-y-0.5">
                  {[['> 80 km/h', '#f43f5e', 'Høj'], ['40–80', '#f59e0b', 'Middel'], ['< 40', '#00ffff', 'Lav'], ['Stoppet', '#334455', '—']].map(([r, c, l]) => (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span className="text-[8px] font-mono" style={{ color: 'rgba(148,163,184,0.6)' }}>{r} — {l}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeMode === 'maintenance' && (
                <div className="space-y-0.5">
                  {[['OK', '#10b981', '> 14 dage'], ['Snart', '#f59e0b', '< 14 dage'], ['Overskredet', '#f43f5e', 'Forfald']].map(([l, c, r]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span className="text-[8px] font-mono" style={{ color: 'rgba(148,163,184,0.6)' }}>{l} — {r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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