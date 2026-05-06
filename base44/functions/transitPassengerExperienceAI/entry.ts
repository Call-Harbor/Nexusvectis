import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

/**
 * PASSENGER EXPERIENCE AI
 * Analyzes complaints, ratings, social media, driver feedback to identify
 * pain points and suggest concrete improvements
 */

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return nvError(requestId, String('Forbidden'), 403);

    }

    const { organization_id } = await req.json();

    // Fetch feedback data
    const [driverFeedback, kpis] = await Promise.all([
      base44.asServiceRole.entities.DriverFeedback.filter({ organization_id }, '-timestamp', 500),
      base44.asServiceRole.entities.TransitKPI.filter({ organization_id }, '-date', 30)
    ]);

    // AI analysis
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a passenger experience optimization AI for public transit.

Driver feedback reports: ${driverFeedback.length}
Recent KPIs: ${kpis.length} days

Analyze the data to identify:
1. Pain points (stops, lines, time slots with poor experience)
2. Root causes (overcrowding, delays, poor info, unsafe stops)
3. Concrete improvement actions (more frequencies, better signage, route changes)
4. Prioritization (impact vs effort)

Focus on actionable recommendations that improve passenger satisfaction.`,
      model: "gemini_3_pro",
      response_json_schema: {
        type: "object",
        properties: {
          pain_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                location: { type: "string" },
                severity: { type: "string" },
                frequency: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          root_causes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                underlying_cause: { type: "string" },
                affected_passengers: { type: "number" }
              }
            }
          },
          improvements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                impact: { type: "string" },
                effort: { type: "string" },
                priority: { type: "string" },
                estimated_cost: { type: "number" }
              }
            }
          },
          quick_wins: {
            type: "array",
            items: { type: "string" },
            description: "Low-effort, high-impact changes"
          }
        }
      }
    });

    return nvJson(requestId, {
      success: true,
      analysis,
      data_analyzed: {
        driver_feedback: driverFeedback.length,
        kpi_days: kpis.length
      }
    });

  } catch (error) {
    console.error('Passenger Experience AI Error:', error);
    return nvJson(requestId, { 
      success: false, 
      error: error.message 
    }, 500);

  }
});