import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Ship, Plane, Train, ChevronRight, ChevronLeft, 
  Fuel, Wind, BarChart3, Zap, Weight, Thermometer, 
  AlertTriangle, CheckCircle2, Play, RotateCcw, X,
  Settings, Activity, TrendingUp, TrendingDown, Gauge,
  Calculator, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ── Vehicle Base Configs ──────────────────────────────────────────────────────
const VEHICLE_TYPES = {
  truck: {
    label: "Lastbil", icon: Truck, color: "#06b6d4",
    description: "Vejkøretøj til landevejstransport",
    baseWeight: 8000, // kg tara
    maxPayload: 24000,
    baseConsumption: 32, // L/100km
    co2PerLiter: 2.64, // kg CO2 per liter diesel
    speedKph: 90,
    variants: ["Solo lastbil", "Sættevogn", "Påhængs-kombo"],
    attachments: {
      label: "Trailere",
      options: [
        { id: "standard_curtain", label: "Gardintrailer", weight: 8000, dragCoef: 1.0, img: "🏗️", desc: "Standard, alsidig transport" },
        { id: "reefer", label: "Kølstrailer", weight: 9500, dragCoef: 1.08, img: "❄️", desc: "+8% forbrug til køleanlæg", extraPower: 5 },
        { id: "flatbed", label: "Flatbed", weight: 6500, dragCoef: 0.95, img: "📦", desc: "Lavere modstand, lavere egenvægt" },
        { id: "tanker", label: "Tanktrailer", weight: 10500, dragCoef: 1.12, img: "🛢️", desc: "Flydende gods, højere tara" },
        { id: "car_carrier", label: "Bil-trailer", weight: 11000, dragCoef: 1.25, img: "🚗", desc: "Til personbiler, høj luftmodstand" },
        { id: "mega", label: "Mega Trailer (3m)", weight: 8200, dragCoef: 1.18, img: "📐", desc: "Ekstra højde, øget luftmodstand" },
        { id: "swap_body", label: "Veksellad", weight: 7200, dragCoef: 0.98, img: "🔄", desc: "Intermodal, fleksibel" },
        { id: "walking_floor", label: "Walking Floor", weight: 9000, dragCoef: 1.02, img: "🌾", desc: "Bulk/løs last" },
      ]
    }
  },
  ship: {
    label: "Skib", icon: Ship, color: "#8b5cf6",
    description: "Maritim transport til gods og containere",
    baseWeight: 5000000,
    maxPayload: 80000000,
    baseConsumption: 200, // ton bunker per dag
    co2PerLiter: 3.15, // HFO
    speedKph: 25, // knots
    variants: ["Feedervartøj", "Handysize", "Panamax", "Post-Panamax"],
    attachments: {
      label: "Containertype / Last",
      options: [
        { id: "std_20", label: "20' Standard (TEU)", weight: 2200, dragCoef: 1.0, img: "📦", desc: "Standard 20-fods container" },
        { id: "std_40", label: "40' Standard (FEU)", weight: 3800, dragCoef: 1.0, img: "📦", desc: "Standard 40-fods container" },
        { id: "reefer_40", label: "40' Kølcontainer", weight: 4500, dragCoef: 1.0, img: "❄️", desc: "+12% forbrug til kølekraft" , extraPower: 12 },
        { id: "bulk", label: "Bulklast (korn/kul)", weight: 0, dragCoef: 0.85, img: "🌾", desc: "Løs bulk last, optimal stuvning" },
        { id: "tanker_load", label: "Tankerlast (crude/kemikalie)", weight: 0, dragCoef: 0.9, img: "🛢️", desc: "Flydende last i tankskib" },
        { id: "ro_ro", label: "Ro-Ro (biler/maskiner)", weight: 0, dragCoef: 1.15, img: "🚛", desc: "Roll-on/Roll-off, begrænset luk" },
        { id: "break_bulk", label: "Stykgods", weight: 0, dragCoef: 1.05, img: "🎁", desc: "Projektgods, tung løftet last" },
      ]
    }
  },
  aircraft: {
    label: "Fly", icon: Plane, color: "#f59e0b",
    description: "Luftfragt til hurtig og tidskritisk transport",
    baseWeight: 90000,
    maxPayload: 100000,
    baseConsumption: 11000, // liter JET-A1 per time
    co2PerLiter: 2.52,
    speedKph: 900,
    variants: ["Narrowbody freighter", "Widebody freighter", "Belly cargo", "Regional turboprop"],
    attachments: {
      label: "Lastcontainer / ULD",
      options: [
        { id: "ld3", label: "LD3 Container", weight: 80, dragCoef: 1.0, img: "📦", desc: "Standard narrowbody container" },
        { id: "ld7", label: "LD7 Container", weight: 120, dragCoef: 1.0, img: "📦", desc: "Widebody container, bred bund" },
        { id: "pallet_88", label: "88×125 Palle (PMC)", weight: 110, dragCoef: 1.0, img: "🧱", desc: "Standard luftfragts palle" },
        { id: "pallet_96", label: "96×125 Palle (PAG)", weight: 120, dragCoef: 1.0, img: "🧱", desc: "Stor fragts palle" },
        { id: "live_animals", label: "Levende dyr (AVI)", weight: 200, dragCoef: 1.0, img: "🐄", desc: "Spe­cialcontainer, vejrtrækning +5%" },
        { id: "pharma", label: "Pharma/Temp kontrolleret", weight: 150, dragCoef: 1.0, img: "💊", desc: "Aktiv temp-kontrol, +8% forbrug", extraPower: 8 },
        { id: "dangerous", label: "Farligt gods (DGR)", weight: 90, dragCoef: 1.0, img: "⚠️", desc: "IATA DGR klasse, spec. håndtering" },
      ]
    }
  },
  train: {
    label: "Tog", icon: Train, color: "#10b981",
    description: "Jernbanetransport, energieffektiv og massegods",
    baseWeight: 120000,
    maxPayload: 3000000,
    baseConsumption: 6, // kWh per ton-km (el) 
    co2PerLiter: 0.233, // kg CO2 per kWh (DK elnet mix 2024)
    speedKph: 120,
    variants: ["Godstog (el)", "Godstog (diesel)", "Intermodal block-train", "Tungt bulk-tog"],
    attachments: {
      label: "Vogne / Lasttype",
      options: [
        { id: "flat_wagon", label: "Fladbordsvogn (containere)", weight: 20000, dragCoef: 1.0, img: "🚃", desc: "Til 20'/40' containere, intermodal" },
        { id: "tank_wagon", label: "Tankvogn", weight: 25000, dragCoef: 1.05, img: "🛢️", desc: "Flydende gods, kemikalier" },
        { id: "gondola", label: "Gondolvogn (bulk)", weight: 22000, dragCoef: 0.95, img: "⛏️", desc: "Åben vogn til kul, malm, grus" },
        { id: "boxcar", label: "Lukkede lukvogn", weight: 24000, dragCoef: 1.02, img: "📦", desc: "Alsidig lukket godsvogn" },
        { id: "car_wagon", label: "Biltransportvogn", weight: 28000, dragCoef: 1.3, img: "🚗", desc: "Dobbelt-dæks biltransport" },
        { id: "reefer_wagon", label: "Kølvogn", weight: 28000, dragCoef: 1.08, img: "❄️", desc: "Kølet gods jernbane", extraPower: 6 },
        { id: "hopper", label: "Hoppervogn (korn/cement)", weight: 21000, dragCoef: 0.93, img: "🌾", desc: "Bund-tøm bulk vogn" },
      ]
    }
  }
};

