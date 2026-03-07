import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Ship, Plane, Train, ChevronRight, ChevronLeft,
  Fuel, Wind, BarChart3, Zap, Weight,
  CheckCircle2, Play, RotateCcw, X,
  Settings, Activity, TrendingUp, Gauge,
  Calculator, Info, AlertTriangle, Thermometer,
  Clock, MapPin, DollarSign, Leaf, Cpu, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ComposedChart,
  ReferenceLine, Legend
} from "recharts";

// ── Real vehicle models ───────────────────────────────────────────────────────
const REAL_VEHICLES = {
  truck: [
    { id:"volvo_fh16_750", brand:"Volvo", model:"FH16 750", flag:"🇸🇪", color:"#1a3a6e",
      specs:{ engine:"D16K 16.1L I6", power:"750 hp / 553 kW", torque:"3,550 Nm", gvw:44000, tare:8200, maxPayload:25000, baseConsumption:31.5, co2PerLiter:2.64, speedKph:90, topSpeed:90, euro:"Euro 6", transmission:"I-Shift 12-speed", idleConsumption:2.8, engineDisplacement:16.1, cylinderCount:6, compressionRatio:17.5, turbo:"Twin-turbo compound", afr:30, thermalEfficiency:0.46, rollingResistance:0.006, dragCoefficient:0.36, frontalArea:9.5 }},
    { id:"mercedes_actros_1863", brand:"Mercedes-Benz", model:"Actros 1863 LS", flag:"🇩🇪", color:"#2d2d40",
      specs:{ engine:"OM 473 15.6L I6", power:"630 hp / 463 kW", torque:"3,000 Nm", gvw:40000, tare:8100, maxPayload:25000, baseConsumption:30.2, co2PerLiter:2.64, speedKph:89, topSpeed:89, euro:"Euro 6d", transmission:"PowerShift 3", idleConsumption:2.5, engineDisplacement:15.6, cylinderCount:6, compressionRatio:17.0, turbo:"Twin-turbo", afr:29, thermalEfficiency:0.47, rollingResistance:0.006, dragCoefficient:0.34, frontalArea:9.2 }},
    { id:"scania_r650", brand:"Scania", model:"R 650 V8", flag:"🇸🇪", color:"#991b1b",
      specs:{ engine:"DC16 16.4L V8", power:"650 hp / 478 kW", torque:"3,400 Nm", gvw:44000, tare:8300, maxPayload:24000, baseConsumption:32.8, co2PerLiter:2.64, speedKph:90, topSpeed:90, euro:"Euro 6", transmission:"Opticruise G25", idleConsumption:3.1, engineDisplacement:16.4, cylinderCount:8, compressionRatio:17.3, turbo:"Twin-turbo V", afr:31, thermalEfficiency:0.44, rollingResistance:0.0065, dragCoefficient:0.37, frontalArea:9.6 }},
    { id:"man_tgx_640", brand:"MAN", model:"TGX 26.640", flag:"🇩🇪", color:"#166534",
      specs:{ engine:"D38 15.2L I6", power:"640 hp / 471 kW", torque:"3,000 Nm", gvw:44000, tare:8000, maxPayload:26000, baseConsumption:29.8, co2PerLiter:2.64, speedKph:90, topSpeed:90, euro:"Euro 6d", transmission:"MAN TipMatic 12AS", idleConsumption:2.6, engineDisplacement:15.2, cylinderCount:6, compressionRatio:17.2, turbo:"Turbo compound", afr:30, thermalEfficiency:0.48, rollingResistance:0.0058, dragCoefficient:0.33, frontalArea:9.1 }},
    { id:"daf_xf_530", brand:"DAF", model:"XF 530 FT", flag:"🇳🇱", color:"#b45309",
      specs:{ engine:"MX-13 12.9L I6", power:"530 hp / 390 kW", torque:"2,600 Nm", gvw:44000, tare:7900, maxPayload:26000, baseConsumption:28.5, co2PerLiter:2.64, speedKph:90, topSpeed:90, euro:"Euro 6", transmission:"AS Tronic 12-speed", idleConsumption:2.4, engineDisplacement:12.9, cylinderCount:6, compressionRatio:17.0, turbo:"Single-stage turbo", afr:28, thermalEfficiency:0.45, rollingResistance:0.006, dragCoefficient:0.35, frontalArea:9.3 }},
  ],
  ship: [
    { id:"maersk_emma", brand:"Maersk", model:"Emma Mærsk class", flag:"🇩🇰", color:"#0f3460",
      specs:{ engine:"Wärtsilä-Sulzer 14RT-flex96C", power:"80,080 kW", torque:"N/A", gvw:0, tare:0, maxPayload:156907000, deadweight:156907, teu:18000, baseConsumption:350, co2PerLiter:3.15, speedKph:27.6, topSpeed:29.6, euro:"IMO Tier II", transmission:"Direct drive", idleConsumption:40, engineDisplacement:25480, cylinderCount:14, compressionRatio:21, turbo:"Turbo compound", afr:45, thermalEfficiency:0.55, rollingResistance:0, dragCoefficient:0, frontalArea:0, hullForm:"container", engineRPM:102, sfoc:171 }},
    { id:"msc_gulsun", brand:"MSC", model:"Gülsün class", flag:"🇨🇭", color:"#1a1a2e",
      specs:{ engine:"MAN B&W 11G95ME-C10.5", power:"63,000 kW", torque:"N/A", gvw:0, tare:0, maxPayload:228000000, deadweight:228000, teu:23756, baseConsumption:420, co2PerLiter:3.15, speedKph:22.8, topSpeed:22.8, euro:"IMO Tier III", transmission:"Direct drive", idleConsumption:50, engineDisplacement:0, cylinderCount:11, compressionRatio:21, turbo:"Turbo compound", afr:45, thermalEfficiency:0.56, rollingResistance:0, dragCoefficient:0, frontalArea:0, hullForm:"container", engineRPM:80, sfoc:163 }},
    { id:"ever_given", brand:"Evergreen", model:"Ever Given", flag:"🇹🇼", color:"#065f46",
      specs:{ engine:"MAN B&W 11G90ME-C", power:"58,900 kW", torque:"N/A", gvw:0, tare:0, maxPayload:199629000, deadweight:199629, teu:20388, baseConsumption:380, co2PerLiter:3.15, speedKph:25, topSpeed:25, euro:"IMO Tier III", transmission:"Direct drive", idleConsumption:45, engineDisplacement:0, cylinderCount:11, compressionRatio:21, turbo:"Turbo", afr:44, thermalEfficiency:0.55, rollingResistance:0, dragCoefficient:0, frontalArea:0, hullForm:"container", engineRPM:84, sfoc:168 }},
    { id:"vale_brasil", brand:"Vale", model:"Valemax bulk carrier", flag:"🇧🇷", color:"#064e3b",
      specs:{ engine:"MAN B&W diesel", power:"32,000 kW", torque:"N/A", gvw:0, tare:0, maxPayload:400000000, deadweight:400000, teu:0, baseConsumption:230, co2PerLiter:3.15, speedKph:24, topSpeed:24, euro:"IMO Tier II", transmission:"Direct drive", idleConsumption:30, engineDisplacement:0, cylinderCount:7, compressionRatio:21, turbo:"Turbo", afr:44, thermalEfficiency:0.53, rollingResistance:0, dragCoefficient:0, frontalArea:0, hullForm:"bulk", engineRPM:95, sfoc:178 }},
  ],
  aircraft: [
    { id:"boeing_747_8f", brand:"Boeing", model:"747-8F", flag:"🇺🇸", color:"#1d4ed8",
      specs:{ engine:"4× GEnx-2B67B", power:"4× 296 kN thrust", torque:"N/A", gvw:0, tare:0, maxPayload:133980, mtow:447696, baseConsumption:11800, co2PerLiter:2.52, speedKph:908, topSpeed:988, euro:"ICAO Chapter 4", transmission:"FADEC", idleConsumption:800, engineDisplacement:0, cylinderCount:0, compressionRatio:45, turbo:"Turbofan BPR 8.0", afr:50, thermalEfficiency:0.52, rollingResistance:0, dragCoefficient:0.022, frontalArea:0, engineCount:4, bypassRatio:8.0, specificFuelConsumption:15.5, cruiseAlt:12500 }},
    { id:"boeing_777f", brand:"Boeing", model:"777F", flag:"🇺🇸", color:"#ea580c",
      specs:{ engine:"2× GE90-110B1L", power:"2× 489 kN thrust", torque:"N/A", gvw:0, tare:0, maxPayload:102010, mtow:347814, baseConsumption:9800, co2PerLiter:2.52, speedKph:905, topSpeed:945, euro:"ICAO Chapter 4", transmission:"FADEC", idleConsumption:650, engineDisplacement:0, cylinderCount:0, compressionRatio:42, turbo:"Turbofan BPR 9.0", afr:52, thermalEfficiency:0.54, rollingResistance:0, dragCoefficient:0.020, frontalArea:0, engineCount:2, bypassRatio:9.0, specificFuelConsumption:14.8, cruiseAlt:12500 }},
    { id:"antonov_an124", brand:"Antonov", model:"An-124 Ruslan", flag:"🇺🇦", color:"#2563eb",
      specs:{ engine:"4× D-18T turbofan", power:"4× 229.5 kN", torque:"N/A", gvw:0, tare:0, maxPayload:150000, mtow:405000, baseConsumption:14500, co2PerLiter:2.52, speedKph:865, topSpeed:865, euro:"ICAO Chapter 3", transmission:"FADEC", idleConsumption:1000, engineDisplacement:0, cylinderCount:0, compressionRatio:38, turbo:"Turbofan BPR 5.6", afr:48, thermalEfficiency:0.48, rollingResistance:0, dragCoefficient:0.026, frontalArea:0, engineCount:4, bypassRatio:5.6, specificFuelConsumption:18.2, cruiseAlt:12000 }},
  ],
  train: [
    { id:"db_class_189", brand:"DB Cargo / Siemens", model:"Class 189 (ES64F4)", flag:"🇩🇪", color:"#dc2626",
      specs:{ engine:"4× 3-phase induction motors", power:"6,400 kW", torque:"300 kN tractive", gvw:0, tare:88000, maxPayload:3200000, baseConsumption:5.2, co2PerLiter:0.233, speedKph:140, topSpeed:140, euro:"EN 50126", transmission:"4-quadrant converter", idleConsumption:0.3, engineDisplacement:0, cylinderCount:0, compressionRatio:0, turbo:"N/A", afr:0, thermalEfficiency:0.92, rollingResistance:0.0015, dragCoefficient:1.8, frontalArea:10, axles:"Bo'Bo'", voltage:"15kV/25kV AC" }},
    { id:"siemens_vectron", brand:"Siemens", model:"Vectron MS", flag:"🇩🇪", color:"#0284c7",
      specs:{ engine:"4× 3-phase IGBT motors", power:"6,400 kW", torque:"400 kN tractive", gvw:0, tare:90000, maxPayload:3500000, baseConsumption:4.8, co2PerLiter:0.233, speedKph:160, topSpeed:160, euro:"EN 50126", transmission:"IGBT inverter", idleConsumption:0.25, engineDisplacement:0, cylinderCount:0, compressionRatio:0, turbo:"N/A", afr:0, thermalEfficiency:0.93, rollingResistance:0.0014, dragCoefficient:1.7, frontalArea:10, axles:"Bo'Bo'", voltage:"Multi-system" }},
    { id:"ge_es44ac", brand:"GE Transportation", model:"ES44AC (GEVO)", flag:"🇺🇸", color:"#d97706",
      specs:{ engine:"16-cyl GEVO diesel", power:"4,400 hp / 3,281 kW", torque:"667 kN tractive", gvw:0, tare:196000, maxPayload:5000000, baseConsumption:18, co2PerLiter:2.7, speedKph:120, topSpeed:120, euro:"EPA Tier 4", transmission:"AC traction motors", idleConsumption:1.8, engineDisplacement:65, cylinderCount:16, compressionRatio:14.7, turbo:"Twin-turbo", afr:35, thermalEfficiency:0.42, rollingResistance:0.0012, dragCoefficient:2.2, frontalArea:12, axles:"C-C", voltage:"Diesel-electric" }},
  ],
};

