import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import {
  Truck, Ship, Plane, Train, ChevronRight, ChevronLeft,
  Fuel, Wind, BarChart3, Zap, Weight,
  CheckCircle2, Play, RotateCcw, X,
  Settings, Activity, TrendingUp, Gauge,
  Calculator, Info, Box, RotateCw, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ── Real vehicle models with accurate specs ───────────────────────────────────

const REAL_VEHICLES = {
  truck: [
    {
      id: "volvo_fh16_750",
      brand: "Volvo", model: "FH16 750",
      color: "#1a3a6e", cabColor: "#1a3a6e",
      flag: "🇸🇪",
      specs: {
        engine: "D16K, 16.1L I6 diesel", power: "750 hp / 553 kW", torque: "3,550 Nm",
        gvw: 44000, tare: 8200, maxPayload: 25000,
        baseConsumption: 31.5, co2PerLiter: 2.64,
        speedKph: 90, topSpeed: 90,
        wheelbase: "3,900 mm", cab: "Globetrotter XL",
        euro: "Euro 6", transmission: "I-Shift 12-speed",
      },
      desc: "Europe's most powerful series-production truck. Industry benchmark for long-haul.",
      trailerType: "standard",
    },
    {
      id: "mercedes_actros_1863",
      brand: "Mercedes-Benz", model: "Actros 1863 LS",
      color: "#1c1c2e", cabColor: "#2d2d40",
      flag: "🇩🇪",
      specs: {
        engine: "OM 473, 15.6L I6 diesel", power: "630 hp / 463 kW", torque: "3,000 Nm",
        gvw: 40000, tare: 8100, maxPayload: 25000,
        baseConsumption: 30.2, co2PerLiter: 2.64,
        speedKph: 89, topSpeed: 89,
        wheelbase: "3,800 mm", cab: "StreamSpace",
        euro: "Euro 6d", transmission: "PowerShift 3 12-speed",
      },
      desc: "World's first production truck with autonomous driving Level 2. MirrorCam standard.",
      trailerType: "standard",
    },
    {
      id: "scania_r650",
      brand: "Scania", model: "R 650 V8",
      color: "#b91c1c", cabColor: "#991b1b",
      flag: "🇸🇪",
      specs: {
        engine: "DC16, 16.4L V8 diesel", power: "650 hp / 478 kW", torque: "3,400 Nm",
        gvw: 44000, tare: 8300, maxPayload: 24000,
        baseConsumption: 32.8, co2PerLiter: 2.64,
        speedKph: 90, topSpeed: 90,
        wheelbase: "3,700 mm", cab: "Topline",
        euro: "Euro 6", transmission: "Opticruise G25 CM",
      },
      desc: "The legendary V8 — iconic sound, supreme power. Preferred by owner-operators.",
      trailerType: "standard",
    },
    {
      id: "man_tgx_640",
      brand: "MAN", model: "TGX 26.640",
      color: "#15803d", cabColor: "#166534",
      flag: "🇩🇪",
      specs: {
        engine: "D38, 15.2L I6 diesel", power: "640 hp / 471 kW", torque: "3,000 Nm",
        gvw: 44000, tare: 8000, maxPayload: 26000,
        baseConsumption: 29.8, co2PerLiter: 2.64,
        speedKph: 90, topSpeed: 90,
        wheelbase: "3,600 mm", cab: "GX cab",
        euro: "Euro 6d", transmission: "MAN TipMatic 12AS 2540 TO",
      },
      desc: "New generation MAN — 25% improved aerodynamics, predictive cruise control.",
      trailerType: "standard",
    },
    {
      id: "daf_xf_530",
      brand: "DAF", model: "XF 530 FT",
      color: "#d97706", cabColor: "#b45309",
      flag: "🇳🇱",
      specs: {
        engine: "MX-13, 12.9L I6 diesel", power: "530 hp / 390 kW", torque: "2,600 Nm",
        gvw: 44000, tare: 7900, maxPayload: 26000,
        baseConsumption: 28.5, co2PerLiter: 2.64,
        speedKph: 90, topSpeed: 90,
        wheelbase: "3,800 mm", cab: "Super Space Cab",
        euro: "Euro 6", transmission: "AS Tronic 12-speed",
      },
      desc: "Truck of the Year 2018. Best payload-to-tare ratio in class.",
      trailerType: "standard",
    },
    {
      id: "volvo_fm_reefer",
      brand: "Volvo", model: "FM 500 + Reefer",
      color: "#0e4d92", cabColor: "#0e4d92",
      flag: "🇸🇪",
      specs: {
        engine: "D13K, 12.8L I6 diesel", power: "500 hp / 368 kW", torque: "2,600 Nm",
        gvw: 44000, tare: 9700, maxPayload: 22000,
        baseConsumption: 34.5, co2PerLiter: 2.64,
        speedKph: 85, topSpeed: 85,
        wheelbase: "3,800 mm", cab: "Globetrotter",
        euro: "Euro 6", transmission: "I-Shift 12-speed",
      },
      desc: "Cold chain specialist with Thermo King Advancer reefer unit. -30°C to +30°C.",
      trailerType: "refrigerated",
    },
    {
      id: "scania_r500_tanker",
      brand: "Scania", model: "R 500 + Tank",
      color: "#6b21a8", cabColor: "#581c87",
      flag: "🇸🇪",
      specs: {
        engine: "DC13, 12.7L I6 diesel", power: "500 hp / 368 kW", torque: "2,600 Nm",
        gvw: 44000, tare: 10800, maxPayload: 23000,
        baseConsumption: 33.2, co2PerLiter: 2.64,
        speedKph: 85, topSpeed: 85,
        wheelbase: "3,700 mm", cab: "Highline",
        euro: "Euro 6", transmission: "Opticruise G25",
      },
      desc: "ADR-certified tanker configuration for liquid chemicals and fuel transport.",
      trailerType: "tanker",
    },
    {
      id: "daf_xf_flatbed",
      brand: "DAF", model: "XF 480 + Flatbed",
      color: "#92400e", cabColor: "#78350f",
      flag: "🇳🇱",
      specs: {
        engine: "MX-13, 12.9L I6 diesel", power: "480 hp / 353 kW", torque: "2,500 Nm",
        gvw: 44000, tare: 7200, maxPayload: 27000,
        baseConsumption: 27.8, co2PerLiter: 2.64,
        speedKph: 90, topSpeed: 90,
        wheelbase: "4,200 mm", cab: "Space Cab",
        euro: "Euro 6", transmission: "AS Tronic",
      },
      desc: "Heavy machinery and oversize cargo specialist on flatbed configuration.",
      trailerType: "flatbed",
    },
  ],

  ship: [
    {
      id: "maersk_emma",
      brand: "Maersk", model: "Emma Mærsk class",
      color: "#0f3460", hullColor: "#0f3460", funnelColor: "#004b9b",
      flag: "🇩🇰",
      specs: {
        type: "Ultra-large container vessel (ULCV)", built: "2006",
        length: "397 m", beam: "56 m", draft: "15.5 m",
        deadweight: 156907, teu: 18000,
        engine: "Wärtsilä-Sulzer 14RT-flex96C", power: "80,080 kW",
        baseConsumption: 350, co2PerLiter: 3.15,
        speedKph: 27.6, topSpeed: 29.6,
        flag_reg: "Denmark", operator: "A.P. Møller-Mærsk",
      },
      desc: "Legendary Danish container giant. One of the world's largest container ships ever built.",
      shipType: "container",
    },
    {
      id: "msc_gulsun",
      brand: "MSC", model: "Gülsün class",
      color: "#1a1a2e", hullColor: "#1a1a2e", funnelColor: "#cc6600",
      flag: "🇨🇭",
      specs: {
        type: "Mega container vessel", built: "2019",
        length: "400 m", beam: "61.5 m", draft: "16 m",
        deadweight: 228000, teu: 23756,
        engine: "MAN B&W 11G95ME-C10.5", power: "63,000 kW",
        baseConsumption: 420, co2PerLiter: 3.15,
        speedKph: 22.8, topSpeed: 22.8,
        flag_reg: "Panama", operator: "Mediterranean Shipping Company",
      },
      desc: "World's largest container ship by TEU capacity as of 2019. 23,756 TEU.",
      shipType: "container",
    },
    {
      id: "knock_nevis",
      brand: "Seawise Giant", model: "TI-class VLCC",
      color: "#374151", hullColor: "#1f2937", funnelColor: "#ef4444",
      flag: "🇸🇦",
      specs: {
        type: "Very Large Crude Carrier (VLCC)", built: "1979",
        length: "458 m", beam: "68.8 m", draft: "24.6 m",
        deadweight: 564763, teu: 0,
        engine: "Steam turbine", power: "50,000 kW",
        baseConsumption: 300, co2PerLiter: 3.15,
        speedKph: 28, topSpeed: 30,
        flag_reg: "Panama", operator: "Various tanker operators",
      },
      desc: "Longest ship ever built (458 m). Ultra-large crude oil tanker (ULCC).",
      shipType: "tanker",
    },
    {
      id: "vale_brasil",
      brand: "Vale", model: "Valemax bulk carrier",
      color: "#064e3b", hullColor: "#064e3b", funnelColor: "#16a34a",
      flag: "🇧🇷",
      specs: {
        type: "Very Large Ore Carrier (VLOC)", built: "2011",
        length: "362 m", beam: "65 m", draft: "23 m",
        deadweight: 400000, teu: 0,
        engine: "MAN B&W diesel", power: "32,000 kW",
        baseConsumption: 230, co2PerLiter: 3.15,
        speedKph: 24, topSpeed: 24,
        flag_reg: "Brazil", operator: "Vale S.A.",
      },
      desc: "World's largest bulk carrier. Carries iron ore from Brazil to Asia (400,000 DWT).",
      shipType: "bulk",
    },
    {
      id: "ever_given",
      brand: "Evergreen", model: "Ever Given (ULCV)",
      color: "#065f46", hullColor: "#065f46", funnelColor: "#22c55e",
      flag: "🇹🇼",
      specs: {
        type: "Ultra-large container vessel", built: "2018",
        length: "399.94 m", beam: "58.8 m", draft: "14.5 m",
        deadweight: 199629, teu: 20388,
        engine: "MAN B&W 11G90ME-C", power: "58,900 kW",
        baseConsumption: 380, co2PerLiter: 3.15,
        speedKph: 25, topSpeed: 25,
        flag_reg: "Panama", operator: "Evergreen Marine",
      },
      desc: "Became world-famous after blocking the Suez Canal for 6 days in March 2021.",
      shipType: "container",
    },
  ],

  aircraft: [
    {
      id: "boeing_747_8f",
      brand: "Boeing", model: "747-8F",
      color: "#e5e7eb", stripeColor: "#1d4ed8",
      flag: "🇺🇸",
      specs: {
        type: "Wide-body cargo freighter", firstFlight: "2010",
        length: "76.3 m", wingspan: "68.4 m", height: "19.4 m",
        maxPayload: 133980, mtow: 447696,
        engines: "4× GEnx-2B67B turbofan", thrust: "4× 296.3 kN",
        baseConsumption: 11800, co2PerLiter: 2.52,
        speedKph: 908, topSpeed: 988,
        range: "8,130 km", ceiling: "13,100 m",
        operator: "UPS, Cargolux, Korean Air Cargo",
      },
      desc: "Queen of the Skies — most successful large cargo aircraft. Main deck + lower deck.",
      engineCount: 4,
    },
    {
      id: "boeing_777f",
      brand: "Boeing", model: "777F",
      color: "#f8fafc", stripeColor: "#ea580c",
      flag: "🇺🇸",
      specs: {
        type: "Wide-body cargo freighter", firstFlight: "2008",
        length: "63.7 m", wingspan: "64.8 m", height: "18.6 m",
        maxPayload: 102010, mtow: 347814,
        engines: "2× GE90-110B1L turbofan", thrust: "2× 489.3 kN",
        baseConsumption: 9800, co2PerLiter: 2.52,
        speedKph: 905, topSpeed: 945,
        range: "9,200 km", ceiling: "13,100 m",
        operator: "FedEx, Emirates SkyCargo, China Southern",
      },
      desc: "World's largest twin-engine cargo aircraft. Preferred by express freight operators.",
      engineCount: 2,
    },
    {
      id: "airbus_a380f",
      brand: "Airbus", model: "A330-200F",
      color: "#f0f4ff", stripeColor: "#7c3aed",
      flag: "🇫🇷",
      specs: {
        type: "Wide-body cargo freighter", firstFlight: "2009",
        length: "58.8 m", wingspan: "60.3 m", height: "16.9 m",
        maxPayload: 70000, mtow: 233000,
        engines: "2× Rolls-Royce Trent 772B", thrust: "2× 316.3 kN",
        baseConsumption: 8200, co2PerLiter: 2.52,
        speedKph: 871, topSpeed: 900,
        range: "7,400 km", ceiling: "12,500 m",
        operator: "DHL, Turkish Cargo, Etihad Cargo",
      },
      desc: "Most fuel-efficient widebody freighter. 15% lower fuel burn vs. previous generation.",
      engineCount: 2,
    },
    {
      id: "antonov_an124",
      brand: "Antonov", model: "An-124 Ruslan",
      color: "#d1d5db", stripeColor: "#2563eb",
      flag: "🇺🇦",
      specs: {
        type: "Strategic heavy transport", firstFlight: "1982",
        length: "69.1 m", wingspan: "73.3 m", height: "21.1 m",
        maxPayload: 150000, mtow: 405000,
        engines: "4× ZMKB Progress D-18T turbofan", thrust: "4× 229.5 kN",
        baseConsumption: 14500, co2PerLiter: 2.52,
        speedKph: 865, topSpeed: 865,
        range: "5,400 km", ceiling: "12,000 m",
        operator: "Antonov Airlines, Volga-Dnepr",
      },
      desc: "World's heaviest operational cargo aircraft (150t payload). Front + rear loading.",
      engineCount: 4,
    },
    {
      id: "fedex_md11f",
      brand: "FedEx / McDonnell Douglas", model: "MD-11F",
      color: "#fff7ed", stripeColor: "#7c2d12",
      flag: "🇺🇸",
      specs: {
        type: "Wide-body trijet freighter", firstFlight: "1990",
        length: "61.6 m", wingspan: "51.7 m", height: "17.6 m",
        maxPayload: 90760, mtow: 285990,
        engines: "3× GE CF6-80C2D1F turbofan", thrust: "3× 273.6 kN",
        baseConsumption: 10500, co2PerLiter: 2.52,
        speedKph: 876, topSpeed: 945,
        range: "6,840 km", ceiling: "12,800 m",
        operator: "FedEx Express, UPS (retired)",
      },
      desc: "Iconic trijet with tail-mounted engine. FedEx's legendary overnight express workhorse.",
      engineCount: 3,
    },
  ],

  train: [
    {
      id: "db_class_189",
      brand: "DB Cargo / Siemens", model: "Class 189 (ES64F4)",
      color: "#dc2626", cabColor: "#b91c1c",
      flag: "🇩🇪",
      specs: {
        type: "Electric freight locomotive", built: "2002–2009",
        length: "19.58 m", weight: 88000,
        maxPayload: 3200000, tractiveForce: "300 kN",
        power: "6,400 kW (8,600 hp)", voltage: "15kV / 25kV AC",
        baseConsumption: 5.2, co2PerLiter: 0.233,
        speedKph: 140, topSpeed: 140,
        axles: "Bo'Bo'", wheelDiameter: "1,250 mm",
        operator: "DB Cargo, ÖBB Rail Cargo, SBB Cargo",
      },
      desc: "Europe's most-used freight locomotive. Multi-system capable across 4 countries.",
      wagons: 3,
    },
    {
      id: "union_pacific_big_boy",
      brand: "Union Pacific", model: "Big Boy 4014",
      color: "#1f2937", cabColor: "#111827",
      flag: "🇺🇸",
      specs: {
        type: "Steam articulated locomotive", built: "1941",
        length: "40.47 m", weight: 548000,
        maxPayload: 6000000, tractiveForce: "601 kN",
        power: "6,290 hp (4,692 kW)", voltage: "Steam (coal/oil)",
        baseConsumption: 28, co2PerLiter: 2.9,
        speedKph: 112, topSpeed: 112,
        axles: "4-8-8-4", wheelDiameter: "1,778 mm",
        operator: "Union Pacific Railroad",
      },
      desc: "Largest steam locomotive ever built. Restored 4014 still hauls excursion trains.",
      wagons: 4,
    },
    {
      id: "siemens_vectron",
      brand: "Siemens", model: "Vectron MS",
      color: "#0ea5e9", cabColor: "#0284c7",
      flag: "🇩🇪",
      specs: {
        type: "Multi-system electric/diesel", built: "2010–present",
        length: "18.98 m", weight: 90000,
        maxPayload: 3500000, tractiveForce: "400 kN",
        power: "6,400 kW (8,600 hp)", voltage: "15kV/25kV AC + 3kV/1.5kV DC",
        baseConsumption: 4.8, co2PerLiter: 0.233,
        speedKph: 160, topSpeed: 160,
        axles: "Bo'Bo'", wheelDiameter: "1,250 mm",
        operator: "Various European operators (36 countries)",
      },
      desc: "Most modern multi-system European freight loco. Digital LZB/ETCS Level 2 signalling.",
      wagons: 3,
    },
    {
      id: "ge_es44ac",
      brand: "GE Transportation", model: "ES44AC (GEVO)",
      color: "#f59e0b", cabColor: "#d97706",
      flag: "🇺🇸",
      specs: {
        type: "Diesel-electric freight locomotive", built: "2005–present",
        length: "22.56 m", weight: 196000,
        maxPayload: 5000000, tractiveForce: "667 kN",
        power: "4,400 hp (3,281 kW)", voltage: "Diesel-electric",
        baseConsumption: 18, co2PerLiter: 2.7,
        speedKph: 120, topSpeed: 120,
        axles: "C-C", wheelDiameter: "1,067 mm",
        operator: "BNSF, CSX, Norfolk Southern, UP",
      },
      desc: "North America's workhorse. Hauls 10,000+ ton coal and grain trains across the continent.",
      wagons: 5,
    },
    {
      id: "class_66",
      brand: "EMD / Progress Rail", model: "Class 66 (JT42CWR)",
      color: "#166534", cabColor: "#14532d",
      flag: "🇬🇧",
      specs: {
        type: "Diesel freight locomotive", built: "1998–2016",
        length: "20.06 m", weight: 130000,
        maxPayload: 3000000, tractiveForce: "409 kN",
        power: "3,300 hp (2,462 kW)", voltage: "Diesel-electric",
        baseConsumption: 16, co2PerLiter: 2.7,
        speedKph: 120, topSpeed: 120,
        axles: "Co-Co", wheelDiameter: "1,092 mm",
        operator: "DB Cargo UK, Freightliner, GBRf",
      },
      desc: "UK's most common freight locomotive. 446 units operating across Britain and Europe.",
      wagons: 3,
    },
  ],
};

// ── Payload limits derived from real specs ────────────────────────────────────
const TRAILER_OPTIONS = [
  { id: "standard_curtain", label: "Curtainsider trailer", weight: 8000, dragCoef: 1.0, img: "🏗️", desc: "13.6m load length, 33 EUR pallets" },
  { id: "reefer", label: "Refrigerated (Thermo King)", weight: 9500, dragCoef: 1.08, img: "❄️", desc: "+8% fuel — active cooling unit", extraPower: 5 },
  { id: "flatbed", label: "Flatbed trailer", weight: 6500, dragCoef: 0.95, img: "📦", desc: "Oversize / heavy machinery" },
  { id: "tanker", label: "Tank trailer (ADR)", weight: 10500, dragCoef: 1.12, img: "🛢️", desc: "Liquids, chemicals, fuel" },
  { id: "car_carrier", label: "Car transporter", weight: 11000, dragCoef: 1.25, img: "🚗", desc: "Up to 10 passenger vehicles" },
  { id: "mega", label: "Mega trailer (3m)", weight: 8200, dragCoef: 1.18, img: "📐", desc: "Extra volumetric capacity" },
];

const CONTAINER_OPTIONS = [
  { id: "std_20", label: "20' TEU containers", weight: 2200, dragCoef: 1.0, img: "📦", desc: "Standard ISO 20-foot" },
  { id: "std_40", label: "40' FEU containers", weight: 3800, dragCoef: 1.0, img: "📦", desc: "Standard ISO 40-foot" },
  { id: "reefer_40", label: "Reefer containers (40')", weight: 4500, dragCoef: 1.0, img: "❄️", desc: "+12% power for refrigeration", extraPower: 12 },
  { id: "bulk", label: "Bulk cargo (ore/grain)", weight: 0, dragCoef: 0.85, img: "🌾", desc: "Open hold bulk stowage" },
  { id: "tanker_load", label: "Crude/chemical tanker", weight: 0, dragCoef: 0.9, img: "🛢️", desc: "Full tank loading" },
];

const ULD_OPTIONS = [
  { id: "ld3", label: "LD3 containers", weight: 80, dragCoef: 1.0, img: "📦", desc: "Standard narrowbody ULD" },
  { id: "ld7", label: "LD7 / LD11 containers", weight: 120, dragCoef: 1.0, img: "📦", desc: "Widebody main deck" },
  { id: "pallet_88", label: "PMC 88×125 pallets", weight: 110, dragCoef: 1.0, img: "🧱", desc: "Standard air freight pallet" },
  { id: "pharma", label: "Pharma / Temp-controlled", weight: 150, dragCoef: 1.0, img: "💊", desc: "+8% active temp control", extraPower: 8 },
  { id: "dangerous", label: "DGR (Dangerous Goods)", weight: 90, dragCoef: 1.0, img: "⚠️", desc: "IATA DGR certified" },
];

const WAGON_OPTIONS = [
  { id: "flat_wagon", label: "Flat wagons (containers)", weight: 20000, dragCoef: 1.0, img: "🚃", desc: "Intermodal 20'/40' containers" },
  { id: "tank_wagon", label: "Tank wagons", weight: 25000, dragCoef: 1.05, img: "🛢️", desc: "Liquids / chemicals" },
  { id: "gondola", label: "Gondola wagons (bulk)", weight: 22000, dragCoef: 0.95, img: "⛏️", desc: "Coal, ore, gravel" },
  { id: "boxcar", label: "Covered boxcars", weight: 24000, dragCoef: 1.02, img: "📦", desc: "General enclosed freight" },
  { id: "reefer_wagon", label: "Refrigerated wagons", weight: 28000, dragCoef: 1.08, img: "❄️", desc: "Cold chain rail", extraPower: 6 },
];

function getAttachmentOptions(vehicleType) {
  if (vehicleType === "truck") return TRAILER_OPTIONS;
  if (vehicleType === "ship") return CONTAINER_OPTIONS;
  if (vehicleType === "aircraft") return ULD_OPTIONS;
  if (vehicleType === "train") return WAGON_OPTIONS;
  return [];
}

// ── 3D Model Builders ─────────────────────────────────────────────────────────

function buildTruck3D(vehicle) {
  const group = new THREE.Group();
  const cabCol = new THREE.Color(vehicle.cabColor || vehicle.color);
  const bodyCol = new THREE.Color(vehicle.color);
  const darkMetal = new THREE.Color("#1a1a2e");
  const chrome = new THREE.Color("#c0c0c0");
  const glassColor = new THREE.Color("#a8d8ea");
  const rubber = new THREE.Color("#111111");
  const lightYellow = new THREE.Color("#ffee88");
  const lightRed = new THREE.Color("#ff4444");

  // Cab
  const cabMat = new THREE.MeshPhysicalMaterial({ color: cabCol, roughness: 0.25, metalness: 0.65 });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.8), cabMat);
  cab.position.set(0, 1.5, 1.0); group.add(cab);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.8), new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.8 }));
  visor.position.set(0, 2.68, 0.6); group.add(visor);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: glassColor, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.08), glassMat);
  windshield.position.set(0, 1.8, 2.36); group.add(windshield);
  [-1.05, 1.05].forEach(x => { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.9), glassMat); sw.position.set(x, 1.9, 1.3); group.add(sw); });
  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.1), new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.4, metalness: 0.9 }));
  grill.position.set(0, 0.9, 2.35); group.add(grill);
  const headlightMat = new THREE.MeshStandardMaterial({ color: lightYellow, emissive: lightYellow, emissiveIntensity: 1.2 });
  [-0.7, 0.7].forEach(x => { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), headlightMat); hl.position.set(x, 1.1, 2.38); group.add(hl); });
  const exhaustMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.95 });
  [-0.9, 0.9].forEach(x => { const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), exhaustMat); ex.position.set(x, 2.8, 0.7); group.add(ex); });
  const fuelTankGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16); fuelTankGeo.rotateZ(Math.PI / 2);
  const tankMat = new THREE.MeshPhysicalMaterial({ color: chrome, roughness: 0.1, metalness: 1.0 });
  [-1.2, 1.2].forEach(x => { const ft = new THREE.Mesh(fuelTankGeo, tankMat); ft.position.set(x, 0.55, 0.2); group.add(ft); });

  // Trailer
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, -2.5);
  const trailerType = vehicle.trailerType || "standard";
  if (trailerType === "refrigerated") {
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 8.5), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#f0f0f0"), roughness: 0.5, metalness: 0.3 }));
    trailer.position.set(0, 1.8, -1.75); trailerGroup.add(trailer);
    for (let i = 0; i < 8; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(2.42, 2.62, 0.05), new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.3, metalness: 0.8 }));
      rib.position.set(0, 1.8, -1.75 + (i - 3.5) * 1.0); trailerGroup.add(rib);
    }
    const cooler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.0), new THREE.MeshStandardMaterial({ color: new THREE.Color("#888888"), roughness: 0.3, metalness: 0.8 }));
    cooler.position.set(0, 3.25, 1.0); trailerGroup.add(cooler);
  } else if (trailerType === "flatbed") {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 9.5), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#8B4513"), roughness: 0.9, metalness: 0.1 }));
    bed.position.set(0, 0.8, -2.25); trailerGroup.add(bed);
    const railMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });
    [-1.16, 1.16].forEach(x => { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 9.5), railMat); rail.position.set(x, 1.06, -2.25); trailerGroup.add(rail); });
  } else if (trailerType === "tanker") {
    const tankBodyGeo = new THREE.CylinderGeometry(1.1, 1.1, 9.0, 24); tankBodyGeo.rotateZ(Math.PI / 2);
    const tankBody = new THREE.Mesh(tankBodyGeo, new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#c8c8c8"), roughness: 0.15, metalness: 0.95 }));
    tankBody.position.set(0, 1.8, -2.0); trailerGroup.add(tankBody);
    for (let i = 0; i < 5; i++) {
      const ringGeo = new THREE.TorusGeometry(1.12, 0.04, 8, 24); ringGeo.rotateY(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.9 }));
      ring.position.set(0, 1.8, -2.0 + (i - 2) * 1.8); trailerGroup.add(ring);
    }
  } else {
    // Standard box trailer in brand color
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 9.0), new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.4, metalness: 0.5 }));
    trailer.position.set(0, 1.8, -2.0); trailerGroup.add(trailer);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.3, 9.02), new THREE.MeshStandardMaterial({ color: new THREE.Color(vehicle.color).offsetHSL(0, 0, -0.2) }));
    stripe.position.set(0, 2.5, -2.0); trailerGroup.add(stripe);
  }
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 8.5), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.7, metalness: 0.6 }));
  under.position.set(0, 0.3, -2.0); trailerGroup.add(under);
  const rearLightMat = new THREE.MeshStandardMaterial({ color: lightRed, emissive: lightRed, emissiveIntensity: 0.8 });
  [-0.9, 0.9].forEach(x => { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.08), rearLightMat); rl.position.set(x, 1.6, -6.45); trailerGroup.add(rl); });
  group.add(trailerGroup);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: rubber, roughness: 0.9 });
  const hubGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12); hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: chrome, roughness: 0.2, metalness: 0.9 });
  const addW = (x, y, z) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, y, z); group.add(w);
    const h = new THREE.Mesh(hubGeo, hubMat); h.position.set(x, y, z); group.add(h);
  };
  addW(-1.3, 0.5, 1.8); addW(1.3, 0.5, 1.8);
  [-0.5, -1.3].forEach(z => [-1.45, 1.45].forEach(x => addW(x, 0.5, z)));
  [-5.8, -6.8].forEach(z => [-1.45, 1.45].forEach(x => addW(x, 0.5, z)));

  group.rotation.y = Math.PI / 6;
  group.position.y = 0.5;
  return group;
}

