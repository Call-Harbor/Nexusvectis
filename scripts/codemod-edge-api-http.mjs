#!/usr/bin/env node
// Codemod: add _shared/apiHttp to all base44/functions/*/entry.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "base44/functions");
const SKIP = new Set(["harborCore", "harborIntellectAPI", "harborOrchestratorAPI", "_shared"]);

const IMPORT =
  "import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';\n";

function matchingParen(s, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < s.length; i += 1) {
    const c = s[i];
    if (c === "(") depth += 1;
    else if (c === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Split firstArg from trailing { status, headers } using bracket matching
function stripTrailingOptions(args) {
  const s = args.trimEnd();
  if (!s) return { body: s, status: 200 };
  let i = s.length - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  if (s[i] !== "}") return { body: s, status: 200 };
  const end = i;
  let depth = 1;
  let k = end - 1;
  for (; k >= 0; k--) {
    if (s[k] === "}") depth += 1;
    else if (s[k] === "{") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  if (k < 0) return { body: s, status: 200 };
  const optsStr = s.slice(k, end + 1);
  let j = k - 1;
  while (j >= 0 && /\s/.test(s[j])) j--;
  if (j < 0 || s[j] !== ",") return { body: s, status: 200 };
  const sm = optsStr.match(/\bstatus:\s*(\d+)/);
  const status = sm ? parseInt(sm[1], 10) : 200;
  return { body: s.slice(0, j).trim(), status };
}

function replaceAllResponseJson(src) {
  const needle = "return Response.json(";
  let out = "";
  let i = 0;
  while (i < src.length) {
    const j = src.indexOf(needle, i);
    if (j === -1) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, j);
    const open = j + needle.length - 1;
    const close = matchingParen(src, open);
    if (close === -1) {
      out += needle;
      i = j + needle.length;
      continue;
    }
    const fullInner = src.slice(open + 1, close);
    const { body, status } = stripTrailingOptions(fullInner);
    const errSimple = body.match(/^\{\s*error:\s*([^,}]+)\s*\}$/);
    if (errSimple && status >= 400) {
      const e = errSimple[1].trim();
      out += `return nvError(requestId, String(${e}), ${status});\n`;
    } else if (status !== 200) {
      out += `return nvJson(requestId, ${body}, ${status});\n`;
    } else {
      out += `return nvJson(requestId, ${body});\n`;
    }
    i = close + 1;
    if (src[i] === ";") i += 1;
  }
  return out;
}

function replaceOptionsNv(src) {
  return src;
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (src.includes("_shared/apiHttp")) {
    return { filePath, status: "skip_import" };
  }

  const servePatterns = [
    "Deno.serve(async (req) => {",
    "Deno.serve(async (req)=>{",
    "Deno.serve(async(req)=>{",
  ];
  let sp = null;
  let idx = -1;
  for (const p of servePatterns) {
    const x = src.indexOf(p);
    if (x !== -1) {
      idx = x;
      sp = p;
      break;
    }
  }
  if (idx === -1) {
    return { filePath, status: "skip_no_serve" };
  }

  const lines = src.split("\n");
  let lastImportLine = -1;
  for (let li = 0; li < lines.length; li += 1) {
    const t = lines[li].trim();
    if (t.startsWith("import ")) lastImportLine = li;
  }
  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, IMPORT.trimEnd());
    src = lines.join("\n");
  } else {
    src = IMPORT + src;
  }

  idx = src.indexOf(sp);
  src =
    src.slice(0, idx + sp.length) +
    "\n  const requestId = resolveRequestId(req);\n" +
    src.slice(idx + sp.length);

  src = replaceOptionsNv(src);
  src = replaceAllResponseJson(src);

  src = src.replace(
    /return\s+Response\.json\(\s*\{\s*error:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g,
    "return nvError(requestId, error instanceof Error ? error.message : String(error), 500, 'INTERNAL_ERROR')",
  );

  fs.writeFileSync(filePath, src, "utf8");
  return { filePath, status: "ok" };
}

const dirs = fs.readdirSync(ROOT, { withFileTypes: true });
const summary = { ok: 0, skip: 0, details: [] };
for (const d of dirs) {
  if (!d.isDirectory() || SKIP.has(d.name)) continue;
  const entry = path.join(ROOT, d.name, "entry.ts");
  if (!fs.existsSync(entry)) continue;
  const r = processFile(entry);
  if (r.status === "ok") summary.ok += 1;
  else {
    summary.skip += 1;
    summary.details.push(r);
  }
}
console.log(JSON.stringify(summary, null, 2));