// ── Physics/Simulation Engine ─────────────────────────────────────────────────
function simulate(config) {
  const { type, variant, attachment, payload, distance, terrain, weather, speed } = config;
  const vt = VEHICLE_TYPES[type];
  if (!vt || !attachment) return null;

  const att = vt.attachments.options.find(o => o.id === attachment);
  if (!att) return null;

  // Base consumption (normalize by type)
  let baseFuel = vt.baseConsumption;

  // Speed effect (quadratic drag)
  const nominalSpeed = vt.speedKph;
  const speedRatio = speed / nominalSpeed;
  const speedFactor = 0.6 + 0.4 * Math.pow(speedRatio, 2.5); // drag law

  // Payload factor — heavier = more fuel
  const payloadRatio = payload / vt.maxPayload;
  const loadFactor = 1 + payloadRatio * 0.65; // 0% load = baseline, 100% = +65%

  // Drag coefficient from trailer
  const dragFactor = att.dragCoef;

  // Terrain
  const terrainFactors = { flat: 1.0, hills: 1.18, mountains: 1.42, city: 1.28, mixed: 1.12 };
  const terrainFactor = terrainFactors[terrain] || 1.0;

  // Weather
  const weatherFactors = { clear: 1.0, rain: 1.07, wind_headwind: 1.15, snow: 1.22, fog: 1.03 };
  const weatherFactor = weatherFactors[weather] || 1.0;

  // Extra power (reefer, pharma, etc.)
  const extraFactor = att.extraPower ? 1 + att.extraPower / 100 : 1.0;

  // Combined consumption rate
  const consumptionRate = baseFuel * speedFactor * loadFactor * dragFactor * terrainFactor * weatherFactor * extraFactor;

  // Total consumption
  let totalFuel, unit, fuelLabel;
  if (type === "truck") {
    // L/100km → total liters
    totalFuel = (consumptionRate / 100) * distance;
    unit = "L";
    fuelLabel = "Diesel (L)";
  } else if (type === "ship") {
    // ton bunker per dag → distance/speed = tid i dage
    const days = distance / (speed * 24);
    totalFuel = consumptionRate * days;
    unit = "ton";
    fuelLabel = "Bunker (ton)";
  } else if (type === "aircraft") {
    // L per time → distance/speed = timer
    const hours = distance / speed;
    totalFuel = consumptionRate * hours;
    unit = "L";
    fuelLabel = "JET-A1 (L)";
  } else if (type === "train") {
    // kWh per ton-km
    const totalTons = (payload / 1000) || 1;
    totalFuel = consumptionRate * totalTons * distance;
    unit = "kWh";
    fuelLabel = "Elektricitet (kWh)";
  }

  const co2Total = totalFuel * vt.co2PerLiter;
  const co2PerTonKm = payload > 0 ? (co2Total / ((payload / 1000) * distance)) * 1000 : 0; // g/ton-km

  // Efficiency score (0-100)
  const efficiencyScore = Math.max(10, Math.round(
    100 - (loadFactor - 1) * 30 - (speedFactor - 1) * 20 - (dragFactor - 1) * 25 - (terrainFactor - 1) * 15
  ));

  // Cost estimates (DKK)
  const fuelPrices = { truck: 10.5, ship: 4200, aircraft: 8.2, train: 0.85 }; // DKK per unit
  const fuelCost = totalFuel * fuelPrices[type];
  const driverCost = type === "truck" ? (distance / speed) * 280 : 0; // 280 DKK/h
  const totalCost = fuelCost + driverCost;

  // Hour-by-hour simulation data (simplified)
  const steps = Math.min(24, Math.max(8, Math.round(distance / (speed * 0.5))));
  const timeline = Array.from({ length: steps }, (_, i) => {
    const progress = i / (steps - 1);
    const fuelAtStep = (totalFuel / steps) * (i + 1);
    // Speed variation
    const speedVar = speed * (0.9 + Math.sin(progress * Math.PI * 3) * 0.1);
    const fuelRateVar = consumptionRate * (0.85 + Math.random() * 0.3);
    return {
      step: `${Math.round(progress * 100)}%`,
      brændstof: Math.round(fuelAtStep),
      co2: Math.round(fuelAtStep * vt.co2PerLiter),
      hastighed: Math.round(speedVar),
      forbrug: Math.round(fuelRateVar * 10) / 10,
      distance: Math.round(progress * distance),
    };
  });

  // Efficiency breakdown for radar
  const radarData = [
    { subject: "Hastighed", value: Math.max(20, 100 - Math.abs(speedRatio - 1) * 60) },
    { subject: "Last", value: Math.max(20, 100 - payloadRatio * 40) },
    { subject: "Aerodynamik", value: Math.max(20, 100 - (dragFactor - 1) * 120) },
    { subject: "Vejr", value: Math.max(20, 100 - (weatherFactor - 1) * 150) },
    { subject: "Terræn", value: Math.max(20, 100 - (terrainFactor - 1) * 100) },
    { subject: "Udstyr", value: Math.max(20, 100 - (extraFactor - 1) * 200) },
  ];

  return {
    totalFuel: Math.round(totalFuel),
    unit, fuelLabel,
    co2Total: Math.round(co2Total),
    co2PerTonKm: Math.round(co2PerTonKm * 10) / 10,
    efficiencyScore,
    fuelCost: Math.round(fuelCost),
    driverCost: Math.round(driverCost),
    totalCost: Math.round(totalCost),
    consumptionRate: Math.round(consumptionRate * 10) / 10,
    timeline,
    radarData,
    duration: type === "ship" ? `${(distance / (speed * 24)).toFixed(1)} dage` :
              type === "aircraft" ? `${(distance / speed).toFixed(1)} timer` :
              `${(distance / speed).toFixed(1)} timer`,
    factors: { speedFactor, loadFactor, dragFactor, terrainFactor, weatherFactor, extraFactor }
  };
}

