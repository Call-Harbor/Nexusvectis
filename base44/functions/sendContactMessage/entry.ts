import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { name, email, company, message, subject } = body;

    if (!name || !email || !message) {
      return nvError(requestId, String('Missing required fields'), 400);

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

    return nvJson(requestId, { success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error('Error sending contact message:', error);
    return nvError(requestId, String(error.message), 500);

  }
});