function buildShip3D(vehicle) {
  const group = new THREE.Group();
  const hullCol = new THREE.Color(vehicle.hullColor || vehicle.color);
  const funnelCol = new THREE.Color(vehicle.funnelColor || "#ff6600");
  const white = new THREE.Color("#f0f0f0");
  const darkMetal = new THREE.Color("#333344");

  // Hull
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-3, 0); hullShape.lineTo(-3.5, -1.5); hullShape.lineTo(-2.5, -2.5);
  hullShape.lineTo(2.5, -2.5); hullShape.lineTo(3.5, -1.5); hullShape.lineTo(3, 0); hullShape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 14, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.2, bevelSegments: 4 }), new THREE.MeshPhysicalMaterial({ color: hullCol, roughness: 0.5, metalness: 0.7 }));
  hull.rotation.y = Math.PI / 2; hull.position.set(7, 0, -3); group.add(hull);
  const waterline = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 14.2), new THREE.MeshStandardMaterial({ color: new THREE.Color("#cc2222") }));
  waterline.position.set(0, -1.4, 0); group.add(waterline);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.3, 14), new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#666666"), roughness: 0.7, metalness: 0.4 }));
  deck.position.set(0, 0.35, 0); group.add(deck);

  const shipType = vehicle.shipType || "container";
  if (shipType === "container") {
    const containerColors = ["#1e40af", "#dc2626", "#15803d", "#92400e", "#6d28d9", "#0f766e", "#be185d", "#0369a1"];
    [[-2,0],[0,0],[2,0],[-2,1.3],[0,1.3],[2,1.3],[-1,2.6],[1,2.6]].forEach(([x,y], ri) => {
      [-5,-2.5,0,2.5,5].forEach((z, zi) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.1,2.3), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(containerColors[(ri+zi)%containerColors.length]), roughness: 0.4, metalness: 0.3 }));
        c.position.set(x, 1.0+y, z); group.add(c);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.8,1.1,2.3)), new THREE.LineBasicMaterial({ color: 0x000000 }));
        edges.position.set(x, 1.0+y, z); group.add(edges);
      });
    });
  } else if (shipType === "tanker") {
    [-5,-1.5,2,5].forEach(z => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,3,20), new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.2, metalness: 0.8 }));
      t.position.set(0, 2.2, z); group.add(t);
    });
    const pipeGeo = new THREE.CylinderGeometry(0.1,0.1,14,8); pipeGeo.rotateZ(Math.PI/2);
    [-1.1, 0, 1.1].forEach(x => { const p = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color("#888888"), roughness: 0.3, metalness: 0.8 })); p.position.set(x, 0.85, 0); group.add(p); });
  } else {
    const hold = new THREE.Mesh(new THREE.BoxGeometry(5.5,1.5,11), new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.8, metalness: 0.4 }));
    hold.position.set(0, 1.25, 0); group.add(hold);
    for (let i = -2; i <= 2; i++) {
      const hatch = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 1.8), new THREE.MeshStandardMaterial({ color: new THREE.Color("#444444"), roughness: 0.5, metalness: 0.6 }));
      hatch.position.set(0, 2.07, i * 2.2); group.add(hatch);
    }
  }

  // Bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.5, 4), new THREE.MeshPhysicalMaterial({ color: white, roughness: 0.4, metalness: 0.3 }));
  bridge.position.set(0, 2.4, -5.5); group.add(bridge);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#88bbdd"), transparent: true, opacity: 0.7, roughness: 0.05 });
  [0,1,2].forEach(i => { const win = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 0.1), glassMat); win.position.set(0, 2.8+i*1.0, -3.49); group.add(win); });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,2.5,16), new THREE.MeshStandardMaterial({ color: funnelCol, roughness: 0.3, metalness: 0.5 }));
  funnel.position.set(0, 5.8, -5.5); group.add(funnel);
  const funnelTop = new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.4,16), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.3 }));
  funnelTop.position.set(0, 7.0, -5.5); group.add(funnelTop);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,4,8), new THREE.MeshStandardMaterial({ color: white, roughness: 0.3 }));
  mast.position.set(0, 9, -5.5); group.add(mast);

  group.rotation.y = -Math.PI / 8;
  group.scale.set(0.5, 0.5, 0.5);
  group.position.y = -0.5;
  return group;
}

