import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mock AIS data - In production, integrate with real AIS provider (e.g., MarineTraffic, exactEarth)
        const aisTraffic = [
            {
                id: 'ais_1',
                mmsi: '219000123',
                name: 'MSC GULSUN',
                type: 'ship',
                latitude: 55.42,
                longitude: 12.65,
                speed: 22.5,
                heading: 270,
                destination: 'Hamburg',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'ais_2',
                mmsi: '218000456',
                name: 'EVER GIVEN',
                type: 'ship',
                latitude: 55.65,
                longitude: 12.85,
                speed: 18.2,
                heading: 180,
                destination: 'Rotterdam',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'ais_3',
                mmsi: '215000789',
                name: 'MAERSK SEALAND',
                type: 'ship',
                latitude: 55.8,
                longitude: 12.4,
                speed: 20.1,
                heading: 90,
                destination: 'Copenhagen',
                lastUpdate: new Date().toISOString(),
            },
            {
                id: 'ais_4',
                mmsi: '220000321',
                name: 'NORDIC OCEAN',
                type: 'ship',
                latitude: 55.3,
                longitude: 12.2,
                speed: 15.8,
                heading: 45,
                destination: 'Bremerhaven',
                lastUpdate: new Date().toISOString(),
            },
        ];

        return Response.json({ traffic: aisTraffic });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});