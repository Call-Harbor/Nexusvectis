import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If user already has organization_id, nothing to do
    if (user.organization_id) {
      return Response.json({ 
        needsOrganization: false,
        organization_id: user.organization_id
      });
    }

    // Check if user has a pending OrganizationMember invite
    const members = await base44.asServiceRole.entities.OrganizationMember.filter({ 
      user_email: user.email 
    });

    const activeMember = members.find(m => m.status === 'invited' || m.status === 'active');

    if (activeMember) {
      // Assign the organization to the user
      await base44.auth.updateMe({ organization_id: activeMember.organization_id });

      // Mark the member record as active
      if (activeMember.status === 'invited') {
        await base44.asServiceRole.entities.OrganizationMember.update(activeMember.id, { status: 'active' });
      }

      return Response.json({ 
        needsOrganization: false,
        organization_id: activeMember.organization_id,
        joined: true
      });
    }

    // No organization found — user needs to create one
    return Response.json({ 
      needsOrganization: true,
      message: 'User needs to create or join an organization'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});