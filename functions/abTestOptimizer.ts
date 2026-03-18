import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Scheduled function: Analyzes A/B test results and updates SEOMetrics with winning variants
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Allow scheduled execution (no user auth needed for automation)
        let isAdmin = false;
        try {
            const user = await base44.auth.me();
            isAdmin = user?.role === 'admin';
        } catch (_) {
            // Called from automation - proceed with service role
            isAdmin = true;
        }

        if (!isAdmin) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all A/B test records
        const allRecords = await base44.asServiceRole.entities.ABTestConversion.list();

        if (!allRecords || allRecords.length === 0) {
            return Response.json({ success: true, message: 'No A/B test data yet' });
        }

        // Group by variant_type and variant_index
        const stats = {};
        for (const record of allRecords) {
            const key = `${record.variant_type}__${record.variant_index}`;
            if (!stats[key]) {
                stats[key] = {
                    variant_type: record.variant_type,
                    variant_index: record.variant_index,
                    variant_value: record.variant_value,
                    impressions: 0,
                    conversions: 0
                };
            }
            stats[key].impressions++;
            if (record.converted) stats[key].conversions++;
        }

        // Calculate conversion rates and find winners per variant_type
        const byType = {};
        for (const [key, data] of Object.entries(stats)) {
            data.conversion_rate = data.impressions > 0
                ? (data.conversions / data.impressions) * 100
                : 0;
            const type = data.variant_type;
            if (!byType[type]) byType[type] = [];
            byType[type].push(data);
        }

        // Find winning variant per type
        const winners = {};
        for (const [type, variants] of Object.entries(byType)) {
            // Need at least 10 impressions per variant to trust the data
            const qualified = variants.filter(v => v.impressions >= 10);
            if (qualified.length === 0) continue;
            const winner = qualified.reduce((best, v) =>
                v.conversion_rate > best.conversion_rate ? v : best
            );
            winners[type] = winner;
        }

        // Get the latest SEOMetrics record
        const seoMetrics = await base44.asServiceRole.entities.SEOMetrics.list('-created_date', 1);
        if (!seoMetrics || seoMetrics.length === 0) {
            return Response.json({ success: true, message: 'No SEOMetrics found', stats, winners });
        }

        const latestMetrics = seoMetrics[0];
        const updates = {};

        // Promote winning title variant to front of title_tag_variants array
        if (winners.title && latestMetrics.title_tag_variants?.length > 0) {
            const winnerValue = winners.title.variant_value;
            const remaining = latestMetrics.title_tag_variants.filter(v => v !== winnerValue);
            updates.title_tag_variants = [winnerValue, ...remaining];
        }

        // Promote winning meta_description variant
        if (winners.meta_description && latestMetrics.meta_description_variants?.length > 0) {
            const winnerValue = winners.meta_description.variant_value;
            const remaining = latestMetrics.meta_description_variants.filter(v => v !== winnerValue);
            updates.meta_description_variants = [winnerValue, ...remaining];
        }

        if (Object.keys(updates).length > 0) {
            await base44.asServiceRole.entities.SEOMetrics.update(latestMetrics.id, updates);
        }

        return Response.json({
            success: true,
            stats,
            winners,
            updates_applied: Object.keys(updates)
        });

    } catch (error) {
        console.error('AB Test Optimizer Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});