function buildAircraft3D(vehicle) {
  const group = new THREE.Group();
  const bodyCol = new THREE.Color(vehicle.color || "#e5e7eb");
  const stripeCol = new THREE.Color(vehicle.stripeColor || "#1d4ed8");
  const darkMetal = new THREE.Color("#222233");
  const glass = new THREE.Color("#7ecef4");
  const engineCount = vehicle.engineCount || 2;

  const fuselageGeo = new THREE.CylinderGeometry(0.7, 0.35, 10, 22); fuselageGeo.rotateZ(Math.PI / 2);
  const fuselageMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.25, metalness: 0.6 });
  group.add(new THREE.Mesh(fuselageGeo, fuselageMat));
  const noseGeo = new THREE.ConeGeometry(0.7, 2.2, 22); noseGeo.rotateZ(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat); nose.position.set(6.1, 0, 0); group.add(nose);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(engineCount === 4 ? 5.0 : 4.0, -1.5); wingShape.lineTo(engineCount === 4 ? 5.4 : 4.4, -0.6); wingShape.lineTo(1.0, 0.25); wingShape.closePath();
  const wingMat = new THREE.MeshPhysicalMaterial({ color: bodyCol, roughness: 0.3, metalness: 0.5 });
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.14, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, wingMat); wingL.rotation.x = Math.PI / 2; wingL.position.set(-0.5, -0.1, 0); group.add(wingL);
  const wingR = wingL.clone(); wingR.rotation.x = -Math.PI / 2; wingR.position.set(-0.5, -0.1, 0.14); group.add(wingR);

  // Engines
  const engPositions = engineCount === 4
    ? [[1.2, -0.7, -2.0], [1.2, -0.7, 2.0], [0.2, -0.7, -3.5], [0.2, -0.7, 3.5]]
    : engineCount === 3
    ? [[1.0, -0.65, -2.2], [1.0, -0.65, 2.2], [-3.8, 0.8, 0]]
    : [[1.0, -0.65, -2.2], [1.0, -0.65, 2.2]];
  engPositions.forEach(([x,y,z]) => {
    const engGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.8, 18); engGeo.rotateZ(Math.PI / 2);
    const eng = new THREE.Mesh(engGeo, new THREE.MeshPhysicalMaterial({ color: darkMetal, roughness: 0.3, metalness: 0.9 }));
    eng.position.set(x, y, z); group.add(eng);
    const intakeGeo = new THREE.TorusGeometry(0.38, 0.05, 8, 18); intakeGeo.rotateY(Math.PI / 2);
    const intake = new THREE.Mesh(intakeGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color("#c0c0c0"), roughness: 0.2, metalness: 1.0 }));
    intake.position.set(x + 0.92, y, z); group.add(intake);
  });

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.14), wingMat); tail.position.set(-4.5, 0.9, 0); group.add(tail);
  const tailHorz = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, engineCount === 3 ? 5 : 4), wingMat); tailHorz.position.set(-4.5, -0.1, 0); group.add(tailHorz);

  const cockpitGeo = new THREE.BoxGeometry(0.06, 0.45, 1.1);
  const cockpitMat = new THREE.MeshPhysicalMaterial({ color: glass, transparent: true, opacity: 0.6, roughness: 0.05 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat); cockpit.position.set(5.3, 0.35, 0); group.add(cockpit);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.28, 0.72), new THREE.MeshStandardMaterial({ color: stripeCol, roughness: 0.3 }));
  stripe.position.set(-0.5, 0.22, 0); group.add(stripe);

  group.rotation.y = Math.PI / 5;
  group.scale.set(0.72, 0.72, 0.72);
  group.position.y = 1.5;
  return group;
}

