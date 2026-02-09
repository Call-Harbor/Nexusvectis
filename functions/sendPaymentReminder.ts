import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { invoice_id } = await req.json();

    // Get invoice and organization details
    const invoice = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    if (!invoice || invoice.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const inv = invoice[0];
    const organization = await base44.asServiceRole.entities.Organization.filter({ id: inv.organization_id });
    
    if (!organization || organization.length === 0) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = organization[0];

    // Calculate days overdue
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));

    // Send payment reminder email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: org.admin_email,
      subject: `Payment Reminder: Invoice ${inv.invoice_number} - ${daysOverdue} days overdue`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">NexusVectis</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Fleet Intelligence Platform</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #ef4444; margin-top: 0;">Payment Reminder</h2>
            
            <p style="color: #475569; font-size: 16px;">Dear ${org.name},</p>
            
            <p style="color: #475569; font-size: 16px;">
              This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> is now <strong>${daysOverdue} days overdue</strong>.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Period:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${inv.period_month}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">${new Date(inv.due_date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 20px; font-weight: bold;">€${inv.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #475569; font-size: 16px;">
              Please arrange payment at your earliest convenience to avoid service interruption.
            </p>
            
            ${daysOverdue > 10 ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0; font-weight: bold;">⚠️ Important Notice</p>
                <p style="color: #991b1b; margin: 5px 0 0 0;">
                  Your account may be suspended if payment is not received within the next few days.
                </p>
              </div>
            ` : ''}
            
            <p style="color: #475569; font-size: 14px; margin-top: 30px;">
              If you have any questions or have already made payment, please contact us immediately.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                NexusVectis ApS | Denmark<br>
                Email: billing@nexusvectis.com
              </p>
            </div>
          </div>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Payment reminder sent successfully',
      days_overdue: daysOverdue
    });

  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});