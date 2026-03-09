import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const MISTRAL_KEY = Deno.env.get("MISTRAL_API_KEY");

function scoreComponents(vehicle, history) {
  const now = Date.now();
  const msOld = vehicle.last_maintenance ? now - new Date(vehicle.last_maintenance).getTime() : 180 * 86400000;
  const daysOld = msOld / 86400000;
  const mo = daysOld / 30;
  const km = vehicle.total_distance_km || 0;
  const fuel = vehicle.fuel_level ?? 100;
  const eff = vehicle.efficiency_score ?? 80;
  const co2 = vehicle.co2_emissions ?? 0;
  const sig = vehicle.signal_strength ?? 100;
  const emgCount = history.filter(m => m.type === 'emergency').length;

  const defs = [
    { name:"Engine", risk: Math.min((mo>3?(mo-3)*8:0)+(km>50000?Math.min((km-50000)/5000,30):0)+(eff<60?(60-eff)*0.8:0)+emgCount*5,100), svc:"Oil & Filter Change + Engine Diagnostics", cost:180, hrs:2 },
    { name:"Brakes", risk: Math.min((mo>6?(mo-6)*6:0)+(km>80000?Math.min((km-80000)/3000,35):0),100), svc:"Brake Pad & Disc Inspection", cost:320, hrs:3 },
    { name:"Transmission", risk: Math.min((mo>12?(mo-12)*4:0)+(km>100000?Math.min((km-100000)/5000,25):0)+(eff<50?20:0),100), svc:"Transmission Fluid & Clutch Check", cost:450, hrs:4 },
    { name:"Tires", risk: Math.min((mo>9?(mo-9)*5:0)+(km>40000?Math.min((km-40000)/2000,30):0),100), svc:"Tire Rotation & Alignment", cost:600, hrs:2 },
    { name:"Fuel System", risk: Math.min((fuel<15?40:fuel<25?20:0)+(co2>500?Math.min((co2-500)/50,25):0),100), svc:"Fuel Filter & Injector Cleaning", cost:150, hrs:2 },
    { name:"Electrical", risk: Math.min((sig<40?(40-sig)*1.5:0)+(vehicle.status==='offline'?30:0),100), svc:"Battery & Sensor Calibration", cost:200, hrs:2 },
    { name:"Cooling", risk: Math.min((mo>18?(mo-18)*3:0)+(eff<55?20:0),100), svc:"Coolant Flush & Radiator Check", cost:120, hrs:2 },
    { name:"Exhaust", risk: Math.min((co2>400?Math.min((co2-400)/30,40):0)+(eff<65?(65-eff)*0.5:0),100), svc:"Exhaust & Emissions Test", cost:250, hrs:3 },
  ];

  return defs.map(d => {
    const r = Math.round(d.risk);
    const urg = r>75?'critical':r>45?'high':r>20?'medium':'low';
    return {
      name: d.name, risk: r, urgency: urg, service: d.svc,
      estimated_failure_days: r>0 ? Math.max(Math.round((100-r)*0.8),3) : 999,
      preventive_cost_eur: Math.round(d.cost + d.hrs*85),
      reactive_cost_eur: Math.round(d.cost*2.8 + d.hrs*120),
      labor_hours: d.hrs,
    };
  });
}

