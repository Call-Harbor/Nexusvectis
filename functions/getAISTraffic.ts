import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let aisTraffic = [];

        // Try Multiple AIS data sources
        try {
            // Try MarineTraffic Free API
            const response = await fetch('https://services.marinetraffic.com/api/v8/json/position_reports?timespan=10&mmsi=all', {
                signal: AbortSignal.timeout(8000)
            });
            
            if (response.ok) {
                const data = await response.json();
                aisTraffic = Object.values(data || {}).map(vessel => ({
                    id: `ais_${vessel.MMSI}`,
                    mmsi: vessel.MMSI,
                    name: vessel.SHIPNAME || 'Unknown',
                    type: 'ship',
                    latitude: parseFloat(vessel.LAT),
                    longitude: parseFloat(vessel.LON),
                    speed: parseFloat(vessel.SOG) || 0,
                    heading: parseFloat(vessel.COG) || 0,
                    destination: vessel.DESTINATION || 'Unknown',
                    lastUpdate: new Date().toISOString(),
                })).filter(v => v.latitude && v.longitude && v.latitude >= -90 && v.latitude <= 90 && v.longitude >= -180 && v.longitude <= 180).slice(0, 100);
            }
        } catch (e) {
            console.log('MarineTraffic API failed, trying OpenSeaMap...');
        }

        // Fallback to OpenSeaMap
        if (aisTraffic.length === 0) {
            try {
                const response = await fetch('https://tiles.openseamap.org/vessels/latest.json', {
                    signal: AbortSignal.timeout(8000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    aisTraffic = (data.features || []).map(feature => ({
                        id: `ais_${feature.properties.mmsi}`,
                        mmsi: feature.properties.mmsi,
                        name: feature.properties.name || 'Unknown',
                        type: 'ship',
                        latitude: feature.geometry.coordinates[1],
                        longitude: feature.geometry.coordinates[0],
                        speed: feature.properties.sog || 0,
                        heading: feature.properties.cog || 0,
                        destination: feature.properties.destination || 'Unknown',
                        lastUpdate: new Date().toISOString(),
                    })).filter(v => v.latitude >= -90 && v.latitude <= 90 && v.longitude >= -180 && v.longitude <= 180).slice(0, 100);
                }
            } catch (e) {
                console.log('OpenSeaMap also failed');
            }
        }

        return Response.json({ traffic: aisTraffic });
    } catch (error) {
        console.error('AIS Error:', error);
        return Response.json({ traffic: [] });
    }
});