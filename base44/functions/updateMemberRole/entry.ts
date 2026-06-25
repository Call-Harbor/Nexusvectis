import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return nvError(requestId, String('Unauthorized'), 401);


        const { memberId, newRole } = await req.json();
        if (!memberId || !newRole) return nvError(requestId, String('Missing memberId or newRole'), 400);

        if (newRole === 'alpha') return nvError(requestId, String('Cannot assign alpha role'), 403);


        const orgId = user.organization_id;
        if (!orgId) return nvError(requestId, String('No organization'), 400);


        // Verify requester is admin or alpha in this org
        const myMembers = await base44.asServiceRole.entities.OrganizationMember.filter({
            organization_id: orgId,
            user_email: user.email,
        });
        const myMember = myMembers[0];

        // Get org to find alpha
        const orgs = await base44.asServiceRole.entities.Organization.filter({ id: orgId });
        const org = orgs[0];
        const isAlpha = user.email === org?.admin_email;
        const isAdmin = myMember?.role === 'admin';

        if (!isAlpha && !isAdmin) {
            return nvError(requestId, String('Forbidden: Only admins can change roles'), 403);

        }

        // Get the target member
        const targets = await base44.asServiceRole.entities.OrganizationMember.filter({ id: memberId });
        const target = targets[0];
        if (!target) return nvError(requestId, String('Member not found'), 404);

        if (target.user_email === org?.admin_email) {
            return nvError(requestId, String('Cannot change the alpha owner\'s role'), 403);

        }
        if (target.organization_id !== orgId) {
            return nvError(requestId, String('Member not in your organization'), 403);

        }

        await base44.asServiceRole.entities.OrganizationMember.update(memberId, { role: newRole });

        return nvJson(requestId, { success: true });

    } catch (error) {
        return nvError(requestId, String(error.message), 500);

    }
});