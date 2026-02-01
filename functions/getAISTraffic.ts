import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch live AIS data using AI with internet context
        const aisData = await base44.integrations.Core.InvokeLLM({
            prompt: `Get the current real-time AIS maritime traffic data from global shipping routes. Return JSON array of currently active ships with this exact structure for each vessel:
{
  "id": "ais_MMSI",
  "mmsi": "Maritime Mobile Service Identity",
  "name": "Vessel name",
  "type": "ship",
  "latitude": number,
  "longitude": number,
  "speed": number in knots,
  "heading": number 0-360,
  "destination": "Port name",
  "lastUpdate": "ISO timestamp"
}
Include at least 30-50 vessels from different global regions (North Sea, Mediterranean, Atlantic, Pacific, Indian Ocean, etc). Get REAL current AIS data, not examples.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    traffic: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                mmsi: { type: "string" },
                                name: { type: "string" },
                                type: { type: "string" },
                                latitude: { type: "number" },
                                longitude: { type: "number" },
                                speed: { type: "number" },
                                heading: { type: "number" },
                                destination: { type: "string" },
                                lastUpdate: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        const aisTraffic = (aisData.traffic || []).filter(v => 
            v.latitude && v.longitude && 
            v.latitude >= -90 && v.latitude <= 90 && 
            v.longitude >= -180 && v.longitude <= 180
        );

        return Response.json({ traffic: aisTraffic });
    } catch (error) {
        console.error('AIS Error:', error);
        return Response.json({ traffic: [] });
    }
});