function buildTrain3D(vehicle) {
  const group = new THREE.Group();
  const locoCol = new THREE.Color(vehicle.color || "#dc2626");
  const cabCol = new THREE.Color(vehicle.cabColor || vehicle.color);
  const darkMetal = new THREE.Color("#1a1a1a");
  const glass = new THREE.Color("#a8d8ea");
  const wagons = vehicle.wagons || 3;

  // Locomotive body
  const locoBody = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 6), new THREE.MeshPhysicalMaterial({ color: locoCol, roughness: 0.3, metalness: 0.65 }));
  locoBody.position.set(0, 1.5, 2); group.add(locoBody);
  // Cab section
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2.5), new THREE.MeshPhysicalMaterial({ color: cabCol, roughness: 0.3, metalness: 0.65 }));
  cabin.position.set(0, 3.05, 3.25); group.add(cabin);
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.09), new THREE.MeshPhysicalMaterial({ color: glass, transparent: true, opacity: 0.65, roughness: 0.05 }));
  frontGlass.position.set(0, 3.15, 4.49); group.add(frontGlass);
  const headlightMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#ffee88"), emissive: new THREE.Color("#ffee88"), emissiveIntensity: 1.5 });
  [-0.8, 0.8].forEach(x => { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.1), headlightMat); hl.position.set(x, 2.8, 4.95); group.add(hl); });
  // Pantograph
  const pantoMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#888888"), roughness: 0.3, metalness: 0.8 });
  const panto1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.06), pantoMat); panto1.position.set(0, 4.1, 1.5); group.add(panto1);
  const panto2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), pantoMat); panto2.position.set(0, 3.6, 1.5); group.add(panto2);
  // Body stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.02, 0.35, 8.02), new THREE.MeshStandardMaterial({ color: new THREE.Color(vehicle.color).offsetHSL(0, 0, -0.2), roughness: 0.3 }));
  stripe.position.set(0, 2.5, 2); group.add(stripe);

  // Wagons
  for (let i = 0; i < wagons; i++) {
    const z = -6 - i * 7;
    const wagonMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#374151"), roughness: 0.4, metalness: 0.5 });
    const wagon = new THREE.Mesh(new THREE.BoxGeometry(2.85, 2.4, 6.2), wagonMat);
    wagon.position.set(0, 1.4, z); group.add(wagon);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.3, 6.0), new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.6, metalness: 0.6 }));
    bottom.position.set(0, 0.3, z); group.add(bottom);
    // Wagon stripe matching loco color
    const wStripe = new THREE.Mesh(new THREE.BoxGeometry(2.87, 0.25, 6.22), new THREE.MeshStandardMaterial({ color: locoCol, roughness: 0.3 }));
    wStripe.position.set(0, 2.45, z); group.add(wStripe);
  }

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.28, 22); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.5, metalness: 0.9 });
  const addW = (x, y, z) => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, y, z); group.add(w); };
  [2.5, -0.5].forEach(z => [-1.55, 1.55].forEach(x => addW(x, 0.48, z)));
  for (let i = 0; i < wagons; i++) {
    const z = -6 - i * 7;
    [z - 2, z + 2].forEach(wz => [-1.55, 1.55].forEach(x => addW(x, 0.48, wz)));
  }

  // Rails
  const railMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#6b7280"), roughness: 0.5, metalness: 0.8 });
  [-1.55, 1.55].forEach(x => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 40), railMat); r.position.set(x, 0.06, -10); group.add(r); });
  for (let i = 0; i < 10; i++) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.22), new THREE.MeshStandardMaterial({ color: new THREE.Color("#5c3d1e"), roughness: 0.9 }));
    sleeper.position.set(0, 0.0, -2 + i * -4); group.add(sleeper);
  }

  group.rotation.y = Math.PI / 8;
  group.position.y = 0.3;
  return group;
}

