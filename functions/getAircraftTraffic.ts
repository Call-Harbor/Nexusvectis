import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch real aircraft data from OpenSky Network API (free tier)
        const osmUrl = new URL('https://opensky-network.org/api/states/all');
        const response = await fetch(osmUrl.toString());

        let aircraftTraffic = [];

        if (response.ok) {
            const data = await response.json();
            aircraftTraffic = (data.states || []).slice(0, 100).map(state => ({
                id: `adsb_${state[0]}`,
                icao: state[0],
                callsign: (state[1] || 'N/A').trim(),
                type: 'aircraft',
                latitude: state[6] || 0,
                longitude: state[5] || 0,
                altitude: state[7] ? state[7] * 0.3048 : 0, // Convert feet to meters
                speed: state[9] ? (state[9] * 1.94384) : 0, // Convert m/s to knots
                heading: state[10] || 0,
                destination: state[8] ? 'In Flight' : 'Unknown',
                lastUpdate: new Date().toISOString(),
            })).filter(a => a.latitude && a.longitude); // Only include aircraft with position
        }

        return Response.json({ traffic: aircraftTraffic });
    } catch (error) {
        console.error('Aircraft Error:', error);
        return Response.json({ traffic: [] });
    }
});