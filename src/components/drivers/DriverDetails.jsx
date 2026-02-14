import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, TrendingUp, Award } from "lucide-react";
import moment from "moment";

export default function DriverDetails({ driver, onClose, onEdit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "on_leave": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "suspended": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "terminated": return "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
                <h1 className="text-3xl font-bold text-white">{driver.first_name} {driver.last_name}</h1>
                <Badge className={getStatusColor(driver.status)}>{driver.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-slate-400">{driver.employee_id}</p>
            </div>
          </div>
          <Button onClick={() => onEdit(driver)} variant="outline" className="border-slate-700 text-slate-300">
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Email</p><p className="text-white">{driver.email}</p></div>
                  <div><p className="text-slate-400 text-sm">Phone</p><p className="text-white">{driver.phone || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Date of Birth</p><p className="text-white">{driver.date_of_birth ? moment(driver.date_of_birth).format('MMM DD, YYYY') : "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Hire Date</p><p className="text-white">{moment(driver.hire_date).format('MMM DD, YYYY')}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">License Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">License Number</p><p className="text-white">{driver.license_number || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">License Type</p><p className="text-white">{driver.license_type || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Expiry Date</p><p className="text-white">{driver.license_expiry ? moment(driver.license_expiry).format('MMM DD, YYYY') : "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Home Base</p><p className="text-white">{driver.home_base || "N/A"}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" />Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-slate-400 text-sm">Total Trips</p><p className="text-white font-medium">{driver.total_trips_completed || 0}</p></div>
                  <div><p className="text-slate-400 text-sm">Distance</p><p className="text-white font-medium">{driver.total_distance_km?.toLocaleString() || 0} km</p></div>
                  <div><p className="text-slate-400 text-sm">Hours Worked</p><p className="text-white font-medium">{driver.total_hours_worked || 0}h</p></div>
                </div>
                {driver.performance_rating && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Performance Rating</span>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-400 font-semibold text-lg">{driver.performance_rating}/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {(driver.emergency_contact_name || driver.emergency_contact_phone) && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><p className="text-slate-400 text-sm">Name</p><p className="text-white">{driver.emergency_contact_name || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Phone</p><p className="text-white">{driver.emergency_contact_phone || "N/A"}</p></div>
                </CardContent>
              </Card>
            )}

            {driver.notes && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white whitespace-pre-wrap">{driver.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-slate-400 text-sm">Created</p><p className="text-white">{moment(driver.created_date).format('MMM DD, YYYY')}</p></div>
                <div><p className="text-slate-400 text-sm">Created By</p><p className="text-white">{driver.created_by}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}