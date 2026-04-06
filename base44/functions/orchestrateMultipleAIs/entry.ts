import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { task, workerType, orchestrationId, taskId, fileUrls = [] } = body;

    if (!task || !workerType) {
      return Response.json({ error: 'Missing task or workerType' }, { status: 400 });
    }

    // Get the correct agent name
    const agentName = WORKER_TO_AGENT_MAP[workerType] || workerType;

    try {
      // Create conversation for this specific worker
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { orchestrationId, taskId, workerType, organization_id: body.organization_id }
      });

      // Send org context as system message
      if (body.organization_id) {
        // Fetch company data for context
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
        companyContext += "Always filter entities and operations by this organization ID. Use current data for analysis.";
        
        await base44.agents.addMessage(conv, {
          role: "system",
          content: companyContext
        });
      }

      // Send task with files to the agent
      const messageData = {
        role: 'user',
        content: task
      };

      if (fileUrls && fileUrls.length > 0) {
        messageData.file_urls = fileUrls;
      }

      await base44.agents.addMessage(conv, messageData);

      // Wait for agent response (give it time to respond)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fullConv = await base44.agents.getConversation(conv.id);
      const agentResponse = fullConv.messages?.find(m => m.role === 'assistant');
      
      const output = agentResponse?.content || `${agentName} processing complete`;

      return Response.json({
        orchestrationId,
        taskId,
        workerType,
        agentName,
        output,
        conversationId: conv.id,
        timestamp: new Date().toISOString(),
        status: 'completed',
        filesProcessed: fileUrls ? fileUrls.length : 0
      });
    } catch (agentError) {
      console.error(`Agent ${agentName} error:`, agentError.message);
      return Response.json({
        error: agentError.message,
        orchestrationId,
        taskId,
        workerType,
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});