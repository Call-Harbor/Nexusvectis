import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return Response.json({ error: 'API key name is required' }, { status: 400 });
    }

    // Get user's organization
    const userData = await base44.entities.User.filter({ email: user.email });
    if (!userData || userData.length === 0 || !userData[0].organization_id) {
      return Response.json({ error: 'User must be assigned to an organization' }, { status: 400 });
    }

    const organization_id = userData[0].organization_id;

    // Generate a random API key
    const apiKey = `nvx_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const key_prefix = apiKey.substring(0, 12);

    // Hash the API key for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store the API key
    const apiKeyRecord = await base44.asServiceRole.entities.APIKey.create({
      organization_id,
      name,
      key_prefix,
      key_hash,
      status: 'active'
    });

    return Response.json({
      success: true,
      api_key: apiKey,
      key_id: apiKeyRecord.id,
      key_prefix,
      message: 'Save this API key securely - it will not be shown again'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});