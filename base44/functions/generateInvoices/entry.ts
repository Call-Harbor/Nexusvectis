import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Country-specific VAT rates and legal requirements
const TAX_RULES = {
  'Denmark': { vat_rate: 25, requires_vat_id: true, payment_terms_days: 14 },
  'Germany': { vat_rate: 19, requires_vat_id: true, payment_terms_days: 14 },
  'Sweden': { vat_rate: 25, requires_vat_id: true, payment_terms_days: 30 },
  'Norway': { vat_rate: 25, requires_vat_id: true, payment_terms_days: 14 },
  'USA': { vat_rate: 0, requires_vat_id: false, payment_terms_days: 30 },
  'UK': { vat_rate: 20, requires_vat_id: true, payment_terms_days: 30 },
  'Netherlands': { vat_rate: 21, requires_vat_id: true, payment_terms_days: 14 },
  'France': { vat_rate: 20, requires_vat_id: true, payment_terms_days: 30 },
  'Spain': { vat_rate: 21, requires_vat_id: true, payment_terms_days: 30 },
  'Italy': { vat_rate: 22, requires_vat_id: true, payment_terms_days: 30 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled automation runs with service role — no user auth needed

    // Get seller information from InvoiceSettings
    const invoiceSettings = await base44.asServiceRole.entities.InvoiceSettings.list();
    const SELLER_INFO = invoiceSettings.length > 0 ? {
      name: invoiceSettings[0].company_name,
      vat_number: invoiceSettings[0].vat_number,
      address: invoiceSettings[0].company_address,
      country: invoiceSettings[0].company_country,
      email: invoiceSettings[0].company_email,
      phone: invoiceSettings[0].company_phone,
      bank_account: invoiceSettings[0].bank_account,
      bank_swift: invoiceSettings[0].bank_swift
    } : {
      name: 'Nexus Vectis',
      vat_number: 'DK12345678',
      address: 'Vesterbrogade 123, 1620 København V, Denmark',
      country: 'Denmark'
    };

    // Get all organizations
    const organizations = await base44.asServiceRole.entities.Organization.list();
    
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const periodMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const issueDate = currentDate.toISOString().split('T')[0];

    const generatedInvoices = [];

    for (const org of organizations) {
      // Count vehicles and resources for this organization
      const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
        organization_id: org.id
      });
      
      const resources = await base44.asServiceRole.entities.Resource.filter({
        organization_id: org.id
      });

      // Find last invoice for this organization to determine billing window
      const existingInvoicesForOrg = await base44.asServiceRole.entities.Invoice.filter({
        organization_id: org.id
      });
      const sortedPrevInvoices = existingInvoicesForOrg
        .filter(i => i.status !== 'cancelled')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const lastInvoiceDate = sortedPrevInvoices.length > 0
        ? new Date(sortedPrevInvoices[0].created_date)
        : new Date(0); // All time if no previous invoice

      const periodStart = lastInvoiceDate;
      const periodEnd = currentDate;
      
      const allFleetAIUsage = await base44.asServiceRole.entities.FleetAIUsage.filter({ 
        organization_id: org.id 
      }) || [];
      const fleetAICommands = (Array.isArray(allFleetAIUsage) ? allFleetAIUsage : []).filter(usage => {
        const usageDate = new Date(usage.created_date);
        return usageDate > periodStart && usageDate <= periodEnd && usage.success;
      }).length;

      // Count API calls since last invoice (split standard vs Harbor premium)
      const allAPIUsage = await base44.asServiceRole.entities.APIUsage.filter({ 
        organization_id: org.id 
      }) || [];
      const periodAPIUsage = (Array.isArray(allAPIUsage) ? allAPIUsage : []).filter(usage => {
        const usageDate = new Date(usage.created_date);
        return usageDate > periodStart && usageDate <= periodEnd && usage.status_code < 400;
      });
      const harborCalls = periodAPIUsage.filter(u => u.endpoint && u.endpoint.includes('/harbor/intelligence') && !u.endpoint.includes('harborIntellectAPI') && !u.endpoint.includes('Orchestrator')).length;
      const intellectCalls = periodAPIUsage.filter(u => u.endpoint && (u.endpoint.includes('harborIntellectAPI') || u.endpoint.includes('Intellect'))).length;
      const orchestratorCalls = periodAPIUsage.filter(u => u.endpoint && u.endpoint.includes('Orchestrator')).length;
      const apiCalls = periodAPIUsage.filter(u => !u.endpoint || (!u.endpoint.includes('/harbor/intelligence') && !u.endpoint.includes('harborIntellectAPI') && !u.endpoint.includes('Intellect') && !u.endpoint.includes('Orchestrator'))).length;

      const vehicleCount = vehicles.length;
      const resourceCount = resources.length;
      
      const vehiclePriceEuro = 15;
      const resourcePriceEuro = 40;
      const fleetAIPricePer100 = 5;
      const apiPricePer100 = 5;
      const harborPricePerCall = 0.25;
      const intellectPricePerCall = 0.50;
      const orchestratorPricePerCall = 0.50;
      const addonPrice = 2000;

      // Check if add-ons have been active for 48+ hours (once activated, billed for entire period even if deactivated)
      const HOURS_48_MS = 48 * 60 * 60 * 1000;
      const periodCheckDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      let addonAirportOps = false;
      let addonPortCommand = false;
      let addonTransitControl = false;
      
      // Addon is billed if: activated within/before period AND reached 48 hours by period end
      if (org.addon_airport_ops_activated_at) {
        const activatedAt = new Date(org.addon_airport_ops_activated_at);
        const hoursSinceActivation = periodCheckDate - activatedAt;
        addonAirportOps = hoursSinceActivation >= HOURS_48_MS;
      }
      
      if (org.addon_port_command_activated_at) {
        const activatedAt = new Date(org.addon_port_command_activated_at);
        const hoursSinceActivation = periodCheckDate - activatedAt;
        addonPortCommand = hoursSinceActivation >= HOURS_48_MS;
      }
      
      if (org.addon_transit_control_activated_at) {
        const activatedAt = new Date(org.addon_transit_control_activated_at);
        const hoursSinceActivation = periodCheckDate - activatedAt;
        addonTransitControl = hoursSinceActivation >= HOURS_48_MS;
      }
      
      const vehicleTotal = vehicleCount * vehiclePriceEuro;
      const resourceTotal = resourceCount * resourcePriceEuro;
      const fleetAITotal = Math.ceil(fleetAICommands / 100) * fleetAIPricePer100;
      const apiTotal = Math.ceil(apiCalls / 100) * apiPricePer100;
      const harborTotal = harborCalls * harborPricePerCall;
      const intellectTotal = intellectCalls * intellectPricePerCall;
      const orchestratorTotal = orchestratorCalls * orchestratorPricePerCall;
      const airportOpsTotal = addonAirportOps ? addonPrice : 0;
      const portCommandTotal = addonPortCommand ? addonPrice : 0;
      const transitControlTotal = addonTransitControl ? addonPrice : 0;
      
      // Determine tax rules based on buyer country
      const buyerCountry = org.headquarters_country || 'Denmark';
      const taxRules = TAX_RULES[buyerCountry] || TAX_RULES['Denmark'];

      // Calculate VAT
      const subtotal = vehicleTotal + resourceTotal + fleetAITotal + apiTotal + harborTotal + intellectTotal + orchestratorTotal + airportOpsTotal + portCommandTotal + transitControlTotal;
      const isEUCrossBorder = buyerCountry !== 'Denmark' && taxRules.requires_vat_id;
      const reverseCharge = isEUCrossBorder; // EU B2B reverse charge
      const vatRate = reverseCharge ? 0 : taxRules.vat_rate;
      const vatAmount = (subtotal * vatRate) / 100;
      const totalAmount = subtotal + vatAmount;
      
      // Due date based on country
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + taxRules.payment_terms_days);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      // Create line items
      const lineItems = [];
      if (vehicleCount > 0) {
        lineItems.push({
          description: 'Fleet Management - Vehicles',
          quantity: vehicleCount,
          unit_price: vehiclePriceEuro,
          total: vehicleTotal
        });
      }
      if (resourceCount > 0) {
        lineItems.push({
          description: 'Fleet Management - Resources',
          quantity: resourceCount,
          unit_price: resourcePriceEuro,
          total: resourceTotal
        });
      }
      if (fleetAICommands > 0) {
        lineItems.push({
          description: `FLEET AI IntellectMode (${fleetAICommands} commands)`,
          quantity: Math.ceil(fleetAICommands / 100),
          unit_price: fleetAIPricePer100,
          total: fleetAITotal
        });
      }
      if (apiCalls > 0) {
        lineItems.push({
          description: `REST API Calls (${apiCalls} calls)`,
          quantity: Math.ceil(apiCalls / 100),
          unit_price: apiPricePer100,
          total: apiTotal
        });
      }
      if (harborCalls > 0) {
        lineItems.push({
          description: `Harbor Core Intelligence API (${harborCalls} calls @ €${harborPricePerCall}/call)`,
          quantity: harborCalls,
          unit_price: harborPricePerCall,
          total: harborTotal
        });
      }
      if (intellectCalls > 0) {
        lineItems.push({
          description: `H.A.R.B.O.R. Intellect Chat API (${intellectCalls} calls @ €${intellectPricePerCall}/call) — Claude Sonnet 4.6`,
          quantity: intellectCalls,
          unit_price: intellectPricePerCall,
          total: intellectTotal
        });
      }
      if (orchestratorCalls > 0) {
        lineItems.push({
          description: `H.A.R.B.O.R. Orchestrator API (${orchestratorCalls} calls @ €${orchestratorPricePerCall}/call) — 50+ AI Agents`,
          quantity: orchestratorCalls,
          unit_price: orchestratorPricePerCall,
          total: orchestratorTotal
        });
      }
      if (addonAirportOps) {
        lineItems.push({
          description: 'Airport Ops Center — Månedslicens (Add-on)',
          quantity: 1,
          unit_price: addonPrice,
          total: airportOpsTotal
        });
      }
      if (addonPortCommand) {
        lineItems.push({
          description: 'Port Command Center — Månedslicens (Add-on)',
          quantity: 1,
          unit_price: addonPrice,
          total: portCommandTotal
        });
      }
      if (addonTransitControl) {
        lineItems.push({
          description: 'Transit Control — Månedslicens (Add-on)',
          quantity: 1,
          unit_price: addonPrice,
          total: transitControlTotal
        });
      }
      
      // Legal notes based on country
      let legalNotes = '';
      if (reverseCharge) {
        legalNotes = 'Reverse charge - VAT is payable by the recipient according to EU Directive 2006/112/EC Article 196.';
      } else if (taxRules.requires_vat_id) {
        legalNotes = `VAT included at ${vatRate}% rate according to ${buyerCountry} tax legislation.`;
      } else {
        legalNotes = 'No VAT applied - service provided to non-EU entity.';
      }

      // Skip if last invoice was less than 1 day ago (prevent double-billing)
      const hoursSinceLastInvoice = (currentDate - lastInvoiceDate) / (1000 * 60 * 60);
      if (hoursSinceLastInvoice < 24 && sortedPrevInvoices.length > 0) {
        console.log(`Invoice generated too recently for ${org.name}, skipping`);
        continue;
      }

      // Period label: from last invoice date (or epoch) to now
      const periodLabel = sortedPrevInvoices.length > 0
        ? `${lastInvoiceDate.toISOString().split('T')[0]} – ${currentDate.toISOString().split('T')[0]}`
        : `All time – ${currentDate.toISOString().split('T')[0]}`;

      // Generate invoice number with year prefix (legal requirement in many countries)
      const invoiceNumber = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${org.id.slice(0, 8)}`;

      // Create invoice with all legally required fields
      const invoice = await base44.asServiceRole.entities.Invoice.create({
        organization_id: org.id,
        invoice_number: invoiceNumber,
        period_month: periodLabel,
        issue_date: issueDate,
        vehicle_count: vehicleCount,
        resource_count: resourceCount,
        vehicle_price_euro: vehiclePriceEuro,
        resource_price_euro: resourcePriceEuro,
        fleetai_commands: fleetAICommands,
         fleetai_price_per_100: fleetAIPricePer100,
         api_calls: apiCalls,
         api_price_per_100: apiPricePer100,
         harbor_intelligence_calls: harborCalls,
         harbor_intelligence_price_per_call: harborPricePerCall,
         harbor_intellect_calls: intellectCalls,
         harbor_intellect_price_per_call: intellectPricePerCall,
         harbor_orchestrator_calls: orchestratorCalls,
         harbor_orchestrator_price_per_call: orchestratorPricePerCall,
         addon_airport_ops: addonAirportOps,
        addon_port_command: addonPortCommand,
        addon_transit_control: addonTransitControl,
        addon_airport_ops_price: airportOpsTotal,
        addon_port_command_price: portCommandTotal,
        addon_transit_control_price: transitControlTotal,
        subtotal: subtotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'pending',
        due_date: dueDateStr,
        payment_terms: `Net ${taxRules.payment_terms_days} days`,
        currency: 'EUR',
        seller_name: SELLER_INFO.name,
        seller_vat_number: SELLER_INFO.vat_number,
        seller_address: SELLER_INFO.address,
        seller_country: SELLER_INFO.country,
        buyer_name: org.name,
        buyer_country: buyerCountry,
        buyer_address: org.address || (org.headquarters_city ? `${org.headquarters_city}, ${buyerCountry}` : buyerCountry),
        buyer_vat_number: org.vat_number || org.company_registration || '',
        line_items: lineItems,
        reverse_charge: reverseCharge,
        notes: legalNotes
      });

      generatedInvoices.push(invoice);
      
      // Deactivate add-ons immediately if they didn't reach 48 hours
      // Add-ons that reached 48 hours stay active, will be deactivated next period
      const updateData = {};
      
      if (org.addon_airport_ops_activated_at && !addonAirportOps) {
        updateData.addon_airport_ops = false;
        updateData.addon_airport_ops_activated_at = null;
      }
      if (org.addon_port_command_activated_at && !addonPortCommand) {
        updateData.addon_port_command = false;
        updateData.addon_port_command_activated_at = null;
      }
      if (org.addon_transit_control_activated_at && !addonTransitControl) {
        updateData.addon_transit_control = false;
        updateData.addon_transit_control_activated_at = null;
      }
      
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Organization.update(org.id, updateData);
      }

      // Send email notification to organization admin
      try {
        const vatDisplay = reverseCharge 
          ? '<p><strong>VAT:</strong> Reverse charge applies - VAT is payable by recipient</p>'
          : `<p><strong>VAT (${vatRate}%):</strong> €${vatAmount.toFixed(2)}</p>`;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: org.admin_email,
          subject: `New Invoice from NexusVectis - ${periodMonth}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0ea5e9;">New Invoice</h2>
              <p>Hello,</p>
              <p>Your invoice for ${periodMonth} is ready.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Issue Date:</strong> ${issueDate}</p>
                <p><strong>Due Date:</strong> ${dueDateStr}</p>
                <p><strong>Payment Terms:</strong> Net ${taxRules.payment_terms_days} days</p>
              </div>
              
              <h3>Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #e2e8f0;">
                    <th style="padding: 10px; text-align: left;">Description</th>
                    <th style="padding: 10px; text-align: right;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehicleCount > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Fleet Management - Vehicles</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${vehicleCount}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${vehiclePriceEuro}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${vehicleTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${resourceCount > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Fleet Management - Resources</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${resourceCount}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${resourcePriceEuro}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${resourceTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${fleetAICommands > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">FLEET AI IntellectMode (${fleetAICommands} commands)</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${Math.ceil(fleetAICommands / 100)}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${fleetAIPricePer100}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${fleetAITotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${apiCalls > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">REST API Calls (${apiCalls} calls)</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${Math.ceil(apiCalls / 100)}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${apiPricePer100}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${apiTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${harborCalls > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Harbor Core Intelligence API (${harborCalls} calls) <span style="background:#fef3c7;color:#92400e;font-size:11px;padding:2px 6px;border-radius:4px;font-weight:bold;">PREMIUM</span></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${harborCalls}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${harborPricePerCall}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${harborTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${intellectCalls > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">H.A.R.B.O.R. Intellect Chat API (${intellectCalls} calls) <span style="background:#e9d5ff;color:#6b21a8;font-size:11px;padding:2px 6px;border-radius:4px;font-weight:bold;">ULTRA</span></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${intellectCalls}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${intellectPricePerCall}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${intellectTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  ${orchestratorCalls > 0 ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">H.A.R.B.O.R. Orchestrator API (${orchestratorCalls} calls) <span style="background:#e0e7ff;color:#3730a3;font-size:11px;padding:2px 6px;border-radius:4px;font-weight:bold;">ULTRA</span></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${orchestratorCalls}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${orchestratorPricePerCall}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${orchestratorTotal.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  </tbody>
              </table>
              
              <div style="margin-top: 20px; text-align: right;">
                <p><strong>Subtotal:</strong> €${subtotal.toFixed(2)}</p>
                ${vatDisplay}
                <p style="font-size: 18px; font-weight: bold; color: #0ea5e9;"><strong>Total Amount:</strong> €${totalAmount.toFixed(2)}</p>
              </div>
              
              ${reverseCharge ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Reverse Charge:</strong> VAT is payable by the recipient according to EU Directive 2006/112/EC Article 196.
                </p>
              </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                <p><strong>Seller:</strong> ${SELLER_INFO.name} | ${SELLER_INFO.vat_number}</p>
                <p>${SELLER_INFO.address}</p>
              </div>
              
              <p style="margin-top: 20px;">Log in to your account to view the full invoice details.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${org.admin_email}:`, emailError);
      }
    }

    return Response.json({
      success: true,
      message: `Generated ${generatedInvoices.length} invoices`,
      invoices: generatedInvoices
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});