import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { invoice_id } = await req.json();

    // Get invoice and organization
    const invoice = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoice || invoice.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = invoice[0];
    const organization = await base44.asServiceRole.entities.Organization.filter({ 
      id: inv.organization_id 
    });
    
    if (!organization || organization.length === 0) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = organization[0];

    // Cancel the invoice
    await base44.asServiceRole.entities.Invoice.update(invoice_id, { 
      status: 'cancelled' 
    });

    // Skip email for test invoices (invoice numbers starting with 'TEST-')
    if (inv.invoice_number.startsWith('TEST-')) {
      return Response.json({ 
        success: true, 
        message: 'Test invoice cancelled (no email sent)',
        invoice_id,
        credited_amount: inv.total_amount
      });
    }

    // Send credit note email only for real invoices
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: org.admin_email,
      subject: `Credit Note: Invoice ${inv.invoice_number} Cancelled`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nexus Vectis</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Credit Note</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #0f172a; margin-top: 0;">Credit Note</h2>
            
            <p style="color: #475569; font-size: 16px;">Dear ${org.name},</p>
            
            <p style="color: #475569; font-size: 16px;">
              Invoice <strong>${inv.invoice_number}</strong> has been cancelled. A credit note has been issued for the full amount.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #0f172a; margin-top: 0;">Credit Note Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Original Invoice:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Credit Note Date:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Period:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${inv.period_month}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Credited Amount:</td>
                  <td style="padding: 8px 0; color: #10b981; font-size: 20px; font-weight: bold;">€${inv.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0f172a; margin-top: 0;">Line Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 8px 0; text-align: left; color: #64748b; font-weight: normal;">Description</th>
                  <th style="padding: 8px 0; text-align: right; color: #64748b; font-weight: normal;">Qty</th>
                  <th style="padding: 8px 0; text-align: right; color: #64748b; font-weight: normal;">Unit Price</th>
                  <th style="padding: 8px 0; text-align: right; color: #64748b; font-weight: normal;">Total</th>
                </tr>
                ${inv.line_items?.map(item => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #0f172a;">${item.description}</td>
                    <td style="padding: 8px 0; text-align: right; color: #0f172a;">${item.quantity}</td>
                    <td style="padding: 8px 0; text-align: right; color: #0f172a;">€${item.unit_price.toFixed(2)}</td>
                    <td style="padding: 8px 0; text-align: right; color: #0f172a;">€${item.total.toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
                <tr>
                  <td colspan="3" style="padding: 12px 0; text-align: right; color: #64748b; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: bold;">€${inv.subtotal.toFixed(2)}</td>
                </tr>
                ${inv.vat_amount > 0 ? `
                  <tr>
                    <td colspan="3" style="padding: 8px 0; text-align: right; color: #64748b;">VAT (${inv.vat_rate}%):</td>
                    <td style="padding: 8px 0; text-align: right; color: #0f172a;">€${inv.vat_amount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${inv.reverse_charge ? `
                  <tr>
                    <td colspan="4" style="padding: 8px 0; color: #64748b; font-size: 12px;">
                      *Reverse Charge VAT applies
                    </td>
                  </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e2e8f0;">
                  <td colspan="3" style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: bold; font-size: 16px;">Total Credit:</td>
                  <td style="padding: 12px 0; text-align: right; color: #10b981; font-weight: bold; font-size: 20px;">€${inv.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #166534; margin: 0; font-weight: bold;">✓ No payment is required</p>
              <p style="color: #166534; margin: 5px 0 0 0;">
                This credit note cancels the original invoice. If you have already paid, the amount will be refunded or credited to your account.
              </p>
            </div>
            
            <p style="color: #475569; font-size: 14px; margin-top: 30px;">
              If you have any questions about this credit note, please contact us.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Nexus Vectis | Denmark<br>
                VAT: DK12345678<br>
                Email: billing@nexusvectis.com
              </p>
            </div>
          </div>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Invoice cancelled and credit note sent',
      invoice_id,
      credited_amount: inv.total_amount
    });

  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});