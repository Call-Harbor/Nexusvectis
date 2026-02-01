import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger invoice generation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all organizations
    const organizations = await base44.asServiceRole.entities.Organization.list();
    
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const periodMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // Due date: 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const generatedInvoices = [];

    for (const org of organizations) {
      // Count vehicles for this organization
      const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
        created_by: org.admin_email
      });

      const unitCount = vehicles.length;
      const pricePerUnit = 200;
      const totalAmount = unitCount * pricePerUnit;

      // Check if invoice already exists for this period
      const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
        organization_id: org.id,
        period_month: periodMonth
      });

      if (existingInvoices.length > 0) {
        console.log(`Invoice already exists for ${org.name} for ${periodMonth}`);
        continue;
      }

      // Generate invoice number
      const invoiceNumber = `INV-${org.id.slice(0, 8)}-${periodMonth.replace('-', '')}`;

      // Create invoice
      const invoice = await base44.asServiceRole.entities.Invoice.create({
        organization_id: org.id,
        invoice_number: invoiceNumber,
        period_month: periodMonth,
        unit_count: unitCount,
        price_per_unit: pricePerUnit,
        total_amount: totalAmount,
        status: 'pending',
        due_date: dueDateStr
      });

      generatedInvoices.push(invoice);

      // Send email notification to organization admin
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: org.admin_email,
          subject: `Ny faktura fra NexusVectis - ${periodMonth}`,
          body: `
            <h2>Ny faktura</h2>
            <p>Hej,</p>
            <p>Din faktura for ${periodMonth} er klar.</p>
            <p><strong>Fakturanummer:</strong> ${invoiceNumber}</p>
            <p><strong>Antal enheder:</strong> ${unitCount}</p>
            <p><strong>Pris pr. enhed:</strong> ${pricePerUnit} kr</p>
            <p><strong>Total beløb:</strong> ${totalAmount} kr</p>
            <p><strong>Forfaldsdato:</strong> ${dueDateStr}</p>
            <p>Log ind på din konto for at se fakturaen.</p>
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