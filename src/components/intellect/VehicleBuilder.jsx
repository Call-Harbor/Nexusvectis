import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { 
  Truck, Ship, Plane, Train, ChevronRight, ChevronLeft, 
  Fuel, Wind, BarChart3, Zap, Weight, Thermometer, 
  AlertTriangle, CheckCircle2, Play, RotateCcw, X,
  Settings, Activity, TrendingUp, TrendingDown, Gauge,
  Calculator, Info, Layers, Box, RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ── Vehicle Base Configs ──────────────────────────────────────────────────────
const VEHICLE_TYPES = {
  truck: {
    label: "Truck", icon: Truck, color: "#06b6d4",
    description: "Road vehicle for highway transport",
    baseWeight: 8000,
    maxPayload: 24000,
    baseConsumption: 32,
    co2PerLiter: 2.64,
    speedKph: 90,
    variants: ["Solo truck", "Semi-trailer", "B-train combo"],
    trailerMap: {
      standard_curtain: "standard",
      reefer: "refrigerated",
      flatbed: "flatbed",
      tanker: "tanker",
      car_carrier: "car_carrier",
      mega: "standard",
      swap_body: "standard",
      walking_floor: "standard",
    },
    attachments: {
      label: "Trailers",
      options: [
        { id: "standard_curtain", label: "Curtain-side trailer", weight: 8000, dragCoef: 1.0, img: "🏗️", desc: "Standard, versatile freight" },
        { id: "reefer", label: "Refrigerated trailer", weight: 9500, dragCoef: 1.08, img: "❄️", desc: "+8% consumption for cooling unit", extraPower: 5 },
        { id: "flatbed", label: "Flatbed trailer", weight: 6500, dragCoef: 0.95, img: "📦", desc: "Lower drag, lighter tare weight" },
        { id: "tanker", label: "Tank trailer", weight: 10500, dragCoef: 1.12, img: "🛢️", desc: "Liquid cargo, higher tare weight" },
        { id: "car_carrier", label: "Car transporter", weight: 11000, dragCoef: 1.25, img: "🚗", desc: "Multi-level, high aerodynamic drag" },
        { id: "mega", label: "Mega trailer (3m)", weight: 8200, dragCoef: 1.18, img: "📐", desc: "Extra height, increased air resistance" },
        { id: "swap_body", label: "Swap body", weight: 7200, dragCoef: 0.98, img: "🔄", desc: "Intermodal, flexible logistics" },
        { id: "walking_floor", label: "Walking floor", weight: 9000, dragCoef: 1.02, img: "🌾", desc: "Bulk / loose cargo" },
      ]
    }
  },
  ship: {
    label: "Ship", icon: Ship, color: "#8b5cf6",
    description: "Maritime transport for cargo and containers",
    baseWeight: 5000000,
    maxPayload: 80000000,
    baseConsumption: 200,
    co2PerLiter: 3.15,
    speedKph: 25,
    variants: ["Feeder vessel", "Handysize", "Panamax", "Post-Panamax"],
    shipTypeMap: {
      std_20: "container",
      std_40: "container",
      reefer_40: "container",
      bulk: "bulk",
      tanker_load: "tanker",
      ro_ro: "container",
      break_bulk: "container",
    },
    attachments: {
      label: "Container type / cargo",
      options: [
        { id: "std_20", label: "20' Standard (TEU)", weight: 2200, dragCoef: 1.0, img: "📦", desc: "Standard 20-foot ISO container" },
        { id: "std_40", label: "40' Standard (FEU)", weight: 3800, dragCoef: 1.0, img: "📦", desc: "Standard 40-foot container" },
        { id: "reefer_40", label: "40' Reefer container", weight: 4500, dragCoef: 1.0, img: "❄️", desc: "+12% consumption for refrigeration", extraPower: 12 },
        { id: "bulk", label: "Bulk cargo (grain/coal)", weight: 0, dragCoef: 0.85, img: "🌾", desc: "Loose bulk cargo, optimal stowage" },
        { id: "tanker_load", label: "Tanker cargo (crude/chemical)", weight: 0, dragCoef: 0.9, img: "🛢️", desc: "Liquid cargo in tanker vessel" },
        { id: "ro_ro", label: "Ro-Ro (vehicles/machinery)", weight: 0, dragCoef: 1.15, img: "🚛", desc: "Roll-on/Roll-off, limited closure" },
        { id: "break_bulk", label: "Break bulk", weight: 0, dragCoef: 1.05, img: "🎁", desc: "Project cargo, heavy-lift loads" },
      ]
    }
  },
  aircraft: {
    label: "Aircraft", icon: Plane, color: "#f59e0b",
    description: "Air freight for fast, time-critical transport",
    baseWeight: 90000,
    maxPayload: 100000,
    baseConsumption: 11000,
    co2PerLiter: 2.52,
    speedKph: 900,
    variants: ["Narrowbody freighter", "Widebody freighter", "Belly cargo", "Regional turboprop"],
    attachments: {
      label: "Cargo containers / ULD",
      options: [
        { id: "ld3", label: "LD3 Container", weight: 80, dragCoef: 1.0, img: "📦", desc: "Standard narrowbody container" },
        { id: "ld7", label: "LD7 Container", weight: 120, dragCoef: 1.0, img: "📦", desc: "Widebody container, wide base" },
        { id: "pallet_88", label: "88×125 Pallet (PMC)", weight: 110, dragCoef: 1.0, img: "🧱", desc: "Standard air freight pallet" },
        { id: "pallet_96", label: "96×125 Pallet (PAG)", weight: 120, dragCoef: 1.0, img: "🧱", desc: "Large freight pallet" },
        { id: "live_animals", label: "Live animals (AVI)", weight: 200, dragCoef: 1.0, img: "🐄", desc: "Special container, ventilation +5%" },
        { id: "pharma", label: "Pharma / Temp-controlled", weight: 150, dragCoef: 1.0, img: "💊", desc: "Active temp-control, +8% consumption", extraPower: 8 },
        { id: "dangerous", label: "Dangerous goods (DGR)", weight: 90, dragCoef: 1.0, img: "⚠️", desc: "IATA DGR class, special handling" },
      ]
    }
  },
  train: {
    label: "Train", icon: Train, color: "#10b981",
    description: "Rail transport — energy efficient, high-volume",
    baseWeight: 120000,
    maxPayload: 3000000,
    baseConsumption: 6,
    co2PerLiter: 0.233,
    speedKph: 120,
    variants: ["Freight train (electric)", "Freight train (diesel)", "Intermodal block train", "Heavy bulk train"],
    attachments: {
      label: "Wagons / cargo type",
      options: [
        { id: "flat_wagon", label: "Flat wagon (containers)", weight: 20000, dragCoef: 1.0, img: "🚃", desc: "For 20'/40' containers, intermodal" },
        { id: "tank_wagon", label: "Tank wagon", weight: 25000, dragCoef: 1.05, img: "🛢️", desc: "Liquid cargo, chemicals" },
        { id: "gondola", label: "Gondola wagon (bulk)", weight: 22000, dragCoef: 0.95, img: "⛏️", desc: "Open wagon for coal, ore, gravel" },
        { id: "boxcar", label: "Boxcar (covered wagon)", weight: 24000, dragCoef: 1.02, img: "📦", desc: "Versatile enclosed freight wagon" },
        { id: "car_wagon", label: "Auto-rack wagon", weight: 28000, dragCoef: 1.3, img: "🚗", desc: "Double-deck vehicle transport" },
        { id: "reefer_wagon", label: "Refrigerated wagon", weight: 28000, dragCoef: 1.08, img: "❄️", desc: "Cold chain rail cargo", extraPower: 6 },
        { id: "hopper", label: "Hopper wagon (grain/cement)", weight: 21000, dragCoef: 0.93, img: "🌾", desc: "Bottom-discharge bulk wagon" },
      ]
    }
  }
};

// ── Three.js model builders (reused from Fleet3DViewer) ───────────────────────

function buildTruck3D(config = {}) {
  const group = new THREE.Group();
  const { trailerType = "standard", color = "#1e40af", cabColor = null } = config;
  const cabCol = new THREE.Color(cabColor || color);
  const bodyCol = new THREE.Color(color).offsetHSL(0, 0, 0.05);
  const darkMetal = new THREE.Color("#1a1a2e");
  const chrome = new THREE.Color("#c0c0c0");
  const glassColor = new THREE.Color("#a8d8ea");
  const rubber = new THREE.Color("#111111");
  const lightYellow = new THREE.Color("#ffee88");
  const lightRed = new THREE.Color("#ff4444");

  const cabMat = new THREE.MeshPhysicalMaterial({ color: cabCol, roughness: 0.3, metalness: 0.6 });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.8), cabMat);
  cab.position.set(0, 1.5, 1.0); group.add(cab);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.8), new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.8 }));
  visor.position.set(0, 2.68, 0.6); group.add(visor);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: glassColor, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.08), glassMat);
  windshield.position.set(0, 1.8, 2.36); group.add(windshield);
  const grillMat = new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.4, metalness: 0.9 });
  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.1), grillMat);
  grill.position.set(0, 0.9, 2.35); group.add(grill);
  const headlightMat = new THREE.MeshStandardMaterial({ color: lightYellow, emissive: lightYellow, emissiveIntensity: 1.2 });
  [-0.7, 0.7].forEach(x => { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), headlightMat); hl.position.set(x, 1.1, 2.38); group.add(hl); });
  const exhaustMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.95 });
  [-0.9, 0.9].forEach(x => { const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), exhaustMat); ex.position.set(x, 2.8, 0.7); group.add(ex); });
  const tankGeoC = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16); tankGeoC.rotateZ(Math.PI / 2);
  const tankMat = new THREE.MeshPhysicalMaterial({ color: chrome, roughness: 0.1, metalness: 1.0 });
  [-1.2, 1.2].forEach(x => { const tank = new THREE.Mesh(tankGeoC, tankMat); tank.position.set(x, 0.55, 0.2); group.add(tank); });

  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, -2.5);
  if (trailerType === "refrigerated") {
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 8.5), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#f0f0f0"), roughness: 0.5, metalness: 0.3 }));
    trailer.position.set(0, 1.8, -1.75); trailerGroup.add(trailer);
    const cooler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.0), new THREE.MeshStandardMaterial({ color: new THREE.Color("#888888"), roughness: 0.3, metalness: 0.8 }));
    cooler.position.set(0, 3.25, 1.0); trailerGroup.add(cooler);
  } else if (trailerType === "flatbed") {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 9.5), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#8B4513"), roughness: 0.9, metalness: 0.1 }));
    bed.position.set(0, 0.8, -2.25); trailerGroup.add(bed);
  } else if (trailerType === "tanker") {
    const tankBodyGeo = new THREE.CylinderGeometry(1.1, 1.1, 9.0, 24); tankBodyGeo.rotateZ(Math.PI / 2);
    const tankBody = new THREE.Mesh(tankBodyGeo, new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#c8c8c8"), roughness: 0.15, metalness: 0.95 }));
    tankBody.position.set(0, 1.8, -2.0); trailerGroup.add(tankBody);
  } else if (trailerType === "car_carrier") {
    [0.8, 2.2, 3.6].forEach(y => {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 9.0), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.7 }));
      deck.position.set(0, y, -2.0); trailerGroup.add(deck);
    });
  } else {
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 9.0), new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.4, metalness: 0.5 }));
    trailer.position.set(0, 1.8, -2.0); trailerGroup.add(trailer);
  }
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 8.5), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.7, metalness: 0.6 }));
  under.position.set(0, 0.3, -2.0); trailerGroup.add(under);
  group.add(trailerGroup);

  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: rubber, roughness: 0.9 });
  const addW = (x, y, z) => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, y, z); group.add(w); };
  addW(-1.3, 0.5, 1.8); addW(1.3, 0.5, 1.8);
  [-0.5, -1.3].forEach(z => { [-1.4, 1.4].forEach(x => addW(x, 0.5, z)); });
  [-6.0, -7.0].forEach(z => { [-1.4, 1.4].forEach(x => addW(x, 0.5, z)); });

  group.rotation.y = Math.PI / 6;
  group.position.y = 0.5;
  return group;
}