// ── Step Components ───────────────────────────────────────────────────────────
function StepVehicleType({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-cyan-400" /> Vælg transportmiddel
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(VEHICLE_TYPES).map(([key, vt]) => {
          const Icon = vt.icon;
          const selected = config.type === key;
          return (
            <motion.button key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ type: key, attachment: null, variant: null })}
              className="p-4 rounded-xl border text-left transition-all"
              style={{
                background: selected ? `${vt.color}18` : "rgba(15,23,42,0.6)",
                borderColor: selected ? vt.color : "rgba(100,116,139,0.3)",
                boxShadow: selected ? `0 0 20px ${vt.color}30` : "none"
              }}>
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
                style={{
                  background: config.variant === v ? `${VEHICLE_TYPES[config.type].color}20` : "rgba(30,41,59,0.8)",
                  borderWidth: 1, borderStyle: "solid",
                  borderColor: config.variant === v ? VEHICLE_TYPES[config.type].color : "rgba(100,116,139,0.3)",
                  color: config.variant === v ? "#fff" : "#94a3b8"
                }}>
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
              style={{
                background: selected ? `${vt.color}15` : "rgba(15,23,42,0.6)",
                borderColor: selected ? vt.color : "rgba(100,116,139,0.3)"
              }}>
              <span className="text-2xl">{att.img}</span>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{att.label}</p>
                <p className="text-slate-400 text-xs">{att.desc}</p>
                {att.extraPower && <Badge className="mt-1 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">+{att.extraPower}% effektforbrug</Badge>}
              </div>
              {att.weight > 0 && <span className="text-slate-500 text-xs whitespace-nowrap">{(att.weight/1000).toFixed(1)}t tara</span>}
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
        <Gauge className="w-5 h-5 text-cyan-400" /> Driftparameter
      </h3>

      {/* Payload */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Lastkapacitet</label>
          <span className="text-white font-bold text-sm">{((config.payload || payloadKg)/1000).toFixed(1)} ton</span>
        </div>
        <Slider min={0} max={maxPayload} step={100}
          value={[config.payload || payloadKg]}
          onValueChange={([v]) => onChange({ payload: v })}
          className="w-full" />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0 ton</span><span>Maks: {(maxPayload/1000).toFixed(0)} ton</span>
        </div>
      </div>

      {/* Distance */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">Rute-distance</label>
          <span className="text-white font-bold text-sm">{(config.distance || 500).toLocaleString()} km</span>
        </div>
        <Slider min={50} max={config.type === "ship" ? 15000 : config.type === "aircraft" ? 12000 : config.type === "train" ? 3000 : 2000}
          step={50} value={[config.distance || 500]}
          onValueChange={([v]) => onChange({ distance: v })} className="w-full" />
      </div>

      {/* Speed */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-slate-300 text-sm font-medium">
            Rejsehastighed {config.type === "ship" ? "(knob)" : config.type === "aircraft" ? "(km/t)" : "(km/t)"}
          </label>
          <span className="text-white font-bold text-sm">{config.speed || vt.speedKph} {config.type === "ship" ? "kn" : "km/t"}</span>
        </div>
        <Slider min={config.type === "ship" ? 8 : config.type === "aircraft" ? 600 : config.type === "train" ? 40 : 50}
          max={config.type === "ship" ? 35 : config.type === "aircraft" ? 950 : config.type === "train" ? 160 : 110}
          step={1} value={[config.speed || vt.speedKph]}
          onValueChange={([v]) => onChange({ speed: v })} className="w-full" />
      </div>

      {/* Terrain */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Terræn / Rute-type</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "flat", label: "Flad", emoji: "🛣️" },
            { id: "hills", label: "Bakket", emoji: "⛰️" },
            { id: "mountains", label: "Bjergrig", emoji: "🏔️" },
            { id: "city", label: "By-kørsel", emoji: "🏙️" },
            { id: "mixed", label: "Blandet", emoji: "🗺️" },
          ].map(t => (
            <button key={t.id} onClick={() => onChange({ terrain: t.id })}
              className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{
                background: config.terrain === t.id ? `${vt.color}20` : "rgba(30,41,59,0.8)",
                borderColor: config.terrain === t.id ? vt.color : "rgba(100,116,139,0.3)",
                color: config.terrain === t.id ? "#fff" : "#94a3b8"
              }}>
              <div>{t.emoji}</div>
              <div>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div>
        <label className="text-slate-300 text-sm font-medium block mb-2">Vejrforhold</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "clear", label: "Klart", emoji: "☀️" },
            { id: "rain", label: "Regn", emoji: "🌧️" },
            { id: "wind_headwind", label: "Modvind", emoji: "💨" },
            { id: "snow", label: "Sne", emoji: "❄️" },
            { id: "fog", label: "Tåge", emoji: "🌫️" },
          ].map(w => (
            <button key={w.id} onClick={() => onChange({ weather: w.id })}
              className="p-2 rounded-lg border text-center text-xs transition-all"
              style={{
                background: config.weather === w.id ? `${vt.color}20` : "rgba(30,41,59,0.8)",
                borderColor: config.weather === w.id ? vt.color : "rgba(100,116,139,0.3)",
                color: config.weather === w.id ? "#fff" : "#94a3b8"
              }}>
              <div>{w.emoji}</div>
              <div>{w.label}</div>
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
        <BarChart3 className="w-5 h-5 text-cyan-400" /> Simuleringsresultater
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: result.fuelLabel, value: result.totalFuel.toLocaleString(), unit: result.unit, icon: Fuel, color: "#f59e0b" },
          { label: "CO₂ udledning", value: result.co2Total.toLocaleString(), unit: "kg", icon: Wind, color: "#ef4444" },
          { label: "CO₂ intensitet", value: result.co2PerTonKm, unit: "g/ton-km", icon: Activity, color: "#8b5cf6" },
          { label: "Varighed", value: result.duration, unit: "", icon: Gauge, color: "#06b6d4" },
          { label: "Brændstof-omkost.", value: result.fuelCost.toLocaleString(), unit: "DKK", icon: TrendingUp, color: "#10b981" },
          { label: "Total omkostning", value: result.totalCost.toLocaleString(), unit: "DKK", icon: Calculator, color: "#06b6d4" },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="p-3 rounded-xl border" style={{ background: `${color}0a`, borderColor: `${color}30` }}>
            <Icon className="w-4 h-4 mb-1.5" style={{ color }} />
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white font-bold text-lg">{value} <span className="text-slate-500 text-xs font-normal">{unit}</span></p>
          </div>
        ))}
      </div>

      {/* Efficiency Score */}
      <div className="p-4 rounded-xl border" style={{ background: `${scoreColor}0a`, borderColor: `${scoreColor}30` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm font-semibold">Driftseffektivitet</span>
          <span className="font-black text-2xl" style={{ color: scoreColor }}>{result.efficiencyScore}/100</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${result.efficiencyScore}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)` }} />
        </div>
        <p className="text-slate-400 text-xs mt-2">
          {result.efficiencyScore >= 75 ? "✅ Excellent — optimal kørsel" :
           result.efficiencyScore >= 50 ? "⚠️ Moderat — der er forbedringspotentiale" :
           "🔴 Lav — overvej lastoptimering og reduceret hastighed"}
        </p>
      </div>

      {/* Fuel Timeline Chart */}
      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Brændstofforbrug over ruten
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={result.timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
            <Area type="monotone" dataKey="brændstof" stroke={vt.color} fill={`${vt.color}30`} name={result.fuelLabel} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* CO2 Bar Chart */}
      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-red-400" /> CO₂ akkumulering (kg)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={result.timeline.filter((_, i) => i % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
            <Bar dataKey="co2" fill="#ef444460" stroke="#ef4444" name="CO₂ (kg)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar */}
      <div>
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" /> Effektivitetsprofil
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={result.radarData}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Radar name="Score" dataKey="value" stroke={vt.color} fill={`${vt.color}30`} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor breakdown */}
      <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40">
        <p className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" /> Faktorer og indvirkning
        </p>
        <div className="space-y-2">
          {[
            { label: "Hastighedsfaktor", value: result.factors.speedFactor, neutral: 1.0 },
            { label: "Lastfaktor", value: result.factors.loadFactor, neutral: 1.0 },
            { label: "Luftmodstandsfaktor (trailer)", value: result.factors.dragFactor, neutral: 1.0 },
            { label: "Terrænfaktor", value: result.factors.terrainFactor, neutral: 1.0 },
            { label: "Vejrfaktor", value: result.factors.weatherFactor, neutral: 1.0 },
            { label: "Ekstra udstyr", value: result.factors.extraFactor, neutral: 1.0 },
          ].map(({ label, value, neutral }) => {
            const increase = ((value - neutral) * 100).toFixed(0);
            const isNeg = value > neutral;
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
const STEPS = ["Køretøj", "Udstyr", "Parametre", "Simulering"];

export default function VehicleBuilder({ onClose }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    type: "truck",
    variant: null,
    attachment: null,
    payload: 15000,
    distance: 500,
    speed: 85,
    terrain: "mixed",
    weather: "clear",
  });
  const [simRan, setSimRan] = useState(false);

  const updateConfig = (changes) => setConfig(prev => ({ ...prev, ...changes }));

  const result = useMemo(() => {
    if (!simRan || !config.attachment) return null;
    return simulate(config);
  }, [simRan, config]);

  const vt = VEHICLE_TYPES[config.type];
  const canProceed = [
    config.type,
    config.attachment,
    config.payload != null && config.distance > 0,
    true
  ][step];

  const handleRunSim = () => {
    setSimRan(true);
    setStep(3);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          {vt && <vt.icon className="w-6 h-6" style={{ color: vt.color }} />}
          <div>
            <h2 className="text-white font-bold text-sm">Transportbygger & Simulator</h2>
            <p className="text-slate-500 text-xs">Konfigurer dit køretøj og kør avanceret beregning</p>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>}
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-slate-800/60 flex-shrink-0">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < 3 && setStep(i)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all relative"
            style={{ color: step === i ? vt?.color || "#06b6d4" : "#64748b" }}>
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center border font-bold"
                style={{ borderColor: step === i ? vt?.color || "#06b6d4" : "#334155", background: step === i ? `${vt?.color || "#06b6d4"}20` : "transparent" }}>
                {i + 1}
              </span>
              {s}
            </span>
            {step === i && <motion.div layoutId="step-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: vt?.color || "#06b6d4" }} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 0 && <StepVehicleType config={config} onChange={updateConfig} />}
            {step === 1 && <StepAttachment config={config} onChange={updateConfig} />}
            {step === 2 && <StepParameters config={config} onChange={updateConfig} />}
            {step === 3 && !simRan && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `${vt?.color}20`, border: `2px solid ${vt?.color}40` }}>
                  {vt && <vt.icon className="w-12 h-12" style={{ color: vt.color }} />}
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Klar til simulering</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {vt?.label} · {(config.payload / 1000).toFixed(1)}t last · {config.distance} km
                  </p>
                </div>
                <Button onClick={handleRunSim} className="gap-2 px-8 py-3 font-bold text-base" style={{ background: `linear-gradient(135deg, ${vt?.color || "#06b6d4"}, #8b5cf6)` }}>
                  <Play className="w-5 h-5" /> Kør simulering
                </Button>
              </div>
            )}
            {step === 3 && simRan && result && <SimulationResults result={result} config={config} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/60 flex-shrink-0 gap-3">
        <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="gap-2 text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Tilbage
        </Button>

        {simRan && step === 3 && (
          <Button variant="ghost" onClick={() => { setSimRan(false); setStep(2); }}
            className="gap-2 text-slate-400 hover:text-amber-400 text-xs">
            <RotateCcw className="w-3 h-3" /> Ændr parametre
          </Button>
        )}

        {step < 2 && (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}
            className="gap-2 ml-auto" style={{ background: canProceed ? `linear-gradient(135deg, ${vt?.color || "#06b6d4"}, #8b5cf6)` : undefined }}>
            Næste <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        {step === 2 && (
          <Button onClick={handleRunSim} disabled={!config.attachment}
            className="gap-2 ml-auto font-bold" style={{ background: `linear-gradient(135deg, ${vt?.color || "#06b6d4"}, #8b5cf6)` }}>
            <Zap className="w-4 h-4" /> Simuler nu
          </Button>
        )}
      </div>
    </div>
  );
}