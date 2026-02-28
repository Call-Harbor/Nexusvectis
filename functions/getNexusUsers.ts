import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Use service role to list all users (bypasses per-user security rules)
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);

    // Return all users except the current user
    const users = allUsers
      .filter(u => u.email !== user.email)
      .map(u => ({ id: u.id, name: u.full_name, email: u.email }));

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});