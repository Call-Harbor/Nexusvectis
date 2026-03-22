import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { city, country } = await req.json();

    if (!city) {
      return Response.json({ error: 'Missing city' }, { status: 400 });
    }

    // Try with country first, then fallback to just city
    const query = country ? `${city}, ${country}` : city;
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    let data = await response.json();

    // If no results and country was provided, try just the city
    if ((!data || data.length === 0) && country) {
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      data = await response.json();
    }

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