// ── 3D Preview Component ──────────────────────────────────────────────────────
function Vehicle3DPreview({ vehicle, vehicleType }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);
  const modelRef = useRef(null);
  const rotRef = useRef({ x: 0.12, y: 0.4 });
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const [autoOn, setAutoOn] = useState(true);

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
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x223344, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
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
    const onWheel = (e) => { e.preventDefault(); camera.position.z = Math.max(5, Math.min(28, camera.position.z + e.deltaY * 0.02)); camera.position.y = Math.max(2, Math.min(15, camera.position.y + e.deltaY * 0.005)); };
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
      if (autoRotate.current && modelRef.current) { rotRef.current.y += 0.005; modelRef.current.rotation.y = rotRef.current.y; }
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

  useEffect(() => {
    if (!sceneRef.current || !vehicle) return;
    if (modelRef.current) { sceneRef.current.remove(modelRef.current); modelRef.current = null; }
    autoRotate.current = true; setAutoOn(true);
    rotRef.current = { x: 0.12, y: 0.4 };
    let model;
    if (vehicleType === "truck") model = buildTruck3D(vehicle);
    else if (vehicleType === "ship") model = buildShip3D(vehicle);
    else if (vehicleType === "aircraft") model = buildAircraft3D(vehicle);
    else if (vehicleType === "train") model = buildTrain3D(vehicle);
    if (model) {
      sceneRef.current.add(model);
      modelRef.current = model;
      model.rotation.y = rotRef.current.y;
      model.rotation.x = rotRef.current.x;
    }
  }, [vehicle, vehicleType]);

  const toggleAutoRotate = () => { autoRotate.current = !autoRotate.current; setAutoOn(autoRotate.current); };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-cyan-500/20" style={{ background: "#060a14" }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3">
        <button onClick={toggleAutoRotate} className={`p-1.5 rounded-lg border transition-all ${autoOn ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-slate-900/60 border-slate-700/40 text-slate-400 hover:text-cyan-400"}`}>
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono text-right leading-relaxed">
        <p>Drag to rotate · Scroll to zoom</p>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">3D Live Preview</span>
      </div>
    </div>
  );
}

