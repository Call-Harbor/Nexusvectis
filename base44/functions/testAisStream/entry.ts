import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = Deno.env.get("AISSTREAM_API_KEY") || "";
  const log = [];

  log.push(`key_length=${apiKey.length}`);
  log.push(`key_prefix=${apiKey.trim().slice(0, 8)}`);

  const messages = [];

  const result = await new Promise((resolve) => {
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    const timer = setTimeout(() => {
      log.push("timeout fired, closing ws");
      ws.close();
      resolve({ status: "timeout", messages });
    }, 8000);

    ws.onopen = () => {
      log.push("ws opened");
      const sub = JSON.stringify({
        APIKey: apiKey.trim(),
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"]
      });
      log.push("sending: " + sub);
      ws.send(sub);
    };

    ws.onmessage = (e) => {
      const raw = typeof e.data === "string" ? e.data : "binary";
      log.push("msg: " + raw.slice(0, 100));
      messages.push(raw.slice(0, 200));
      if (messages.length >= 3) {
        clearTimeout(timer);
        ws.close();
        resolve({ status: "got_data", messages });
      }
    };

    ws.onclose = (e) => {
      log.push(`closed code=${e.code} reason=${e.reason}`);
      clearTimeout(timer);
      resolve({ status: `closed_${e.code}`, messages });
    };

    ws.onerror = (e) => {
      log.push("error: " + (e.message || "unknown"));
      clearTimeout(timer);
      resolve({ status: "error", messages });
    };
  });

  return Response.json({ result, log });
});