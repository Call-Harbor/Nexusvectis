import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Wrench, AlertTriangle, Clock, DollarSign } from "lucide-react";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MaintenanceDetails({ maintenance, vehicle, onClose, onEdit }) {
  const navigate = useNavigate();

  const { data: driver } = useQuery({
    queryKey: ['maintenanceDriver', vehicle?.driver],
    queryFn: async () => {
      if (!vehicle?.driver) return null;
      const drivers = await base44.entities.Driver.filter({ employee_id: vehicle.driver });
      return drivers[0] || null;
    },
    enabled: !!vehicle?.driver
  });

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

  const isOverdue = maintenance.status === "pending" && maintenance.scheduled_date && moment(maintenance.scheduled_date).isBefore(moment());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={onClose} variant="outline" size="icon" className="border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{vehicle?.name || "Unknown Vehicle"}</h1>
                <Badge className={getStatusColor(maintenance.status)}>{maintenance.status.replace('_', ' ')}</Badge>
                <Badge className={getPriorityColor(maintenance.priority)}>{maintenance.priority}</Badge>
                {isOverdue && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Overdue
                  </Badge>
                )}
              </div>
              <p className="text-slate-400">{maintenance.component}</p>
            </div>
          </div>
          <Button onClick={() => onEdit(maintenance)} variant="outline" className="border-slate-700 text-slate-300">
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                  Maintenance Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Type</p><p className="text-white capitalize">{maintenance.type}</p></div>
                  <div><p className="text-slate-400 text-sm">Component</p><p className="text-white">{maintenance.component}</p></div>
                  <div><p className="text-slate-400 text-sm">Scheduled Date</p><p className="text-white">{maintenance.scheduled_date ? moment(maintenance.scheduled_date).format('MMM DD, YYYY') : "Not scheduled"}</p></div>
                  {maintenance.completed_date && (
                    <div><p className="text-slate-400 text-sm">Completed Date</p><p className="text-white">{moment(maintenance.completed_date).format('MMM DD, YYYY')}</p></div>
                  )}
                </div>
                {maintenance.description && (
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Description</p>
                    <p className="text-white">{maintenance.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {maintenance.predicted_failure_date && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Predictive Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-slate-400 text-sm">Predicted Failure</p><p className="text-white">{moment(maintenance.predicted_failure_date).format('MMM DD, YYYY')}</p></div>
                    {maintenance.ai_confidence && (
                      <div><p className="text-slate-400 text-sm">AI Confidence</p><p className="text-white">{maintenance.ai_confidence}%</p></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Cost & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Estimated Cost</p>
                  <p className="text-2xl font-bold text-white">€{maintenance.cost_estimate?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Expected Downtime</p>
                  <p className="text-xl font-semibold text-cyan-400">{maintenance.downtime_hours || 0}h</p>
                </div>
              </CardContent>
            </Card>

            {vehicle && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl('Fleet'))}
                  >
                    <p className="text-white font-medium">{vehicle.name}</p>
                    <p className="text-slate-400 text-xs capitalize">{vehicle.type}</p>
                    <div className="mt-2">
                      <Badge className={vehicle.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>
                        {vehicle.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {driver && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Assigned Driver</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl('DriverManagement'))}
                  >
                    <p className="text-white font-medium">{driver.first_name} {driver.last_name}</p>
                    <p className="text-slate-400 text-xs">{driver.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-slate-400 text-sm">Created</p><p className="text-white">{moment(maintenance.created_date).format('MMM DD, YYYY')}</p></div>
                <div><p className="text-slate-400 text-sm">Created By</p><p className="text-white">{maintenance.created_by}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}