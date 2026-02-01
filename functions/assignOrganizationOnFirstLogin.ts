import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user doesn't have organization_id, they need to create one or join one
    if (!user.organization_id) {
      return Response.json({ 
        needsOrganization: true,
        message: 'User needs to create or join an organization'
      });
    }

    return Response.json({ 
      needsOrganization: false,
      organization_id: user.organization_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});