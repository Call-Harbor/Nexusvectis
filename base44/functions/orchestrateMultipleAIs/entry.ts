import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const AI_MODELS = {
  analyzer: 'data_analysis_model',
  optimizer: 'optimization_engine',
  predictor: 'prediction_model',
  visualizer: 'visualization_engine',
  summarizer: 'summary_model',
  researcher: 'research_agent',
  validator: 'validation_engine',
  transformer: 'transformation_tool',
  generator: 'generation_model',
  integrator: 'integration_engine',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { task, workerType, orchestrationId, taskId } = body;

    if (!task || !workerType) {
      return Response.json({ error: 'Missing task or workerType' }, { status: 400 });
    }

    // Parallel execution of multiple analysis passes
    const analyses = await Promise.all([
      // Pass 1: Direct analysis
      analyzeTask(task, workerType, base44),
      // Pass 2: Context enrichment
      enrichContext(task, base44),
      // Pass 3: Multi-perspective
      multiPerspectiveAnalysis(task, workerType, base44),
      // Pass 4: Cross-reference
      crossReferenceInsights(task, base44),
      // Pass 5: Predictive modeling
      predictiveModeling(task, base44),
    ]);

    // Synthesize all analyses
    const synthesized = synthesizeResults(analyses, workerType);

    // Execute specialized worker logic
    const workerOutput = await executeWorker(workerType, task, synthesized, base44);

    return Response.json({
      orchestrationId,
      taskId,
      workerType,
      output: workerOutput,
      analyses: synthesized,
      timestamp: new Date().toISOString(),
      parallelExecutions: 5
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function analyzeTask(task, workerType, base44) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `As a ${workerType}, analyze this task comprehensively: "${task}". Provide: 1. Core insight, 2. Key metrics, 3. Immediate actions. Be precise and data-driven.`,
      model: 'gpt_5',
      response_json_schema: {
        type: 'object',
        properties: {
          insight: { type: 'string' },
          metrics: { type: 'array', items: { type: 'string' } },
          actions: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    return { type: 'direct_analysis', data: result.data };
  } catch (e) {
    return { type: 'direct_analysis', error: e.message };
  }
}

async function enrichContext(task, base44) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide deep contextual enrichment for: "${task}". Include: 1. Industry standards, 2. Best practices, 3. Risk factors, 4. Opportunity gaps`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          standards: { type: 'array', items: { type: 'string' } },
          practices: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    return { type: 'context_enrichment', data: result.data };
  } catch (e) {
    return { type: 'context_enrichment', error: e.message };
  }
}

async function multiPerspectiveAnalysis(task, workerType, base44) {
  try {
    const perspectives = ['technical', 'business', 'user', 'strategic'];
    const results = await Promise.all(perspectives.map(perspective =>
      base44.integrations.Core.InvokeLLM({
        prompt: `From a ${perspective} perspective, what are the key points for: "${task}"? List top 5 insights.`,
        response_json_schema: {
          type: 'object',
          properties: { insights: { type: 'array', items: { type: 'string' } } }
        }
      })
    ));
    return { type: 'multi_perspective', data: Object.fromEntries(perspectives.map((p, i) => [p, results[i].data])) };
  } catch (e) {
    return { type: 'multi_perspective', error: e.message };
  }
}

async function crossReferenceInsights(task, base44) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Cross-reference and validate these insights: "${task}". Identify: 1. Common themes, 2. Contradictions, 3. Consensus areas, 4. Outliers`,
      response_json_schema: {
        type: 'object',
        properties: {
          themes: { type: 'array', items: { type: 'string' } },
          contradictions: { type: 'array', items: { type: 'string' } },
          consensus: { type: 'string' },
          outliers: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    return { type: 'cross_reference', data: result.data };
  } catch (e) {
    return { type: 'cross_reference', error: e.message };
  }
}

async function predictiveModeling(task, base44) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create predictive models for: "${task}". Include: 1. 30-day forecast, 2. 90-day scenario, 3. Risk probability, 4. Success factors`,
      response_json_schema: {
        type: 'object',
        properties: {
          forecast_30d: { type: 'string' },
          scenario_90d: { type: 'string' },
          risk_probability: { type: 'number' },
          success_factors: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    return { type: 'predictive_modeling', data: result.data };
  } catch (e) {
    return { type: 'predictive_modeling', error: e.message };
  }
}

function synthesizeResults(analyses, workerType) {
  const synthesized = {
    workerType,
    executedPasses: analyses.length,
    results: []
  };

  analyses.forEach(analysis => {
    if (analysis.data) {
      synthesized.results.push({
        type: analysis.type,
        insights: analysis.data
      });
    }
  });

  // Merge all insights into cohesive output
  const allInsights = synthesized.results.map(r => r.insights).flat();
  synthesized.synthesis = {
    totalInsights: allInsights.length,
    primaryInsight: allInsights[0],
    secondaryInsights: allInsights.slice(1, 4),
    relatedFindings: allInsights.slice(4)
  };

  return synthesized;
}

async function executeWorker(workerType, task, synthesized, base44) {
  const workerPrompts = {
    analyzer: `Provide comprehensive data analysis. Data: ${JSON.stringify(synthesized.synthesis)}. Format: structured JSON with metrics.`,
    optimizer: `Optimize based on: ${task}. Recommendations: ${JSON.stringify(synthesized.synthesis)}. Format: actionable steps.`,
    predictor: `Predict outcomes for: ${task}. Based on: ${JSON.stringify(synthesized.synthesis)}. Format: probability scenarios.`,
    visualizer: `Generate visualization specs for: ${task}. Data: ${JSON.stringify(synthesized.synthesis)}. Format: chart recommendations.`,
    summarizer: `Create executive summary for: ${task}. Synthesis: ${JSON.stringify(synthesized.synthesis)}. Format: bullet points + narrative.`,
    researcher: `Research findings on: ${task}. Context: ${JSON.stringify(synthesized.synthesis)}. Format: sources + insights.`,
    validator: `Validate accuracy of: ${task}. Criteria: ${JSON.stringify(synthesized.synthesis)}. Format: validation report.`,
    transformer: `Transform insights into: ${task}. Source: ${JSON.stringify(synthesized.synthesis)}. Format: transformation steps.`,
    generator: `Generate content for: ${task}. Based on: ${JSON.stringify(synthesized.synthesis)}. Format: creative output.`,
    integrator: `Integrate findings for: ${task}. Components: ${JSON.stringify(synthesized.synthesis)}. Format: integrated solution.`,
  };

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: workerPrompts[workerType] || workerPrompts.analyzer,
      model: 'gpt_5'
    });
    return result.data;
  } catch (e) {
    return `Worker ${workerType} executed with synthesis. Error: ${e.message}`;
  }
}