function buildShip3D(config = {}) {
  const group = new THREE.Group();
  const { shipType = "container", color = "#1e3a5f" } = config;
  const hullCol = new THREE.Color(color);
  const white = new THREE.Color("#f0f0f0");
  const darkMetal = new THREE.Color("#333344");
  const orange = new THREE.Color("#ff6600");

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-3,0); hullShape.lineTo(-3.5,-1.5); hullShape.lineTo(-2.5,-2.5);
  hullShape.lineTo(2.5,-2.5); hullShape.lineTo(3.5,-1.5); hullShape.lineTo(3,0); hullShape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 14, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.2, bevelSegments: 4 }), new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: 0.5, metalness: 0.7 }));
  hull.rotation.y = Math.PI / 2; hull.position.set(7, 0, -3); group.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 14), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#666666"), roughness: 0.7, metalness: 0.4 }));
  deck.position.set(0, 0.35, 0); group.add(deck);

  if (shipType === "container") {
    const colors = ["#1e40af","#dc2626","#15803d","#92400e","#6d28d9","#0f766e"];
    [[-2,0],[0,0],[2,0],[-2,1.3],[0,1.3],[2,1.3],[-1,2.6],[1,2.6]].forEach(([x,y],ri) => {
      [-5,-2.5,0,2.5,5].forEach((z,zi) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.1,2.3), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(colors[(ri+zi)%colors.length]), roughness: 0.4, metalness: 0.3 }));
        c.position.set(x, 1.0+y, z); group.add(c);
      });
    });
  } else if (shipType === "tanker") {
    [-5,-1.5,2,5].forEach(z => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,3,20), new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.2, metalness: 0.8 }));
      t.position.set(0, 2.2, z); group.add(t);
    });
  } else {
    const hold = new THREE.Mesh(new THREE.BoxGeometry(5.5,1.5,11), new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.8, metalness: 0.4 }));
    hold.position.set(0, 1.25, 0); group.add(hold);
  }

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.5,3.5,4), new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.4, metalness: 0.3 }));
  bridge.position.set(0, 2.4, -5.5); group.add(bridge);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,2.5,16), new THREE.MeshStandardMaterial({ color: orange, roughness: 0.3, metalness: 0.5 }));
  funnel.position.set(0, 5.8, -5.5); group.add(funnel);

  group.rotation.y = -Math.PI / 8;
  group.scale.set(0.5, 0.5, 0.5);
  group.position.y = -0.5;
  return group;
}

