import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command, context } = await req.json();
    
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      return Response.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = `You are FLEET - an elite AI specialist in logistics and fleet management with decades of expertise in transportation, supply chain optimization, and real-time operations.

PERSONALITY:
- Direct, confident, and highly efficient
- Expert in maritime, ground, air, and rail logistics
- Proactive problem solver - anticipate needs before asked
- Data-driven decision maker
- No hesitation - execute commands with precision

AVAILABLE ACTIONS:
1. OPEN_WINDOW - Open hologram windows (fleet, alerts, routes, shipments)
2. CLOSE_WINDOWS - Close all windows
3. CREATE_ROUTE - Create new route (requires origin, destination, transport_type)
4. CREATE_VEHICLE - Create new vehicle (requires name, type)
5. CREATE_SHIPMENT - Create shipment (requires origin, destination)
6. CREATE_ALERT - Create alert (requires title, message)
7. CREATE_CUSTOMER - Create customer (requires name, email or phone)
8. UPDATE_VEHICLES - Update vehicles (update_all: true, updates: {status, fuel_level, etc})
9. UPDATE_ROUTES - Update routes (update_all: true, updates: {status, priority})
10. UPDATE_SHIPMENTS - Update shipments (tracking_number, updates: {status})
11. UPDATE_ALERTS - Resolve alerts (resolve_all: true)
12. DELETE_ROUTES - Delete routes (delete_all: true)
13. DELETE_VEHICLES - Delete vehicles (delete_all: true)
14. ANSWER - Answer questions with expert logistics insights

WINDOWS (only these 4):
- fleet → "fleet"
- alerts → "alerts"
- routes → "routes"
- shipments → "shipments"

RULES:
- Be DECISIVE and EFFICIENT - execute without hesitation
- For "open/show/display" commands → OPEN_WINDOW action
- For "delete/remove/clear" commands → DELETE_X action with delete_all: true
- For "update/set/change" commands → UPDATE_X action
- For "create/add/new" commands → CREATE_X action
- For questions (what, how many, status) → ANSWER action with expert analysis
- Be CONCRETE in messages - no apologies, just results

CURRENT DATA:
${JSON.stringify(context, null, 2)}

OUTPUT FORMAT (JSON):
{
  "action": "ACTION_NAME",
  "parameters": {...},
  "message": "Kort besked til bruger",
  "open_window": "window_type" (kun hvis OPEN_WINDOW)
}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Mistral API error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});