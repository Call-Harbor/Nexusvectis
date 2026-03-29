import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function StaffRequestManager({ orgId }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingModalities, setEditingModalities] = useState([]);

  const { data: org = {} } = useQuery({
    queryKey: ["org-details", orgId],
    queryFn: () => base44.entities.Organization.filter({ id: orgId }).then(r => r[0]),
    enabled: !!orgId,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["staff-requests", orgId],
    queryFn: () =>
      base44.entities.DriverRequest.filter({
        organization_id: orgId,
        request_type: "staff"
      }, "-created_date", 100),
    enabled: !!orgId,
  });

  const availableModalities = [];
  if (org?.addon_airport_ops) availableModalities.push("airport");
  if (org?.addon_port_command) availableModalities.push("port");
  if (org?.addon_transit_control) availableModalities.push("transit");

  const modLabels = {
    airport: "Airport Operations",
    port: "Port Operations",
    transit: "Transit Control"
  };

  const approveMutation = useMutation({
    mutationFn: async ({ id, modalities }) => {
      const user = await base44.auth.me();
      return base44.entities.DriverRequest.update(id, {
        status: "approved",
        approved_modalities: modalities,
        approved_by: user.email,
        approved_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-requests"] });
      setEditingId(null);
      toast.success("Request approved");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const user = await base44.auth.me();
      return base44.entities.DriverRequest.update(id, {
        status: "rejected",
        approved_by: user.email,
        approved_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-requests"] });
      toast.success("Request rejected");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, modalities }) => {
      return base44.entities.DriverRequest.update(id, {
        approved_modalities: modalities
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-requests"] });
      setEditingId(null);
      toast.success("Permissions updated");
    },
  });

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const RequestCard = ({ request, isApproved = false }) => {
    const isEditing = editingId === request.id;
    const mods = isEditing ? editingModalities : (request.approved_modalities || request.requested_modalities || []);
    const isExpanded = expandedId === request.id;

    return (
      <motion.div
        layout
        className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setExpandedId(isExpanded ? null : request.id)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
        >
          <div className="text-left flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{request.driver_name}</p>
            <p className="text-slate-400 text-xs">{request.driver_email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {(request.approved_modalities || request.requested_modalities || []).slice(0, 2).map(m => (
                <span key={m} className="px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold">
                  {modLabels[m]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-700/40"
            >
              <div className="p-4 space-y-4">
                {/* Modality selection */}
                <div>
                  <p className="text-slate-300 text-xs font-semibold mb-2 uppercase">Access Modalities</p>
                  <div className="space-y-2">
                    {availableModalities.map(mod => (
                      <button
                        key={mod}
                        onClick={() => {
                          if (!isApproved && !isEditing) {
                            setEditingId(request.id);
                            setEditingModalities([mod]);
                          } else if (isEditing) {
                            setEditingModalities(prev =>
                              prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
                            );
                          } else {
                            setEditingId(request.id);
                            setEditingModalities(prev =>
                              prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
                            );
                          }
                        }}
                        disabled={isApproved && !isEditing}
                        className={`w-full p-2.5 rounded-lg border-2 transition-all text-left font-semibold text-sm flex items-center gap-3 ${
                          mods.includes(mod)
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                            : "bg-slate-700/40 border-slate-600/40 text-slate-400"
                        } ${(isApproved && !isEditing) ? "opacity-60 cursor-default" : "hover:border-slate-500/40"}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          mods.includes(mod)
                            ? "bg-cyan-500/40 border-cyan-500"
                            : "border-slate-500"
                        }`}>
                          {mods.includes(mod) && <div className="w-2 h-2 rounded-full bg-cyan-300" />}
                        </div>
                        {modLabels[mod]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {!isApproved ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate({ id: request.id, modalities: editingModalities || request.requested_modalities })}
                      disabled={approveMutation.isPending || (editingId === request.id && editingModalities.length === 0)}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/30 disabled:opacity-50 transition-all"
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-semibold text-sm hover:bg-red-500/30 disabled:opacity-50 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditingId(request.id);
                          setEditingModalities(request.approved_modalities || []);
                        }}
                        className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/30 transition-all"
                      >
                        Edit Permissions
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => updateMutation.mutate({ id: request.id, modalities: editingModalities })}
                          disabled={updateMutation.isPending || editingModalities.length === 0}
                          className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/30 disabled:opacity-50 transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-300 font-semibold text-sm hover:bg-slate-700/60 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Approved Staff ({approvedRequests.length})
          </h3>
          <div className="space-y-2">
            {approvedRequests.map(req => (
              <RequestCard key={req.id} request={req} isApproved />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
            <X className="w-5 h-5 text-red-400" />
            Rejected ({rejectedRequests.length})
          </h3>
          <div className="space-y-2">
            {rejectedRequests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-slate-800/30 border border-slate-700/30">
          <p className="text-slate-500 text-sm">No staff requests yet</p>
        </div>
      )}
    </div>
  );
}