async function getAIInsights(summaryData) {
  if (!MISTRAL_KEY) return null;
  const prompt = `You are a fleet maintenance AI. Analyze this data and respond ONLY with valid JSON (no markdown):
${JSON.stringify(summaryData)}

{"fleet_health_score":<0-100>,"total_preventive_savings_eur":<number>,"key_findings":["<finding1>","<finding2>","<finding3>"],"highest_risk_component_fleet_wide":"<name>","ai_summary":"<2 sentences in Danish>"}`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method:"POST",
      headers:{"Authorization":`Bearer ${MISTRAL_KEY}`,"Content-Type":"application/json"},
      body: JSON.stringify({ model:"mistral-small-latest", messages:[{role:"user",content:prompt}], temperature:0.2, max_tokens:500 }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const txt = d.choices?.[0]?.message?.content || "";
    const m = txt.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error:'Unauthorized' }, { status:401 });

    const { organization_id } = await req.json();

    const [vehicles, maintenanceRecords] = await Promise.all([
      base44.entities.Vehicle.filter({ organization_id }),
      base44.entities.Maintenance.filter({ organization_id }),
    ]);

    const vehicleAnalyses = vehicles.map(vehicle => {
      const history = maintenanceRecords.filter(m => m.vehicle_id === vehicle.id);
      const components = scoreComponents(vehicle, history);
      const daysSinceService = vehicle.last_maintenance
        ? Math.round((Date.now() - new Date(vehicle.last_maintenance).getTime()) / 86400000) : null;
      const overallRisk = Math.round(components.reduce((s,c) => s+c.risk, 0) / components.length);
      const urg = overallRisk>70?'critical':overallRisk>45?'high':overallRisk>20?'medium':'low';
      const prevCost = components.filter(c=>c.risk>20).reduce((s,c)=>s+c.preventive_cost_eur,0);
      const reactCost = components.filter(c=>c.risk>20).reduce((s,c)=>s+c.reactive_cost_eur,0);

      return {
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        vehicle_type: vehicle.type,
        fuel_level: vehicle.fuel_level,
        efficiency_score: vehicle.efficiency_score,
        co2_emissions: vehicle.co2_emissions,
        total_distance_km: vehicle.total_distance_km,
        days_since_service: daysSinceService,
        overall_risk: overallRisk,
        urgency: urg,
        components,
        critical_components: components.filter(c=>c.urgency==='critical').map(c=>c.name),
        high_risk_components: components.filter(c=>c.urgency==='high').map(c=>c.name),
        preventive_cost_eur: Math.round(prevCost),
        reactive_cost_eur: Math.round(reactCost),
        potential_savings_eur: Math.max(Math.round(reactCost - prevCost), 0),
        estimated_downtime_hours: components.filter(c=>c.risk>20).reduce((s,c)=>s+c.labor_hours,0),
        emergency_count: history.filter(m=>m.type==='emergency').length,
      };
    }).sort((a,b) => b.overall_risk - a.overall_risk);

    const aiInsights = await getAIInsights({
      vehicle_count: vehicles.length,
      top_vehicles: vehicleAnalyses.slice(0,5).map(v=>({ name:v.vehicle_name, risk:v.overall_risk, urgency:v.urgency, top_issues:v.critical_components.concat(v.high_risk_components).slice(0,3) }))
    });

    const criticalVehicles = vehicleAnalyses.filter(v=>v.urgency==='critical');
    const createdOrders = [];
    for (const risk of criticalVehicles.slice(0,5)) {
      const critComp = risk.components.find(c=>c.urgency==='critical');
      if (!critComp) continue;
      const order = await base44.asServiceRole.entities.Maintenance.create({
        organization_id, vehicle_id:risk.vehicle_id, type:'predictive', priority:'critical',
        component: critComp.name,
        description: `AI Predictive: ${[...risk.critical_components,...risk.high_risk_components].join(', ')} — proaktiv service anbefalet.`,
        predicted_failure_date: new Date(Date.now()+critComp.estimated_failure_days*86400000).toISOString().split('T')[0],
        scheduled_date: new Date(Date.now()+2*86400000).toISOString().split('T')[0],
        cost_estimate: risk.preventive_cost_eur,
        downtime_hours: risk.estimated_downtime_hours,
        ai_confidence: risk.overall_risk,
        status:'pending',
      });
      createdOrders.push(order);
    }

    const optimizedSchedule = vehicleAnalyses.filter(v=>v.urgency==='high').slice(0,6).map((v,i) => ({
      vehicle_id: v.vehicle_id, vehicle_name: v.vehicle_name,
      suggested_schedule_date: new Date(Date.now()+(7+i*3)*86400000).toISOString().split('T')[0],
      batch_group: Math.floor(i/2)+1,
      services: v.components.filter(c=>c.risk>40).map(c=>c.service),
      cost_eur: v.preventive_cost_eur,
    }));

    const healthScore = aiInsights?.fleet_health_score
      ?? Math.round(100 - vehicleAnalyses.reduce((s,v)=>s+v.overall_risk,0)/Math.max(vehicles.length,1));

    return Response.json({
      summary: {
        total_vehicles: vehicles.length,
        critical_vehicles: criticalVehicles.length,
        high_risk_vehicles: vehicleAnalyses.filter(v=>v.urgency==='high').length,
        maintenance_orders_created: createdOrders.length,
        total_preventive_cost_eur: vehicleAnalyses.reduce((s,v)=>s+v.preventive_cost_eur,0),
        total_potential_savings_eur: vehicleAnalyses.reduce((s,v)=>s+v.potential_savings_eur,0),
        potential_downtime_avoidance_hours: criticalVehicles.reduce((s,v)=>s+v.estimated_downtime_hours,0),
        fleet_health_score: healthScore,
      },
      vehicle_analyses: vehicleAnalyses,
      ai_insights: aiInsights,
      created_orders: createdOrders,
      optimized_schedule: optimizedSchedule,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status:500 });
  }
});