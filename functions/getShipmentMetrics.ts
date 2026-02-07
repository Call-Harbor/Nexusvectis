import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization_id } = await req.json();

    const shipments = await base44.asServiceRole.entities.Shipment.filter({ organization_id });

    // Calculate metrics
    const metrics = {
      total_shipments: shipments.length,
      
      // Status breakdown
      by_status: shipments.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {}),
      
      // Cargo type distribution
      by_cargo_type: shipments.reduce((acc, s) => {
        acc[s.cargo_type] = (acc[s.cargo_type] || 0) + 1;
        return acc;
      }, {}),
      
      // Priority distribution
      by_priority: shipments.reduce((acc, s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
        return acc;
      }, {}),
      
      // Delivery performance
      on_time_deliveries: shipments.filter(s => s.status === 'delivered' && s.actual_delivery <= s.eta).length,
      late_deliveries: shipments.filter(s => s.status === 'delivered' && s.actual_delivery > s.eta).length,
      on_time_rate: ((shipments.filter(s => s.status === 'delivered' && s.actual_delivery <= s.eta).length / 
                      shipments.filter(s => s.status === 'delivered').length) * 100).toFixed(1) || '0',
      
      // Weight & Temperature
      total_weight_kg: shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0),
      average_weight_kg: (shipments.reduce((sum, s) => sum + (s.weight_kg || 0), 0) / shipments.length).toFixed(1),
      cold_chain_shipments: shipments.filter(s => s.cargo_type === 'cold_chain').length,
      hazardous_shipments: shipments.filter(s => s.cargo_type === 'hazardous').length,
      
      // Temperature compliance (for cold chain)
      temp_compliant: shipments.filter(s => 
        s.cargo_type === 'cold_chain' && 
        s.current_temperature >= s.temperature_min && 
        s.current_temperature <= s.temperature_max
      ).length,
      
      // ETA accuracy
      average_eta_confidence: (shipments.filter(s => s.eta_confidence)
        .reduce((sum, s) => sum + s.eta_confidence, 0) / 
        shipments.filter(s => s.eta_confidence).length).toFixed(1) || '0',
      
      // Sustainability
      total_co2_emissions: shipments.reduce((sum, s) => sum + (s.co2_emissions_kg || 0), 0),
      average_co2_per_shipment: (shipments.reduce((sum, s) => sum + (s.co2_emissions_kg || 0), 0) / shipments.length).toFixed(2)
    };

    return Response.json({
      success: true,
      metrics
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});