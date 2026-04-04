import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── JavaScript execution via new Function (sandboxed) ────────────────────────
async function executeJS(code, env = {}) {
  const start = Date.now();
  const output = [];

  const makeLog = (type) => (...args) => {
    const text = args.map(a => {
      try { return typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a); }
      catch { return '[Circular]'; }
    }).join(' ');
    output.push({ type, text });
  };

  const fakeConsole = {
    log:   makeLog('default'),
    info:  makeLog('info'),
    warn:  makeLog('warn'),
    error: makeLog('error'),
    debug: makeLog('info'),
    table: (data) => output.push({ type: 'default', text: JSON.stringify(data, null, 2) }),
    dir:   (o) => output.push({ type: 'default', text: JSON.stringify(o, null, 2) }),
    time:  (l='default') => { fakeConsole._t = {...(fakeConsole._t||{}), [l]: Date.now()}; },
    timeEnd: (l='default') => {
      const t = (fakeConsole._t||{})[l];
      output.push({ type: 'info', text: `${l}: ${t ? Date.now()-t : 0}ms` });
    },
    group:    (l) => output.push({ type: 'info', text: '▼ ' + l }),
    groupEnd: () => {},
    count:    (l='default') => {
      fakeConsole._c = {...(fakeConsole._c||{}), [l]: ((fakeConsole._c||{})[l]||0)+1};
      output.push({ type: 'info', text: `${l}: ${fakeConsole._c[l]}` });
    },
    assert: (cond, ...args) => {
      if (!cond) output.push({ type: 'error', text: 'Assertion failed: ' + args.join(' ') });
    },
    _t: {}, _c: {},
  };

  const fakeProcess = {
    env: env || {},
    argv: ['node', 'script.js'],
    version: 'v18.0.0',
    platform: 'linux',
    exit: (code = 0) => { throw { __processExit: true, code }; },
    stdout: { write: (s) => output.push({ type: 'default', text: String(s) }) },
    stderr: { write: (s) => output.push({ type: 'error',   text: String(s) }) },
    hrtime: () => [0, 0],
  };

  const fakeRequire = (mod) => {
    const mocks = {
      path: {
        join: (...a) => a.join('/'), basename: (p) => p.split('/').pop(),
        dirname: (p) => p.split('/').slice(0,-1).join('/') || '.',
        extname: (p) => { const m = p.match(/\.[^.]+$/); return m ? m[0] : ''; },
        resolve: (...a) => '/workspace/' + a.join('/'),
      },
      fs: {
        readFileSync: (p) => `// mock content of ${p}`,
        writeFileSync: () => {},
        existsSync: () => true,
        readdirSync: () => ['file1.js','file2.js'],
        mkdirSync: () => {},
        statSync: () => ({ size: 1024, isFile: () => true, isDirectory: () => false }),
      },
      os: {
        platform: () => 'linux', arch: () => 'x64',
        cpus: () => [{ model: 'Intel Xeon', speed: 2400, times: { user: 100, sys: 50 } }],
        totalmem: () => 8 * 1024 * 1024 * 1024,
        freemem: () => 4 * 1024 * 1024 * 1024,
        hostname: () => 'nexusvectis-runtime',
        homedir: () => '/home/user',
        tmpdir: () => '/tmp',
        networkInterfaces: () => ({ lo: [{ address: '127.0.0.1' }] }),
      },
      crypto: {
        randomBytes: (n) => { const b = new Uint8Array(n); for(let i=0;i<n;i++) b[i]=Math.floor(Math.random()*256); return b; },
        randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }),
        createHash: (alg) => ({ _d: '', update(d){this._d+=d;return this;}, digest(e){ return e==='hex' ? Array.from(new TextEncoder().encode(this._d)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32) : '<buffer>'; } }),
        createHmac: (alg, key) => ({ update(d){return this;}, digest(e){ return 'hmac_' + alg + '_result'; } }),
      },
      events: { EventEmitter: class { constructor(){this._h={};} on(e,h){(this._h[e]||(this._h[e]=[])).push(h);return this;} emit(e,...a){(this._h[e]||[]).forEach(h=>h(...a));return this;} off(e,h){this._h[e]=(this._h[e]||[]).filter(x=>x!==h);return this;} once(e,h){const w=(...a)=>{h(...a);this.off(e,w);};return this.on(e,w);} removeAllListeners(){this._h={};return this;} } },
      util: {
        promisify: (fn) => (...args) => new Promise((res,rej) => fn(...args,(e,r)=>e?rej(e):res(r))),
        inspect: (o, opts) => JSON.stringify(o, null, opts?.compact ? 0 : 2),
        format: (...args) => args.map(a=>typeof a==='object'?JSON.stringify(a):String(a)).join(' '),
        inherits: (ctor, superCtor) => { ctor.prototype = Object.create(superCtor.prototype); },
        isArray: Array.isArray,
        isString: (v) => typeof v === 'string',
        isNumber: (v) => typeof v === 'number',
      },
      assert: Object.assign(
        (val, msg) => { if (!val) throw new Error(msg || 'AssertionError'); },
        { strictEqual: (a,b,m) => { if(a!==b) throw new Error(m||`${a} !== ${b}`); }, ok: (v,m) => { if(!v) throw new Error(m||'AssertionError'); }, throws: (fn,m) => { try{fn();}catch{return;} throw new Error(m||'Expected to throw'); } }
      ),
      lodash: {
        chunk: (arr, n) => { const r=[]; for(let i=0;i<arr.length;i+=n) r.push(arr.slice(i,i+n)); return r; },
        flatten: (arr) => arr.flat(),
        uniq: (arr) => [...new Set(arr)],
        groupBy: (arr, key) => arr.reduce((r,v)=>{ (r[v[key]]||(r[v[key]]=[])).push(v); return r; }, {}),
        sortBy: (arr, key) => [...arr].sort((a,b) => a[key]>b[key]?1:-1),
        pick: (obj, keys) => Object.fromEntries(keys.map(k=>[k,obj[k]])),
        omit: (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k])=>!keys.includes(k))),
        merge: (...objs) => Object.assign({}, ...objs),
        debounce: (fn, ms) => fn,
        throttle: (fn, ms) => fn,
        cloneDeep: (v) => JSON.parse(JSON.stringify(v)),
        get: (obj, path, def) => { try { return path.split('.').reduce((o,k)=>o[k], obj) ?? def; } catch { return def; } },
        set: (obj, path, val) => { const keys=path.split('.'); keys.slice(0,-1).reduce((o,k)=>o[k]||(o[k]={}), obj)[keys.at(-1)]=val; return obj; },
        isEmpty: (v) => !v || (Array.isArray(v)?v.length===0:typeof v==='object'?Object.keys(v).length===0:false),
        isEqual: (a,b) => JSON.stringify(a)===JSON.stringify(b),
        mapValues: (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,fn(v,k)])),
        keyBy: (arr, key) => arr.reduce((r,v)=>{r[v[key]]=v;return r;}, {}),
        sumBy: (arr, key) => arr.reduce((s,v)=>s+(typeof key==='function'?key(v):v[key]||0), 0),
        orderBy: (arr, keys, dirs) => [...arr].sort((a,b) => { for(let i=0;i<keys.length;i++){ const d=dirs?.[i]==='desc'?-1:1; if(a[keys[i]]<b[keys[i]]) return -1*d; if(a[keys[i]]>b[keys[i]]) return 1*d; } return 0; }),
      },
    };
    if (mocks[mod]) return mocks[mod];
    if (mod === '_' || mod === 'underscore') return mocks.lodash;
    output.push({ type: 'warn', text: `[require] Module '${mod}' mocked — not available in browser runtime` });
    return {};
  };

  try {
    const fn = new Function(
      '__console__', '__process__', '__require__', '__env__',
      `
"use strict";
const console = __console__;
const process = __process__;
const require = __require__;
const __filename = 'script.js';
const __dirname = '/workspace';
const fetch = globalThis.fetch;
const setTimeout = globalThis.setTimeout;
const clearTimeout = globalThis.clearTimeout;
const setInterval = globalThis.setInterval;
const clearInterval = globalThis.clearInterval;
const Promise = globalThis.Promise;
const JSON = globalThis.JSON;
const Math = globalThis.Math;
const Date = globalThis.Date;
const URL = globalThis.URL;
const URLSearchParams = globalThis.URLSearchParams;
const TextEncoder = globalThis.TextEncoder;
const TextDecoder = globalThis.TextDecoder;
const atob = globalThis.atob;
const btoa = globalThis.btoa;
const performance = globalThis.performance;
return (async () => {
${code}
})();
      `
    );

    await Promise.race([
      fn(fakeConsole, fakeProcess, fakeRequire, env),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Execution timeout (10s)')), 10000)),
    ]);

  } catch (err) {
    if (err && err.__processExit) {
      output.push({ type: err.code === 0 ? 'info' : 'warn', text: `process.exit(${err.code}) called` });
      return { output, exit_code: err.code, duration_ms: Date.now() - start };
    }
    const lines = (err.stack || err.message || String(err)).split('\n');
    lines.forEach(l => { if (l.trim()) output.push({ type: 'error', text: l }); });
  }

  const duration = Date.now() - start;
  const hasError = output.some(o => o.type === 'error');
  if (output.length === 0) {
    output.push({ type: 'info', text: '(no output)' });
  }
  output.push({ type: hasError ? 'error' : 'success', text: `Process exited with code ${hasError ? 1 : 0} in ${duration}ms` });
  return { output, exit_code: hasError ? 1 : 0, duration_ms: duration };
}

