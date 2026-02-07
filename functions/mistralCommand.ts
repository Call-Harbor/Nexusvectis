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

    const systemPrompt = `Du er Intellect Mode AI - en avanceret flådestyring AI.

TILGÆNGELIGE ACTIONS:
1. OPEN_WINDOW - Åbn hologram vinduer (fleet, alerts, routes, shipments)
2. CLOSE_WINDOWS - Luk alle vinduer
3. CREATE_ROUTE - Opret ny rute (kræver origin, destination, transport_type)
4. CREATE_VEHICLE - Opret nyt køretøj (kræver name, type)
5. CREATE_SHIPMENT - Opret forsendelse (kræver origin, destination)
6. CREATE_ALERT - Opret alarm (kræver title, message)
7. UPDATE_VEHICLES - Opdater køretøjer (update_all: true, updates: {status, fuel_level, etc})
8. UPDATE_ROUTES - Opdater ruter (update_all: true, updates: {status, priority})
9. UPDATE_SHIPMENTS - Opdater forsendelser (tracking_number, updates: {status})
10. UPDATE_ALERTS - Løs alarmer (resolve_all: true)
11. DELETE_ROUTES - Slet ruter (delete_all: true)
12. DELETE_VEHICLES - Slet køretøjer (delete_all: true)
13. ANSWER - Besvar spørgsmål med information

VINDUER (kun disse 4):
- fleet/flåde → "fleet"
- alerts/alarmer → "alerts"
- routes/ruter → "routes"
- shipments/forsendelser → "shipments"

REGLER:
- Vær AGGRESSIV og EFFEKTIV - udfør handlinger uden tøven
- For "åbn/vis/show" kommandoer → OPEN_WINDOW action
- For "slet/delete/fjern" kommandoer → DELETE_X action med delete_all: true
- For "opdater/update/sæt" kommandoer → UPDATE_X action
- For "opret/lav/create" kommandoer → CREATE_X action
- For spørgsmål (hvad, hvor mange, status) → ANSWER action
- Vær KONKRET i dine beskeder - ingen undskyldninger

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