function buildAircraft3D(config = {}) {
  const group = new THREE.Group();
  const { color = "#e5e7eb" } = config;
  const bodyCol = new THREE.Color(color);
  const darkMetal = new THREE.Color("#222233");
  const blue = new THREE.Color("#1d4ed8");
  const glass = new THREE.Color("#7ecef4");

  const fuselageGeo = new THREE.CylinderGeometry(0.7, 0.3, 8, 20); fuselageGeo.rotateZ(Math.PI / 2);
  const fuselageMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.6 });
  group.add(new THREE.Mesh(fuselageGeo, fuselageMat));
  const noseGeo = new THREE.ConeGeometry(0.7, 2, 20); noseGeo.rotateZ(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat); nose.position.set(5, 0, 0); group.add(nose);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0,0); wingShape.lineTo(3.5,-1.2); wingShape.lineTo(3.8,-0.5); wingShape.lineTo(0.8,0.2); wingShape.closePath();
  const wingMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.5 });
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.12, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, wingMat); wingL.rotation.x = Math.PI / 2; wingL.position.set(-0.5, -0.1, 0); group.add(wingL);
  const wingR = wingL.clone(); wingR.rotation.x = -Math.PI / 2; wingR.position.set(-0.5, -0.1, 0.12); group.add(wingR);

  [[0.8,-0.6,-2],[0.8,-0.6,2]].forEach(([x,y,z]) => {
    const engGeo = new THREE.CylinderGeometry(0.35,0.3,1.6,16); engGeo.rotateZ(Math.PI/2);
    const eng = new THREE.Mesh(engGeo, new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.9 }));
    eng.position.set(x,y,z); group.add(eng);
  });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8,2.0,0.12), wingMat); tail.position.set(-3.5,0.8,0); group.add(tail);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(8.2,0.25,0.71), new THREE.MeshStandardMaterial({ color: blue, roughness: 0.3 }));
  stripe.position.set(-0.5,0.2,0); group.add(stripe);

  group.rotation.y = Math.PI / 5;
  group.scale.set(0.75, 0.75, 0.75);
  group.position.y = 1.5;
  return group;
}