// ── Simulation Engine ─────────────────────────────────────────────────────────
function simulate(vehicle, vehicleType, attachment, payload, distance, terrain, weather, speed) {
  const att = getAttachmentOptions(vehicleType).find(o => o.id === attachment);
  if (!vehicle || !att) return null;
  const s = vehicle.specs;

  const nominalSpeed = s.speedKph;
  const speedRatio = speed / nominalSpeed;
  const speedFactor = 0.6 + 0.4 * Math.pow(speedRatio, 2.5);
  const maxP = s.maxPayload || s.deadweight || 100000;
  const payloadRatio = Math.min(1, payload / maxP);
  const loadFactor = 1 + payloadRatio * 0.65;
  const dragFactor = att.dragCoef;
  const terrainFactors = { flat: 1.0, hills: 1.18, mountains: 1.42, city: 1.28, mixed: 1.12 };
  const weatherFactors = { clear: 1.0, rain: 1.07, wind_headwind: 1.15, snow: 1.22, fog: 1.03 };
  const terrainFactor = terrainFactors[terrain] || 1.0;
  const weatherFactor = weatherFactors[weather] || 1.0;
  const extraFactor = att.extraPower ? 1 + att.extraPower / 100 : 1.0;
  const consumptionRate = s.baseConsumption * speedFactor * loadFactor * dragFactor * terrainFactor * weatherFactor * extraFactor;
  const co2PerUnit = s.co2PerLiter;

  let totalFuel, unit, fuelLabel;
  if (vehicleType === "truck") { totalFuel = (consumptionRate / 100) * distance; unit = "L"; fuelLabel = "Diesel (L)"; }
  else if (vehicleType === "ship") { const days = distance / (speed * 24); totalFuel = consumptionRate * days; unit = "ton"; fuelLabel = "Bunker fuel (t)"; }
  else if (vehicleType === "aircraft") { const hours = distance / speed; totalFuel = consumptionRate * hours; unit = "L"; fuelLabel = "JET-A1 (L)"; }
  else { const totalTons = (payload / 1000) || 1; totalFuel = consumptionRate * totalTons * distance; unit = "kWh"; fuelLabel = "Electricity (kWh)"; }

  const co2Total = totalFuel * co2PerUnit;
  const co2PerTonKm = payload > 0 ? (co2Total / ((payload / 1000) * distance)) * 1000 : 0;
  const efficiencyScore = Math.max(10, Math.round(100 - (loadFactor-1)*30 - (speedFactor-1)*20 - (dragFactor-1)*25 - (terrainFactor-1)*15));
  const fuelPrices = { truck: 10.5, ship: 4200, aircraft: 8.2, train: 0.85 };
  const fuelCost = totalFuel * fuelPrices[vehicleType];
  const driverCost = vehicleType === "truck" ? (distance / speed) * 280 : 0;

  const steps = Math.min(24, Math.max(8, Math.round(distance / (speed * 0.5))));
  const timeline = Array.from({ length: steps }, (_, i) => {
    const p = i / (steps - 1);
    return { step: `${Math.round(p * 100)}%`, fuel: Math.round((totalFuel / steps) * (i + 1)), co2: Math.round((totalFuel / steps) * (i + 1) * co2PerUnit), distance: Math.round(p * distance) };
  });

  const radarData = [
    { subject: "Speed", value: Math.max(20, 100 - Math.abs(speedRatio - 1) * 60) },
    { subject: "Load", value: Math.max(20, 100 - payloadRatio * 40) },
    { subject: "Aerodynamics", value: Math.max(20, 100 - (dragFactor - 1) * 120) },
    { subject: "Weather", value: Math.max(20, 100 - (weatherFactor - 1) * 150) },
    { subject: "Terrain", value: Math.max(20, 100 - (terrainFactor - 1) * 100) },
    { subject: "Equipment", value: Math.max(20, 100 - (extraFactor - 1) * 200) },
  ];

  const duration = vehicleType === "ship" ? `${(distance/(speed*24)).toFixed(1)} days` : `${(distance/speed).toFixed(1)} hrs`;

  return { totalFuel: Math.round(totalFuel), unit, fuelLabel, co2Total: Math.round(co2Total), co2PerTonKm: Math.round(co2PerTonKm*10)/10, efficiencyScore, fuelCost: Math.round(fuelCost), driverCost: Math.round(driverCost), totalCost: Math.round(fuelCost + driverCost), timeline, radarData, duration, factors: { speedFactor, loadFactor, dragFactor, terrainFactor, weatherFactor, extraFactor } };
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const TYPE_META = {
  truck:    { label: "Trucks",    icon: Truck,  color: "#06b6d4", desc: "Road freight — long-haul semi-trucks" },
  ship:     { label: "Ships",     icon: Ship,   color: "#8b5cf6", desc: "Maritime — container, tanker, bulk" },
  aircraft: { label: "Aircraft",  icon: Plane,  color: "#f59e0b", desc: "Air freight — freighters & cargo jets" },
  train:    { label: "Trains",    icon: Train,  color: "#10b981", desc: "Rail freight — electric & diesel locos" },
};

function StepSelectVehicle({ config, onChange }) {
  const [expandedType, setExpandedType] = useState(config.vehicleType || "truck");
  const vehicles = REAL_VEHICLES[expandedType] || [];
  const typeMeta = TYPE_META[expandedType];

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <Settings className="w-5 h-5 text-cyan-400" /> Select Vehicle
      </h3>
      {/* Type tabs */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <button key={key} onClick={() => { setExpandedType(key); onChange({ vehicleType: key, vehicleId: null, attachment: null }); }}
              className="p-3 rounded-xl border text-center transition-all"
              style={{ background: expandedType===key?`${meta.color}18`:"rgba(15,23,42,0.6)", borderColor: expandedType===key?meta.color:"rgba(100,116,139,0.3)", boxShadow: expandedType===key?`0 0 16px ${meta.color}25`:"none" }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: meta.color }} />
              <p className="text-white text-xs font-bold">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Vehicle list */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {vehicles.map(v => {
          const selected = config.vehicleId === v.id;
          return (
            <motion.button key={v.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ vehicleId: v.id, vehicleType: expandedType, attachment: null })}
              className="w-full p-3 rounded-xl border text-left transition-all"
              style={{ background: selected?`${typeMeta.color}15`:"rgba(15,23,42,0.6)", borderColor: selected?typeMeta.color:"rgba(100,116,139,0.3)", boxShadow: selected?`0 0 14px ${typeMeta.color}20`:"none" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{v.flag}</span>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{v.brand}</span>
                    {selected && <Badge className="text-[9px] px-1.5 py-0" style={{ background: `${typeMeta.color}25`, color: typeMeta.color, border: `1px solid ${typeMeta.color}40` }}>Selected</Badge>}
                  </div>
                  <p className="text-white font-bold text-sm">{v.model}</p>
                  <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{v.desc}</p>
                </div>
                <div className="flex-shrink-0 text-right space-y-0.5">
                  {v.specs.power && <p className="text-[10px] font-mono" style={{ color: typeMeta.color }}>{v.specs.power}</p>}
                  {v.specs.teu && <p className="text-[10px] text-slate-400 font-mono">{v.specs.teu.toLocaleString()} TEU</p>}
                  {v.specs.length && <p className="text-[10px] text-slate-400 font-mono">{v.specs.length}</p>}
                  {v.specs.maxPayload && !v.specs.teu && <p className="text-[10px] text-slate-400 font-mono">{(v.specs.maxPayload/1000).toFixed(0)}t payload</p>}
                </div>
              </div>
              {selected && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-3 gap-1.5">
                  {Object.entries(v.specs).slice(0, 6).map(([k, val]) => (
                    <div key={k} className="bg-slate-900/60 rounded px-2 py-1">
                      <p className="text-[9px] text-slate-500 uppercase">{k.replace(/_/g," ")}</p>
                      <p className="text-[10px] text-slate-200 font-mono font-medium truncate">{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepSelectAttachment({ config, onChange }) {
  const vehicleType = config.vehicleType;
  const options = getAttachmentOptions(vehicleType);
  const meta = TYPE_META[vehicleType];
  const labelMap = { truck: "Trailer / Configuration", ship: "Cargo / Container type", aircraft: "ULD / Cargo units", train: "Wagon type" };

  return (
    <div className="space-y-3">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <Weight className="w-5 h-5 text-cyan-400" /> {labelMap[vehicleType] || "Attachment"}
      </h3>
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {options.map(att => {
          const selected = config.attachment === att.id;
          return (
            <motion.button key={att.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => onChange({ attachment: att.id })}
              className="w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all"
              style={{ background: selected?`${meta?.color}15`:"rgba(15,23,42,0.6)", borderColor: selected?meta?.color:"rgba(100,116,139,0.3)" }}>
              <span className="text-2xl">{att.img}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{att.label}</p>
                <p className="text-slate-400 text-xs">{att.desc}</p>
                {att.extraPower && <Badge className="mt-1 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">+{att.extraPower}% energy consumption</Badge>}
              </div>
              {att.weight > 0 && <span className="text-slate-500 text-xs whitespace-nowrap">{(att.weight/1000).toFixed(1)}t tare</span>}
              {selected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: meta?.color }} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepParameters({ config, onChange }) {
  const vehicleType = config.vehicleType;
  const vehicle = REAL_VEHICLES[vehicleType]?.find(v => v.id === config.vehicleId);
  if (!vehicle) return null;
  const s = vehicle.specs;
  const maxP = s.maxPayload || s.deadweight || 100000;
  const meta = TYPE_META[vehicleType];
  const speedUnit = vehicleType === "ship" ? "kn" : "km/h";
  const speedLabel = vehicleType === "ship" ? "(knots)" : "(km/h)";

  return (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <Gauge className="w-5 h-5 text-cyan-400" /> Operating Parameters
      </h3>
      <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-900/40 text-xs grid grid-cols-2 gap-2">
        <div><span className="text-slate-500">Vehicle: </span><span className="text-white font-semibold">{vehicle.brand} {vehicle.model}</span></div>
        {s.engine && <div><span className="text-slate-500">Engine: </span><span className="text-slate-300">{s.engine}</span></div>}
        {s.power && <div><span className="text-slate-500">Power: </span><span style={{ color: meta?.color }} className="font-bold">{s.power}</span></div>}
        {s.euro && <div><span className="text-slate-500">Emission: </span><span className="text-emerald-400">{s.euro}</span></div>}
        {s.engines && <div className="col-span-2"><span className="text-slate-500">Engines: </span><span className="text-slate-300">{s.engines}</span></div>}
        {s.operator && <div className="col-span-2"><span className="text-slate-500">Operators: </span><span className="text-slate-300">{s.operator}</span></div>}
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Payload</label>
          <span className="text-white font-bold text-sm">{((config.payload || Math.round(maxP*0.7))/1000).toFixed(1)} t</span>
        </div>
        <Slider min={0} max={maxP} step={Math.max(100, Math.round(maxP/500)*100)} value={[config.payload || Math.round(maxP*0.7)]} onValueChange={([v]) => onChange({ payload: v })} className="w-full" />
        <div className="flex justify-between text-xs text-slate-500 mt-1"><span>0 t</span><span>Max: {(maxP/1000).toFixed(0)} t</span></div>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Route distance</label>
          <span className="text-white font-bold text-sm">{(config.distance || 500).toLocaleString()} km</span>
        </div>
        <Slider min={50} max={vehicleType==="ship"?20000:vehicleType==="aircraft"?12000:vehicleType==="train"?5000:3000} step={50} value={[config.distance || 500]} onValueChange={([v]) => onChange({ distance: v })} className="w-full" />
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Travel speed {speedLabel}</label>
          <span className="text-white font-bold text-sm">{config.speed || s.speedKph} {speedUnit}</span>
        </div>
        <Slider min={vehicleType==="ship"?5:vehicleType==="aircraft"?600:vehicleType==="train"?30:40} max={vehicleType==="ship"?35:vehicleType==="aircraft"?980:vehicleType==="train"?200:120} step={1} value={[config.speed || s.speedKph]} onValueChange={([v]) => onChange({ speed: v })} className="w-full" />
        <p className="text-xs text-slate-500 mt-1">Top speed: {s.topSpeed || s.speedKph} {speedUnit}</p>
      </div>
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Terrain / Route type</label>
        <div className="grid grid-cols-5 gap-2">
          {[{id:"flat",label:"Flat",emoji:"🛣️"},{id:"hills",label:"Hills",emoji:"⛰️"},{id:"mountains",label:"Mountains",emoji:"🏔️"},{id:"city",label:"Urban",emoji:"🏙️"},{id:"mixed",label:"Mixed",emoji:"🗺️"}].map(t => (
            <button key={t.id} onClick={() => onChange({ terrain: t.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.terrain===t.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.terrain===t.id?meta?.color:"rgba(100,116,139,0.3)", color: config.terrain===t.id?"#fff":"#94a3b8" }}>
              <div>{t.emoji}</div><div className="text-[10px] mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Weather conditions</label>
        <div className="grid grid-cols-5 gap-2">
          {[{id:"clear",label:"Clear",emoji:"☀️"},{id:"rain",label:"Rain",emoji:"🌧️"},{id:"wind_headwind",label:"Headwind",emoji:"💨"},{id:"snow",label:"Snow",emoji:"❄️"},{id:"fog",label:"Fog",emoji:"🌫️"}].map(w => (
            <button key={w.id} onClick={() => onChange({ weather: w.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.weather===w.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.weather===w.id?meta?.color:"rgba(100,116,139,0.3)", color: config.weather===w.id?"#fff":"#94a3b8" }}>
              <div>{w.emoji}</div><div className="text-[10px] mt-0.5">{w.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimulationResults({ result, config }) {
  const meta = TYPE_META[config.vehicleType];
  const vehicle = REAL_VEHICLES[config.vehicleType]?.find(v => v.id === config.vehicleId);
  if (!result || !meta) return null;
  const scoreColor = result.efficiencyScore >= 75 ? "#10b981" : result.efficiencyScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-5">
      <h3 className="text-white font-bold text-lg flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-cyan-400" /> Simulation Results — {vehicle?.brand} {vehicle?.model}
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
          {result.efficiencyScore >= 75 ? "✅ Excellent — optimal operation" : result.efficiencyScore >= 50 ? "⚠️ Moderate — improvement potential exists" : "🔴 Low — consider load optimisation and reduced speed"}
        </p>
      </div>
      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /> Fuel consumption over route</p>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={result.timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
            <Area type="monotone" dataKey="fuel" stroke={meta.color} fill={`${meta.color}30`} name={result.fuelLabel} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2"><Wind className="w-4 h-4 text-red-400" /> CO₂ accumulation (kg)</p>
        <ResponsiveContainer width="100%" height={130}>
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
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-violet-400" /> Efficiency profile</p>
        <ResponsiveContainer width="100%" height={190}>
          <RadarChart data={result.radarData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Radar name="Score" dataKey="value" stroke={meta.color} fill={`${meta.color}30`} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40">
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Factor breakdown</p>
        <div className="space-y-2">
          {[["Speed factor", result.factors.speedFactor],["Load factor", result.factors.loadFactor],["Aerodynamic drag", result.factors.dragFactor],["Terrain factor", result.factors.terrainFactor],["Weather factor", result.factors.weatherFactor],["Extra equipment", result.factors.extraFactor]].map(([label, value]) => {
            const inc = ((value-1)*100).toFixed(0);
            return (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className={`font-mono font-bold ${value>1?"text-amber-400":"text-emerald-400"}`}>×{value.toFixed(2)} {value>1&&inc>0?`(+${inc}%)`:"" }</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STEPS = ["Select Vehicle", "Cargo Config", "Parameters", "Simulate"];

export default function VehicleBuilder({ onClose }) {
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("configure");
  const [config, setConfig] = useState({
    vehicleType: "truck", vehicleId: null, attachment: null,
    payload: 20000, distance: 500, speed: 85, terrain: "mixed", weather: "clear",
  });
  const [simRan, setSimRan] = useState(false);

  const updateConfig = (changes) => {
    setSimRan(false);
    setConfig(prev => ({ ...prev, ...changes }));
  };

  const vehicle = REAL_VEHICLES[config.vehicleType]?.find(v => v.id === config.vehicleId);
  const meta = TYPE_META[config.vehicleType];

  const result = useMemo(() => {
    if (!simRan || !vehicle || !config.attachment) return null;
    return simulate(vehicle, config.vehicleType, config.attachment, config.payload, config.distance, config.terrain, config.weather, config.speed || vehicle?.specs?.speedKph || 80);
  }, [simRan, config, vehicle]);

  const canProceed = [
    config.vehicleId,
    config.attachment,
    config.payload != null && config.distance > 0,
    true
  ][step];

  const handleRunSim = () => { setSimRan(true); setStep(3); };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          {meta && <meta.icon className="w-5 h-5" style={{ color: meta.color }} />}
          <div>
            <h2 className="text-white font-bold text-sm">Transport Builder & Simulator</h2>
            <p className="text-slate-500 text-xs">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Select a real vehicle to begin"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
            <button onClick={() => setActiveTab("configure")} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono transition-all ${activeTab==="configure"?"bg-cyan-500/20 text-cyan-400":"text-slate-500 hover:text-slate-300"}`}>
              <Settings className="w-3 h-3 inline mr-1" />Configure
            </button>
            <button onClick={() => setActiveTab("3d")} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono transition-all ${activeTab==="3d"?"bg-cyan-500/20 text-cyan-400":"text-slate-500 hover:text-slate-300"}`}>
              <Box className="w-3 h-3 inline mr-1" />3D View
            </button>
          </div>
          {onClose && <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* 3D Tab */}
        {activeTab === "3d" && (
          <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 p-4 flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <Vehicle3DPreview vehicle={vehicle} vehicleType={config.vehicleType} />
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl border border-slate-700/40 bg-slate-900/40 space-y-2">
              {/* Type selector */}
              <div className="flex gap-2">
                {Object.entries(TYPE_META).map(([key, m]) => {
                  const Icon = m.icon;
                  return (
                    <button key={key} onClick={() => updateConfig({ vehicleType: key, vehicleId: null, attachment: null })}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      style={{ background: config.vehicleType===key?`${m.color}20`:"rgba(30,41,59,0.6)", borderColor: config.vehicleType===key?m.color:"rgba(100,116,139,0.3)", color: config.vehicleType===key?"#fff":"#94a3b8" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />{m.label}
                    </button>
                  );
                })}
              </div>
              {/* Model selector */}
              <div className="flex flex-wrap gap-1.5">
                {(REAL_VEHICLES[config.vehicleType] || []).map(v => (
                  <button key={v.id} onClick={() => updateConfig({ vehicleId: v.id })}
                    className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-medium transition-all"
                    style={{ background: config.vehicleId===v.id?`${meta?.color}20`:"rgba(15,23,42,0.7)", borderColor: config.vehicleId===v.id?meta?.color:"rgba(100,116,139,0.2)", color: config.vehicleId===v.id?"#fff":"#64748b" }}>
                    <span>{v.flag}</span> {v.brand} {v.model}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Configure Tab */}
        {activeTab === "configure" && (
          <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            <div className="flex border-b border-slate-800/60 flex-shrink-0">
              {STEPS.map((s, i) => (
                <button key={s} onClick={() => i < step && setStep(i)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all relative"
                  style={{ color: step===i?meta?.color||"#06b6d4":"#64748b" }}>
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center border font-bold"
                      style={{ borderColor: step===i?meta?.color||"#06b6d4":"#334155", background: step===i?`${meta?.color||"#06b6d4"}20`:"transparent" }}>
                      {i+1}
                    </span>
                    <span className="hidden sm:inline">{s}</span>
                  </span>
                  {step===i && <motion.div layoutId="step-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: meta?.color||"#06b6d4" }} />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {step===0 && <StepSelectVehicle config={config} onChange={updateConfig} />}
                  {step===1 && <StepSelectAttachment config={config} onChange={updateConfig} />}
                  {step===2 && <StepParameters config={config} onChange={updateConfig} />}
                  {step===3 && !simRan && (
                    <div className="flex flex-col items-center justify-center py-12 gap-6">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `${meta?.color}20`, border: `2px solid ${meta?.color}40` }}>
                        {meta && <meta.icon className="w-12 h-12" style={{ color: meta.color }} />}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-lg">Ready to simulate</p>
                        <p className="text-slate-400 text-sm mt-1">{vehicle?.brand} {vehicle?.model} · {(config.payload/1000).toFixed(1)}t · {config.distance} km</p>
                      </div>
                      <Button onClick={handleRunSim} className="gap-2 px-8 py-3 font-bold text-base" style={{ background: `linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)` }}>
                        <Play className="w-5 h-5" /> Run Simulation
                      </Button>
                    </div>
                  )}
                  {step===3 && simRan && result && <SimulationResults result={result} config={config} />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/60 flex-shrink-0 gap-3">
              <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0} className="gap-2 text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              {simRan && step===3 && (
                <Button variant="ghost" onClick={() => { setSimRan(false); setStep(2); }} className="gap-2 text-slate-400 hover:text-amber-400 text-xs">
                  <RotateCcw className="w-3 h-3" /> Adjust parameters
                </Button>
              )}
              {step < 2 && (
                <Button onClick={() => setStep(s => s+1)} disabled={!canProceed} className="gap-2 ml-auto" style={{ background: canProceed?`linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)`:undefined }}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              {step===2 && (
                <Button onClick={handleRunSim} disabled={!config.attachment} className="gap-2 ml-auto font-bold" style={{ background: `linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)` }}>
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