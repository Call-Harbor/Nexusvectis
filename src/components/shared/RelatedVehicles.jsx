import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RelatedVehicles({ filterKey, filterValue, title = "Related Vehicles" }) {
  const navigate = useNavigate();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['relatedVehicles', filterKey, filterValue],
    queryFn: async () => {
      if (!filterValue) return [];
      const filter = { [filterKey]: filterValue };
      return await base44.entities.Vehicle.filter(filter, '-created_date', 50);
    },
    enabled: !!filterValue
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-6">
          <p className="text-slate-400 text-sm">Loading vehicles...</p>
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "maintenance": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "offline": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          {title} ({vehicles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
            onClick={() => navigate(createPageUrl('Fleet'))}
          >
            <div className="flex-1">
              <p className="text-white font-medium">{vehicle.name}</p>
              <p className="text-slate-400 text-xs">{vehicle.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(vehicle.status)}>
                {vehicle.status}
              </Badge>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}