function buildTrain3D() {
  const group = new THREE.Group();
  const bodyCol = new THREE.Color("#1a3a6e");
  const darkMetal = new THREE.Color("#1a1a1a");
  const yellow = new THREE.Color("#f59e0b");
  const glass = new THREE.Color("#a8d8ea");

  // Locomotive
  const locoBody = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 6), new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.6 }));
  locoBody.position.set(0, 1.5, 2); group.add(locoBody);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2), new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.6 }));
  cabin.position.set(0, 3.1, 3.5); group.add(cabin);
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.08), new THREE.MeshPhysicalMaterial({ color: glass, transparent: true, opacity: 0.6, roughness: 0.05 }));
  frontGlass.position.set(0, 3.2, 4.54); group.add(frontGlass);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.02, 0.3, 6.02), new THREE.MeshStandardMaterial({ color: yellow, roughness: 0.3 }));
  stripe.position.set(0, 2.65, 2); group.add(stripe);

  // Wagons
  [-6, -12].forEach(z => {
    const wagon = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 5.5), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#374151"), roughness: 0.4, metalness: 0.5 }));
    wagon.position.set(0, 1.4, z); group.add(wagon);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 5.3), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.6, metalness: 0.6 }));
    bottom.position.set(0, 0.3, z); group.add(bottom);
  });

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 20); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.9 });
  [2, -1, -6, -12].forEach(z => {
    [-1.5, 1.5].forEach(x => {
      const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, 0.45, z); group.add(w);
    });
  });

  // Rails
  const railGeo = new THREE.BoxGeometry(0.15, 0.12, 30);
  const railMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#6b7280"), roughness: 0.5, metalness: 0.8 });
  [-1.5, 1.5].forEach(x => { const r = new THREE.Mesh(railGeo, railMat); r.position.set(x, 0.05, -4); group.add(r); });

  group.rotation.y = Math.PI / 8;
  group.position.y = 0.3;
  return group;
}

// ── 3D Preview Component ──────────────────────────────────────────────────────
function Vehicle3DPreview({ vehicleType, attachmentId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animRef = useRef(null);
  const modelRef = useRef(null);
  const rotRef = useRef({ x: 0.12, y: 0.4 });
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const [autoOn, setAutoOn] = useState(true);

  const vt = VEHICLE_TYPES[vehicleType];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    camera.position.set(8, 5, 12);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x223344, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(10, 15, 10); mainLight.castShadow = true; scene.add(mainLight);
    const fillLight = new THREE.DirectionalLight(0x4488bb, 0.8); fillLight.position.set(-8, 5, -5); scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.4); rimLight.position.set(0, -3, -10); scene.add(rimLight);
    scene.add(new THREE.HemisphereLight(0x223366, 0x0a0a14, 0.5));

    scene.add(new THREE.GridHelper(30, 30, 0x0d3d5a, 0x0a2a3a));
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x05101e, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const starVerts = [];
    for (let i = 0; i < 800; i++) starVerts.push((Math.random()-0.5)*200,(Math.random()-0.5)*200,(Math.random()-0.5)*200);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x88aacc, size: 0.5, transparent: true, opacity: 0.4 })));

    const onDown = (e) => { isDragging.current = true; autoRotate.current = false; setAutoOn(false); prevMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e) => {
      if (!isDragging.current || !modelRef.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      rotRef.current.y += dx * 0.008;
      rotRef.current.x = Math.max(-0.6, Math.min(0.8, rotRef.current.x + dy * 0.005));
      modelRef.current.rotation.y = rotRef.current.y;
      modelRef.current.rotation.x = rotRef.current.x;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onWheel = (e) => { e.preventDefault(); camera.position.z = Math.max(5, Math.min(25, camera.position.z + e.deltaY * 0.02)); camera.position.y = Math.max(2, Math.min(15, camera.position.y + e.deltaY * 0.005)); };
    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("mouseleave", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (autoRotate.current && modelRef.current) {
        rotRef.current.y += 0.005;
        modelRef.current.rotation.y = rotRef.current.y;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animRef.current);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Rebuild model when type or attachment changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (modelRef.current) { sceneRef.current.remove(modelRef.current); modelRef.current = null; }
    autoRotate.current = true; setAutoOn(true);
    rotRef.current = { x: 0.12, y: 0.4 };

    let model;
    if (vehicleType === "truck") {
      const trailerType = VEHICLE_TYPES.truck.trailerMap?.[attachmentId] || "standard";
      model = buildTruck3D({ color: vt.color, trailerType });
    } else if (vehicleType === "ship") {
      const shipType = VEHICLE_TYPES.ship.shipTypeMap?.[attachmentId] || "container";
      model = buildShip3D({ color: "#1e3a5f", shipType });
    } else if (vehicleType === "aircraft") {
      model = buildAircraft3D({ color: "#e5e7eb" });
    } else if (vehicleType === "train") {
      model = buildTrain3D();
    }
    if (model) {
      sceneRef.current.add(model);
      modelRef.current = model;
      model.rotation.y = rotRef.current.y;
      model.rotation.x = rotRef.current.x;
    }
  }, [vehicleType, attachmentId]);

  const toggleAutoRotate = () => {
    autoRotate.current = !autoRotate.current;
    setAutoOn(autoRotate.current);
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-cyan-500/20" style={{ background: "#060a14" }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Controls */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button onClick={toggleAutoRotate} title="Toggle auto-rotate"
          className={`p-1.5 rounded-lg border transition-all ${autoOn ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-slate-900/60 border-slate-700/40 text-slate-400 hover:text-cyan-400"}`}>
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono text-right leading-relaxed">
        <p>Drag to rotate</p>
        <p>Scroll to zoom</p>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">3D Preview</span>
      </div>
    </div>
  );
}

