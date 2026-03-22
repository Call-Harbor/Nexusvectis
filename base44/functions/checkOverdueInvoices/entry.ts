import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all pending/overdue invoices
    const allInvoices = await base44.asServiceRole.entities.Invoice.list();
    const pendingInvoices = allInvoices.filter(inv => 
      inv.status === 'pending' || inv.status === 'overdue'
    );

    const results = {
      checked: pendingInvoices.length,
      marked_overdue: 0,
      reminders_sent: 0,
      errors: []
    };

    for (const invoice of pendingInvoices) {
      try {
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        // Mark as overdue if past due date
        if (daysOverdue > 0 && invoice.status === 'pending') {
          await base44.asServiceRole.entities.Invoice.update(invoice.id, {
            status: 'overdue'
          });
          results.marked_overdue++;
        }

        // Send reminder at 10 days overdue
        if (daysOverdue === 10) {
          const organization = await base44.asServiceRole.entities.Organization.filter({ 
            id: invoice.organization_id 
          });
          
          if (organization && organization.length > 0) {
            const org = organization[0];
            
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: org.admin_email,
              subject: `URGENT: Payment Required - Invoice ${invoice.invoice_number}`,
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Payment Required</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 18px;">10 Days Overdue</p>
                  </div>
                  
                  <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #dc2626; margin-top: 0;">Urgent: Account Suspension Warning</h2>
                    
                    <p style="color: #475569; font-size: 16px;">Dear ${org.name},</p>
                    
                    <p style="color: #475569; font-size: 16px;">
                      Invoice <strong>${invoice.invoice_number}</strong> is now <strong>10 days overdue</strong>.
                    </p>
                    
                    <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <p style="color: #991b1b; margin: 0; font-weight: bold; font-size: 18px;">⚠️ Your account may be suspended</p>
                      <p style="color: #991b1b; margin: 10px 0 0 0;">
                        Please make payment immediately to avoid service interruption.
                      </p>
                    </div>
                    
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #64748b;">Invoice:</td>
                          <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${invoice.invoice_number}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b;">Amount:</td>
                          <td style="padding: 8px 0; color: #dc2626; font-size: 20px; font-weight: bold;">€${invoice.total_amount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
                          <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b;">Days Overdue:</td>
                          <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">10 days</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #475569; font-size: 16px;">
                      Contact us immediately at billing@nexusvectis.com if you have any questions.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        NexusVectis ApS | Denmark
                      </p>
                    </div>
                  </div>
                </div>
              `
            });
            
            results.reminders_sent++;
          }
        }
      } catch (error) {
        results.errors.push({ 
          invoice_id: invoice.id, 
          error: error.message 
        });
      }
    }

    return Response.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Error checking overdue invoices:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});