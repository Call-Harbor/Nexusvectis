import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, UserX, Clock, CheckCircle2, XCircle, Mail, Phone, 
  User, Shield, AlertCircle, Truck, Search, Filter, X as XIcon 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DriverManagement() {
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

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

  const { data: orgMembers = [] } = useQuery({
    queryKey: ["org-members", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.OrganizationMember.filter({
        user_email: user.email,
        status: "active"
      });
    },
    enabled: !!user?.email,
  });

  const orgId = orgMembers[0]?.organization_id;

  const { data: requests = [] } = useQuery({
    queryKey: ["driver-requests", orgId],
    queryFn: () => base44.entities.DriverRequest.filter({ organization_id: orgId }, "-created_date", 100),
    enabled: !!orgId,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", orgId],
    queryFn: () => base44.entities.Vehicle.filter({ organization_id: orgId }, "-created_date", 100),
    enabled: !!orgId,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, driverEmail, driverName, vehicleId }) => {
      await base44.entities.DriverRequest.update(requestId, {
        status: "approved",
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        vehicle_assigned: vehicleId
      });

      await base44.entities.OrganizationMember.create({
        organization_id: orgId,
        user_email: driverEmail,
        role: "user",
        status: "active"
      });

      // Vehicle assignment happens via DriverRequest.vehicle_assigned
      // No need to update Vehicle.driver field here
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["driver-requests"]);
      queryClient.invalidateQueries(["vehicles"]);
      setSelectedRequest(null);
      setSelectedVehicle("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => base44.entities.DriverRequest.update(requestId, {
      status: "rejected",
      approved_by: user.email,
      approved_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["driver-requests"]);
      setSelectedRequest(null);
    },
  });

  const assignVehicleMutation = useMutation({
    mutationFn: async ({ requestId, vehicleId }) => {
      // Simply update the DriverRequest with new vehicle assignment
      // NexusOrbit will find vehicle via DriverRequest.vehicle_assigned
      await base44.entities.DriverRequest.update(requestId, {
        vehicle_assigned: vehicleId || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["driver-requests"]);
      queryClient.invalidateQueries(["vehicles"]);
      queryClient.invalidateQueries(["orbit-vehicles"]);
    },
  });

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const availableVehicles = vehicles.filter(v => !v.driver || v.driver === "");

  const filteredPending = pendingRequests.filter(r =>
    r.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.driver_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedRequests.filter(r =>
    r.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.driver_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-rose-500/20">
          <Shield className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-300 text-xl mb-2">Admin Access Required</p>
          <p className="text-slate-500 text-sm">Only coordinators can manage driver requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
            <UserCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Driver Management</h1>
            <p className="text-slate-400">Approve driver requests from Nexus Orbit</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-slate-800/50 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-2xl font-black text-amber-400">{pendingRequests.length}</p>
                <p className="text-xs text-slate-400">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-slate-800/50 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-black text-emerald-400">{approvedRequests.length}</p>
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-slate-800/50 border border-rose-500/20">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-400" />
              <div>
                <p className="text-2xl font-black text-rose-400">{rejectedRequests.length}</p>
                <p className="text-xs text-slate-400">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Pending Requests</h2>
          {filteredPending.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
              <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600">No pending driver requests</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPending.map((request) => (
                <div
                  key={request.id}
                  className="p-5 rounded-xl bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <User className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{request.driver_name}</p>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                            PENDING
                          </Badge>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          {request.driver_email}
                        </div>
                        {request.driver_phone && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            {request.driver_phone}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-2">
                        Requested {new Date(request.created_date).toLocaleDateString("da-DK")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={rejectMutation.isPending}
                        variant="outline"
                        className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Drivers */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Approved Drivers</h2>
          {filteredApproved.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
              <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600">No approved drivers yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApproved.map((request) => {
                const assignedVehicle = vehicles.find(v => v.id === request.vehicle_assigned);
                return (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/15 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{request.driver_name}</p>
                        <p className="text-slate-500 text-xs">{request.driver_email}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="text-slate-400 text-xs mb-1.5 block">Assigned Vehicle</label>
                      <Select
                        value={request.vehicle_assigned || "none"}
                        onValueChange={(vehicleId) => {
                          const newVehicleId = vehicleId === "none" ? null : vehicleId;
                          assignVehicleMutation.mutate({
                            requestId: request.id,
                            vehicleId: newVehicleId
                          });
                        }}
                      >
                        <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9 text-sm">
                          <SelectValue placeholder="Select vehicle">
                            {assignedVehicle ? assignedVehicle.name : "No vehicle"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="none" className="text-slate-400">
                            <div className="flex items-center gap-2">
                              <XIcon className="w-3 h-3" />
                              Remove vehicle
                            </div>
                          </SelectItem>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <div className="flex items-center gap-2">
                                <Truck className="w-3 h-3" />
                                {vehicle.name} — {vehicle.type}
                                {vehicle.driver && vehicle.id !== request.vehicle_assigned && (
                                  <span className="text-xs text-amber-400">(in use)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <p className="text-slate-600 text-xs">
                      Approved {new Date(request.approved_at).toLocaleDateString("da-DK")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approval Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Approve Driver Request</DialogTitle>
              <DialogDescription className="text-slate-400">
                Assign a vehicle to {selectedRequest?.driver_name} and approve their access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <p className="text-slate-400 text-xs mb-1">Driver Name</p>
                <p className="text-white font-semibold">{selectedRequest?.driver_name}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <p className="text-slate-400 text-xs mb-1">Email</p>
                <p className="text-white">{selectedRequest?.driver_email}</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Assign Vehicle (Optional)</label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a vehicle..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="none">No vehicle (assign later)</SelectItem>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} — {vehicle.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableVehicles.length === 0 && (
                  <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-xs">No available vehicles. You can assign one later.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    approveMutation.mutate({
                      requestId: selectedRequest.id,
                      driverEmail: selectedRequest.driver_email,
                      driverName: selectedRequest.driver_name,
                      vehicleId: selectedVehicle && selectedVehicle !== "none" ? selectedVehicle : null
                    });
                  }}
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Driver
                </Button>
                <Button
                  onClick={() => setSelectedRequest(null)}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}