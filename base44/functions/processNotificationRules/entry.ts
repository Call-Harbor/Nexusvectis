import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * Processes entity changes against NotificationRules and creates Notification records + sends emails.
 * Called from entity automations OR from frontend when an entity is saved.
 *
 * Payload:
 *   entity_type: string   (e.g. "Vehicle", "Shipment")
 *   entity_data: object   (current state of the entity)
 *   old_data:    object   (previous state, optional)
 *   event_type:  string   (create | update | status_change | threshold)
 */

const PAGE_ROUTES = {
  Vehicle: "/Fleet",
  Shipment: "/Shipments",
  Route: "/Routes",
  Maintenance: "/MaintenanceManagement",
  Alert: "/Alerts",
  Exception: "/Alerts",
};

function evaluateCondition(cond, entityData, oldData) {
  const val = entityData[cond.field];
  const condValue = cond.value;

  switch (cond.operator) {
    case "equals":
      return String(val) === String(condValue);
    case "not_equals":
      return String(val) !== String(condValue);
    case "contains":
      return val && String(val).toLowerCase().includes(String(condValue).toLowerCase());
    case "less_than":
      return Number(val) < Number(condValue);
    case "greater_than":
      return Number(val) > Number(condValue);
    case "changes_to":
      return oldData && String(oldData[cond.field]) !== String(val) && String(val) === String(condValue);
    default:
      return false;
  }
}

function buildMessage(template, entityData) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = entityData[key];
    return val !== undefined ? String(val) : `(${key})`;
  });
}

function buildEntityDetails(entityType, entityData) {
  const fieldMap = {
    Vehicle: ["name", "type", "status", "speed", "fuel_level", "destination", "driver"],
    Shipment: ["tracking_number", "origin", "destination", "status", "customer_name", "priority", "cargo_type"],
    Route: ["name", "origin", "destination", "status", "transport_type", "priority"],
    Maintenance: ["component", "description", "priority", "status", "scheduled_date", "cost_estimate"],
    Alert: ["title", "type", "category", "message"],
    Exception: ["title", "type", "severity", "status", "estimated_delay_minutes"],
  };

  const fields = fieldMap[entityType] || [];
  const details = {};
  fields.forEach(f => {
    if (entityData[f] !== undefined && entityData[f] !== null && entityData[f] !== "") {
      details[f] = entityData[f];
    }
  });
  return details;
}

