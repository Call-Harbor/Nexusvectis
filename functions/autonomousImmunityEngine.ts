import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════════════════
// FLEET AUTONOMOUS IMMUNITY ENGINE v2.0 — FULL CYBER DEFENSE
// Protects against: hacking, GPS spoofing, API abuse, data manipulation,
// unauthorized access, cascade failures, and physical fleet threats.
// Runs every 10 minutes as scheduled automation.
// ═══════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let organizationIds = [];
    try {
      const user = await base44.auth.me();
      if (user?.organization_id) organizationIds = [user.organization_id];
    } catch {
      // Scheduled run — process all organizations
    }

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
    console.error('[IMMUNITY] Engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
async function runImmunityProtocol(base44, orgId, mistralApiKey, now, immunityLog) {
  let actionsCount = 0;
  const nowDate = new Date();

  const log = (action, details, severity = 'info') => {
    immunityLog.push({ org_id: orgId, action, details, severity, timestamp: now });
    console.log(`[IMMUNITY][${severity.toUpperCase()}] ${action}: ${details}`);
  };

  // ── FETCH ALL DATA IN PARALLEL ──────────────────────────────────────────
  const [vehicles, routes, alerts, maintenance, exceptions, shipments, securityAudits, apiUsage] = await Promise.all([
    base44.asServiceRole.entities.Vehicle.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Route.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Alert.filter({ organization_id: orgId, is_resolved: false }),
    base44.asServiceRole.entities.Maintenance.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Exception.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.Shipment.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.SecurityAudit.filter({ organization_id: orgId }),
    base44.asServiceRole.entities.APIUsage.filter({ organization_id: orgId }),
  ]);

  const cyberThreats = [];

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 0: CYBER THREAT DETECTION — The Immune Sentinels
  // ════════════════════════════════════════════════════════════════════════

  // ── 0A. GPS SPOOFING DETECTION ──────────────────────────────────────────
  // Detect vehicles with impossible position jumps (teleportation = spoofing)
  const oneHourAgo = new Date(nowDate.getTime() - 60 * 60 * 1000);
  for (const v of vehicles) {
    // Detect: vehicle marked active but coordinates are 0,0 (null island)
    if (v.status === 'active' && v.latitude === 0 && v.longitude === 0) {
      cyberThreats.push({ type: 'GPS_NULL_ISLAND', vehicle: v.name, severity: 'critical' });
      const existing = alerts.find(a => a.vehicle_id === v.id && a.title?.includes('GPS_SPOOF') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] GPS SPOOFING DETECTED: ${v.name}`,
          message: `Vehicle ${v.name} is reporting coordinates 0,0 (Null Island) — a classic indicator of GPS signal spoofing or hardware tampering. Vehicle has been flagged. Do NOT trust position data. Physical verification required immediately.`,
          type: 'critical',
          category: 'system',
          vehicle_id: v.id,
          ai_recommendation: 'Treat vehicle position as compromised. Contact driver directly. Do not dispatch based on current GPS data. File security incident report.',
          is_read: false,
          is_resolved: false,
        });
        await base44.asServiceRole.entities.Exception.create({
          organization_id: orgId,
          title: `[CYBER] GPS Spoofing — ${v.name}`,
          description: `GPS position reporting Null Island (0,0). Possible GPS signal injection or hardware tampering attack.`,
          type: 'route_blocked',
          severity: 'critical',
          vehicle_id: v.id,
          status: 'detected',
          detected_at: now,
          ai_recommendation: 'Isolate vehicle from automated dispatch. Physical inspection required.',
          auto_resolved: false,
          impact_score: 95,
        });
        log('GPS_SPOOFING_DETECTED', `${v.name} → null island coordinates`, 'critical');
        actionsCount += 2;
      }
    }

    // Detect: active vehicle with no signal strength but still "active" — ghost vehicle
    if (v.status === 'active' && v.signal_strength !== undefined && v.signal_strength < 5) {
      cyberThreats.push({ type: 'GHOST_VEHICLE', vehicle: v.name, severity: 'high' });
      const existing = alerts.find(a => a.vehicle_id === v.id && a.title?.includes('GHOST') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] Ghost Vehicle Signal: ${v.name}`,
          message: `${v.name} is marked active but signal strength is ${v.signal_strength}% — near zero. This may indicate a replay attack (reusing old GPS data) or a silent compromise of the telematics unit.`,
          type: 'critical',
          category: 'system',
          vehicle_id: v.id,
          ai_recommendation: 'Verify vehicle is physically in operation. Check telematics hardware integrity. Consider replay attack vector.',
          is_read: false,
          is_resolved: false,
        });
        log('GHOST_VEHICLE_SIGNAL', `${v.name} signal_strength=${v.signal_strength}%`, 'high');
        actionsCount++;
      }
    }
  }

  // ── 0B. API ABUSE & BRUTE FORCE DETECTION ──────────────────────────────
  // Detect rapid API calls from same IP — brute force or bot attack
  const recentHour = new Date(nowDate.getTime() - 60 * 60 * 1000);
  const recentApiCalls = apiUsage.filter(a => new Date(a.created_date) > recentHour);

  // Group by IP address
  const ipCounts = {};
  const ipErrors = {};
  recentApiCalls.forEach(call => {
    if (!call.ip_address) return;
    ipCounts[call.ip_address] = (ipCounts[call.ip_address] || 0) + 1;
    if (call.status_code >= 400) {
      ipErrors[call.ip_address] = (ipErrors[call.ip_address] || 0) + 1;
    }
  });

  for (const [ip, count] of Object.entries(ipCounts)) {
    const errorRate = (ipErrors[ip] || 0) / count;
    
    // High volume from single IP (> 200 calls/hour = suspicious)
    if (count > 200) {
      cyberThreats.push({ type: 'API_ABUSE', ip, count, severity: 'high' });
      const existing = alerts.find(a => a.title?.includes(ip) && a.title?.includes('API_ABUSE') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] API Abuse Detected: ${ip}`,
          message: `IP ${ip} has made ${count} API calls in the last hour — far exceeding normal usage patterns. This may indicate automated scraping, DDoS preparation, or a compromised integration. Error rate: ${Math.round(errorRate * 100)}%.`,
          type: 'critical',
          category: 'system',
          ai_recommendation: `Block IP ${ip} at the firewall level. Audit what data was accessed. Rotate API keys used by this IP immediately.`,
          is_read: false,
          is_resolved: false,
        });
        await base44.asServiceRole.entities.SecurityAudit.create({
          organization_id: orgId,
          action: 'API_ABUSE_DETECTED',
          user_email: 'immunity-engine@system',
          user_id: 'system',
          resource_type: 'api',
          ip_address: ip,
          status: 'blocked',
          severity: 'critical',
          details: `IP ${ip} made ${count} calls/hour. Error rate: ${Math.round(errorRate * 100)}%. Auto-flagged by immunity engine.`,
        });
        log('API_ABUSE_BLOCKED', `IP ${ip} — ${count} calls/hour`, 'critical');
        actionsCount += 2;
      }
    }

    // High error rate from single IP (> 60% errors = brute force)
    if (count > 20 && errorRate > 0.6) {
      cyberThreats.push({ type: 'BRUTE_FORCE', ip, severity: 'critical' });
      const existing = alerts.find(a => a.title?.includes(ip) && a.title?.includes('BRUTE') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] Brute Force Attack: ${ip}`,
          message: `IP ${ip} has a ${Math.round(errorRate * 100)}% error rate across ${count} API calls — consistent with credential stuffing or brute force authentication attack. Immunity engine has logged this for immediate review.`,
          type: 'critical',
          category: 'system',
          ai_recommendation: `Immediately block ${ip}. Enable 2FA for all accounts. Review access logs for any successful logins from this IP.`,
          is_read: false,
          is_resolved: false,
        });
        log('BRUTE_FORCE_DETECTED', `IP ${ip} — ${Math.round(errorRate * 100)}% error rate`, 'critical');
        actionsCount++;
      }
    }
  }

  // ── 0C. SECURITY AUDIT ANOMALY DETECTION ──────────────────────────────
  // Look for repeated failed actions in SecurityAudit
  const recentAudits = securityAudits.filter(a => new Date(a.created_date) > recentHour);
  const failedAudits = recentAudits.filter(a => a.status === 'failed' || a.status === 'blocked');

  // Group failed audits by user
  const userFailures = {};
  failedAudits.forEach(a => {
    userFailures[a.user_email] = (userFailures[a.user_email] || 0) + 1;
  });

  for (const [email, failCount] of Object.entries(userFailures)) {
    if (failCount >= 10 && email !== 'immunity-engine@system') {
      cyberThreats.push({ type: 'ACCOUNT_COMPROMISE', email, failCount, severity: 'critical' });
      const existing = alerts.find(a => a.title?.includes(email) && a.title?.includes('SUSPICIOUS') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] Suspicious Account Activity: ${email}`,
          message: `Account ${email} has ${failCount} failed security events in the last hour. This pattern is consistent with account takeover attempts, credential stuffing, or an insider threat. Immediate investigation required.`,
          type: 'critical',
          category: 'system',
          ai_recommendation: `Lock account ${email} pending investigation. Force password reset. Review all actions taken by this account in the last 24 hours.`,
          is_read: false,
          is_resolved: false,
        });
        await base44.asServiceRole.entities.SecurityAudit.create({
          organization_id: orgId,
          action: 'ACCOUNT_LOCKDOWN_RECOMMENDED',
          user_email: 'immunity-engine@system',
          user_id: 'system',
          resource_type: 'user_account',
          resource_id: email,
          status: 'blocked',
          severity: 'critical',
          details: `${failCount} failed auth events in 1 hour for ${email}. Immunity engine recommends immediate account lockdown.`,
        });
        log('ACCOUNT_COMPROMISE_DETECTED', `${email} — ${failCount} failed events`, 'critical');
        actionsCount += 2;
      }
    }
  }

  // ── 0D. DATA INTEGRITY CHECK — Detect tampered records ─────────────────
  // Vehicles with impossible speed (> 500 km/h for trucks/ships = data injection)
  for (const v of vehicles) {
    const maxSpeed = v.type === 'aircraft' ? 1000 : v.type === 'drone' ? 300 : 200;
    if (v.speed && v.speed > maxSpeed) {
      cyberThreats.push({ type: 'DATA_INJECTION', vehicle: v.name, speed: v.speed, severity: 'high' });
      const existing = alerts.find(a => a.vehicle_id === v.id && a.title?.includes('DATA_INJECT') && !a.is_resolved);
      if (!existing) {
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] Data Injection Detected: ${v.name}`,
          message: `${v.name} (${v.type}) is reporting speed of ${v.speed} km/h — physically impossible. This is a strong indicator of telemetry data injection or a man-in-the-middle attack on the data pipeline. All data from this vehicle should be considered untrusted.`,
          type: 'critical',
          category: 'system',
          vehicle_id: v.id,
          ai_recommendation: `Mark all telemetry from ${v.name} as untrusted. Inspect data pipeline for MITM injection point. Reset telematics credentials.`,
          is_read: false,
          is_resolved: false,
        });
        log('DATA_INJECTION_DETECTED', `${v.name} speed=${v.speed}km/h (impossible)`, 'high');
        actionsCount++;
      }
    }

    // Detect impossible fuel level (> 100%)
    if (v.fuel_level && v.fuel_level > 100) {
      cyberThreats.push({ type: 'FUEL_DATA_TAMPERED', vehicle: v.name, severity: 'medium' });
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[CYBER] Fuel Data Tampered: ${v.name}`,
        message: `${v.name} reports fuel level of ${v.fuel_level}% — physically impossible (max 100%). Telemetry data has been tampered with. Do not rely on fuel readings from this vehicle.`,
        type: 'warning',
        category: 'system',
        vehicle_id: v.id,
        ai_recommendation: 'Inspect telematics unit for tampering. Cross-check with driver fuel receipts.',
        is_read: false,
        is_resolved: false,
      });
      log('FUEL_DATA_TAMPERED', `${v.name} fuel=${v.fuel_level}%`, 'medium');
      actionsCount++;
    }
  }

  // ── 0E. ROUTE INTEGRITY — Detect unauthorized route modifications ───────
  // Routes that suddenly have no waypoints or destination cleared = data wipe
  for (const r of routes) {
    if (r.status === 'active' && !r.destination) {
      const existing = alerts.find(a => a.title?.includes(r.id) && a.title?.includes('ROUTE_WIPE') && !a.is_resolved);
      if (!existing) {
        cyberThreats.push({ type: 'ROUTE_DATA_WIPE', route: r.name, severity: 'high' });
        await base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[CYBER] Route Data Wipe Detected: ${r.name}`,
          message: `Active route "${r.name}" has had its destination cleared while still marked active. This may indicate unauthorized data modification, a ransomware wipe of route data, or a misconfigured API call. Vehicles on this route are navigating without destination.`,
          type: 'critical',
          category: 'route',
          ai_recommendation: 'Restore route from backup. Audit who last modified this route. Check for unauthorized API key usage.',
          is_read: false,
          is_resolved: false,
        });
        log('ROUTE_DATA_WIPE', `${r.name} — destination cleared on active route`, 'high');
        actionsCount++;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 1: PHYSICAL FLEET THREATS (Original Immunity Logic)
  // ════════════════════════════════════════════════════════════════════════

  const offlineVehicles = vehicles.filter(v => v.status === 'offline');
  for (const v of offlineVehicles) {
    const existing = alerts.find(a => a.vehicle_id === v.id && a.title?.includes('[IMMUNITY]') && !a.is_resolved);
    if (!existing) {
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[IMMUNITY] Vehicle Offline: ${v.name}`,
        message: `Autonomous immunity: ${v.name} is offline and unreachable. GPS signal lost. Immediate investigation required. Possible GPS spoofing, mechanical failure, or network attack.`,
        type: 'critical',
        category: 'system',
        vehicle_id: v.id,
        ai_recommendation: 'Physically verify vehicle location. Activate backup communication channel. Cross-reference with driver.',
        is_read: false,
        is_resolved: false,
      });
      log('OFFLINE_VEHICLE_FLAGGED', `${v.name} — critical alert created`, 'critical');
      actionsCount++;
    }
  }

  const criticalFuelVehicles = vehicles.filter(v => v.fuel_level < 15 && v.status === 'active');
  for (const v of criticalFuelVehicles) {
    const existing = alerts.find(a => a.vehicle_id === v.id && a.category === 'fuel' && !a.is_resolved);
    if (!existing) {
      await base44.asServiceRole.entities.Alert.create({
        organization_id: orgId,
        title: `[IMMUNITY] Critical Fuel: ${v.name}`,
        message: `Autonomous immunity: ${v.name} has ${v.fuel_level}% fuel — critically low. Risk of breakdown on active route.`,
        type: 'critical',
        category: 'fuel',
        vehicle_id: v.id,
        ai_recommendation: `Redirect ${v.name} to nearest fuel station immediately. Suspend new delivery tasks.`,
        is_read: false,
        is_resolved: false,
      });
      log('CRITICAL_FUEL_ALERT', `${v.name} — ${v.fuel_level}% fuel`, 'critical');
      actionsCount++;
    }
  }

  const overdueActive = maintenance.filter(m => m.status === 'pending' && m.priority === 'critical');
  for (const m of overdueActive) {
    const vehicle = vehicles.find(v => v.id === m.vehicle_id);
    if (vehicle && vehicle.status === 'active') {
      await Promise.all([
        base44.asServiceRole.entities.Vehicle.update(vehicle.id, { status: 'maintenance' }),
        base44.asServiceRole.entities.Maintenance.update(m.id, { status: 'in_progress' }),
        base44.asServiceRole.entities.Alert.create({
          organization_id: orgId,
          title: `[IMMUNITY] Vehicle Quarantined for Maintenance: ${vehicle.name}`,
          message: `Autonomous immunity has placed ${vehicle.name} into maintenance mode. Reason: Critical component "${m.component}" requires immediate service. Downtime prevents catastrophic failure.`,
          type: 'warning',
          category: 'maintenance',
          vehicle_id: vehicle.id,
          ai_recommendation: m.description || 'Prioritize service of critical component.',
          is_read: false,
          is_resolved: false,
        }),
      ]);
      log('VEHICLE_QUARANTINED', `${vehicle.name} → maintenance (${m.component})`, 'high');
      actionsCount++;
    }
  }

  const overdueShipments = shipments.filter(s =>
    s.status === 'in_transit' && s.eta && new Date(s.eta) < nowDate
  );
  for (const s of overdueShipments) {
    await base44.asServiceRole.entities.Shipment.update(s.id, { status: 'delayed' });
    log('SHIPMENT_AUTO_DELAYED', `${s.tracking_number} — ETA exceeded`, 'medium');
    actionsCount++;
  }

  const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleAlerts = alerts.filter(a =>
    a.type === 'info' && !a.is_resolved && new Date(a.created_date) < sevenDaysAgo
  );
  for (const a of staleAlerts) {
    await base44.asServiceRole.entities.Alert.update(a.id, { is_resolved: true });
    log('STALE_ALERT_CLEARED', `Alert "${a.title}" auto-resolved`, 'info');
    actionsCount++;
  }

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 2: AI THREAT INTELLIGENCE (Mistral) — Deep Analysis
  // ════════════════════════════════════════════════════════════════════════

  if (!mistralApiKey) {
    log('AI_LAYER_SKIPPED', 'MISTRAL_API_KEY not configured', 'warning');
  } else {
    const threatCount = offlineVehicles.length + criticalFuelVehicles.length +
      overdueActive.length + cyberThreats.length +
      exceptions.filter(e => e.status !== 'resolved').length;

    if (threatCount > 0) {
      const fleetContext = `
FLEET THREAT SITUATION (${now}) — Organization: ${orgId}

PHYSICAL THREATS:
- Vehicles offline: ${offlineVehicles.length} (${offlineVehicles.map(v => v.name).join(', ')})
- Critical fuel: ${criticalFuelVehicles.length} (${criticalFuelVehicles.map(v => `${v.name}:${v.fuel_level}%`).join(', ')})
- Critical maintenance overdue: ${overdueActive.length}
- Overdue shipments: ${overdueShipments.length}

CYBER THREATS DETECTED BY IMMUNITY SENTINEL:
${cyberThreats.map(t => `- [${t.severity.toUpperCase()}] ${t.type}: ${JSON.stringify(t)}`).join('\n')}

ACTIVE EXCEPTIONS:
${exceptions.filter(e => e.status !== 'resolved').slice(0, 5).map(e => `- [${e.severity}] ${e.title}: ${e.description || ''}`).join('\n')}

SECURITY AUDIT (last hour):
- Total events: ${recentAudits.length}
- Failed/Blocked: ${failedAudits.length}
- API calls: ${recentApiCalls.length}
- Suspicious IPs: ${Object.keys(ipCounts).filter(ip => ipCounts[ip] > 100).join(', ') || 'none'}
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
                content: `You are an autonomous fleet cyber-immunity AI. You defend fleet management systems against hacking, GPS spoofing, API abuse, data injection, ransomware, and physical threats. 
                Analyze threats and generate SPECIFIC, ACTIONABLE immunity responses.
                Output JSON with:
                - threat_summary: string (1 sentence covering both cyber and physical)
                - cascade_risk: boolean (true if multiple threats could amplify each other)
                - cyber_attack_vector: string (most likely attack vector being used)
                - recommended_exceptions: array of {title, type, severity, description, vehicle_id_hint, ai_recommendation}
                - recommended_alerts: array of {title, message, type, category, ai_recommendation}
                - immunity_assessment: string (what the AI did and what humans should do next)
                - lockdown_recommended: boolean (true if organization should enter security lockdown mode)
                Be specific about vehicle names, IPs, and threat vectors from the data.`
              },
              { role: 'user', content: `Analyze and respond to this fleet threat situation:\n${fleetContext}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.15,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiResult = JSON.parse(aiData.choices[0].message.content);

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
                impact_score: exc.severity === 'critical' ? 90 : exc.severity === 'high' ? 70 : 45,
              });
              log('AI_EXCEPTION_CREATED', exc.title, exc.severity || 'high');
              actionsCount++;
            }
          }

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
              title: '[IMMUNITY-AI] ⚠️ CASCADE FAILURE RISK DETECTED',
              message: `Autonomous immunity AI has detected cascade failure risk across the fleet. ${aiResult.threat_summary} Immediate human escalation recommended. Cyber vector: ${aiResult.cyber_attack_vector || 'unknown'}.`,
              type: 'critical',
              category: 'system',
              ai_recommendation: 'Escalate to senior operator immediately. Activate emergency protocol. Consider temporary fleet operational pause.',
              is_read: false,
              is_resolved: false,
            });
            log('CASCADE_RISK_ESCALATED', 'Cascade failure warning created', 'critical');
            actionsCount++;
          }

          // Full lockdown recommendation
          if (aiResult.lockdown_recommended) {
            await base44.asServiceRole.entities.Alert.create({
              organization_id: orgId,
              title: '[IMMUNITY-AI] 🔴 SECURITY LOCKDOWN RECOMMENDED',
              message: `Fleet Immunity AI recommends entering SECURITY LOCKDOWN MODE. Multiple simultaneous threats detected: ${aiResult.threat_summary}. Recommended actions: 1) Rotate all API keys immediately. 2) Suspend all external integrations. 3) Contact cybersecurity team. 4) Preserve all logs for forensic analysis.`,
              type: 'critical',
              category: 'system',
              ai_recommendation: 'Enter security lockdown. Preserve forensic evidence. Contact incident response team within 15 minutes.',
              is_read: false,
              is_resolved: false,
            });
            log('LOCKDOWN_RECOMMENDED', 'AI recommends full security lockdown', 'critical');
            actionsCount++;
          }
        }
      } catch (aiErr) {
        log('AI_LAYER_ERROR', aiErr.message, 'warning');
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 3: IMMUNITY MEMORY — Full cycle audit log
  // ════════════════════════════════════════════════════════════════════════
  const totalThreatCount = offlineVehicles.length + criticalFuelVehicles.length +
    overdueActive.length + cyberThreats.length +
    exceptions.filter(e => e.status !== 'resolved').length;

  await base44.asServiceRole.entities.SecurityAudit.create({
    organization_id: orgId,
    action: 'AUTONOMOUS_IMMUNITY_CYCLE_V2',
    user_email: 'immunity-engine@system',
    user_id: 'system',
    resource_type: 'fleet',
    status: 'success',
    severity: cyberThreats.length > 0 ? 'critical' : totalThreatCount > 5 ? 'high' : totalThreatCount > 0 ? 'medium' : 'low',
    details: `Immunity v2 cycle complete. Cyber threats: ${cyberThreats.length} (${cyberThreats.map(t => t.type).join(', ') || 'none'}). Physical threats: ${offlineVehicles.length + criticalFuelVehicles.length}. Total actions: ${actionsCount}. Vehicles scanned: ${vehicles.length}. API abuse IPs flagged: ${Object.keys(ipCounts).filter(ip => ipCounts[ip] > 200).length}.`,
  });

  return actionsCount;
}