const TRAILER_OPTIONS = [
  { id:"standard_curtain", label:"Curtainsider trailer", weight:8000, dragMod:1.0, img:"🏗️", desc:"13.6m, 33 EUR pallets — standard long-haul" },
  { id:"reefer", label:"Refrigerated (Thermo King)", weight:9500, dragMod:1.08, img:"❄️", desc:"+8% fuel — active cooling unit", extraPower:5 },
  { id:"flatbed", label:"Flatbed trailer", weight:6500, dragMod:0.95, img:"📦", desc:"Oversize / heavy machinery — low drag" },
  { id:"tanker", label:"Tank trailer (ADR)", weight:10500, dragMod:1.12, img:"🛢️", desc:"Liquids, chemicals, fuel — high tare" },
  { id:"car_carrier", label:"Car transporter", weight:11000, dragMod:1.25, img:"🚗", desc:"Multi-level — very high aerodynamic drag" },
  { id:"mega", label:"Mega trailer (3m height)", weight:8200, dragMod:1.18, img:"📐", desc:"Extra volumetric capacity" },
];
const CONTAINER_OPTIONS = [
  { id:"std_20", label:"20' TEU containers", weight:2200, dragMod:1.0, img:"📦", desc:"Standard ISO 20-foot" },
  { id:"std_40", label:"40' FEU containers", weight:3800, dragMod:1.0, img:"📦", desc:"Standard ISO 40-foot" },
  { id:"reefer_40", label:"Reefer containers (40')", weight:4500, dragMod:1.0, img:"❄️", desc:"+12% power for refrigeration", extraPower:12 },
  { id:"bulk", label:"Bulk cargo (ore/grain)", weight:0, dragMod:0.9, img:"🌾", desc:"Open hold bulk stowage" },
  { id:"tanker_load", label:"Crude/chemical tanker", weight:0, dragMod:0.92, img:"🛢️", desc:"Full tank loading" },
];
const ULD_OPTIONS = [
  { id:"ld3", label:"LD3 containers", weight:80, dragMod:1.0, img:"📦", desc:"Standard narrowbody ULD" },
  { id:"ld7", label:"LD7/LD11 containers", weight:120, dragMod:1.0, img:"📦", desc:"Widebody main deck" },
  { id:"pallet_88", label:"PMC 88×125 pallets", weight:110, dragMod:1.0, img:"🧱", desc:"Standard air freight pallet" },
  { id:"pharma", label:"Pharma / Temp-controlled", weight:150, dragMod:1.0, img:"💊", desc:"+8% active temp control", extraPower:8 },
  { id:"dangerous", label:"DGR (Dangerous Goods)", weight:90, dragMod:1.02, img:"⚠️", desc:"IATA DGR — speed restricted -5%" },
];
const WAGON_OPTIONS = [
  { id:"flat_wagon", label:"Flat wagons (containers)", weight:20000, dragMod:1.0, img:"🚃", desc:"Intermodal 20'/40' containers" },
  { id:"tank_wagon", label:"Tank wagons", weight:25000, dragMod:1.05, img:"🛢️", desc:"Liquids / chemicals" },
  { id:"gondola", label:"Gondola wagons (bulk)", weight:22000, dragMod:0.95, img:"⛏️", desc:"Coal, ore, gravel" },
  { id:"boxcar", label:"Covered boxcars", weight:24000, dragMod:1.02, img:"📦", desc:"General enclosed freight" },
  { id:"reefer_wagon", label:"Refrigerated wagons", weight:28000, dragMod:1.08, img:"❄️", desc:"Cold chain rail", extraPower:6 },
];
function getAttachmentOptions(t) {
  return { truck:TRAILER_OPTIONS, ship:CONTAINER_OPTIONS, aircraft:ULD_OPTIONS, train:WAGON_OPTIONS }[t] || [];
}

