import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, DollarSign } from "lucide-react";
import moment from "moment";

export default function AssetDetails({ asset, onClose, onEdit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_use": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "maintenance": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "retired": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

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
                <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
                <Badge className={getStatusColor(asset.status)}>{asset.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-slate-400">{asset.asset_number}</p>
            </div>
          </div>
          <Button onClick={() => onEdit(asset)} variant="outline" className="border-slate-700 text-slate-300">
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Type</p><p className="text-white capitalize">{asset.asset_type}</p></div>
                  <div><p className="text-slate-400 text-sm">Location</p><p className="text-white">{asset.location || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Manufacturer</p><p className="text-white">{asset.manufacturer || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Model</p><p className="text-white">{asset.model || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Serial Number</p><p className="text-white">{asset.serial_number || "N/A"}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" />Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Purchase Date</p><p className="text-white">{asset.purchase_date ? moment(asset.purchase_date).format('MMM DD, YYYY') : "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Purchase Cost</p><p className="text-white">{asset.purchase_cost ? `€${asset.purchase_cost.toLocaleString()}` : "N/A"}</p></div>
                  {asset.current_value && (
                    <div><p className="text-slate-400 text-sm">Current Value</p><p className="text-white">€{asset.current_value.toLocaleString()}</p></div>
                  )}
                  {asset.depreciation_rate && (
                    <div><p className="text-slate-400 text-sm">Depreciation Rate</p><p className="text-white">{asset.depreciation_rate}%</p></div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Interval</p><p className="text-white">{asset.maintenance_interval_days} days</p></div>
                  <div><p className="text-slate-400 text-sm">Last Maintenance</p><p className="text-white">{asset.last_maintenance_date ? moment(asset.last_maintenance_date).format('MMM DD, YYYY') : "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Next Maintenance</p><p className="text-white">{asset.next_maintenance_date ? moment(asset.next_maintenance_date).format('MMM DD, YYYY') : "N/A"}</p></div>
                  {asset.total_usage_hours && (
                    <div><p className="text-slate-400 text-sm">Total Usage</p><p className="text-white">{asset.total_usage_hours}h</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {asset.utilization_rate && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-cyan-400 mb-2">{asset.utilization_rate}%</p>
                    <p className="text-slate-400 text-sm">Current utilization rate</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {asset.notes && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white whitespace-pre-wrap">{asset.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-slate-400 text-sm">Created</p><p className="text-white">{moment(asset.created_date).format('MMM DD, YYYY')}</p></div>
                <div><p className="text-slate-400 text-sm">Created By</p><p className="text-white">{asset.created_by}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}