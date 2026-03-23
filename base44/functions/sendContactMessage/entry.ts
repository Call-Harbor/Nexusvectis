import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { name, email, company, message, subject } = body;

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save contact message to database
    await base44.asServiceRole.entities.ContactMessage.create({
      name,
      email,
      company: company || '',
      subject: subject || 'general',
      message,
      status: 'new'
    });

    return Response.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});