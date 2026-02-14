import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, FileText, MapPin } from "lucide-react";
import moment from "moment";

export default function CustomerDetails({ customer, onClose, onEdit }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: shipments = [] } = useQuery({
    queryKey: ['customer-shipments', customer.id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      const allShipments = await base44.entities.Shipment.filter({ organization_id: user.organization_id }, '-created_date', 100);
      return allShipments.filter(s => s.customer_email === customer.email);
    },
    enabled: !!user?.organization_id
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['customer-contracts', customer.id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Contract.filter({ 
        organization_id: user.organization_id,
        customer_id: customer.id 
      }, '-created_date', 50);
    },
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    return status === "active" 
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
                <h1 className="text-3xl font-bold text-white">{customer.name}</h1>
                <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
              </div>
              {customer.company && <p className="text-slate-400">{customer.company}</p>}
            </div>
          </div>
          <Button onClick={() => onEdit(customer)} variant="outline" className="border-slate-700 text-slate-300">
            <Edit className="w-4 h-4 mr-2" />Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-slate-400 text-sm">Type</p><p className="text-white capitalize">{customer.customer_type}</p></div>
                  <div><p className="text-slate-400 text-sm">Email</p><p className="text-white">{customer.email || "N/A"}</p></div>
                  <div><p className="text-slate-400 text-sm">Phone</p><p className="text-white">{customer.phone || "N/A"}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-white">{customer.address || "N/A"}</p>
                <p className="text-white">{customer.city && customer.postal_code ? `${customer.postal_code} ${customer.city}` : customer.city || "N/A"}</p>
                <p className="text-white">{customer.country || "N/A"}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-emerald-400" />Recent Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                {shipments.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No shipments yet</p>
                ) : (
                  <div className="space-y-2">
                    {shipments.slice(0, 5).map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{shipment.tracking_number}</p>
                          <p className="text-slate-400 text-sm">{shipment.origin} → {shipment.destination}</p>
                        </div>
                        <Badge className={
                          shipment.status === "delivered" ? "bg-emerald-500/20 text-emerald-400" :
                          shipment.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" :
                          "bg-amber-500/20 text-amber-400"
                        }>
                          {shipment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-3xl font-bold text-cyan-400 mb-1">{shipments.length}</p>
                  <p className="text-slate-300 text-sm">Total Shipments</p>
                </div>
                <div className="text-center p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                  <p className="text-3xl font-bold text-violet-400 mb-1">{contracts.length}</p>
                  <p className="text-slate-300 text-sm">Active Contracts</p>
                </div>
              </CardContent>
            </Card>

            {customer.notes && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white whitespace-pre-wrap">{customer.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-slate-400 text-sm">Created</p><p className="text-white">{moment(customer.created_date).format('MMM DD, YYYY')}</p></div>
                <div><p className="text-slate-400 text-sm">Created By</p><p className="text-white">{customer.created_by}</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}