const TYPE_META = {
  truck:    { label:"Trucks",   icon:Truck,  color:"#06b6d4", desc:"Road freight" },
  ship:     { label:"Ships",    icon:Ship,   color:"#8b5cf6", desc:"Maritime" },
  aircraft: { label:"Aircraft", icon:Plane,  color:"#f59e0b", desc:"Air freight" },
  train:    { label:"Trains",   icon:Train,  color:"#10b981", desc:"Rail freight" },
};

// ── Advanced Physics Simulation Engine ───────────────────────────────────────
function runAdvancedSimulation(vehicle, vehicleType, attachment, params) {
  const { payload, distance, terrain, weather, speed, driverBehavior, routeProfile, season, cargoTemp } = params;
  const s = vehicle.specs;
  const att = getAttachmentOptions(vehicleType).find(o => o.id === attachment);
  if (!att) return null;

  const maxP = s.maxPayload || s.deadweight || 100000;
  const payloadRatio = Math.min(1.0, payload / maxP);

  // ── 1. AERODYNAMIC DRAG (advanced)
  // F_drag = 0.5 * rho * Cd * A * v²
  const airDensityBase = 1.225; // kg/m³ at sea level 15°C
  const seasonalDensity = { summer: 1.184, winter: 1.292, spring: 1.225, autumn: 1.248 }[season] || 1.225;
  const weatherDensityMod = { clear:1.0, rain:1.02, wind_headwind:0.98, snow:1.05, fog:1.01 }[weather] || 1.0;
  const airDensity = seasonalDensity * weatherDensityMod;

  let cd = s.dragCoefficient || 0.36;
  let fa = s.frontalArea || 9.5;
  cd *= att.dragMod;
  // headwind increases effective speed significantly
  const headwindBonus = weather === "wind_headwind" ? 1.18 : 1.0;
  const speedMS = (speed * headwindBonus) / 3.6;
  const aeroDragForce = 0.5 * airDensity * cd * fa * speedMS * speedMS; // N

  // ── 2. ROLLING RESISTANCE
  const rrc = s.rollingResistance || 0.006;
  const totalMassKg = (s.tare || 0) + payload;
  const g = 9.81;
  const rollingForce = rrc * totalMassKg * g; // N

  // ── 3. GRADIENT RESISTANCE
  const terrainGradients = { flat:0.0, hills:0.025, mountains:0.055, city:0.012, mixed:0.018 };
  const avgGradient = terrainGradients[terrain] || 0.0;
  const gradientForce = totalMassKg * g * avgGradient; // N

  // ── 4. INERTIA / ACCELERATION (city stop-go)
  const stopGoFactor = terrain === "city" ? 1.35 : terrain === "mixed" ? 1.08 : 1.0;

  // ── 5. TOTAL TRACTIVE FORCE
  const totalForce = aeroDragForce + rollingForce + gradientForce; // N

  // ── 6. ENGINE LOAD
  const enginePowerW = parseFloat((s.power||"500").replace(/[^0-9.]/g, "")) * 1000 * (vehicleType === "aircraft" ? 1 : 0.736);
  const requiredPower = totalForce * speedMS; // W
  const engineLoad = vehicleType === "truck" ? Math.min(1.0, requiredPower / (enginePowerW || 400000)) : payloadRatio * 0.7 + 0.3;

  // ── 7. SPECIFIC FUEL CONSUMPTION CURVE (BSFC map emulation)
  // BSFC (g/kWh) varies with load — sweet spot around 75-80% load
  let bsfc;
  if (vehicleType === "truck" || vehicleType === "train") {
    const loadPct = engineLoad;
    if (loadPct < 0.3) bsfc = 220 + (0.3 - loadPct) * 300;
    else if (loadPct < 0.75) bsfc = 200 - (loadPct - 0.3) * 20;
    else if (loadPct < 0.9) bsfc = 191 + (loadPct - 0.75) * 60;
    else bsfc = 200 + (loadPct - 0.9) * 200;
  } else if (vehicleType === "aircraft") {
    bsfc = s.specificFuelConsumption || 15.5; // mg/N·s (thrust specific)
  } else {
    bsfc = s.sfoc || 171; // g/kWh — marine 2-stroke
  }

  // ── 8. DRIVER BEHAVIOR FACTOR
  const driverFactors = { eco:0.88, normal:1.0, aggressive:1.18, optimal:0.92 };
  const driverFactor = driverFactors[driverBehavior] || 1.0;

  // ── 9. TEMPERATURE / COLD START FACTOR
  const coldStartFactor = season === "winter" ? 1.08 : season === "summer" ? 1.02 : 1.0;

  // ── 10. REEFER / EXTRA POWER
  const extraPowerFactor = att.extraPower ? 1 + att.extraPower / 100 : 1.0;

  // ── 11. CALCULATE CONSUMPTION per type
  let baseFuelPerUnit;
  let totalFuel, unit, fuelLabel;
  const nominalSpeed = s.speedKph;
  const speedRatio = speed / nominalSpeed;

  if (vehicleType === "truck") {
    // L/100km calculation from physics
    const tractionEnergy = totalForce * (distance * 1000) / (s.thermalEfficiency || 0.45) / (1000 * 35.5e6) * 1000000; // MJ to liters diesel
    const dieselLHV = 35.5e6; // J/L diesel
    const fuelFromPhysics = (totalForce * distance * 1000) / ((s.thermalEfficiency || 0.45) * dieselLHV) * 1000;
    const idleFuel = (distance / speed) * s.idleConsumption * 0.15; // idle during stops
    totalFuel = (fuelFromPhysics + idleFuel) * driverFactor * coldStartFactor * extraPowerFactor * stopGoFactor;
    unit = "L"; fuelLabel = "Diesel (L)";
  } else if (vehicleType === "ship") {
    // Admiralty formula: Fuel ∝ displacement^(2/3) × speed³
    const days = distance / (speed * 24);
    const speedCubeFactor = Math.pow(speedRatio, 3.0); // cubic law for ship resistance
    const displacementFactor = Math.pow(payloadRatio, 2/3) * 0.4 + 0.6;
    const seaStateFactor = { clear:1.0, rain:1.08, wind_headwind:1.22, snow:1.15, fog:1.03 }[weather] || 1.0;
    const foulingFactor = 1.06; // hull fouling avg
    totalFuel = s.baseConsumption * days * speedCubeFactor * displacementFactor * seaStateFactor * foulingFactor * extraPowerFactor;
    unit = "ton"; fuelLabel = "Bunker fuel (t)";
  } else if (vehicleType === "aircraft") {
    const hours = distance / speed;
    const liftDragRatio = 17 - payloadRatio * 3;
    const altitudeFactor = 1.0; // cruising at optimal altitude
    const windFactor = weather === "wind_headwind" ? 1.12 : 1.0;
    const takeoffFuel = s.baseConsumption * 0.08; // takeoff phase
    const climbFuel = s.baseConsumption * 0.12 * hours * 0.15;
    const cruiseFuel = s.baseConsumption * hours * 0.75 * (1 + payloadRatio * 0.35) * windFactor * altitudeFactor;
    const descentFuel = s.baseConsumption * 0.04 * hours * 0.10;
    totalFuel = (takeoffFuel + climbFuel + cruiseFuel + descentFuel) * driverFactor * extraPowerFactor;
    unit = "L"; fuelLabel = "JET-A1 (L)";
  } else { // train
    const totalTrainMassT = ((s.tare || 88000) + payload) / 1000;
    const electricityPerTonKm = s.baseConsumption; // kWh/1000 ton-km
    const regenerativeBrakingRecovery = terrain === "hills" || terrain === "mountains" ? 0.15 : terrain === "mixed" ? 0.08 : 0.03;
    const speedFactor = Math.pow(speedRatio, 2.2);
    const trackResistance = { flat:1.0, hills:1.35, mountains:1.85, city:1.2, mixed:1.25 }[terrain] || 1.0;
    const grossKWh = electricityPerTonKm * totalTrainMassT * distance / 1000 * speedFactor * trackResistance;
    totalFuel = grossKWh * (1 - regenerativeBrakingRecovery) * driverFactor * coldStartFactor * extraPowerFactor;
    unit = "kWh"; fuelLabel = "Electricity (kWh)";
  }

  totalFuel = Math.max(0, totalFuel);
  const co2Total = totalFuel * s.co2PerLiter;
  const co2PerTonKm = payload > 0 ? (co2Total / ((payload / 1000) * distance)) * 1000 : 0;

  // ── 12. EMISSIONS BREAKDOWN (NOx, PM, SOx, HC)
  const emissionFactors = {
    truck:    { nox: 0.46, pm: 0.006, hc: 0.16, sox: 0.001 },
    ship:     { nox: 18.0, pm: 1.5,   hc: 0.5,  sox: 10.5 },
    aircraft: { nox: 12.0, pm: 0.03,  hc: 0.4,  sox: 0.8 },
    train:    { nox: 0.18, pm: 0.002, hc: 0.05, sox: 0.0 },
  };
  const ef = emissionFactors[vehicleType];
  const noxKg = totalFuel * ef.nox / 1000;
  const pmKg  = totalFuel * ef.pm  / 1000;
  const hcKg  = totalFuel * ef.hc  / 1000;
  const soxKg = totalFuel * ef.sox / 1000;

  // ── 13. ENERGY ANALYSIS
  const dieselLHVkJ = 35500; // kJ/L
  const totalEnergyMJ = vehicleType === "truck" ? totalFuel * dieselLHVkJ / 1000
                      : vehicleType === "aircraft" ? totalFuel * 34.7
                      : vehicleType === "ship" ? totalFuel * 1000 * 40.5 / 1000
                      : totalFuel * 3.6; // kWh to MJ
  const usefulWorkMJ = (totalForce * distance * 1000) / 1e6;
  const thermalLossMJ = totalEnergyMJ * (1 - (s.thermalEfficiency || 0.45));
  const drivetrainLoss = totalEnergyMJ * 0.07;
  const auxiliaryLoad = totalEnergyMJ * 0.05;
  const actualUsefulMJ = totalEnergyMJ - thermalLossMJ - drivetrainLoss - auxiliaryLoad;

  // ── 14. COST ANALYSIS (detailed)
  const fuelPrices = { truck:11.2, ship:6800, aircraft:9.1, train:1.05 }; // DKK per unit
  const fuelCost = totalFuel * fuelPrices[vehicleType];
  const driverHours = distance / speed;
  const driverCostPerHour = { truck:285, ship:420, aircraft:580, train:310 }[vehicleType] || 300;
  const driverCost = driverHours * driverCostPerHour;
  const maintenanceCostPerKm = { truck:1.8, ship:0.12, aircraft:5.2, train:0.85 }[vehicleType] || 1.5;
  const maintenanceCost = distance * maintenanceCostPerKm;
  const portFeesOrLanding = vehicleType === "ship" ? 45000 : vehicleType === "aircraft" ? 28000 : 0;
  const euEtsCost = co2Total * 0.65; // EU ETS carbon price ~65 DKK/ton CO2
  const totalCost = fuelCost + driverCost + maintenanceCost + portFeesOrLanding + euEtsCost;
  const costPerTonKm = payload > 0 ? totalCost / ((payload / 1000) * distance) : 0;

  // ── 15. EFFICIENCY SCORE (multi-factor)
  const speedEff = Math.max(0, 100 - Math.abs(speedRatio - 0.85) * 80);
  const loadEff = Math.max(0, 100 - Math.abs(payloadRatio - 0.8) * 60);
  const driverEff = { eco:100, optimal:95, normal:78, aggressive:50 }[driverBehavior] || 78;
  const envEff = { clear:100, rain:88, wind_headwind:75, snow:65, fog:92 }[weather] || 100;
  const terrainEff = { flat:100, mixed:88, hills:72, city:68, mountains:55 }[terrain] || 100;
  const efficiencyScore = Math.round((speedEff * 0.2 + loadEff * 0.3 + driverEff * 0.2 + envEff * 0.15 + terrainEff * 0.15));

  // ── 16. ROUTE PROFILE TIMELINE (24 segments with physics)
  const segCount = 24;
  const segDistance = distance / segCount;
  let cumulFuel = 0, cumulCO2 = 0;
  const timeline = Array.from({ length: segCount }, (_, i) => {
    const prog = i / (segCount - 1);
    // Simulate speed variation along route
    const terrainVariation = terrain === "mountains" ? Math.sin(prog * Math.PI * 4) * 0.15 :
                             terrain === "hills" ? Math.sin(prog * Math.PI * 6) * 0.08 :
                             terrain === "city" ? (Math.sin(prog * Math.PI * 12) * 0.12) : 0;
    const segSpeed = Math.max(20, speed * (1 + terrainVariation));
    const segFuel = (totalFuel / segCount) * (1 + terrainVariation * 0.4);
    cumulFuel += segFuel;
    cumulCO2 += segFuel * s.co2PerLiter;
    const instantConsumption = vehicleType === "truck" ? (segFuel / segDistance * 100) : segFuel;
    return {
      step: `${Math.round(prog * 100)}%`,
      distance_km: Math.round(prog * distance),
      speed: Math.round(segSpeed),
      fuel_cumul: Math.round(cumulFuel),
      co2_cumul: Math.round(cumulCO2),
      instant: Math.round(instantConsumption * 10) / 10,
      engine_load: Math.round((engineLoad + terrainVariation * 0.3) * 100),
      power_kw: Math.round(requiredPower / 1000 * (1 + terrainVariation * 0.4)),
    };
  });

  // ── 17. COMPARISON BENCHMARKS
  const benchmarks = {
    truck:    { avgIndustry: 33, best: 26, co2Bench: 82 },
    ship:     { avgIndustry: 380, best: 280, co2Bench: 12 },
    aircraft: { avgIndustry: 12000, best: 9000, co2Bench: 600 },
    train:    { avgIndustry: 6.5, best: 4.0, co2Bench: 1.8 },
  };
  const bench = benchmarks[vehicleType];
  const vsIndustry = ((totalFuel / (distance || 1) * (vehicleType === "truck" ? 100 : 1)) / bench.avgIndustry - 1) * 100;

  // ── 18. MAINTENANCE / WEAR IMPACT
  const wearIndex = engineLoad * 0.5 + (speedRatio > 1.05 ? 0.3 : 0) + (terrain === "mountains" || terrain === "city" ? 0.2 : 0);
  const nextServiceKm = vehicleType === "truck" ? Math.round(120000 - wearIndex * 20000) : 0;

  const duration = vehicleType === "ship" ? `${(distance/(speed*24)).toFixed(1)} days` : `${(distance/speed).toFixed(1)} hrs`;

  return {
    // Basics
    totalFuel: Math.round(totalFuel), unit, fuelLabel, duration,
    co2Total: Math.round(co2Total), co2PerTonKm: Math.round(co2PerTonKm * 10) / 10,
    efficiencyScore,
    // Physics breakdown
    aeroDragForce: Math.round(aeroDragForce), rollingForce: Math.round(rollingForce), gradientForce: Math.round(gradientForce),
    engineLoad: Math.round(engineLoad * 100), requiredPowerKW: Math.round(requiredPower / 1000),
    bsfc: Math.round(bsfc), airDensity: Math.round(airDensity * 1000) / 1000,
    // Emissions
    noxKg: Math.round(noxKg * 10) / 10, pmKg: Math.round(pmKg * 100) / 100, hcKg: Math.round(hcKg * 10) / 10, soxKg: Math.round(soxKg * 10) / 10,
    // Energy
    totalEnergyMJ: Math.round(totalEnergyMJ), thermalLossMJ: Math.round(thermalLossMJ), drivetrainLoss: Math.round(drivetrainLoss), auxiliaryLoad: Math.round(auxiliaryLoad), actualUsefulMJ: Math.round(actualUsefulMJ),
    // Costs
    fuelCost: Math.round(fuelCost), driverCost: Math.round(driverCost), maintenanceCost: Math.round(maintenanceCost), portFeesOrLanding: Math.round(portFeesOrLanding), euEtsCost: Math.round(euEtsCost), totalCost: Math.round(totalCost), costPerTonKm: Math.round(costPerTonKm * 100) / 100,
    // Timeline
    timeline,
    // Benchmarks
    vsIndustry: Math.round(vsIndustry * 10) / 10, bench,
    // Maintenance
    wearIndex: Math.round(wearIndex * 100) / 100, nextServiceKm,
    // Factors
    factors: { aeroDrag: Math.round(aeroDragForce), rolling: Math.round(rollingForce), gradient: Math.round(gradientForce), driverFactor, coldStart: coldStartFactor, extraPower: extraPowerFactor, stopGo: stopGoFactor, speedCube: Math.round(speedRatio * 100) / 100 },
  };
}

