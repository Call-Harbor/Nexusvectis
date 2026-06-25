import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    // If user already has organization_id, nothing to do
    if (user.organization_id) {
      return nvJson(requestId, { 
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

      return nvJson(requestId, { 
        needsOrganization: false,
        organization_id: activeMember.organization_id,
        joined: true
      });

    }

    // No organization found — user needs to create one
    return nvJson(requestId, { 
      needsOrganization: true,
      message: 'User needs to create or join an organization'
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});