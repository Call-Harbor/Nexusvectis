import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { organization_id, invoice_id } = await req.json();

    // Get organization and invoice
    const organization = await base44.asServiceRole.entities.Organization.filter({ id: organization_id });
    if (!organization || organization.length === 0) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = organization[0];
    const invoice = await base44.asServiceRole.entities.Invoice.filter({ id: invoice_id });
    const inv = invoice[0];

    // Update organization settings to suspended
    await base44.asServiceRole.entities.Organization.update(organization_id, {
      settings: {
        ...org.settings,
        suspended: true,
        suspended_date: new Date().toISOString(),
        suspended_reason: `Non-payment of invoice ${inv.invoice_number}`,
        suspended_invoice_id: invoice_id
      }
    });

    // Send suspension notification email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: org.admin_email,
      subject: `Account Suspended - Immediate Action Required`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Account Suspended</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #dc2626; margin-top: 0;">Immediate Action Required</h2>
            
            <p style="color: #475569; font-size: 16px;">Dear ${org.name},</p>
            
            <p style="color: #475569; font-size: 16px;">
              Your NexusVectis account has been <strong>suspended</strong> due to non-payment of invoice <strong>${inv.invoice_number}</strong>.
            </p>
            
            <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: bold; font-size: 18px;">Your account is now suspended</p>
              <p style="color: #991b1b; margin: 10px 0 0 0;">
                You will not be able to access the platform until payment is received.
              </p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0f172a; margin-top: 0;">Outstanding Invoice</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Invoice:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Amount:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-size: 20px; font-weight: bold;">€${inv.total_amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Period:</td>
                  <td style="padding: 8px 0; color: #0f172a;">${inv.period_month}</td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #0f172a;">To Restore Access:</h3>
            <ol style="color: #475569; font-size: 16px; line-height: 1.8;">
              <li>Make payment immediately</li>
              <li>Contact our billing department with payment confirmation</li>
              <li>Your account will be reactivated within 24 hours of payment verification</li>
            </ol>
            
            <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
              <p style="color: #475569; margin: 0; font-size: 14px;">
                <strong>Need Help?</strong><br>
                Contact us immediately at billing@nexusvectis.com
              </p>
            </div>
            
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
      message: 'Organization suspended successfully',
      organization_id,
      invoice_id
    });

  } catch (error) {
    console.error('Error suspending organization:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});