// ── Step Components ───────────────────────────────────────────────────────────
function StepSelectVehicle({ config, onChange }) {
  const [activeType, setActiveType] = useState(config.vehicleType || "truck");
  const vehicles = REAL_VEHICLES[activeType] || [];
  const meta = TYPE_META[activeType];

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-400" /> Select Vehicle</h3>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(TYPE_META).map(([key, m]) => {
          const Icon = m.icon;
          return (
            <button key={key} onClick={() => { setActiveType(key); onChange({ vehicleType: key, vehicleId: null, attachment: null }); }}
              className="p-3 rounded-xl border text-center transition-all"
              style={{ background: activeType===key?`${m.color}18`:"rgba(15,23,42,0.6)", borderColor: activeType===key?m.color:"rgba(100,116,139,0.3)" }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: m.color }} />
              <p className="text-white text-xs font-bold">{m.label}</p>
            </button>
          );
        })}
      </div>
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {vehicles.map(v => {
          const sel = config.vehicleId === v.id;
          return (
            <motion.button key={v.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ vehicleId: v.id, vehicleType: activeType, attachment: null })}
              className="w-full p-3 rounded-xl border text-left transition-all"
              style={{ background: sel?`${meta.color}15`:"rgba(15,23,42,0.6)", borderColor: sel?meta.color:"rgba(100,116,139,0.3)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{v.flag}</span>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{v.brand}</span>
                    {sel && <Badge className="text-[9px] px-1.5" style={{ background:`${meta.color}25`, color:meta.color, border:`1px solid ${meta.color}40` }}>Selected</Badge>}
                  </div>
                  <p className="text-white font-bold text-sm">{v.model}</p>
                </div>
                <div className="text-right text-[10px] font-mono space-y-0.5">
                  {v.specs.power && <p style={{ color: meta.color }}>{v.specs.power}</p>}
                  {v.specs.teu ? <p className="text-slate-400">{v.specs.teu.toLocaleString()} TEU</p> : v.specs.maxPayload && <p className="text-slate-400">{(v.specs.maxPayload/1000).toFixed(0)}t payload</p>}
                </div>
              </div>
              {sel && (
                <div className="mt-2 pt-2 border-t border-slate-700/40 grid grid-cols-3 gap-1">
                  {[["Engine", v.specs.engine],["Efficiency",`${Math.round((v.specs.thermalEfficiency||0.45)*100)}%`],["Roll. resist.",`${(v.specs.rollingResistance||0.006)*1000} ‰`],["Aero drag",`Cd ${v.specs.dragCoefficient||0.36}`],["Standard",v.specs.euro],["Gearbox",v.specs.transmission]].map(([k,val]) => val && (
                    <div key={k} className="bg-slate-900/60 rounded px-2 py-1">
                      <p className="text-[9px] text-slate-500">{k}</p>
                      <p className="text-[10px] text-slate-200 font-mono truncate">{val}</p>
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
  const options = getAttachmentOptions(config.vehicleType);
  const meta = TYPE_META[config.vehicleType];
  const labelMap = { truck:"Trailer / Configuration", ship:"Cargo / Container type", aircraft:"ULD / Cargo units", train:"Wagon type" };
  return (
    <div className="space-y-3">
      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Weight className="w-5 h-5 text-cyan-400" /> {labelMap[config.vehicleType]}</h3>
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {options.map(att => {
          const sel = config.attachment === att.id;
          return (
            <motion.button key={att.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => onChange({ attachment: att.id })}
              className="w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all"
              style={{ background: sel?`${meta?.color}15`:"rgba(15,23,42,0.6)", borderColor: sel?meta?.color:"rgba(100,116,139,0.3)" }}>
              <span className="text-2xl">{att.img}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{att.label}</p>
                <p className="text-slate-400 text-xs">{att.desc}</p>
                {att.extraPower && <Badge className="mt-1 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">+{att.extraPower}% energy consumption</Badge>}
                <p className="text-slate-500 text-[10px] mt-0.5 font-mono">Aero drag mod: ×{att.dragMod}</p>
              </div>
              {att.weight > 0 && <span className="text-slate-500 text-xs">{(att.weight/1000).toFixed(1)}t tare</span>}
              {sel && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: meta?.color }} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepParameters({ config, onChange }) {
  const vehicle = REAL_VEHICLES[config.vehicleType]?.find(v => v.id === config.vehicleId);
  if (!vehicle) return null;
  const s = vehicle.specs;
  const maxP = s.maxPayload || s.deadweight || 100000;
  const meta = TYPE_META[config.vehicleType];
  const vt = config.vehicleType;

  return (
    <div className="space-y-5">
      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400" /> Operating Parameters</h3>

      {/* Payload */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-slate-300 text-sm font-medium">Payload</label>
          <span className="text-white font-bold text-sm">{((config.payload || Math.round(maxP*0.75))/1000).toFixed(1)} t <span className="text-slate-500 text-xs font-normal">({Math.round((config.payload||maxP*0.75)/maxP*100)}% capacity)</span></span>
        </div>
        <Slider min={0} max={maxP} step={Math.max(500, Math.round(maxP/400)*100)} value={[config.payload || Math.round(maxP*0.75)]} onValueChange={([v]) => onChange({ payload: v })} />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>0 t</span><span>Max: {(maxP/1000).toFixed(0)} t</span></div>
      </div>

      {/* Distance */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-slate-300 text-sm font-medium">Route distance</label>
          <span className="text-white font-bold text-sm">{(config.distance || 500).toLocaleString()} km</span>
        </div>
        <Slider min={50} max={vt==="ship"?20000:vt==="aircraft"?14000:vt==="train"?5000:3500} step={50} value={[config.distance || 500]} onValueChange={([v]) => onChange({ distance: v })} />
      </div>

      {/* Speed */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-slate-300 text-sm font-medium">Speed {vt==="ship"?"(knots)":"(km/h)"}</label>
          <span className="text-white font-bold text-sm">{config.speed || s.speedKph} <span className="text-slate-500 text-xs">{vt==="ship"?"kn":"km/h"} · max {s.topSpeed} {vt==="ship"?"kn":"km/h"}</span></span>
        </div>
        <Slider min={vt==="ship"?5:vt==="aircraft"?600:vt==="train"?30:40} max={vt==="ship"?35:vt==="aircraft"?980:vt==="train"?200:120} step={1} value={[config.speed || s.speedKph]} onValueChange={([v]) => onChange({ speed: v })} />
      </div>

      {/* Terrain */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Terrain / Route type</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[{id:"flat",label:"Flat",emoji:"🛣️"},{id:"hills",label:"Hills",emoji:"⛰️"},{id:"mountains",label:"Mountains",emoji:"🏔️"},{id:"city",label:"Urban",emoji:"🏙️"},{id:"mixed",label:"Mixed",emoji:"🗺️"}].map(t => (
            <button key={t.id} onClick={() => onChange({ terrain: t.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.terrain===t.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.terrain===t.id?meta?.color:"rgba(100,116,139,0.3)", color: config.terrain===t.id?"#fff":"#94a3b8" }}>
              <div>{t.emoji}</div><div className="text-[10px] mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Weather conditions</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[{id:"clear",label:"Clear",emoji:"☀️"},{id:"rain",label:"Rain",emoji:"🌧️"},{id:"wind_headwind",label:"Headwind",emoji:"💨"},{id:"snow",label:"Snow",emoji:"❄️"},{id:"fog",label:"Fog",emoji:"🌫️"}].map(w => (
            <button key={w.id} onClick={() => onChange({ weather: w.id })} className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{ background: config.weather===w.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.weather===w.id?meta?.color:"rgba(100,116,139,0.3)", color: config.weather===w.id?"#fff":"#94a3b8" }}>
              <div>{w.emoji}</div><div className="text-[10px] mt-0.5">{w.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Driver Behavior */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Driving style / operation mode</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[{id:"eco",label:"Eco",emoji:"🌱",desc:"-12% fuel"},{id:"optimal",label:"Optimal",emoji:"⚡",desc:"-8% fuel"},{id:"normal",label:"Normal",emoji:"🔄",desc:"baseline"},{id:"aggressive",label:"Aggressive",emoji:"🔥",desc:"+18% fuel"}].map(d => (
            <button key={d.id} onClick={() => onChange({ driverBehavior: d.id })} className="p-2 rounded-lg border text-center transition-all"
              style={{ background: config.driverBehavior===d.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.driverBehavior===d.id?meta?.color:"rgba(100,116,139,0.3)" }}>
              <div className="text-base">{d.emoji}</div>
              <div className="text-[10px] text-white font-medium">{d.label}</div>
              <div className="text-[9px] text-slate-500">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Season */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Season</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[{id:"spring",label:"Spring",emoji:"🌸"},{id:"summer",label:"Summer",emoji:"☀️"},{id:"autumn",label:"Autumn",emoji:"🍂"},{id:"winter",label:"Winter",emoji:"❄️"}].map(s => (
            <button key={s.id} onClick={() => onChange({ season: s.id })} className="p-2 rounded-lg border text-center transition-all"
              style={{ background: config.season===s.id?`${meta?.color}20`:"rgba(30,41,59,0.8)", borderColor: config.season===s.id?meta?.color:"rgba(100,116,139,0.3)" }}>
              <div>{s.emoji}</div>
              <div className="text-[10px] text-white font-medium mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Simulation Results (advanced) ─────────────────────────────────────────────
function SimulationResults({ result, config }) {
  const meta = TYPE_META[config.vehicleType];
  const vehicle = REAL_VEHICLES[config.vehicleType]?.find(v => v.id === config.vehicleId);
  const [activeSection, setActiveSection] = useState("overview");
  if (!result || !meta || !vehicle) return null;
  const scoreColor = result.efficiencyScore >= 75 ? "#10b981" : result.efficiencyScore >= 50 ? "#f59e0b" : "#ef4444";

  const sections = [
    { id:"overview", label:"Overview", icon:BarChart3 },
    { id:"physics", label:"Physics", icon:Cpu },
    { id:"energy", label:"Energy", icon:Zap },
    { id:"emissions", label:"Emissions", icon:Wind },
    { id:"costs", label:"Economics", icon:DollarSign },
    { id:"route", label:"Route", icon:MapPin },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /> {vehicle.brand} {vehicle.model}</h3>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">{config.distance.toLocaleString()} km · {(config.payload/1000).toFixed(1)}t</span>
          <span className="font-black text-xl" style={{ color: scoreColor }}>{result.efficiencyScore}<span className="text-xs font-normal text-slate-500">/100</span></span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 flex-wrap">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all"
              style={{ background: activeSection===s.id?`${meta.color}20`:"rgba(30,41,59,0.6)", color: activeSection===s.id?meta.color:"#64748b", border: `1px solid ${activeSection===s.id?meta.color:"rgba(100,116,139,0.2)"}` }}>
              <Icon className="w-3 h-3" />{s.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}>

          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:result.fuelLabel, value:result.totalFuel.toLocaleString(), unit:result.unit, icon:Fuel, color:"#f59e0b" },
                  { label:"CO₂ total", value:result.co2Total.toLocaleString(), unit:"kg", icon:Wind, color:"#ef4444" },
                  { label:"CO₂ intensity", value:result.co2PerTonKm, unit:"g/ton-km", icon:Activity, color:"#8b5cf6" },
                  { label:"Duration", value:result.duration, unit:"", icon:Clock, color:"#06b6d4" },
                  { label:"Total cost", value:result.totalCost.toLocaleString(), unit:"DKK", icon:Calculator, color:"#10b981" },
                  { label:"Cost per ton-km", value:result.costPerTonKm, unit:"DKK", icon:TrendingUp, color:"#06b6d4" },
                ].map(({ label, value, unit, icon:Icon, color }) => (
                  <div key={label} className="p-3 rounded-xl border" style={{ background:`${color}0a`, borderColor:`${color}30` }}>
                    <Icon className="w-4 h-4 mb-1" style={{ color }} />
                    <p className="text-slate-400 text-[10px]">{label}</p>
                    <p className="text-white font-bold text-base leading-tight">{value}</p>
                    <p className="text-slate-500 text-[10px]">{unit}</p>
                  </div>
                ))}
              </div>
              {/* Efficiency bar */}
              <div className="p-3 rounded-xl border" style={{ background:`${scoreColor}08`, borderColor:`${scoreColor}25` }}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300 text-xs font-semibold">Operational Efficiency</span>
                  <span className="font-black text-lg" style={{ color:scoreColor }}>{result.efficiencyScore}/100</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width:0 }} animate={{ width:`${result.efficiencyScore}%` }} transition={{ duration:1.2, ease:"easeOut" }}
                    className="h-full rounded-full" style={{ background:`linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)` }} />
                </div>
              </div>
              {/* vs industry benchmark */}
              <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                <p className="text-slate-300 text-xs font-semibold mb-2">vs. Industry benchmark</p>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black ${result.vsIndustry < 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {result.vsIndustry > 0 ? "+" : ""}{result.vsIndustry}%
                  </div>
                  <div className="text-xs text-slate-400">
                    {result.vsIndustry < -10 ? "✅ Significantly better than industry average" :
                     result.vsIndustry < 0 ? "✅ Better than industry average" :
                     result.vsIndustry < 10 ? "⚠️ In line with industry average" :
                     "🔴 Below industry average"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHYSICS */}
          {activeSection === "physics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Aerodynamic drag", value:`${result.aeroDragForce.toLocaleString()} N`, sub:`Cd=${vehicle.specs.dragCoefficient||0.36} · ρ=${result.airDensity} kg/m³`, color:"#f59e0b" },
                  { label:"Rolling resistance", value:`${result.rollingForce.toLocaleString()} N`, sub:`RRC = ${vehicle.specs.rollingResistance||0.006} · ${(config.payload/1000).toFixed(0)} t`, color:"#8b5cf6" },
                  { label:"Grade resistance", value:`${result.gradientForce.toLocaleString()} N`, sub:`Avg gradient: ${({flat:"0%",hills:"2.5%",mountains:"5.5%",city:"1.2%",mixed:"1.8%"})[config.terrain]}`, color:"#ef4444" },
                  { label:"Engine load", value:`${result.engineLoad} %`, sub:`Required: ${result.requiredPowerKW} kW`, color:"#06b6d4" },
                  { label:"BSFC", value:`${result.bsfc} g/kWh`, sub:"Fuel consumption at current load", color:"#10b981" },
                  { label:"Air density", value:`${result.airDensity} kg/m³`, sub:`${config.season} · ${config.weather}`, color:"#64748b" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                    <p className="text-slate-400 text-[10px] mb-0.5">{label}</p>
                    <p className="text-white font-bold text-base" style={{ color }}>{value}</p>
                    <p className="text-slate-500 text-[10px] font-mono">{sub}</p>
                  </div>
                ))}
              </div>
              {/* Force breakdown bar chart */}
              <div>
                <p className="text-slate-300 text-xs font-semibold mb-2">Force breakdown (N)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={[
                    { name:"Aero drag", value:result.aeroDragForce, fill:"#f59e0b" },
                    { name:"Rolling", value:result.rollingForce, fill:"#8b5cf6" },
                    { name:"Grade", value:result.gradientForce, fill:"#ef4444" },
                  ]} margin={{ top:5, right:5, bottom:5, left:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize:10 }} />
                    <YAxis stroke="#475569" tick={{ fontSize:10 }} />
                    <Tooltip contentStyle={{ backgroundColor:"#0f172a", border:"1px solid #1e293b", borderRadius:"8px", fontSize:11 }} />
                    <Bar dataKey="value" name="Newton" radius={[4,4,0,0]}>
                      {[{ fill:"#f59e0b" },{ fill:"#8b5cf6" },{ fill:"#ef4444" }].map((c, i) => <Bar key={i} fill={c.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ENERGY */}
          {activeSection === "energy" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                <p className="text-slate-300 text-xs font-semibold mb-3 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Energy Balance — Sankey</p>
                <div className="space-y-2">
                  {[
                    { label:"Total input energy", value:result.totalEnergyMJ, pct:100, color:"#06b6d4" },
                    { label:"Thermal loss (engine)", value:result.thermalLossMJ, pct:Math.round(result.thermalLossMJ/result.totalEnergyMJ*100), color:"#ef4444" },
                    { label:"Drivetrain loss", value:result.drivetrainLoss, pct:Math.round(result.drivetrainLoss/result.totalEnergyMJ*100), color:"#f59e0b" },
                    { label:"Auxiliary load (AC, hydraulics)", value:result.auxiliaryLoad, pct:Math.round(result.auxiliaryLoad/result.totalEnergyMJ*100), color:"#8b5cf6" },
                    { label:"Useful tractive energy", value:result.actualUsefulMJ, pct:Math.round(result.actualUsefulMJ/result.totalEnergyMJ*100), color:"#10b981" },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-mono" style={{ color }}>{value.toLocaleString()} MJ ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                <p className="text-slate-300 text-xs font-semibold mb-2">Key metrics</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 rounded p-2"><p className="text-slate-500">Thermal efficiency</p><p className="text-emerald-400 font-bold text-base">{Math.round((vehicle.specs.thermalEfficiency||0.45)*100)}%</p></div>
                  <div className="bg-slate-900 rounded p-2"><p className="text-slate-500">Engine BSFC</p><p className="text-amber-400 font-bold text-base">{result.bsfc} g/kWh</p></div>
                  <div className="bg-slate-900 rounded p-2"><p className="text-slate-500">Energy per ton-km</p><p className="text-cyan-400 font-bold text-base">{Math.round(result.totalEnergyMJ/((config.payload/1000)*config.distance)*10)/10} MJ</p></div>
                  <div className="bg-slate-900 rounded p-2"><p className="text-slate-500">Engine load</p><p className="text-violet-400 font-bold text-base">{result.engineLoad}%</p></div>
                </div>
              </div>
            </div>
          )}

          {/* EMISSIONS */}
          {activeSection === "emissions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"CO₂", value:`${result.co2Total.toLocaleString()} kg`, sub:"Carbon dioxide", color:"#ef4444", detail:`${result.co2PerTonKm} g/ton-km` },
                  { label:"NOₓ", value:`${result.noxKg} kg`, sub:"Nitrogen oxides", color:"#f59e0b", detail:"Contributes to smog + acid rain" },
                  { label:"PM 2.5/10", value:`${result.pmKg} kg`, sub:"Particulate matter", color:"#8b5cf6", detail:"Health hazard" },
                  { label:"HC", value:`${result.hcKg} kg`, sub:"Hydrocarbons", color:"#06b6d4", detail:"VOC — tropospheric ozone" },
                  ...(config.vehicleType === "ship" ? [{ label:"SOₓ", value:`${result.soxKg} kg`, sub:"Sulphur oxides", color:"#64748b", detail:"Bunker fuel sulphur" }] : []),
                ].map(({ label, value, sub, color, detail }) => (
                  <div key={label} className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                    <p className="font-mono font-black text-xs mb-1" style={{ color }}>{label}</p>
                    <p className="text-white font-bold text-base">{value}</p>
                    <p className="text-slate-400 text-[10px]">{sub}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{detail}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-300 text-xs font-semibold mb-2">CO₂ accumulation along route</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={result.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="step" stroke="#475569" tick={{ fontSize:9 }} interval={5} />
                    <YAxis stroke="#475569" tick={{ fontSize:9 }} />
                    <Tooltip contentStyle={{ backgroundColor:"#0f172a", border:"1px solid #1e293b", borderRadius:"8px", fontSize:10 }} />
                    <Area type="monotone" dataKey="co2_cumul" stroke="#ef4444" fill="#ef444420" name="CO₂ kg" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-emerald-400 text-xs font-semibold mb-1">EU ETS Carbon Credits</p>
                <p className="text-white font-bold">{result.euEtsCost.toLocaleString()} DKK</p>
                <p className="text-slate-400 text-[10px]">Based on {result.co2Total} kg CO₂ × ~65 DKK/ton (ETS price)</p>
              </div>
            </div>
          )}

          {/* COSTS */}
          {activeSection === "costs" && (
            <div className="space-y-3">
              {[
                { label:"Fuel cost", value:result.fuelCost, icon:"⛽", sub:`${result.totalFuel.toLocaleString()} ${result.unit}`, color:"#f59e0b" },
                { label:"Crew / driver cost", value:result.driverCost, icon:"👤", sub:`${result.duration} × rate`, color:"#8b5cf6" },
                { label:"Maintenance", value:result.maintenanceCost, icon:"🔧", sub:`${config.distance} km × rate`, color:"#06b6d4" },
                ...(result.portFeesOrLanding > 0 ? [{ label:config.vehicleType === "ship" ? "Port fees" : "Landing fees", value:result.portFeesOrLanding, icon:"⚓", sub:"Fixed fee", color:"#64748b" }] : []),
                { label:"EU ETS carbon credits", value:result.euEtsCost, icon:"🌱", sub:`${result.co2Total} kg CO₂`, color:"#10b981" },
              ].map(({ label, value, icon, sub, color }) => {
                const pct = Math.round(value / result.totalCost * 100);
                return (
                  <div key={label} className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <div>
                          <p className="text-slate-300 text-xs font-semibold">{label}</p>
                          <p className="text-slate-500 text-[10px]">{sub}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{value.toLocaleString()} DKK</p>
                        <p className="text-slate-500 text-[10px]">{pct}% of total</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:color }} />
                    </div>
                  </div>
                );
              })}
              <div className="p-3 rounded-xl border-2 flex items-center justify-between" style={{ borderColor:meta.color, background:`${meta.color}08` }}>
                <p className="text-white font-bold">Grand Total</p>
                <p className="font-black text-xl" style={{ color:meta.color }}>{result.totalCost.toLocaleString()} DKK</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/40">
                  <p className="text-slate-500">DKK per ton</p>
                  <p className="text-white font-bold">{Math.round(result.totalCost/(config.payload/1000)).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/40">
                  <p className="text-slate-500">DKK per ton-km</p>
                  <p className="text-white font-bold">{result.costPerTonKm}</p>
                </div>
              </div>
            </div>
          )}

          {/* ROUTE */}
          {activeSection === "route" && (
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 text-xs font-semibold mb-2">Instantaneous consumption + engine load</p>
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={result.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="step" stroke="#475569" tick={{ fontSize:9 }} interval={5} />
                    <YAxis yAxisId="left" stroke="#475569" tick={{ fontSize:9 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fontSize:9 }} />
                    <Tooltip contentStyle={{ backgroundColor:"#0f172a", border:"1px solid #1e293b", borderRadius:"8px", fontSize:10 }} />
                    <Legend wrapperStyle={{ fontSize:10 }} />
                    <Area yAxisId="left" type="monotone" dataKey="fuel_cumul" stroke={meta.color} fill={`${meta.color}20`} name="Kumulativt brændstof" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="engine_load" stroke="#f59e0b" name="Motorlast %" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-slate-300 text-xs font-semibold mb-2">Hastighed langs ruten (km/t)</p>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={result.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="step" stroke="#475569" tick={{ fontSize:9 }} interval={5} />
                    <YAxis stroke="#475569" tick={{ fontSize:9 }} />
                    <Tooltip contentStyle={{ backgroundColor:"#0f172a", border:"1px solid #1e293b", borderRadius:"8px", fontSize:10 }} />
                    <ReferenceLine y={config.speed} stroke={meta.color} strokeDasharray="4 4" label={{ value:"Mål", fill:meta.color, fontSize:9 }} />
                    <Area type="monotone" dataKey="speed" stroke="#06b6d4" fill="#06b6d420" name="Hastighed" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Wear & maintenance */}
              {config.vehicleType === "truck" && (
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-900/40">
                  <p className="text-slate-300 text-xs font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Slidindeks & vedligeholdelse</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: result.wearIndex > 0.7 ? "#ef4444" : result.wearIndex > 0.4 ? "#f59e0b" : "#10b981" }}>
                      <span className="font-black text-lg" style={{ color: result.wearIndex > 0.7 ? "#ef4444" : result.wearIndex > 0.4 ? "#f59e0b" : "#10b981" }}>{result.wearIndex}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      <p>Næste service estimeret: <span className="text-white font-bold">{result.nextServiceKm?.toLocaleString()} km</span></p>
                      <p className="mt-1">Høj motorlast ({result.engineLoad}%) + {config.terrain} terræn øger slidhastighed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STEPS = ["Vehicle", "Cargo", "Parameters", "Simulate"];

export default function VehicleBuilder({ onClose }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    vehicleType:"truck", vehicleId:null, attachment:null,
    payload:18000, distance:500, speed:85,
    terrain:"mixed", weather:"clear",
    driverBehavior:"normal", season:"spring", cargoTemp:null,
  });
  const [simRan, setSimRan] = useState(false);

  const updateConfig = (changes) => { setSimRan(false); setConfig(prev => ({ ...prev, ...changes })); };

  const vehicle = REAL_VEHICLES[config.vehicleType]?.find(v => v.id === config.vehicleId);
  const meta = TYPE_META[config.vehicleType];

  const result = useMemo(() => {
    if (!simRan || !vehicle || !config.attachment) return null;
    return runAdvancedSimulation(vehicle, config.vehicleType, config.attachment, {
      payload: config.payload, distance: config.distance,
      terrain: config.terrain, weather: config.weather,
      speed: config.speed || vehicle.specs.speedKph,
      driverBehavior: config.driverBehavior || "normal",
      season: config.season || "spring",
    });
  }, [simRan, config, vehicle]);

  const canProceed = [config.vehicleId, config.attachment, config.payload != null && config.distance > 0, true][step];
  const handleRunSim = () => { setSimRan(true); setStep(3); };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          {meta && <meta.icon className="w-5 h-5" style={{ color: meta.color }} />}
          <div>
            <h2 className="text-white font-bold text-sm">Transport Builder & Advanced Simulator</h2>
            <p className="text-slate-500 text-xs">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Select a vehicle to get started"}</p>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all relative"
            style={{ color: step===i?meta?.color||"#06b6d4":"#64748b" }}>
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center border font-bold"
                style={{ borderColor:step===i?meta?.color||"#06b6d4":"#334155", background:step===i?`${meta?.color||"#06b6d4"}20`:"transparent" }}>
                {i+1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </span>
            {step===i && <motion.div layoutId="step-ind" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:meta?.color||"#06b6d4" }} />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.18 }}>
            {step===0 && <StepSelectVehicle config={config} onChange={updateConfig} />}
            {step===1 && <StepSelectAttachment config={config} onChange={updateConfig} />}
            {step===2 && <StepParameters config={config} onChange={updateConfig} />}
            {step===3 && !simRan && (
              <div className="flex flex-col items-center justify-center py-12 gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background:`${meta?.color}20`, border:`2px solid ${meta?.color}40` }}>
                  {meta && <meta.icon className="w-10 h-10" style={{ color:meta.color }} />}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white font-bold text-lg">Ready for advanced simulation</p>
                  <p className="text-slate-400 text-sm">{vehicle?.brand} {vehicle?.model}</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {[`${(config.payload/1000).toFixed(1)} t payload`,`${config.distance.toLocaleString()} km`,`${config.speed||vehicle?.specs?.speedKph} km/h`,`${config.terrain}`,`${config.weather}`,`${config.driverBehavior}`,`${config.season}`].map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] border border-slate-600 text-slate-400">{tag}</span>
                    ))}
                  </div>
                </div>
                <Button onClick={handleRunSim} className="gap-2 px-8 py-3 font-bold text-base" style={{ background:`linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)` }}>
                  <Cpu className="w-5 h-5" /> Start Advanced Simulation
                </Button>
              </div>
            )}
            {step===3 && simRan && result && <SimulationResults result={result} config={config} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/60 flex-shrink-0">
        <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0} className="gap-2 text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        {simRan && step===3 && (
          <Button variant="ghost" onClick={() => { setSimRan(false); setStep(2); }} className="text-slate-400 hover:text-amber-400 text-xs gap-1.5">
            <RotateCcw className="w-3 h-3" /> Adjust parameters
          </Button>
        )}
        {step < 2 && (
          <Button onClick={() => setStep(s => s+1)} disabled={!canProceed} className="gap-2 ml-auto" style={{ background:canProceed?`linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)`:undefined }}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        {step===2 && (
          <Button onClick={handleRunSim} disabled={!config.attachment} className="gap-2 ml-auto font-bold" style={{ background:`linear-gradient(135deg, ${meta?.color||"#06b6d4"}, #8b5cf6)` }}>
            <Cpu className="w-4 h-4" /> Simuler nu
          </Button>
        )}
      </div>
    </div>
  );
}