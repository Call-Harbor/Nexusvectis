import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mock ADS-B data - In production, integrate with real ADS-B provider (e.g., FlightRadar24, OpenSky)
        const aircraftTraffic = [
            {
                id: 'adsb_1',
                icao: '3c66c3',
                callsign: 'SAS901',
                type: 'aircraft',
                latitude: 55.85,
                longitude: 12.6,
                altitude: 8500,
                speed: 450,
                heading: 225,
                destination: 'CPH',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'adsb_2',
                icao: '4b1234',
                callsign: 'LH456',
                type: 'aircraft',
                latitude: 55.6,
                longitude: 12.8,
                altitude: 10200,
                speed: 480,
                heading: 180,
                destination: 'TXL',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'adsb_3',
                icao: '5c5678',
                callsign: 'AF789',
                type: 'aircraft',
                latitude: 55.4,
                longitude: 12.3,
                altitude: 6800,
                speed: 420,
                heading: 315,
                destination: 'CDG',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'adsb_4',
                icao: '6d9012',
                callsign: 'BA101',
                type: 'aircraft',
                latitude: 56.0,
                longitude: 12.9,
                altitude: 9100,
                speed: 460,
                heading: 90,
                destination: 'LHR',
                lastUpdate: new Date().toISOString(),
            },
        ];

        return Response.json({ traffic: aircraftTraffic });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});