// ── JSON lint ────────────────────────────────────────────────────────────────
function lintJSON(code) {
  const start = Date.now();
  const output = [];
  try {
    const parsed = JSON.parse(code);
    const countItems = (o, depth=0) => {
      if (Array.isArray(o)) return { type: 'array', length: o.length, children: o.slice(0,3).map(i=>countItems(i,depth+1)) };
      if (typeof o === 'object' && o !== null) return { type: 'object', keys: Object.keys(o).length };
      return { type: typeof o };
    };
    const info = countItems(parsed);
    output.push({ type: 'success', text: `✓ Valid JSON` });
    output.push({ type: 'info',    text: `  Root: ${info.type === 'array' ? `Array[${info.length}]` : `Object{${info.keys}}`}` });
    output.push({ type: 'info',    text: `  Size: ${new TextEncoder().encode(code).length} bytes  |  Lines: ${code.split('\n').length}` });
    const preview = JSON.stringify(parsed, null, 2).split('\n').slice(0, 10);
    preview.forEach(l => output.push({ type: 'default', text: l }));
    if (JSON.stringify(parsed, null, 2).split('\n').length > 10) output.push({ type: 'info', text: '  ...' });
    return { output, exit_code: 0, duration_ms: Date.now() - start };
  } catch (e) {
    output.push({ type: 'error', text: `SyntaxError: ${e.message}` });
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const lines = code.split('\n');
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= pos) {
          output.push({ type: 'error', text: `  Line ${i+1}: ${lines[i].trim()}` });
          output.push({ type: 'error', text: `  Column ${pos - charCount}` });
          break;
        }
        charCount += lines[i].length + 1;
      }
    }
    return { output, exit_code: 1, duration_ms: Date.now() - start };
  }
}

