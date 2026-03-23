import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = await req.json();

    const resources = await base44.asServiceRole.entities.Resource.filter({ organization_id });

    // Calculate utilization metrics
    const utilization = {
      total_resources: resources.length,
      
      // By type
      by_type: resources.reduce((acc, r) => {
        if (!acc[r.type]) {
          acc[r.type] = { count: 0, total_capacity: 0, total_current: 0, operational: 0 };
        }
        acc[r.type].count++;
        acc[r.type].total_capacity += r.capacity || 0;
        acc[r.type].total_current += r.current_level || 0;
        if (r.status === 'operational') acc[r.type].operational++;
        return acc;
      }, {}),
      
      // Status distribution
      by_status: resources.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      
      // Capacity metrics
      total_capacity: resources.reduce((sum, r) => sum + (r.capacity || 0), 0),
      total_utilized: resources.reduce((sum, r) => sum + (r.current_level || 0), 0),
      overall_utilization_rate: ((resources.reduce((sum, r) => sum + (r.current_level || 0), 0) / 
                                  resources.reduce((sum, r) => sum + (r.capacity || 0), 1)) * 100).toFixed(1),
      
      // Critical resources
      over_capacity: resources.filter(r => (r.current_level || 0) > (r.capacity || 0)).length,
      near_capacity: resources.filter(r => {
        const util = (r.current_level || 0) / (r.capacity || 1);
        return util > 0.8 && util <= 1;
      }).length,
      under_utilized: resources.filter(r => {
        const util = (r.current_level || 0) / (r.capacity || 1);
        return util < 0.3;
      }).length,
      
      // Operational efficiency
      operational_rate: ((resources.filter(r => r.status === 'operational').length / resources.length) * 100).toFixed(1),
      offline_resources: resources.filter(r => r.status === 'offline').length,
      
      // Location distribution
      unique_locations: [...new Set(resources.map(r => r.location))].length,
      resources_with_coordinates: resources.filter(r => r.latitude && r.longitude).length
    };

    // Calculate averages per type
    Object.keys(utilization.by_type).forEach(type => {
      const typeData = utilization.by_type[type];
      typeData.avg_utilization = ((typeData.total_current / typeData.total_capacity) * 100).toFixed(1);
      typeData.operational_rate = ((typeData.operational / typeData.count) * 100).toFixed(1);
    });

    return Response.json({
      success: true,
      utilization
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});