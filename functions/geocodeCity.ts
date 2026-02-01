import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { city, country } = await req.json();

    if (!city || !country) {
      return Response.json({ error: 'Missing city or country' }, { status: 400 });
    }

    const query = `${city}, ${country}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return Response.json({ error: 'Location not found' }, { status: 404 });
    }

    const { lat, lon } = data[0];

    return Response.json({
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      city,
      country
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});