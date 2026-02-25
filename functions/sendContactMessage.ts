import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { name, email, company, message, subject } = body;

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Route to appropriate email based on subject
    const emailMap = {
      'demo': 'sales@nexusvectis.com',
      'enterprise': 'enterprise@nexusvectis.com',
      'support': 'support@nexusvectis.com',
      'partnership': 'sales@nexusvectis.com',
      'general': 'support@nexusvectis.com'
    };

    const recipientEmail = emailMap[subject] || 'support@nexusvectis.com';

    // Send email to support team
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `New Contact Form Submission: ${subject}`,
      body: `
New message from: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}
Subject: ${subject}

Message:
${message}
      `
    });

    // Send confirmation email to user
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'We received your message',
      body: `
Hi ${name},

Thank you for reaching out to NexusVectis. We've received your message and will get back to you within 24 hours.

Best regards,
The NexusVectis Team
      `
    });

    return Response.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});