import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const orgId = user.organization_id;
        if (!orgId) return Response.json({ error: 'No organization' }, { status: 400 });

        // Get all org members using service role
        const members = await base44.asServiceRole.entities.OrganizationMember.filter({
            organization_id: orgId
        });

        const activeMembers = members.filter(m => m.status !== 'removed');

        // Get all platform users using service role
        const allUsers = await base44.asServiceRole.entities.User.list();

        // Match users to members
        const memberEmails = activeMembers.map(m => m.user_email);
        const matchedUsers = allUsers.filter(u => memberEmails.includes(u.email));

        // Build result: matched users + members without a user record yet (invited)
        const matchedEmails = matchedUsers.map(u => u.email);
        const pendingMembers = activeMembers
            .filter(m => !matchedEmails.includes(m.user_email))
            .map(m => ({
                id: m.id,
                email: m.user_email,
                full_name: m.user_email,
                created_date: m.created_date,
                memberStatus: m.status,
                memberRole: m.role,
            }));

        const result = [
            ...matchedUsers.map(u => {
                const member = activeMembers.find(m => m.user_email === u.email);
                return {
                    ...u,
                    memberStatus: member?.status || 'active',
                    memberRole: member?.role || 'user',
                };
            }),
            ...pendingMembers,
        ];

        return Response.json({ users: result });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});