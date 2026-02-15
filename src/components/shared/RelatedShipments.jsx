import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function RelatedShipments({ filterKey, filterValue, title = "Related Shipments" }) {
  const navigate = useNavigate();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['relatedShipments', filterKey, filterValue],
    queryFn: async () => {
      if (!filterValue) return [];
      const filter = { [filterKey]: filterValue };
      return await base44.entities.Shipment.filter(filter, '-created_date', 50);
    },
    enabled: !!filterValue
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-6">
          <p className="text-slate-400 text-sm">Loading shipments...</p>
        </CardContent>
      </Card>
    );
  }

  if (shipments.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_transit": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "delayed": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-400" />
          {title} ({shipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shipments.map((shipment) => (
          <div
            key={shipment.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
            onClick={() => navigate(createPageUrl('Shipments'))}
          >
            <div className="flex-1">
              <p className="text-white font-medium">{shipment.tracking_number}</p>
              <p className="text-slate-400 text-xs">
                {shipment.origin} → {shipment.destination}
              </p>
              {shipment.eta && (
                <p className="text-slate-500 text-xs mt-1">
                  ETA: {moment(shipment.eta).format('MMM DD, HH:mm')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(shipment.status)}>
                {shipment.status}
              </Badge>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}