// ── Physics/Simulation Engine ─────────────────────────────────────────────────
function simulate(config) {
  const { type, variant, attachment, payload, distance, terrain, weather, speed } = config;
  const vt = VEHICLE_TYPES[type];
  if (!vt || !attachment) return null;
  const att = vt.attachments.options.find(o => o.id === attachment);
  if (!att) return null;

  let baseFuel = vt.baseConsumption;
  const nominalSpeed = vt.speedKph;
  const speedRatio = speed / nominalSpeed;
  const speedFactor = 0.6 + 0.4 * Math.pow(speedRatio, 2.5);
  const payloadRatio = payload / vt.maxPayload;
  const loadFactor = 1 + payloadRatio * 0.65;
  const dragFactor = att.dragCoef;
  const terrainFactors = { flat: 1.0, hills: 1.18, mountains: 1.42, city: 1.28, mixed: 1.12 };
  const weatherFactors = { clear: 1.0, rain: 1.07, wind_headwind: 1.15, snow: 1.22, fog: 1.03 };
  const terrainFactor = terrainFactors[terrain] || 1.0;
  const weatherFactor = weatherFactors[weather] || 1.0;
  const extraFactor = att.extraPower ? 1 + att.extraPower / 100 : 1.0;
  const consumptionRate = baseFuel * speedFactor * loadFactor * dragFactor * terrainFactor * weatherFactor * extraFactor;

  let totalFuel, unit, fuelLabel;
  if (type === "truck") { totalFuel = (consumptionRate / 100) * distance; unit = "L"; fuelLabel = "Diesel (L)"; }
  else if (type === "ship") { const days = distance / (speed * 24); totalFuel = consumptionRate * days; unit = "ton"; fuelLabel = "Bunker fuel (t)"; }
  else if (type === "aircraft") { const hours = distance / speed; totalFuel = consumptionRate * hours; unit = "L"; fuelLabel = "JET-A1 (L)"; }
  else if (type === "train") { const totalTons = (payload / 1000) || 1; totalFuel = consumptionRate * totalTons * distance; unit = "kWh"; fuelLabel = "Electricity (kWh)"; }

  const co2Total = totalFuel * vt.co2PerLiter;
  const co2PerTonKm = payload > 0 ? (co2Total / ((payload / 1000) * distance)) * 1000 : 0;
  const efficiencyScore = Math.max(10, Math.round(100 - (loadFactor-1)*30 - (speedFactor-1)*20 - (dragFactor-1)*25 - (terrainFactor-1)*15));
  const fuelPrices = { truck: 10.5, ship: 4200, aircraft: 8.2, train: 0.85 };
  const fuelCost = totalFuel * fuelPrices[type];
  const driverCost = type === "truck" ? (distance / speed) * 280 : 0;
  const totalCost = fuelCost + driverCost;

  const steps = Math.min(24, Math.max(8, Math.round(distance / (speed * 0.5))));
  const timeline = Array.from({ length: steps }, (_, i) => {
    const progress = i / (steps - 1);
    return {
      step: `${Math.round(progress * 100)}%`,
      fuel: Math.round((totalFuel / steps) * (i + 1)),
      co2: Math.round((totalFuel / steps) * (i + 1) * vt.co2PerLiter),
      speed: Math.round(speed * (0.9 + Math.sin(progress * Math.PI * 3) * 0.1)),
      distance: Math.round(progress * distance),
    };
  });

  const radarData = [
    { subject: "Speed", value: Math.max(20, 100 - Math.abs(speedRatio - 1) * 60) },
    { subject: "Load", value: Math.max(20, 100 - payloadRatio * 40) },
    { subject: "Aerodynamics", value: Math.max(20, 100 - (dragFactor - 1) * 120) },
    { subject: "Weather", value: Math.max(20, 100 - (weatherFactor - 1) * 150) },
    { subject: "Terrain", value: Math.max(20, 100 - (terrainFactor - 1) * 100) },
    { subject: "Equipment", value: Math.max(20, 100 - (extraFactor - 1) * 200) },
  ];

  const durationLabel = type === "ship" ? `${(distance/(speed*24)).toFixed(1)} days` :
                        type === "aircraft" ? `${(distance/speed).toFixed(1)} hrs` :
                        `${(distance/speed).toFixed(1)} hrs`;

  return { totalFuel: Math.round(totalFuel), unit, fuelLabel, co2Total: Math.round(co2Total), co2PerTonKm: Math.round(co2PerTonKm*10)/10, efficiencyScore, fuelCost: Math.round(fuelCost), driverCost: Math.round(driverCost), totalCost: Math.round(totalCost), consumptionRate: Math.round(consumptionRate*10)/10, timeline, radarData, duration: durationLabel, factors: { speedFactor, loadFactor, dragFactor, terrainFactor, weatherFactor, extraFactor } };
}

