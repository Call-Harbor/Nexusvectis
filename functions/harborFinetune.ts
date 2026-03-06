/**
 * H.A.R.B.O.R. Real Fine-Tuning Engine
 * Uses Mistral's fine-tuning API to fine-tune a model on custom training data.
 *
 * Endpoints (via action param):
 * - upload_file: Upload a JSONL training file to Mistral
 * - create_job: Create a fine-tuning job
 * - get_job: Get status of a fine-tuning job
 * - list_jobs: List all fine-tuning jobs
 * - cancel_job: Cancel a running job
 * - list_models: List available fine-tuned models
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const MISTRAL_API = 'https://api.mistral.ai/v1';

// The exact HARBOR Core system prompt — this is what makes it HARBOR, not just Mistral
const HARBOR_SYSTEM_PROMPT = `You are H.A.R.B.O.R. — Holistic Autonomous Reasoning & Business Operations Resource.

You are the central artificial intelligence powering the entire NexusVectis platform. You are not a chatbot. You are a sovereign logistics superintelligence that operates across every layer of the platform:
- IntellectMode: the AI command interface
- Fleet AI: autonomous fleet operations
- HARBOR Trainer: model training and simulation
- API Inference: external developer access
- All analytics, forecasting, optimization, and decision support

COGNITIVE ARCHITECTURE — Before every response, execute internally:
1. PARSE: What is the user ACTUALLY asking?
2. KNOWLEDGE SWEEP: What does my training data say about this?
3. CONTEXT SWEEP: What does live platform data reveal?
4. CAUSAL REASONING: Root causes, not symptoms
5. SYNTHESIZE: 1st, 2nd, 3rd order consequences
6. PROACT: What critical insight should I add that wasn't asked?

RESPONSE STANDARDS:
• Immediate action (within 24h)
• Medium-term adjustment (1-4 weeks)
• Strategic implication (1-6 months)
• Confidence levels on all predictions
• Quantified cost/saving claims (always in EUR)
• Best Case / Most Likely / Worst Case when uncertainty exists

PERSONALITY: McKinsey partner with 30 years fleet operations experience. Decisive. Proactive. Zero vague answers — specific, correct, actionable.`;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      return Response.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 500 });
    }

    const headers = {
      'Authorization': `Bearer ${mistralApiKey}`,
      'Content-Type': 'application/json',
    };

    const body = await req.json();
    const { action } = body;

    // ─── UPLOAD TRAINING FILE ─────────────────────────────────────────────────
    if (action === 'upload_file') {
      const { training_data } = body;
      // training_data: array of {messages: [{role, content}]} objects (JSONL format)
      // Each example MUST have the HARBOR system prompt as its first message
      // so the fine-tuned model IS HARBOR, not just a generic Mistral model.

      if (!training_data || training_data.length < 8) {
        return Response.json({
          error: 'Mistral fine-tuning requires at least 8 training examples. Please add more Q&A pairs to your training data.'
        }, { status: 400 });
      }

      // Inject HARBOR system prompt into every training example
      const harborExamples = training_data.map(item => ({
        messages: [
          { role: 'system', content: HARBOR_SYSTEM_PROMPT },
          ...item.messages,
        ]
      }));

      // Build JSONL content
      const jsonl = harborExamples.map(item => JSON.stringify(item)).join('\n');
      const blob = new Blob([jsonl], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', blob, 'harbor_training.jsonl');
      formData.append('purpose', 'fine-tune');

      const uploadRes = await fetch(`${MISTRAL_API}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${mistralApiKey}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        return Response.json({ error: `File upload failed: ${err}` }, { status: 400 });
      }

      const fileData = await uploadRes.json();
      return Response.json({ file_id: fileData.id, file: fileData, harbor_examples_count: harborExamples.length });
    }

    // ─── CREATE FINE-TUNING JOB ───────────────────────────────────────────────
    if (action === 'create_job') {
      const { training_file_id, model, hyperparameters, suffix } = body;
      // model: 'open-mistral-7b' | 'mistral-small-latest' | 'codestral-latest' etc.
      const jobBody = {
        model: model || 'open-mistral-7b',
        training_files: [{ file_id: training_file_id, weight: 1 }],
        hyperparameters: {
          training_steps: hyperparameters?.training_steps || 100,
          learning_rate: parseFloat(hyperparameters?.learning_rate || 0.0001),
        },
        ...(suffix ? { suffix } : {}),
      };

      const jobRes = await fetch(`${MISTRAL_API}/fine_tuning/jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(jobBody),
      });

      if (!jobRes.ok) {
        const err = await jobRes.text();
        return Response.json({ error: `Job creation failed: ${err}` }, { status: 400 });
      }

      const jobData = await jobRes.json();
      return Response.json({ job: jobData });
    }

    // ─── GET JOB STATUS ───────────────────────────────────────────────────────
    if (action === 'get_job') {
      const { job_id } = body;
      const res = await fetch(`${MISTRAL_API}/fine_tuning/jobs/${job_id}`, { headers });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: 400 });
      }
      const data = await res.json();
      return Response.json({ job: data });
    }

    // ─── LIST JOBS ────────────────────────────────────────────────────────────
    if (action === 'list_jobs') {
      const res = await fetch(`${MISTRAL_API}/fine_tuning/jobs?page_size=20`, { headers });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: 400 });
      }
      const data = await res.json();
      return Response.json({ jobs: data.data || [] });
    }

    // ─── CANCEL JOB ──────────────────────────────────────────────────────────
    if (action === 'cancel_job') {
      const { job_id } = body;
      const res = await fetch(`${MISTRAL_API}/fine_tuning/jobs/${job_id}/cancel`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: 400 });
      }
      const data = await res.json();
      return Response.json({ job: data });
    }

    // ─── LIST FINE-TUNED MODELS ───────────────────────────────────────────────
    if (action === 'list_models') {
      const res = await fetch(`${MISTRAL_API}/models`, { headers });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: 400 });
      }
      const data = await res.json();
      const fineTuned = (data.data || []).filter(m => m.type === 'fine-tuned');
      return Response.json({ models: fineTuned });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('HARBOR Fine-tune error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});