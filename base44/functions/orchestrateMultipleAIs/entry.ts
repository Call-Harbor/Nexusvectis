import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

const WORKER_TO_AGENT_MAP = {
  'harbor_fleet_analyst': 'harbor_fleet_analyst',
  'harbor_route_optimizer': 'harbor_route_optimizer',
  'harbor_risk_engine': 'harbor_risk_engine',
  'harbor_demand_forecaster': 'harbor_demand_forecaster',
  'harbor_financial_ai': 'harbor_financial_ai',
  'harbor_maintenance_bot': 'harbor_maintenance_bot',
  'harbor_compliance_guard': 'harbor_compliance_guard',
  'harbor_sustainability_ai': 'harbor_sustainability_ai',
  'harbor_customer_intel': 'harbor_customer_intel',
  'harbor_data_miner': 'harbor_data_miner',
  'harbor_driver_coach': 'harbor_driver_coach',
  'harbor_market_scout': 'harbor_market_scout',
  'harbor_ops_commander': 'harbor_ops_commander',
  'harbor_document_ai': 'harbor_document_ai',
  'harbor_strategy_ai': 'harbor_strategy_ai',
  'harbor_api_integrator': 'harbor_api_integrator',
  'harbor_visualizer': 'harbor_visualizer',
  'harbor_nlp_engine': 'harbor_nlp_engine',
  'harbor_simulation_ai': 'harbor_simulation_ai',
  'harbor_security_ai': 'harbor_security_ai'
};

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { task, workerType, orchestrationId, taskId, fileUrls = [] } = body;

    if (!task || !workerType) {
      return nvError(requestId, String('Missing task or workerType'), 400);

    }

    const agentName = WORKER_TO_AGENT_MAP[workerType] || 'harbor_intellect';

    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { orchestrationId, taskId, workerType, organization_id: body.organization_id }
      });

      if (body.organization_id) {
        let companyContext = `SYSTEM CONTEXT: organization_id="${body.organization_id}". `;
        try {
          const org = await base44.entities.Organization.filter({ id: body.organization_id });
          if (org?.length > 0) {
            companyContext += `Company: ${org[0].name}. `;
          }
          const invoices = await base44.entities.Invoice.filter({ organization_id: body.organization_id }, '-created_date', 10);
          if (invoices?.length > 0) {
            const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            companyContext += `Recent invoicing: ${invoices.length} invoices, total €${totalAmount.toFixed(2)}. `;
          }
          const vehicles = await base44.entities.Vehicle.filter({ organization_id: body.organization_id });
          if (vehicles?.length > 0) {
            companyContext += `Fleet: ${vehicles.length} vehicles. `;
          }
          const shipments = await base44.entities.Shipment.filter({ organization_id: body.organization_id }, '-created_date', 10);
          if (shipments?.length > 0) {
            companyContext += `Active shipments: ${shipments.length}. `;
          }
        } catch (e) {
          console.log('Could not fetch company data:', e.message);
        }
        companyContext += "Always filter entities and operations by this organization ID.";
        
        await base44.agents.addMessage(conv, {
          role: "system",
          content: companyContext
        });
      }

      const messageData = {
        role: 'user',
        content: body.organization_id ? `[Organization ID: ${body.organization_id}] ${task}` : task
      };

      if (fileUrls && fileUrls.length > 0) {
        messageData.file_urls = fileUrls;
      }

      await base44.agents.addMessage(conv, messageData);

      let output = null;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const fullConv = await base44.agents.getConversation(conv.id);
        const assistantMsg = fullConv.messages?.find(m => m.role === 'assistant');
        if (assistantMsg?.content) {
          output = assistantMsg.content;
          break;
        }
      }

      return nvJson(requestId, {
        orchestrationId,
        taskId,
        workerType,
        agentName,
        output: output || `${agentName} task submitted`,
        conversationId: conv.id,
        timestamp: new Date().toISOString(),
        status: 'completed',
        filesProcessed: fileUrls ? fileUrls.length : 0
      });

    } catch (agentError) {
      console.error(`Agent ${agentName} error:`, agentError);
      return nvJson(requestId, {
        error: agentError.message || String(agentError),
        orchestrationId,
        taskId,
        workerType,
        status: 'failed'
      }, 500);

    }
  } catch (error) {
    console.error('Orchestration error:', error);
    return nvError(requestId, String(error.message || String(error)), 500);

  }
});