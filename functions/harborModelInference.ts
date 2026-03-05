import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  // Allow GET for health check
  if (req.method === 'GET') {
    return Response.json({ status: 'HARBOR Model Inference API — online', version: '1.0' });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { model_id, input } = body;

    if (!model_id) {
      return Response.json({ error: 'model_id is required' }, { status: 400 });
    }

    // Fetch model from DB
    const models = await base44.asServiceRole.entities.FleetAIModel.filter({ snapshot_id: model_id });
    if (!models || models.length === 0) {
      return Response.json({ error: `Model not found: ${model_id}` }, { status: 404 });
    }

    const model = models[0];

    // Run inference via LLM using model config
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the HARBOR AI inference engine running model "${model.name}" (accuracy: ${model.accuracy}%, version: ${model.version}).
Given this input data: ${JSON.stringify(input || {})}, provide a logistics intelligence response.
Include: prediction, confidence score (0-100), recommended actions, and any anomalies detected.`,
      response_json_schema: {
        type: 'object',
        properties: {
          prediction: { type: 'string' },
          confidence: { type: 'number' },
          recommended_actions: { type: 'array', items: { type: 'string' } },
          anomalies: { type: 'array', items: { type: 'string' } },
          model_used: { type: 'string' },
          timestamp: { type: 'string' }
        }
      }
    });

    return Response.json({
      status: 'success',
      model: {
        id: model.snapshot_id,
        name: model.name,
        accuracy: model.accuracy,
        version: model.version
      },
      result: {
        ...result,
        model_used: model.name,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});