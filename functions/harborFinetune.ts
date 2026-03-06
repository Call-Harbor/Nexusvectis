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
      if (!training_data || training_data.length < 8) {
        return Response.json({
          error: 'Mistral fine-tuning requires at least 8 training examples. Please add more Q&A pairs to your training data.'
        }, { status: 400 });
      }

      // Build JSONL content
      const jsonl = training_data.map(item => JSON.stringify(item)).join('\n');
      const blob = new Blob([jsonl], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', blob, 'training.jsonl');
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
      return Response.json({ file_id: fileData.id, file: fileData });
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