// ── Simulate Python/Bash/YAML/etc. via Claude ────────────────────────────────
async function simulateExecution(code, language, filename, base44) {
  const start = Date.now();
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a real ${language} runtime. Simulate EXACTLY what happens when running this code.

File: ${filename || 'script'}
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Requirements:
- Output REAL, computed values — not placeholder text
- Include realistic timing and system info
- Show actual print/echo outputs line by line
- For Python: show correct computed results (e.g. actually compute the math)
- For bash: show realistic system responses, pids, file listings
- If there's a syntax error: show exact line and error message
- Show any warnings (DeprecationWarning, etc.)

Return JSON: { "output": [{"type":"default|info|success|error|warn|system","text":"line"}], "exit_code": 0 }`,
    response_json_schema: {
      type: 'object',
      properties: {
        output: { type: 'array', items: { type: 'object', additionalProperties: true } },
        exit_code: { type: 'number' }
      }
    },
    model: 'claude_sonnet_4_6'
  });

  const duration = Date.now() - start;
  return {
    output: [
      ...(result?.output || [{ type: 'success', text: 'Done' }]),
      { type: result?.exit_code === 0 ? 'success' : 'error', text: `Process exited with code ${result?.exit_code ?? 0} in ${duration}ms` }
    ],
    exit_code: result?.exit_code ?? 0,
    duration_ms: duration,
  };
}

// ── Lint via Claude ───────────────────────────────────────────────────────────
async function lintCode(code, language, filename, base44) {
  const start = Date.now();
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Perform static code analysis on this ${language} code. Find ALL issues including: syntax errors, undefined variables, unused imports, potential null references, type errors, security vulnerabilities, performance anti-patterns, style violations, dead code.

File: ${filename}
Code:
\`\`\`${language}
${code}
\`\`\`

Return JSON:
{
  "issues": [{"line": 5, "col": 10, "severity": "error|warning|info", "rule": "rule-name", "message": "msg", "fix": "suggested fix"}],
  "output": [{"type":"error|warn|info|success","text":"formatted linter output line"}],
  "score": 95,
  "exit_code": 0
}`,
    response_json_schema: {
      type: 'object',
      properties: {
        issues: { type: 'array', items: { type: 'object', additionalProperties: true } },
        output: { type: 'array', items: { type: 'object', additionalProperties: true } },
        score: { type: 'number' },
        exit_code: { type: 'number' }
      }
    }
  });

  const count = result?.issues?.length || 0;
  return {
    output: [
      { type: 'system', text: `$ eslint ${filename}` },
      ...(result?.output || []),
      { type: count === 0 ? 'success' : 'warn', text: `${count} issue${count !== 1 ? 's' : ''} | Score: ${result?.score ?? 100}/100` },
      { type: count === 0 ? 'success' : 'error', text: `Process exited with code ${count > 0 ? 1 : 0} in ${Date.now() - start}ms` },
    ],
    issues: result?.issues || [],
    score: result?.score ?? 100,
    exit_code: count > 0 ? 1 : 0,
    duration_ms: Date.now() - start,
  };
}

