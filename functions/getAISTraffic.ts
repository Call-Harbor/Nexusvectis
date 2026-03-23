import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const AISHUB_USERNAME = Deno.env.get("AISHUB_USERNAME");
        
        if (!AISHUB_USERNAME) {
            return Response.json({ 
                error: 'AISHub credentials not configured',
                traffic: [] 
            });
        }

        let aisTraffic = [];

        try {
            // AISHub API - free but requires registration at aishub.net
            // Fetch vessels in a specific area (Baltic Sea region as example)
            const latMin = 54.0;
            const latMax = 58.0;
            const lonMin = 10.0;
            const lonMax = 15.0;
            
            const url = `http://data.aishub.net/ws.php?username=${AISHUB_USERNAME}&format=1&output=json&compress=0&latmin=${latMin}&latmax=${latMax}&lonmin=${lonMin}&lonmax=${lonMax}`;
            
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data[0] && data[0].ERROR === false && data[1]) {
                    aisTraffic = data[1].map(vessel => ({
                        id: `ais_${vessel.MMSI}`,
                        mmsi: vessel.MMSI,
                        name: vessel.NAME || 'Unknown',
                        type: 'ship',
                        latitude: parseFloat(vessel.LATITUDE),
                        longitude: parseFloat(vessel.LONGITUDE),
                        speed: parseFloat(vessel.SOG) || 0,
                        heading: parseFloat(vessel.COG) || 0,
                        destination: vessel.DESTINATION || 'Unknown',
                        lastUpdate: new Date(vessel.TIME).toISOString(),
                    })).filter(v => 
                        v.latitude && v.longitude && 
                        v.latitude >= -90 && v.latitude <= 90 && 
                        v.longitude >= -180 && v.longitude <= 180
                    ).slice(0, 100);
                }
            } else {
                console.error('AISHub API error:', response.status);
            }
        } catch (e) {
            console.error('AISHub API failed:', e.message);
        }

        return Response.json({ traffic: aisTraffic });
    } catch (error) {
        console.error('AIS Error:', error);
        return Response.json({ traffic: [] });
    }
});