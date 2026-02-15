import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function RelatedMaintenance({ filterKey, filterValue, title = "Related Maintenance" }) {
  const navigate = useNavigate();

  const { data: maintenance = [], isLoading } = useQuery({
    queryKey: ['relatedMaintenance', filterKey, filterValue],
    queryFn: async () => {
      if (!filterValue) return [];
      const filter = { [filterKey]: filterValue };
      return await base44.entities.Maintenance.filter(filter, '-scheduled_date', 50);
    },
    enabled: !!filterValue
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-6">
          <p className="text-slate-400 text-sm">Loading maintenance...</p>
        </CardContent>
      </Card>
    );
  }

  if (maintenance.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_progress": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "cancelled": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          {title} ({maintenance.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {maintenance.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
            onClick={() => navigate(createPageUrl('MaintenanceManagement'))}
          >
            <div className="flex-1">
              <p className="text-white font-medium">{item.component}</p>
              <p className="text-slate-400 text-xs">{item.type}</p>
              {item.scheduled_date && (
                <p className="text-slate-500 text-xs mt-1">
                  {moment(item.scheduled_date).format('MMM DD, YYYY')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(item.priority)}>
                {item.priority}
              </Badge>
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}