function isInCooldown(rule, now) {
  if (!rule.last_triggered || !rule.cooldown_minutes) return false;
  const lastMs = new Date(rule.last_triggered).getTime();
  return (now - lastMs) < (rule.cooldown_minutes * 60 * 1000);
}

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated user calls and service-role calls from automations
    let orgId;
    try {
      const user = await base44.auth.me();
      orgId = user.organization_id || user.data?.organization_id;
    } catch (_) {
      // Automation context — use service role
    }

    const body = await req.json();
    const { entity_type, entity_data, old_data, event_type } = body;

    if (!entity_type || !entity_data) {
      return nvError(requestId, String("entity_type and entity_data are required"), 400);

    }

    const effectiveOrgId = orgId || entity_data.organization_id;
    if (!effectiveOrgId) {
      return nvError(requestId, String("Cannot determine organization_id"), 400);

    }

    // Fetch all active rules for this org + entity_type
    const rules = await base44.asServiceRole.entities.NotificationRule.filter({
      organization_id: effectiveOrgId,
      entity_type,
      is_active: true,
    });

    const now = Date.now();
    const results = [];

    for (const rule of rules) {
      // Cooldown check
      if (isInCooldown(rule, now)) continue;

      // Event type check (loose matching: if rule is status_change, check if status field changed)
      const ruleEventType = rule.event_type;
      let eventMatches = false;
      if (ruleEventType === event_type) {
        eventMatches = true;
      } else if (ruleEventType === "status_change" && old_data && old_data.status !== entity_data.status) {
        eventMatches = true;
      } else if (ruleEventType === "threshold") {
        eventMatches = true; // threshold rules rely on conditions
      } else if (ruleEventType === "update" && (event_type === "update" || event_type === "status_change")) {
        eventMatches = true;
      }

      if (!eventMatches) continue;

      // Evaluate all conditions (AND logic)
      const conditions = rule.conditions || [];
      const allMatch = conditions.length === 0 || conditions.every(c => evaluateCondition(c, entity_data, old_data));
      if (!allMatch) continue;

      // Build notification content
      const defaultTemplates = {
        Vehicle: "Køretøj {{name}} ({{type}}): Status {{status}} — Hastighed: {{speed}} km/h, Brændstof: {{fuel_level}}%. Destination: {{destination}}",
        Shipment: "Forsendelse {{tracking_number}} fra {{origin}} til {{destination}}: {{status}}. Kunde: {{customer_name}}",
        Route: "Rute {{name}} ({{origin}} → {{destination}}): {{status}}",
        Maintenance: "Vedligehold på {{component}}: {{description}} — Prioritet: {{priority}}, Status: {{status}}",
        Alert: "Alert: {{title}} — {{message}}",
        Exception: "Undtagelse: {{title}} — Alvorlighed: {{severity}}, Status: {{status}}",
      };

      const template = rule.message_template || defaultTemplates[entity_type] || "{{entity_type}} hændelse";
      const title = rule.name;
      const message = buildMessage(template, { ...entity_data, entity_type });
      const entityDetails = buildEntityDetails(entity_type, entity_data);
      const actionUrl = PAGE_ROUTES[entity_type] || "/";
      const entityName = entity_data.name || entity_data.tracking_number || entity_data.title || entity_data.id;
      const channelsSent = [];

      // Create in-app notification
      if (rule.channels?.in_app !== false) {
        await base44.asServiceRole.entities.Notification.create({
          organization_id: effectiveOrgId,
          user_email: rule.user_email,
          rule_id: rule.id,
          title,
          message,
          severity: rule.severity || "info",
          entity_type,
          entity_id: entity_data.id,
          entity_name: entityName,
          entity_details: entityDetails,
          is_read: false,
          channels_sent: [],
          action_url: actionUrl,
        });
        channelsSent.push("in_app");
      }

      // Send email
      if (rule.channels?.email && rule.channels?.email_address) {
        const emailBody = `
<div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px; max-width: 600px;">
  <div style="border-left: 4px solid #06b6d4; padding-left: 16px; margin-bottom: 24px;">
    <h2 style="color: #fff; margin: 0 0 4px;">${title}</h2>
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">NexusVectis Fleet Intelligence</p>
  </div>
  <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">${message}</p>
  ${Object.keys(entityDetails).length > 0 ? `
  <div style="margin-top: 20px; background: #1e293b; border-radius: 8px; padding: 16px;">
    <p style="color: #64748b; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Detaljer</p>
    ${Object.entries(entityDetails).map(([k, v]) => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #64748b; font-size: 13px;">${k}</span>
        <span style="color: #e2e8f0; font-size: 13px; font-weight: 500;">${v}</span>
      </div>
    `).join("")}
  </div>` : ""}
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; color: #475569; font-size: 12px;">
    Sendt via NexusVectis · Notifikationsregel: "${rule.name}"
  </div>
</div>
        `.trim();

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: rule.channels.email_address,
          from_name: "NexusVectis Alerts",
          subject: `[${(rule.severity || "info").toUpperCase()}] ${title}`,
          body: emailBody,
        });
        channelsSent.push("email");
      }

      // Update rule stats
      await base44.asServiceRole.entities.NotificationRule.update(rule.id, {
        last_triggered: new Date().toISOString(),
        trigger_count: (rule.trigger_count || 0) + 1,
      });

      results.push({ rule_id: rule.id, rule_name: rule.name, channels: channelsSent });
    }

    return nvJson(requestId, { processed: results.length, notifications: results });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});