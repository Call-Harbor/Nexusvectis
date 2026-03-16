import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { memberId, newRole } = await req.json();
        if (!memberId || !newRole) return Response.json({ error: 'Missing memberId or newRole' }, { status: 400 });
        if (newRole === 'alpha') return Response.json({ error: 'Cannot assign alpha role' }, { status: 403 });

        const orgId = user.organization_id;
        if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });

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
            return Response.json({ error: 'Forbidden: Only admins can change roles' }, { status: 403 });
        }

        // Get the target member
        const targets = await base44.asServiceRole.entities.OrganizationMember.filter({ id: memberId });
        const target = targets[0];
        if (!target) return Response.json({ error: 'Member not found' }, { status: 404 });
        if (target.user_email === org?.admin_email) {
            return Response.json({ error: 'Cannot change the alpha owner\'s role' }, { status: 403 });
        }
        if (target.organization_id !== orgId) {
            return Response.json({ error: 'Member not in your organization' }, { status: 403 });
        }

        await base44.asServiceRole.entities.OrganizationMember.update(memberId, { role: newRole });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});