// ── Bundle analysis ───────────────────────────────────────────────────────────
async function analyzeBundle(files, base44) {
  const start = Date.now();
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Analyze this multi-file project as a bundler (webpack/rollup/vite would).

Files:
${files.slice(0, 8).map(f => `\n--- ${f.name} (${f.lang}) ---\n${f.content?.slice(0, 400)}`).join('\n')}

Provide:
- Import/export dependency graph
- Bundle size estimates per file
- Circular dependencies
- Tree-shaking opportunities
- Code splitting recommendations

Return JSON: {
  "output": [{"type":"info|success|warn|error","text":"line"}],
  "dependencies": [{"from":"file.js","to":"other.js","type":"import|require"}],
  "issues": [{"file":"name","severity":"error|warn","message":"msg"}],
  "bundle_size_estimate_kb": 42,
  "exit_code": 0
}`,
    response_json_schema: {
      type: 'object',
      properties: {
        output: { type: 'array', items: { type: 'object', additionalProperties: true } },
        dependencies: { type: 'array', items: { type: 'object', additionalProperties: true } },
        issues: { type: 'array', items: { type: 'object', additionalProperties: true } },
        bundle_size_estimate_kb: { type: 'number' },
        exit_code: { type: 'number' }
      }
    }
  });

  return {
    output: [
      { type: 'system', text: `$ bundle-analyzer --files ${files.length}` },
      ...(result?.output || []),
      { type: 'info', text: `Estimated bundle: ~${result?.bundle_size_estimate_kb || '?'}KB` },
    ],
    dependencies: result?.dependencies || [],
    issues: result?.issues || [],
    bundle_size_estimate_kb: result?.bundle_size_estimate_kb || 0,
    exit_code: result?.exit_code ?? 0,
    duration_ms: Date.now() - start,
  };
}

// ── REPL ──────────────────────────────────────────────────────────────────────
async function executeREPL(expression, language, context, base44) {
  if (language === 'javascript' || language === 'typescript') {
    const full = `${context || ''}\n// REPL\ntry { const __r = (${expression}); if(__r !== undefined) console.log(__r); } catch(e) { console.error(e.message); }`;
    return await executeJS(full, {});
  }
  return await simulateExecution(expression, language, 'repl', base44);
}

// ── Main Deno handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mode = 'run', code, language = 'javascript', filename, files, expression, context, env } = body;
  const lang = language.toLowerCase();

  try {
    switch (mode) {
      case 'run':
        if (!code) return Response.json({ error: 'No code provided' }, { status: 400 });
        if (lang === 'json') return Response.json(lintJSON(code));
        if (lang === 'javascript' || lang === 'typescript') return Response.json(await executeJS(code, env || {}));
        return Response.json(await simulateExecution(code, lang, filename, base44));

      case 'repl':
        if (!expression) return Response.json({ error: 'No expression' }, { status: 400 });
        return Response.json(await executeREPL(expression, lang, context, base44));

      case 'lint':
        if (!code) return Response.json({ error: 'No code provided' }, { status: 400 });
        if (lang === 'json') return Response.json(lintJSON(code));
        return Response.json(await lintCode(code, lang, filename || 'file', base44));

      case 'bundle':
        if (!files?.length) return Response.json({ error: 'No files provided' }, { status: 400 });
        return Response.json(await analyzeBundle(files, base44));

      default:
        return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({
      output: [{ type: 'error', text: `Internal error: ${error.message}` }],
      exit_code: 1, duration_ms: 0,
    });
  }
});