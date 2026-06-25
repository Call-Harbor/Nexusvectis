/**
 * Shared HTTP helpers for Base44 Edge (Deno) functions — CORS, request correlation, JSON errors.
 * Import from sibling folders: `import { ... } from '../_shared/apiHttp.ts';`
 */

const REQ_ID_HEADER = 'x-request-id';

/** Standard CORS for browser / tooling calling functions directly. */
export const NV_API_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, Authorization, X-API-Key, ${REQ_ID_HEADER}`,
};

/**
 * Prefer client-provided request id (tracing); otherwise generate UUID.
 * @param {Request} req
 */
export function resolveRequestId(req: Request): string {
  const raw = req.headers.get(REQ_ID_HEADER)?.trim();
  if (raw && raw.length <= 128) return raw.slice(0, 128);
  return crypto.randomUUID();
}

/**
 * @param {string} requestId
 * @param {HeadersInit} [extra]
 */
export function apiHeaders(requestId: string, extra?: HeadersInit): Headers {
  const h = new Headers(NV_API_CORS_HEADERS);
  h.set('X-Request-ID', requestId);
  h.set('Cache-Control', 'no-store');
  if (extra) {
    const e = new Headers(extra);
    e.forEach((v, k) => h.set(k, v));
  }
  return h;
}

/**
 * JSON success / payload. Injects `request_id` on object bodies for log correlation.
 * @param {string} requestId
 * @param {unknown} body
 * @param {number} [status]
 */
export function nvJson(requestId: string, body: unknown, status = 200): Response {
  const headers = apiHeaders(requestId);
  headers.set('Content-Type', 'application/json');
  const payload =
    body !== null && typeof body === 'object' && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), request_id: requestId }
      : { data: body, request_id: requestId };
  return Response.json(payload, { status, headers });
}

/**
 * JSON error with stable shape for clients and monitors.
 * @param {string} requestId
 * @param {string} message
 * @param {number} status
 * @param {string} [code]
 */
export function nvError(requestId: string, message: string, status: number, code?: string): Response {
  const headers = apiHeaders(requestId);
  headers.set('Content-Type', 'application/json');
  /** @type {Record<string, unknown>} */
  const o = { error: message, request_id: requestId };
  if (code) o.code = code;
  return Response.json(o, { status, headers });
}

/**
 * @param {string} requestId
 */
export function nvOptions(requestId: string): Response {
  return new Response(null, { status: 204, headers: apiHeaders(requestId) });
}
