# Shared Edge utilities

- `apiHttp.ts` — CORS, `X-Request-ID` / `request_id` in JSON, `nvJson` / `nvError` / `nvOptions` for consistent API responses.

Import in a function: `import { ... } from '../_shared/apiHttp.ts';` (path depth may vary).

To re-apply the JSON response transform on new `entry.ts` files, see `scripts/codemod-edge-api-http.mjs` at repo root (skips functions that already import `apiHttp`).
