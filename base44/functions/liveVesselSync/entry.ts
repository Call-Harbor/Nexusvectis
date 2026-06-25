import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch(e) { console.log('[auth] me() failed:', e.message); }
  if (!user) return nvError(requestId, String('Unauthorized'), 401);


  const body = await req.json().catch(() => ({}));
  const { lat_min, lat_max, lon_min, lon_max, organization_id, duration_ms } = body;

  const orgId = organization_id || user.organization_id;
  const apiKey = Deno.env.get("AISSTREAM_API_KEY");

  if (!apiKey) {
    return nvJson(requestId, { synced: 0, error: "AISSTREAM_API_KEY not configured." });

  }

  const latMin = lat_min ?? 54.5;
  const latMax = lat_max ?? 57.8;
  const lonMin = lon_min ?? 9.5;
  const lonMax = lon_max ?? 13.5;
  const collectMs = duration_ms ?? 10000;

  const vessels = new Map();
  const deadline = Date.now() + collectMs;
  let wsStatus = "connecting";
  let firstMsgRaw = null;

  try {
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.close();
        resolve();
      }, collectMs);

      ws.addEventListener("open", () => {
        wsStatus = "open";
        console.log("[aisstream] API key length:", apiKey.length, "prefix:", apiKey.slice(0, 6));
        const subObj = {
          APIKey: apiKey.trim(),
          BoundingBoxes: [[[latMin, lonMin], [latMax, lonMax]]],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"]
        };
        const sub = JSON.stringify(subObj);
        console.log("[aisstream] sending sub:", sub.slice(0, 200));
        ws.send(sub);
        console.log("[aisstream] subscribed, waiting for data...");
      });

      ws.addEventListener("message", (event) => {
        wsStatus = "receiving";
        try {
          const msg = JSON.parse(typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data));
          if (!firstMsgRaw) firstMsgRaw = JSON.stringify(msg).slice(0, 200);

          const mmsi = String(msg.MetaData?.MMSI || "").trim();
          if (!mmsi || mmsi === "0") return;

          if (msg.MessageType === "PositionReport") {
            const pos = msg.Message?.PositionReport;
            if (!pos) return;
            const existing = vessels.get(mmsi) || {};
            vessels.set(mmsi, {
              ...existing,
              mmsi,
              latitude: pos.Latitude,
              longitude: pos.Longitude,
              speed: pos.Sog || 0,
              heading: pos.Cog || 0,
              status: (pos.Sog || 0) > 0.5 ? "active" : "idle",
              name: msg.MetaData?.ShipName?.trim() || existing.name || "UNKNOWN",
              organization_id: orgId,
              type: "ship",
            });
          } else if (msg.MessageType === "ShipStaticData") {
            const stat = msg.Message?.ShipStaticData;
            if (!stat) return;
            const existing = vessels.get(mmsi) || {};
            const typeMap = { 7: "cargo", 8: "tanker", 6: "passenger", 3: "fishing", 5: "tug", 4: "highspeed" };
            const vesselClass = typeMap[Math.floor((stat.Type || 0) / 10)] || "cargo";
            vessels.set(mmsi, {
              ...existing,
              mmsi,
              name: stat.Name?.trim() || existing.name || "UNKNOWN",
              callsign: stat.CallSign?.trim() || existing.callsign || "",
              destination: stat.Destination?.trim() || existing.destination || "",
              vessel_class: vesselClass,
              organization_id: orgId,
              type: "ship",
            });
          }

          if (vessels.size >= 200 || Date.now() > deadline) {
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        } catch (e) {
          console.log("[aisstream] parse error:", e.message);
        }
      });

      ws.addEventListener("error", (e) => {
        wsStatus = "error:" + (e.message || "unknown");
        console.log("[aisstream] error:", wsStatus);
        clearTimeout(timer);
        reject(new Error(wsStatus));
      });

      ws.addEventListener("close", (e) => {
        wsStatus = `closed(${e.code}:${e.reason})`;
        console.log("[aisstream] closed:", wsStatus);
        clearTimeout(timer);
        resolve();
      });
    });
  } catch (e) {
    console.log("[aisstream] exception:", e.message);
    return nvJson(requestId, { synced: 0, error: e.message, wsStatus });

  }

  console.log(`[aisstream] done — vessels: ${vessels.size}, status: ${wsStatus}, firstMsg: ${firstMsgRaw}`);

  if (vessels.size === 0) {
    return nvJson(requestId, { synced: 0, error: "No vessels received.", debug: { wsStatus, firstMsgRaw } });

  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const existingVessels = await base44.asServiceRole.entities.Vessel.filter({ organization_id: orgId }, "-created_date", 500);
  const vesselByMMSI = {};
  existingVessels.forEach(v => { if (v.mmsi) vesselByMMSI[v.mmsi] = v; });

  const toCreate = [];
  const toUpdate = [];

  for (const [mmsi, vData] of vessels) {
    if (!vData.latitude || !vData.longitude) continue;
    const existing = vesselByMMSI[mmsi];
    if (existing) {
      toUpdate.push({ id: existing.id, ...vData });
    } else {
      toCreate.push(vData);
    }
  }

  let created = 0, updated = 0;

  for (let i = 0; i < toCreate.length; i += 10) {
    await base44.asServiceRole.entities.Vessel.bulkCreate(toCreate.slice(i, i + 10));
    created += Math.min(10, toCreate.length - i);
    if (i + 10 < toCreate.length) await sleep(300);
  }

  for (let i = 0; i < toUpdate.length; i++) {
    const { id, ...d } = toUpdate[i];
    await base44.asServiceRole.entities.Vessel.update(id, d);
    updated++;
    if (i % 5 === 4) await sleep(200);
  }

  return nvJson(requestId, {
    synced: vessels.size,
    vessels_created: created,
    vessels_updated: updated,
    area: { latMin, latMax, lonMin, lonMax },
    timestamp: new Date().toISOString()
  });

});