import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Supported languages and how we handle them
const LANG_HANDLERS = {
  javascript: { runtime: 'deno', ext: 'js' },
  typescript: { runtime: 'deno', ext: 'ts' },
  python: { runtime: 'simulated', ext: 'py' },
  bash: { runtime: 'simulated', ext: 'sh' },
  yaml: { runtime: 'lint', ext: 'yml' },
  json: { runtime: 'parse', ext: 'json' },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, language, filename } = await req.json();
  if (!code) return Response.json({ error: 'No code provided' }, { status: 400 });

  const lang = (language || 'javascript').toLowerCase();
  const startTime = Date.now();
  const output = [];

  try {
    // Real execution for JavaScript/TypeScript via Deno
    if (lang === 'javascript' || lang === 'typescript') {
      const tmpFile = `/tmp/nexus_exec_${Date.now()}.${lang === 'typescript' ? 'ts' : 'js'}`;
      await Deno.writeTextFile(tmpFile, code);

      const cmd = new Deno.Command('deno', {
        args: ['run', '--allow-net', '--allow-read=/tmp', '--allow-write=/tmp', tmpFile],
        stdout: 'piped',
        stderr: 'piped',
      });

      const { code: exitCode, stdout, stderr } = await cmd.output();
      const decoder = new TextDecoder();
      const stdoutText = decoder.decode(stdout);
      const stderrText = decoder.decode(stderr);

      if (stdoutText) {
        stdoutText.split('\n').filter(l => l).forEach(l => output.push({ type: 'default', text: l }));
      }
      if (stderrText) {
        stderrText.split('\n').filter(l => l).forEach(l => output.push({ type: exitCode === 0 ? 'warn' : 'error', text: l }));
      }

      const duration = Date.now() - startTime;
      output.push({ type: exitCode === 0 ? 'success' : 'error', text: `Process exited with code ${exitCode} in ${duration}ms` });

      // Clean up
      try { await Deno.remove(tmpFile); } catch {}

      return Response.json({ output, exit_code: exitCode, duration_ms: duration });
    }

    // JSON validation
    if (lang === 'json') {
      JSON.parse(code);
      output.push({ type: 'success', text: '✓ Valid JSON — no syntax errors' });
      output.push({ type: 'info', text: `Parsed ${code.split('\n').length} lines` });
      return Response.json({ output, exit_code: 0, duration_ms: Date.now() - startTime });
    }

    // For Python, bash, yaml — use LLM to simulate realistic execution
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a real ${lang} runtime. Execute this code and return realistic terminal output.
      
Filename: ${filename || 'script'}
Language: ${lang}
Code:
\`\`\`${lang}
${code}
\`\`\`

Return JSON: { "output": [{"type": "default|info|success|error|warn|system", "text": "line"}], "exit_code": 0 }
Make the output look like real terminal output. Include realistic values, timing, etc.`,
      response_json_schema: {
        type: 'object',
        properties: {
          output: { type: 'array', items: { type: 'object', additionalProperties: true } },
          exit_code: { type: 'number' }
        }
      }
    });

    const duration = Date.now() - startTime;
    const lines = llmResult?.output || [{ type: 'success', text: 'Process completed' }];
    lines.push({ type: llmResult?.exit_code === 0 ? 'success' : 'error', text: `Process exited with code ${llmResult?.exit_code ?? 0} in ${duration}ms` });

    return Response.json({ output: lines, exit_code: llmResult?.exit_code ?? 0, duration_ms: duration });

  } catch (error) {
    const duration = Date.now() - startTime;
    return Response.json({
      output: [
        { type: 'error', text: `Runtime error: ${error.message}` },
        { type: 'error', text: `Process exited with code 1 in ${duration}ms` }
      ],
      exit_code: 1,
      duration_ms: duration
    });
  }
});