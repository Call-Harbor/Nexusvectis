import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      origin,
      destination,
      transport_type = 'truck',
      waypoints = [],
      optimization_priority = 'balanced', // 'fastest', 'lowest_cost', 'greenest', 'balanced'
      vehicle_capacity_tons = 20,
      driver_max_hours = 9,
      delivery_windows = [], // [{location, earliest, latest}]
      co2_target_kg = null,
      cargo_type = 'general',
    } = await req.json();

    if (!origin || !destination) {
      return Response.json({ error: 'origin and destination required' }, { status: 400 });
    }

    const now = new Date();
    const timeString = now.toLocaleString('en-DK', { timeZone: 'Europe/Copenhagen' });

    const priorityInstructions = {
      fastest: 'Minimize total travel time. Prioritize highways and direct routes even if more expensive or higher emissions.',
      lowest_cost: 'Minimize fuel cost and operational expenses. Consider toll avoidance, fuel stops, and efficient speeds.',
      greenest: 'Minimize CO2 emissions. Prefer fuel-efficient paths, suggest speed reductions, and recommend eco-driving stops.',
      balanced: 'Balance time, cost, and emissions equally. Provide an optimal trade-off route.',
    };

    const prompt = `You are an advanced logistics route optimization AI. Current time: ${timeString} (Europe/Copenhagen).

Route Request:
- Origin: ${origin}
- Destination: ${destination}
- Transport Mode: ${transport_type}
- Optimization Priority: ${optimization_priority} — ${priorityInstructions[optimization_priority] || priorityInstructions.balanced}
- Vehicle Capacity: ${vehicle_capacity_tons} tons
- Driver Max Hours of Service: ${driver_max_hours} hours
- Cargo Type: ${cargo_type}
${co2_target_kg ? `- CO2 Emissions Target: max ${co2_target_kg} kg` : ''}
${delivery_windows.length > 0 ? `- Delivery Windows: ${JSON.stringify(delivery_windows)}` : ''}
${waypoints.length > 0 ? `- Required Waypoints: ${waypoints.map(w => w.name).join(', ')}` : ''}

Analyze and respond with a realistic, detailed route optimization. Consider:
1. Real-world road/sea/air networks between the specified locations
2. Current season weather conditions (it is ${now.toLocaleString('en-US', {month:'long'})} in Europe)
3. Traffic congestion patterns for the transport mode
4. Driver hours of service regulations (EU: max 9h driving/day, 45min break after 4.5h)
5. Fuel/energy stops needed
6. Border crossings and customs if international
7. CO2 emissions based on distance and transport mode (truck: ~0.8 kg/km, ship: ~0.02 kg/km, train: ~0.04 kg/km, aircraft: ~0.9 kg/km)
8. Cost estimates (fuel, tolls, port fees if applicable)

Return ONLY valid JSON matching this exact schema:
{
  "route_data": {
    "origin": "string",
    "destination": "string",
    "transport_type": "string",
    "optimization_priority": "string",
    "distance_km": number,
    "estimated_duration_hours": number,
    "co2_estimate_kg": number,
    "fuel_cost_eur": number,
    "toll_cost_eur": number,
    "total_cost_eur": number,
    "waypoints": [{"name": "string", "lat": number, "lng": number, "purpose": "string", "arrival_offset_hours": number}],
    "rest_stops": [{"name": "string", "after_hours": number, "duration_minutes": number, "reason": "string"}],
    "traffic_conditions": {"level": "low|moderate|high", "notes": "string"},
    "weather_conditions": {"impact": "none|minor|moderate|severe", "description": "string"},
    "driver_compliance": {"compliant": boolean, "notes": "string", "required_breaks": number},
    "alternatives": [
      {"name": "string", "description": "string", "distance_km": number, "duration_hours": number, "co2_kg": number, "cost_eur": number, "tradeoff": "string"}
    ],
    "optimization_score": {"time": number, "cost": number, "co2": number, "overall": number},
    "ai_recommendations": ["string"],
    "risks": [{"type": "string", "description": "string", "severity": "low|medium|high"}]
  }
}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json({ error: 'AI response empty' }, { status: 500 });
    }

    const parsed = JSON.parse(content);

    return Response.json({
      success: true,
      ...parsed,
      optimization_date: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});