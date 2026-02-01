import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch real AIS data from AIS.dk (Danish Maritime Authority) for Northern Europe
        const aisResponse = await fetch('https://www.ais.dk/api/receive', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        let aisTraffic = [];

        if (aisResponse.ok) {
            const data = await aisResponse.json();
            aisTraffic = (data.features || []).slice(0, 50).map(feature => ({
                id: `ais_${feature.properties.mmsi}`,
                mmsi: feature.properties.mmsi,
                name: feature.properties.shipname || 'Unknown',
                type: 'ship',
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                speed: feature.properties.sog || 0,
                heading: feature.properties.cog || 0,
                destination: feature.properties.destination || 'Unknown',
                lastUpdate: new Date().toISOString(),
            }));
        }

        return Response.json({ traffic: aisTraffic });
    } catch (error) {
        console.error('AIS Error:', error);
        return Response.json({ traffic: [] });
    }
});