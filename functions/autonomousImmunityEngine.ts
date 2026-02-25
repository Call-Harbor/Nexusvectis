import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════
// FLEET AUTONOMOUS IMMUNITY ENGINE
// Fuldt autonomt immunforsvar — handler uden menneskelig indgriben
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // For scheduled automations there's no user — use service role directly
    let organizationIds = [];
    
    try {
      const user = await base44.auth.me();
      if (user?.organization_id) {
        organizationIds = [user.organization_id];
      }
    } catch {
      // Scheduled run — process all organizations
    }

    // If no specific org, fetch all organizations
    if (organizationIds.length === 0) {
      const orgs = await base44.asServiceRole.entities.Organization.list();
      organizationIds = orgs.map(o => o.id);
    }

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    const now = new Date().toISOString();
    const immunityLog = [];
    let totalActions = 0;

    for (const orgId of organizationIds) {
      const orgActions = await runImmunityProtocol(base44, orgId, mistralApiKey, now, immunityLog);
      totalActions += orgActions;
    }

    return Response.json({
      status: 'immunity_cycle_complete',
      timestamp: now,
      organizations_processed: organizationIds.length,
      total_actions_taken: totalActions,
      immunity_log: immunityLog,
    });

  } catch (error) {
    console.error('Immunity engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function runImmunityProtocol(base44, orgId, mistralApiKey, now, immunityLog) {
  let actionsCount = 0;

  // ── FETCH ALL DATA ──────────────────────────────────────────
  const [vehicles, routes, alerts, maintenance, exceptions, shipments] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Alert.filter({ organization_id: orgId, is_resolved: false }),
    base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Exception.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }),
  ]);

  const log = (action, details, severity = 'info') => {
    const entry = { org_id: orgId, action, details, severity, timestamp: now };
    immunityLog.push(entry);
    console.log(`[IMMUNITY][${severity.toUpperCase()}] ${action}: ${details}`);
  };

  // ══════════════════════════════════════════════════════════════
  // LAYER 1: IMMEDIATE CRITICAL RESPONSE (no AI needed — instant)
  // ══════════════════════════════════════════════════════════════

  // 1A. Offline vehicles → create critical alert + flag maintenance
  const offlineVehicles = vehicles.filter(v => v.status === 'offline');
  for (const v of offlineVehicles) {
    const existing = alerts.find(a => a.vehicle_id === v.id && a.title?.includes('IMMUNITY') && !a.is_resolved);
    if (!existing) {
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[IMMUNITY] Køretøj offline: ${v.name}`,
        message: `Autonomt immunforsvar: ${v.name} er offline og ikke kontaktbar. GPS-signal mistet. Øjeblikkelig undersøgelse påkrævet. Mulig GPS-spoofing, mekanisk svigt eller netværksangreb.`,
        type: 'critical',
        category: 'system',
        vehicle_id: v.id,
        ai_recommendation: 'Kontrollér køretøjets position fysisk. Aktivér backup-kommunikationskanal. Krydsreference med chauffør.',
        is_read: false,
        is_resolved: false,
      });
      log('OFFLINE_VEHICLE_FLAGGED', `${v.name} — kritisk alert oprettet`, 'critical');
      actionsCount++;
    }
  }

  // 1B. Critically low fuel (< 15%) → create urgent alert
  const criticalFuelVehicles = vehicles.filter(v => v.fuel_level < 15 && v.status === 'active');
  for (const v of criticalFuelVehicles) {
    const existing = alerts.find(a => a.vehicle_id === v.id && a.category === 'fuel' && !a.is_resolved);
    if (!existing) {
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[IMMUNITY] Kritisk brændstofniveau: ${v.name}`,
        message: `Autonomt immunforsvar: ${v.name} har ${v.fuel_level}% brændstof — kritisk lavt. Risiko for sammenbrud på aktiv rute.`,
        type: 'critical',
        category: 'fuel',
        vehicle_id: v.id,
        ai_recommendation: `Omdirigér ${v.name} til nærmeste tankstation øjeblikkeligt. Suspendér nye leveringsopgaver.`,
        is_read: false,
        is_resolved: false,
      });
      log('CRITICAL_FUEL_ALERT', `${v.name} — ${v.fuel_level}% brændstof`, 'critical');
      actionsCount++;
    }
  }

  // 1C. Vehicles needing maintenance but still active → flag & set maintenance
  const overdueActive = maintenance.filter(m =>
    m.status === 'pending' && m.priority === 'critical'
  );
  for (const m of overdueActive) {
    const vehicle = vehicles.find(v => v.id === m.vehicle_id);
    if (vehicle && vehicle.status === 'active') {
      await base44.asServiceRole.entities.Vehicle.update(vehicle.id, {
        status: 'maintenance',
      });
      await base44.asServiceRole.entities.Maintenance.update(m.id, {
        status: 'in_progress',
      });
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[IMMUNITY] Køretøj sat til vedligeholdelse: ${vehicle.name}`,
        message: `Autonomt immunforsvar har sat ${vehicle.name} til vedligeholdelsestilstand. Årsag: Kritisk komponent "${m.component}" kræver øjeblikkelig service. Nedetid forebygger katastrofalt svigt.`,
        type: 'warning',
        category: 'maintenance',
        vehicle_id: vehicle.id,
        ai_recommendation: m.description || 'Prioritér service af kritisk komponent.',
        is_read: false,
        is_resolved: false,
      });
      log('VEHICLE_QUARANTINED', `${vehicle.name} → maintenance (${m.component})`, 'high');
      actionsCount++;
    }
  }

  // 1D. Shipments that should be flagged as delayed
  const nowDate = new Date();
  const overdueShipments = shipments.filter(s =>
    s.status === 'in_transit' && s.eta && new Date(s.eta) < nowDate
  );
  for (const s of overdueShipments) {
    await base44.asServiceRole.entities.Shipment.update(s.id, { status: 'delayed' });
    log('SHIPMENT_AUTO_DELAYED', `${s.tracking_number} — ETA overskredet`, 'medium');
    actionsCount++;
  }

  // 1E. Auto-resolve old informational alerts (> 7 days)
  const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleAlerts = alerts.filter(a =>
    a.type === 'info' && !a.is_resolved && new Date(a.created_date) < sevenDaysAgo
  );
  for (const a of staleAlerts) {
    await base44.asServiceRole.entities.Alert.update(a.id, { is_resolved: true });
    log('STALE_ALERT_CLEARED', `Alert "${a.title}" auto-resolved`, 'info');
    actionsCount++;
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 2: AI-DRIVEN DEEP THREAT ANALYSIS (Mistral)
  // ══════════════════════════════════════════════════════════════

  if (!mistralApiKey) {
    log('AI_LAYER_SKIPPED', 'MISTRAL_API_KEY ikke konfigureret', 'warning');
    return actionsCount;
  }

  // Only run AI analysis if there are meaningful threats
  const threatCount = offlineVehicles.length + criticalFuelVehicles.length + 
    overdueActive.length + exceptions.filter(e => e.status !== 'resolved').length;

  if (threatCount > 0) {
    const fleetContext = `
FLEET STATUS for organization ${orgId} at ${now}:
- Vehicles: ${vehicles.length} total | ${offlineVehicles.length} offline | ${criticalFuelVehicles.length} critical fuel
- Routes: ${routes.length} total | ${routes.filter(r => r.status === 'active').length} active
- Shipments: ${shipments.length} total | ${overdueShipments.length} overdue | ${shipments.filter(s => s.status === 'delayed').length} delayed
- Maintenance: ${overdueActive.length} critical pending
- Active exceptions: ${exceptions.filter(e => e.status !== 'resolved').length}
- Unresolved alerts: ${alerts.length}

VEHICLES AT RISK:
${offlineVehicles.map(v => `- OFFLINE: ${v.name} (${v.type}), last known: ${v.latitude},${v.longitude}`).join('\n')}
${criticalFuelVehicles.map(v => `- LOW FUEL: ${v.name} at ${v.fuel_level}%, destination: ${v.destination}`).join('\n')}

ACTIVE EXCEPTIONS:
${exceptions.filter(e => e.status !== 'resolved').slice(0, 5).map(e => `- [${e.severity}] ${e.title}: ${e.description}`).join('\n')}
`;

    try {
      const aiResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralApiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: `You are an autonomous fleet immunity AI. You analyze fleet threats and generate SPECIFIC, ACTIONABLE responses. 
              Output JSON with: 
              - threat_summary: string (1 sentence)
              - cascade_risk: boolean
              - recommended_exceptions: array of {title, type, severity, description, vehicle_id_hint, ai_recommendation}
              - recommended_alerts: array of {title, message, type, category, ai_recommendation}
              - immunity_assessment: string (what the immunity system did and what humans should still do)
              Be very specific about vehicle names and numbers from the data.`
            },
            { role: 'user', content: `Analyze and respond to this fleet threat situation:\n${fleetContext}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiResult = JSON.parse(aiData.choices[0].message.content);

        // Create AI-generated exceptions
        if (aiResult.recommended_exceptions?.length > 0) {
          for (const exc of aiResult.recommended_exceptions.slice(0, 3)) {
            const matchedVehicle = vehicles.find(v =>
              exc.vehicle_id_hint && v.name?.toLowerCase().includes(exc.vehicle_id_hint?.toLowerCase())
            );
            await base44.asServiceRole.entities.Exception.create({
              organization_id: orgId,
              title: `[IMMUNITY-AI] ${exc.title}`,
              description: exc.description,
              type: exc.type || 'route_blocked',
              severity: exc.severity || 'high',
              vehicle_id: matchedVehicle?.id,
              status: 'detected',
              detected_at: now,
              ai_recommendation: exc.ai_recommendation,
              auto_resolved: false,
              impact_score: exc.severity === 'critical' ? 85 : exc.severity === 'high' ? 65 : 40,
            });
            log('AI_EXCEPTION_CREATED', exc.title, exc.severity || 'high');
            actionsCount++;
          }
        }

        // Create AI-generated strategic alerts
        if (aiResult.recommended_alerts?.length > 0) {
          for (const alert of aiResult.recommended_alerts.slice(0, 2)) {
            await base44.asServiceRole.entities.Alert.create({
              organization_id: orgId,
              title: `[IMMUNITY-AI] ${alert.title}`,
              message: alert.message,
              type: alert.type || 'warning',
              category: alert.category || 'system',
              ai_recommendation: alert.ai_recommendation,
              is_read: false,
              is_resolved: false,
            });
            log('AI_STRATEGIC_ALERT', alert.title, alert.type || 'warning');
            actionsCount++;
          }
        }

        if (aiResult.immunity_assessment) {
          log('AI_ASSESSMENT', aiResult.immunity_assessment, 'info');
        }

        if (aiResult.cascade_risk) {
          await base44.asServiceRole.entities.Alert.create({
            organization_id: orgId,
            title: '[IMMUNITY-AI] ⚠️ CASCADE FAILURE RISIKO DETEKTERET',
            message: `Autonomt immunforsvar har detekteret risiko for kaskadesvigt på tværs af flåden. ${aiResult.threat_summary} Øjeblikkelig menneskelig eskalering anbefales.`,
            type: 'critical',
            category: 'system',
            ai_recommendation: 'Eskalér til senioroperatør øjeblikkeligt. Aktiver beredskabsprotokol.',
            is_read: false,
            is_resolved: false,
          });
          log('CASCADE_RISK_ESCALATED', 'Kaskadesvigt-advarsel oprettet', 'critical');
          actionsCount++;
        }
      }
    } catch (aiErr) {
      log('AI_LAYER_ERROR', aiErr.message, 'warning');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 3: IMMUNITY MEMORY — log cycle to SecurityAudit
  // ══════════════════════════════════════════════════════════════
  await base44.asServiceRole.entities.SecurityAudit.create({
    organization_id: orgId,
    action: 'AUTONOMOUS_IMMUNITY_CYCLE',
    user_email: 'immunity-engine@system',
    user_id: 'system',
    resource_type: 'fleet',
    status: 'success',
    severity: threatCount > 5 ? 'high' : threatCount > 0 ? 'medium' : 'low',
    details: `Immunity cycle completed. Threats detected: ${threatCount}. Actions taken: ${actionsCount}. Vehicles processed: ${vehicles.length}.`,
  });

  return actionsCount;
}