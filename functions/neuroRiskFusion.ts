import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { organization_id } = body;

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) return Response.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });

    // Fetch real fleet data
    const [vehicles, routes, alerts, maintenance, exceptions, shipments] = await Promise.all([
      base44.asServiceRole.entities.Vehicle.filter({ organization_id }),
      base44.asServiceRole.entities.Route.filter({ organization_id }),
      base44.asServiceRole.entities.Alert.filter({ organization_id, is_resolved: false }),
      base44.asServiceRole.entities.Maintenance.filter({ organization_id }),
      base44.asServiceRole.entities.Exception.filter({ organization_id }),
      base44.asServiceRole.entities.Shipment.filter({ organization_id }),
    ]);

    // Derive real risk signals from actual data
    const lowFuelVehicles = vehicles.filter(v => v.fuel_level < 20);
    const offlineVehicles = vehicles.filter(v => v.status === 'offline');
    const maintenanceOverdue = maintenance.filter(m => m.status === 'pending' && m.priority === 'critical');
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    const activeExceptions = exceptions.filter(e => e.status !== 'resolved' && e.severity === 'critical');
    const delayedShipments = shipments.filter(s => s.status === 'delayed');

    // Build signal list from real data
    const realSignals = [];

    lowFuelVehicles.forEach(v => {
      realSignals.push({ source: 'IOT', signal: `${v.name} fuel critically low: ${v.fuel_level}%`, severity: v.fuel_level < 10 ? 'critical' : 'high', confidence: 99 });
    });
    offlineVehicles.forEach(v => {
      realSignals.push({ source: 'GPS', signal: `${v.name} signal lost — offline`, severity: 'critical', confidence: 95 });
    });
    maintenanceOverdue.forEach(m => {
      realSignals.push({ source: 'MAINT', signal: `Critical maintenance overdue: ${m.component} on vehicle ${m.vehicle_id}`, severity: 'critical', confidence: 97 });
    });
    criticalAlerts.forEach(a => {
      realSignals.push({ source: 'ALERT', signal: a.message || a.title, severity: 'critical', confidence: 90 });
    });
    activeExceptions.forEach(e => {
      realSignals.push({ source: 'OPS', signal: `Exception: ${e.title} — ${e.description || ''}`, severity: 'critical', confidence: 88 });
    });
    delayedShipments.forEach(s => {
      realSignals.push({ source: 'SHIP', signal: `Shipment ${s.tracking_number} delayed: ${s.origin} → ${s.destination}`, severity: 'high', confidence: 92 });
    });

    // Build symbolic rules from real data
    const symbolicRules = [
      {
        id: 1,
        rule: `IF offline_vehicles(${offlineVehicles.length}) > 0 AND no_recent_checkpoint THEN gps_attack_or_breakdown INVESTIGATE`,
        triggered: offlineVehicles.length > 0,
        confidence: 88,
      },
      {
        id: 2,
        rule: `IF low_fuel_vehicles(${lowFuelVehicles.length}) > 2 AND active_routes > ${routes.filter(r => r.status === 'active').length} THEN range_crisis IMMINENT`,
        triggered: lowFuelVehicles.length > 2,
        confidence: 94,
      },
      {
        id: 3,
        rule: `IF critical_alerts(${criticalAlerts.length}) > 0 AND delayed_shipments(${delayedShipments.length}) > 0 THEN cascade_failure RISK HIGH`,
        triggered: criticalAlerts.length > 0 && delayedShipments.length > 0,
        confidence: 91,
      },
      {
        id: 4,
        rule: `IF overdue_maintenance(${maintenanceOverdue.length}) > 0 AND vehicle_utilization HIGH THEN breakdown_probability ELEVATED`,
        triggered: maintenanceOverdue.length > 0,
        confidence: 86,
      },
      {
        id: 5,
        rule: `IF active_exceptions(${activeExceptions.length}) > 1 AND shipment_delay_rate > 10% THEN supply_chain_stress DETECTED`,
        triggered: activeExceptions.length > 1,
        confidence: 83,
      },
    ];

    // Calculate real risk score
    let riskScore = 10;
    riskScore += offlineVehicles.length * 12;
    riskScore += lowFuelVehicles.length * 8;
    riskScore += maintenanceOverdue.length * 10;
    riskScore += criticalAlerts.length * 7;
    riskScore += activeExceptions.length * 9;
    riskScore += delayedShipments.length * 4;
    riskScore = Math.min(97, Math.max(5, riskScore));

    // Build Mistral prompt with real fleet data
    const fleetSummary = `
REAL-TIME FLEET DATA (${new Date().toISOString()}):
- Total vehicles: ${vehicles.length} (${offlineVehicles.length} offline, ${lowFuelVehicles.length} low fuel)
- Active routes: ${routes.filter(r => r.status === 'active').length} / ${routes.length}
- Active shipments: ${shipments.length} (${delayedShipments.length} delayed)
- Unresolved alerts: ${alerts.length} (${criticalAlerts.length} critical)
- Pending maintenance: ${maintenance.filter(m => m.status === 'pending').length} (${maintenanceOverdue.length} critical)
- Active exceptions: ${exceptions.filter(e => e.status !== 'resolved').length} (${activeExceptions.length} critical)

DETECTED SIGNALS:
${realSignals.map(s => `[${s.source}][${s.severity.toUpperCase()}] ${s.signal} (confidence: ${s.confidence}%)`).join('\n')}

TRIGGERED SYMBOLIC RULES:
${symbolicRules.filter(r => r.triggered).map(r => r.rule).join('\n')}
`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a Neuro-Symbolic Risk Fusion AI for a fleet management system. You analyze real fleet data and produce actionable risk intelligence. Be specific, use the exact vehicle names and numbers from the data. Output valid JSON only.'
          },
          {
            role: 'user',
            content: `Analyze this real fleet data and produce a risk fusion report:\n\n${fleetSummary}\n\nReturn JSON with: overall_risk_score (number 0-100), risk_level (string: NOMINAL/ELEVATED/CRITICAL), compound_risks (array of {scenario, probability, impact, inputs}), cyber_threats (array of strings), supply_chain_signals (array of strings), hedging_actions (array of specific actionable strings), sixth_sense_alert (string: one non-obvious emerging risk), summary (string: 1-2 sentence executive summary).`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Mistral error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const aiReport = JSON.parse(data.choices[0].message.content);

    return Response.json({
      risk_score: riskScore,
      ai_report: aiReport,
      real_signals: realSignals,
      symbolic_rules: symbolicRules,
      fleet_summary: {
        vehicles_total: vehicles.length,
        vehicles_offline: offlineVehicles.length,
        vehicles_low_fuel: lowFuelVehicles.length,
        routes_active: routes.filter(r => r.status === 'active').length,
        shipments_delayed: delayedShipments.length,
        alerts_critical: criticalAlerts.length,
        maintenance_overdue: maintenanceOverdue.length,
        exceptions_critical: activeExceptions.length,
      }
    });

  } catch (error) {
    console.error('neuroRiskFusion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});