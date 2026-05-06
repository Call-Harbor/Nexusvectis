import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { nvError, nvJson, nvOptions, resolveRequestId } from '../_shared/apiHttp.ts';

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req);

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return nvError(requestId, String('Unauthorized'), 401);

    }

    const { entity_type, format = 'json', filters = {} } = await req.json();

    if (!entity_type) {
      return nvError(requestId, String('entity_type required'), 400);

    }

    const validEntities = ['Vehicle', 'Route', 'Shipment', 'Resource', 'Alert', 'Maintenance', 'Exception'];
    if (!validEntities.includes(entity_type)) {
      return nvJson(requestId, { 
        error: `Invalid entity_type. Must be one of: ${validEntities.join(', ')}` 
      }, 400);

    }

    const orgId = user.organization_id || user.data?.organization_id;
    filters.organization_id = orgId;

    // Fetch data
    const data = await base44.asServiceRole.entities[entity_type].filter(filters);

    // Format response based on format
    if (format === 'csv') {
      if (data.length === 0) {
        return new Response('No data', { 
          status: 200,
          headers: { 
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${entity_type.toLowerCase()}_export.csv"`
          }
        });
      }

      // Generate CSV
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (value === null || value === undefined) return '';
          const strValue = String(value).replace(/"/g, '""');
          return strValue.includes(',') ? `"${strValue}"` : strValue;
        });
        csvRows.push(values.join(','));
      }

      return new Response(csvRows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${entity_type.toLowerCase()}_export.csv"`
        }
      });
    }

    // JSON format (default)
    return nvJson(requestId, {
      success: true,
      entity_type,
      count: data.length,
      exported_at: new Date().toISOString(),
      data
    });

  } catch (error) {
    return nvError(requestId, String(error.message), 500);

  }
});