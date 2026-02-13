import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
    const user = await base44.auth.me();

    // Only admins can trigger invoice generation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

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
      name: 'NexusVectis ApS',
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

      // Count FLEET AI usage for current period
      const periodStart = new Date(lastMonth);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const allFleetAIUsage = await base44.asServiceRole.entities.FleetAIUsage.filter({ 
        organization_id: org.id 
      });
      const fleetAICommands = allFleetAIUsage.filter(usage => {
        const usageDate = new Date(usage.created_date);
        return usageDate >= periodStart && usageDate < periodEnd && usage.success;
      }).length;

      // Count API calls for current period
      const allAPIUsage = await base44.asServiceRole.entities.APIUsage.filter({ 
        organization_id: org.id 
      });
      const apiCalls = allAPIUsage.filter(usage => {
        const usageDate = new Date(usage.created_date);
        return usageDate >= periodStart && usageDate < periodEnd && usage.status_code < 400;
      }).length;

      const vehicleCount = vehicles.length;
      const resourceCount = resources.length;
      
      const vehiclePriceEuro = 15;
      const resourcePriceEuro = 40;
      const fleetAIPricePer100 = 5;
      const apiPricePer100 = 5;
      
      const vehicleTotal = vehicleCount * vehiclePriceEuro;
      const resourceTotal = resourceCount * resourcePriceEuro;
      const fleetAITotal = Math.ceil(fleetAICommands / 100) * fleetAIPricePer100;
      const apiTotal = Math.ceil(apiCalls / 100) * apiPricePer100;
      
      // Determine tax rules based on buyer country
      const buyerCountry = org.headquarters_country || 'Denmark';
      const taxRules = TAX_RULES[buyerCountry] || TAX_RULES['Denmark'];

      // Calculate VAT
      const subtotal = vehicleTotal + resourceTotal + fleetAITotal + apiTotal;
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
      
      // Legal notes based on country
      let legalNotes = '';
      if (reverseCharge) {
        legalNotes = 'Reverse charge - VAT is payable by the recipient according to EU Directive 2006/112/EC Article 196.';
      } else if (taxRules.requires_vat_id) {
        legalNotes = `VAT included at ${vatRate}% rate according to ${buyerCountry} tax legislation.`;
      } else {
        legalNotes = 'No VAT applied - service provided to non-EU entity.';
      }

      // Check if invoice already exists for this period
      const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
        organization_id: org.id,
        period_month: periodMonth
      });

      if (existingInvoices.length > 0) {
        console.log(`Invoice already exists for ${org.name} for ${periodMonth}`);
        continue;
      }

      // Generate invoice number with year prefix (legal requirement in many countries)
      const invoiceNumber = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${org.id.slice(0, 8)}`;

      // Create invoice with all legally required fields
      const invoice = await base44.asServiceRole.entities.Invoice.create({
        organization_id: org.id,
        invoice_number: invoiceNumber,
        period_month: periodMonth,
        issue_date: issueDate,
        vehicle_count: vehicleCount,
        resource_count: resourceCount,
        vehicle_price_euro: vehiclePriceEuro,
        resource_price_euro: resourcePriceEuro,
        fleetai_commands: fleetAICommands,
        fleetai_price_per_100: fleetAIPricePer100,
        api_calls: apiCalls,
        api_price_per_100: apiPricePer100,
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
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">FLEET AI Commands (${fleetAICommands} commands)</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${Math.ceil(fleetAICommands / 100)}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${fleetAIPricePer100}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">€${fleetAITotal.toFixed(2)}</td>
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