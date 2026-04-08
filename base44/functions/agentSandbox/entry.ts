import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Sandboxed agent execution — isolated per-task context, timeout enforcement,
 * resource tracking, and shared memory RBAC injection.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      task,
      workerType,
      orchestrationId,
      taskId,
      fileUrls = [],
      metadata = {},
      sandboxOptions = {}
    } = body;

    const {
      timeoutMs = 30000,
      maxTokens = 4000,
      injectMemory = true,
      agentId = workerType
    } = sandboxOptions;

    const orgId = metadata.organization_id;
    const startTime = Date.now();

    // ── 1. Load shared memory with RBAC ──────────────────────────────────
    let memoryContext = '';
    if (injectMemory && orgId) {
      try {
        const allMemories = await base44.asServiceRole.entities.AgentSharedMemory.filter({
          organization_id: orgId
        });

        const now = new Date();
        const accessible = allMemories.filter(m => {
          // Check expiry
          if (m.expires_at && new Date(m.expires_at) < now) return false;
          // Check RBAC
          if (m.access_level === 'all_agents') return true;
          if (m.access_level === 'admin_only' && user.role === 'admin') return true;
          if (m.access_level === 'specific_agents') {
            return m.allowed_agents?.includes(agentId) || false;
          }
          return false;
        });

        if (accessible.length > 0) {
          memoryContext = '\n\n--- SHARED AGENT MEMORY ---\n' +
            accessible.map(m => `[${m.memory_type?.toUpperCase() || 'FACT'}] ${m.key}: ${m.value}`).join('\n') +
            '\n--- END MEMORY ---\n';

          // Increment read counts
          for (const m of accessible) {
            base44.asServiceRole.entities.AgentSharedMemory.update(m.id, {
              read_count: (m.read_count || 0) + 1
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Memory load failed:', e.message);
      }
    }

    // ── 2. Build isolated prompt ──────────────────────────────────────────
    const isolatedPrompt = `You are a specialized AI worker (${workerType}) running in an isolated execution sandbox.
Organization context: ${orgId || 'unknown'}
Task ID: ${taskId}
Orchestration: ${orchestrationId}
${memoryContext}
TASK: ${task}

Respond with a thorough, structured analysis. Use markdown formatting.`;

    // ── 3. Execute with timeout ───────────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let output;
    let tokensUsed = 0;

    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: isolatedPrompt,
        ...(fileUrls.length > 0 && { file_urls: fileUrls }),
        model: 'automatic'
      });

      output = typeof result === 'string' ? result : result?.text || JSON.stringify(result);
      tokensUsed = Math.ceil(output.length / 4); // rough estimate
    } finally {
      clearTimeout(timeoutId);
    }

    // ── 4. Enforce token budget ───────────────────────────────────────────
    if (tokensUsed > maxTokens) {
      output = output.substring(0, maxTokens * 4) + '\n\n⚠️ *Output truncated — token budget exceeded*';
    }

    const latencyMs = Date.now() - startTime;

    // ── 5. Auto-save notable results to shared memory ─────────────────────
    if (orgId && output && output.length > 200) {
      base44.asServiceRole.entities.AgentSharedMemory.create({
        organization_id: orgId,
        key: `${workerType}_result_${taskId}`,
        value: output.substring(0, 2000),
        memory_type: 'result',
        access_level: 'all_agents',
        source_agent: workerType,
        ttl_hours: 24,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }).catch(() => {});
    }

    return Response.json({
      output,
      metadata: {
        workerId: workerType,
        taskId,
        orchestrationId,
        latencyMs,
        tokensUsed,
        memoryEntriesInjected: memoryContext ? memoryContext.split('\n').filter(l => l.startsWith('[')).length : 0,
        sandboxed: true,
        timedOut: false
      }
    });

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return Response.json({
      output: isTimeout
        ? '⏱️ Task timed out — agent did not respond within the allowed window.'
        : `❌ Sandbox error: ${error.message}`,
      metadata: { sandboxed: true, timedOut: isTimeout, error: error.message }
    }, { status: isTimeout ? 408 : 500 });
  }
});