import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Handles both recording a variant impression and recording a conversion
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { action } = body;

        if (action === 'record_impression') {
            // Called when an anonymous visitor lands on the home page
            const { anonymous_id, variant_type, variant_index, variant_value, seo_metrics_id } = body;

            // Check if we already have a record for this visitor + variant_type
            const existing = await base44.asServiceRole.entities.ABTestConversion.filter({
                anonymous_id,
                variant_type
            });

            if (existing && existing.length > 0) {
                // Update visit count
                const record = existing[0];
                await base44.asServiceRole.entities.ABTestConversion.update(record.id, {
                    visit_count: (record.visit_count || 1) + 1
                });
                return Response.json({ success: true, action: 'updated_visit_count', id: record.id });
            } else {
                // Create new impression record
                const created = await base44.asServiceRole.entities.ABTestConversion.create({
                    anonymous_id,
                    variant_type,
                    variant_index,
                    variant_value,
                    seo_metrics_id: seo_metrics_id || null,
                    converted: false,
                    visit_count: 1,
                    first_seen_at: new Date().toISOString()
                });
                return Response.json({ success: true, action: 'created', id: created.id });
            }

        } else if (action === 'record_conversion') {
            // Called when a visitor registers/logs in for the first time
            const { anonymous_id, user_email } = body;

            // Find all impression records for this anonymous visitor
            const records = await base44.asServiceRole.entities.ABTestConversion.filter({
                anonymous_id,
                converted: false
            });

            if (!records || records.length === 0) {
                return Response.json({ success: true, action: 'no_impressions_found' });
            }

            const converted_at = new Date().toISOString();

            // Mark all their variant impressions as converted
            for (const record of records) {
                const first_seen = new Date(record.first_seen_at || record.created_date);
                const time_to_convert_minutes = Math.round(
                    (new Date(converted_at) - first_seen) / 60000
                );
                await base44.asServiceRole.entities.ABTestConversion.update(record.id, {
                    converted: true,
                    converted_user_email: user_email,
                    converted_at,
                    time_to_convert_minutes
                });
            }

            return Response.json({ success: true, action: 'conversion_recorded', count: records.length });

        } else {
            return Response.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error) {
        console.error('AB Test Tracker Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});