// ── Step Components ───────────────────────────────────────────────────────────
function StepVehicleType({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-cyan-400" /> Select transport mode
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(VEHICLE_TYPES).map(([key, vt]) => {
          const Icon = vt.icon;
          const selected = config.type === key;
          return (
            <motion.button key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ type: key, attachment: null, variant: null })}
              className="p-4 rounded-xl border text-left transition-all"
              style={{ background: selected ? `${vt.color}18` : "rgba(15,23,42,0.6)", borderColor: selected ? vt.color : "rgba(100,116,139,0.3)", boxShadow: selected ? `0 0 20px ${vt.color}30` : "none" }}>
              <Icon className="w-8 h-8 mb-2" style={{ color: vt.color }} />
              <p className="text-white font-bold">{vt.label}</p>
              <p className="text-slate-400 text-xs mt-1">{vt.description}</p>
            </motion.button>
          );
        })}
      </div>
      {config.type && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <p className="text-slate-400 text-xs mb-2 font-semibold uppercase tracking-wide">Variant</p>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES[config.type].variants.map(v => (
              <button key={v} onClick={() => onChange({ variant: v })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: config.variant === v ? `${VEHICLE_TYPES[config.type].color}20` : "rgba(30,41,59,0.8)", borderWidth: 1, borderStyle: "solid", borderColor: config.variant === v ? VEHICLE_TYPES[config.type].color : "rgba(100,116,139,0.3)", color: config.variant === v ? "#fff" : "#94a3b8" }}>
                {v}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StepAttachment({ config, onChange }) {
  const vt = VEHICLE_TYPES[config.type];
  if (!vt) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
        <Weight className="w-5 h-5 text-cyan-400" /> {vt.attachments.label}
      </h3>
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {vt.attachments.options.map(att => {
          const selected = config.attachment === att.id;
          return (
            <motion.button key={att.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => onChange({ attachment: att.id })}
              className="w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all"
              style={{ background: selected ? `${vt.color}15` : "rgba(15,23,42,0.6)", borderColor: selected ? vt.color : "rgba(100,116,139,0.3)" }}>
              <span className="text-2xl">{att.img}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{att.label}</p>
                <p className="text-slate-400 text-xs">{att.desc}</p>
                {att.extraPower && <Badge className="mt-1 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">+{att.extraPower}% power consumption</Badge>}
              </div>
              {att.weight > 0 && <span className="text-slate-500 text-xs whitespace-nowrap">{(att.weight/1000).toFixed(1)}t tare</span>}
              {selected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: vt.color }} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepParameters({ config, onChange }) {
  const vt = VEHICLE_TYPES[config.type];
  if (!vt) return null;
  const att = vt.attachments.options.find(o => o.id === config.attachment);
  const maxPayload = vt.maxPayload - (att?.weight || 0);
  const payloadKg = config.payload || Math.round(maxPayload * 0.7);

  return (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <Gauge className="w-5 h-5 text-cyan-400" /> Operating parameters
      </h3>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Payload</label>
          <span className="text-white font-bold text-sm">{((config.payload || payloadKg)/1000).toFixed(1)} t</span>
        </div>
        <Slider min={0} max={maxPayload} step={100} value={[config.payload || payloadKg]} onValueChange={([v]) => onChange({ payload: v })} className="w-full" />
        <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0 t</span><span>Max: {(maxPayload/1000).toFixed(0)} t</span></div>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Route distance</label>
          <span className="text-white font-bold text-sm">{(config.distance || 500).toLocaleString()} km</span>
        </div>
        <Slider min={50} max={config.type==="ship"?15000:config.type==="aircraft"?12000:config.type==="train"?3000:2000} step={50} value={[config.distance || 500]} onValueChange={([v]) => onChange({ distance: v })} className="w-full" />
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Travel speed {config.type==="ship"?"(knots)":"(km/h)"}</label>
          <span className="text-white font-bold text-sm">{config.speed || vt.speedKph} {config.type==="ship"?"kn":"km/h"}</span>
        </div>
        <Slider min={config.type==="ship"?8:config.type==="aircraft"?600:config.type==="train"?40:50} max={config.type==="ship"?35:config.type==="aircraft"?950:config.type==="train"?160:110} step={1} value={[config.speed || vt.speedKph]} onValueChange={([v]) => onChange({ speed: v })} className="w-full" />
      </div>
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Terrain / Route type</label>
        <div className="grid grid-cols-3 gap-2">
          {[{id:"flat",label:"Flat",emoji:"🛣️"},{id:"hills",label:"Hills",emoji:"⛰️"},{id:"mountains",label:"Mountains",emoji:"🏔️"},{id:"city",label:"Urban",emoji:"🏙️"},{id:"mixed",label:"Mixed",emoji:"🗺️"}].map(t => (
            <button key={t.id} onClick={() => onChange({ terrain: t.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.terrain===t.id?`${vt.color}20`:"rgba(30,41,59,0.8)", borderColor: config.terrain===t.id?vt.color:"rgba(100,116,139,0.3)", color: config.terrain===t.id?"#fff":"#94a3b8" }}>
              <div>{t.emoji}</div><div>{t.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Weather conditions</label>
        <div className="grid grid-cols-3 gap-2">
          {[{id:"clear",label:"Clear",emoji:"☀️"},{id:"rain",label:"Rain",emoji:"🌧️"},{id:"wind_headwind",label:"Headwind",emoji:"💨"},{id:"snow",label:"Snow",emoji:"❄️"},{id:"fog",label:"Fog",emoji:"🌫️"}].map(w => (
            <button key={w.id} onClick={() => onChange({ weather: w.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.weather===w.id?`${vt.color}20`:"rgba(30,41,59,0.8)", borderColor: config.weather===w.id?vt.color:"rgba(100,116,139,0.3)", color: config.weather===w.id?"#fff":"#94a3b8" }}>
              <div>{w.emoji}</div><div>{w.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimulationResults({ result, config }) {
  const vt = VEHICLE_TYPES[config.type];
  if (!result || !vt) return null;
  const scoreColor = result.efficiencyScore >= 75 ? "#10b981" : result.efficiencyScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-5">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cyan-400" /> Simulation Results
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: result.fuelLabel, value: result.totalFuel.toLocaleString(), unit: result.unit, icon: Fuel, color: "#f59e0b" },
          { label: "CO₂ emissions", value: result.co2Total.toLocaleString(), unit: "kg", icon: Wind, color: "#ef4444" },
          { label: "CO₂ intensity", value: result.co2PerTonKm, unit: "g/ton-km", icon: Activity, color: "#8b5cf6" },
          { label: "Duration", value: result.duration, unit: "", icon: Gauge, color: "#06b6d4" },
          { label: "Fuel cost", value: result.fuelCost.toLocaleString(), unit: "DKK", icon: TrendingUp, color: "#10b981" },
          { label: "Total cost", value: result.totalCost.toLocaleString(), unit: "DKK", icon: Calculator, color: "#06b6d4" },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="p-3 rounded-xl border" style={{ background: `${color}0a`, borderColor: `${color}30` }}>
            <Icon className="w-4 h-4 mb-1.5" style={{ color }} />
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white font-bold text-lg">{value} <span className="text-slate-500 text-xs font-normal">{unit}</span></p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border" style={{ background: `${scoreColor}0a`, borderColor: `${scoreColor}30` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm font-semibold">Operational Efficiency</span>
          <span className="font-black text-2xl" style={{ color: scoreColor }}>{result.efficiencyScore}/100</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${result.efficiencyScore}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)` }} />
        </div>
        <p className="text-slate-400 text-xs mt-2">
          {result.efficiencyScore >= 75 ? "✅ Excellent — optimal operation" :
           result.efficiencyScore >= 50 ? "⚠️ Moderate — improvement potential exists" :
           "🔴 Low — consider load optimisation and reduced speed"}
        </p>
      </div>

      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Fuel consumption over route
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={result.timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} />
            <Area type="monotone" dataKey="fuel" stroke={vt.color} fill={`${vt.color}30`} name={result.fuelLabel} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-red-400" /> CO₂ accumulation (kg)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={result.timeline.filter((_, i) => i % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
            <Bar dataKey="co2" fill="#ef444460" stroke="#ef4444" name="CO₂ (kg)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" /> Efficiency profile
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={result.radarData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Radar name="Score" dataKey="value" stroke={vt.color} fill={`${vt.color}30`} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40">
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" /> Factor breakdown
        </p>
        <div className="space-y-2">
          {[
            { label: "Speed factor", value: result.factors.speedFactor },
            { label: "Load factor", value: result.factors.loadFactor },
            { label: "Aerodynamic drag (attachment)", value: result.factors.dragFactor },
            { label: "Terrain factor", value: result.factors.terrainFactor },
            { label: "Weather factor", value: result.factors.weatherFactor },
            { label: "Extra equipment", value: result.factors.extraFactor },
          ].map(({ label, value }) => {
            const increase = ((value - 1) * 100).toFixed(0);
            const isNeg = value > 1;
            return (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className={`font-mono font-bold ${isNeg ? "text-amber-400" : "text-emerald-400"}`}>
                  ×{value.toFixed(2)} {isNeg && increase > 0 ? `(+${increase}%)` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STEPS = ["Vehicle", "Equipment", "Parameters", "Simulate"];

export default function VehicleBuilder({ onClose }) {
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("configure"); // "configure" | "3d"
  const [config, setConfig] = useState({
    type: "truck", variant: null, attachment: null,
    payload: 15000, distance: 500, speed: 85,
    terrain: "mixed", weather: "clear",
  });
  const [simRan, setSimRan] = useState(false);

  const updateConfig = (changes) => setConfig(prev => ({ ...prev, ...changes }));
  const result = useMemo(() => { if (!simRan || !config.attachment) return null; return simulate(config); }, [simRan, config]);

  const vt = VEHICLE_TYPES[config.type];
  const canProceed = [config.type, config.attachment, config.payload != null && config.distance > 0, true][step];

  const handleRunSim = () => { setSimRan(true); setStep(3); };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          {vt && <vt.icon className="w-6 h-6" style={{ color: vt.color }} />}
          <div>
            <h2 className="text-white font-bold text-sm">Transport Builder & Simulator</h2>
            <p className="text-slate-500 text-xs">Configure your vehicle and run advanced calculations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
            <button onClick={() => setActiveTab("configure")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono transition-all ${activeTab==="configure" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
              <Settings className="w-3 h-3 inline mr-1" />Configure
            </button>
            <button onClick={() => setActiveTab("3d")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono transition-all ${activeTab==="3d" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
              <Box className="w-3 h-3 inline mr-1" />3D View
            </button>
          </div>
          {onClose && <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* 3D Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "3d" && (
          <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-4 flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <Vehicle3DPreview vehicleType={config.type} attachmentId={config.attachment} />
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(VEHICLE_TYPES).map(([key, v]) => {
                  const Icon = v.icon;
                  return (
                    <button key={key} onClick={() => updateConfig({ type: key, attachment: null, variant: null })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      style={{ background: config.type===key?`${v.color}20`:"rgba(30,41,59,0.6)", borderColor: config.type===key?v.color:"rgba(100,116,139,0.3)", color: config.type===key?"#fff":"#94a3b8" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: v.color }} />{v.label}
                    </button>
                  );
                })}
              </div>
              {config.type && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {VEHICLE_TYPES[config.type].attachments.options.map(att => (
                    <button key={att.id} onClick={() => updateConfig({ attachment: att.id })}
                      className="px-2 py-1 rounded text-[10px] border transition-all"
                      style={{ background: config.attachment===att.id?`${vt?.color}20`:"rgba(15,23,42,0.6)", borderColor: config.attachment===att.id?vt?.color:"rgba(100,116,139,0.2)", color: config.attachment===att.id?"#fff":"#64748b" }}>
                      {att.img} {att.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Configure Tab */}
        {activeTab === "configure" && (
          <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            {/* Step tabs */}
            <div className="flex border-b border-slate-800/60 flex-shrink-0">
              {STEPS.map((s, i) => (
                <button key={s} onClick={() => i < 3 && setStep(i)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all relative"
                  style={{ color: step===i ? vt?.color || "#06b6d4" : "#64748b" }}>
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center border font-bold"
                      style={{ borderColor: step===i?vt?.color||"#06b6d4":"#334155", background: step===i?`${vt?.color||"#06b6d4"}20`:"transparent" }}>
                      {i+1}
                    </span>
                    {s}
                  </span>
                  {step===i && <motion.div layoutId="step-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: vt?.color||"#06b6d4" }} />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {step===0 && <StepVehicleType config={config} onChange={updateConfig} />}
                  {step===1 && <StepAttachment config={config} onChange={updateConfig} />}
                  {step===2 && <StepParameters config={config} onChange={updateConfig} />}
                  {step===3 && !simRan && (
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `${vt?.color}20`, border: `2px solid ${vt?.color}40` }}>
                        {vt && <vt.icon className="w-12 h-12" style={{ color: vt.color }} />}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg">Ready to simulate</p>
                        <p className="text-slate-400 text-sm mt-1">{vt?.label} · {(config.payload/1000).toFixed(1)}t payload · {config.distance} km</p>
                      </div>
                      <Button onClick={handleRunSim} className="gap-2 px-8 py-3 font-bold text-base" style={{ background: `linear-gradient(135deg, ${vt?.color||"#06b6d4"}, #8b5cf6)` }}>
                        <Play className="w-5 h-5" /> Run Simulation
                      </Button>
                    </div>
                  )}
                  {step===3 && simRan && result && <SimulationResults result={result} config={config} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/60 flex-shrink-0 gap-3">
              <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0} className="gap-2 text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              {simRan && step===3 && (
                <Button variant="ghost" onClick={() => { setSimRan(false); setStep(2); }} className="gap-2 text-slate-400 hover:text-amber-400 text-xs">
                  <RotateCcw className="w-3 h-3" /> Adjust parameters
                </Button>
              )}
              {step < 2 && (
                <Button onClick={() => setStep(s => s+1)} disabled={!canProceed} className="gap-2 ml-auto" style={{ background: canProceed?`linear-gradient(135deg, ${vt?.color||"#06b6d4"}, #8b5cf6)`:undefined }}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              {step===2 && (
                <Button onClick={handleRunSim} disabled={!config.attachment} className="gap-2 ml-auto font-bold" style={{ background: `linear-gradient(135deg, ${vt?.color||"#06b6d4"}, #8b5cf6)` }}>
                  <Zap className="w-4 h-4" /> Simulate now
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}