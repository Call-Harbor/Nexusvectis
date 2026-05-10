/**
 * Cross-app clipboard / event bus for FleetDocs, FleetSheet, FleetSlide, and Fleet Drive.
 * Uses sessionStorage (last payload) + window CustomEvent for live handoff between open windows.
 */

export const FLEET_OFFICE_EVENT = "fleet_office_bridge";
const CLIP_KEY = "fleet_office_clip_v1";

export function persistFleetOfficeClip(detail) {
  try {
    sessionStorage.setItem(CLIP_KEY, JSON.stringify(detail));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readFleetOfficeClip() {
  try {
    const raw = sessionStorage.getItem(CLIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function dispatchFleetOfficeBridge(detail) {
  persistFleetOfficeClip(detail);
  window.dispatchEvent(new CustomEvent(FLEET_OFFICE_EVENT, { detail }));
}

/**
 * @param {{ target?: string, kind: string, data?: unknown, meta?: Record<string, unknown> }} p
 */
export function postToFleetOffice(p) {
  const payload = {
    target: p.target || "any",
    kind: p.kind,
    data: p.data,
    meta: p.meta || {},
    ts: Date.now(),
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  };
  dispatchFleetOfficeBridge(payload);
}

export function subscribeFleetOfficeBridge(handler) {
  const fn = (e) => handler(e.detail);
  window.addEventListener(FLEET_OFFICE_EVENT, fn);
  return () => window.removeEventListener(FLEET_OFFICE_EVENT, fn);
}

/** @param {string} text */
export function parseCsvToStringMatrix(text) {
  if (!text || !text.trim()) return [];
  return text.split(/\r?\n/).filter((r) => r.trim()).map((row) => {
    const cells = [];
    let cur = "";
    let inQ = false;
    for (const ch of row) {
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === "," && !inQ) {
        cells.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

/**
 * @param {string} html
 * @returns {{ level: number, text: string }[]}
 */
export function htmlToOutline(html) {
  if (typeof document === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html || "";
  const out = [];
  div.querySelectorAll("h1, h2, h3").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim();
    if (!text) return;
    const level = tag === "h1" ? 1 : tag === "h2" ? 2 : 3;
    out.push({ level, text });
  });
  return out;
}

/**
 * @param {{ level: number, text: string }[]} outline
 */
export function outlineToSlideStubs(outline) {
  if (!outline?.length) return [];
  const slides = [];
  let current = null;
  for (const item of outline) {
    if (item.level === 1) {
      if (current) slides.push(current);
      current = { type: "content", title: item.text, bullets: [], body: "" };
    } else {
      if (!current) current = { type: "content", title: "Outline", bullets: [], body: "" };
      current.bullets.push(item.text);
    }
  }
  if (current) slides.push(current);
  if (slides.length) return slides;
  return [{ type: "content", title: "Outline", bullets: outline.map((o) => o.text), body: "" }];
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
