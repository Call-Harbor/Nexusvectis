import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Satellite, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function StaffRequestModal({ org, onClose }) {
  const qc = useQueryClient();
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [selectedModalities, setSelectedModalities] = useState([]);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const availableModalities = [];
  if (org?.addon_airport_ops) availableModalities.push("airport");
  if (org?.addon_port_command) availableModalities.push("port");
  if (org?.addon_transit_control) availableModalities.push("transit");

  const modLabels = {
    airport: "Airport Operations",
    port: "Port Operations",
    transit: "Transit Control"
  };

  const toggleModality = (mod) => {
    setSelectedModalities(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const submitRequestMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.DriverRequest.create({
        organization_id: org.id,
        driver_email: user.email,
        driver_name: staffName.trim(),
        driver_phone: staffPhone.trim() || null,
        request_type: "staff",
        requested_modalities: selectedModalities,
        status: "pending"
      });
    },
    onSuccess: () => {
      setRequestSubmitted(true);
      qc.invalidateQueries({ queryKey: ["staff-requests"] });
      toast.success("Request submitted");
    },
    onError: () => {
      toast.error("Failed to submit request");
    }
  });

  const handleSubmit = () => {
    if (!staffName.trim() || selectedModalities.length === 0) return;
    submitRequestMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-900/95 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Satellite className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Request Staff Access</h2>
            <p className="text-cyan-400/60 text-xs">{org?.name}</p>
          </div>
        </div>

        {requestSubmitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">Request Submitted!</p>
            <p className="text-slate-400 text-sm mb-6">
              Your access request has been sent to the organization admins. You'll be notified once approved.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/30 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-semibold mb-2 block">Your Full Name</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-semibold mb-2 block">Phone (Optional)</label>
              <input
                type="tel"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="+45 12 34 56 78"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Request Access To</p>
              <div className="space-y-2">
                {availableModalities.length === 0 ? (
                  <p className="text-slate-500 text-xs">No modalities available. Organization must enable add-ons first.</p>
                ) : (
                  availableModalities.map(mod => (
                    <button
                      key={mod}
                      onClick={() => toggleModality(mod)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left font-semibold text-sm ${
                        selectedModalities.includes(mod)
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedModalities.includes(mod)
                            ? "bg-cyan-500/40 border-cyan-500"
                            : "border-slate-600"
                        }`}>
                          {selectedModalities.includes(mod) && (
                            <div className="w-2 h-2 rounded-full bg-cyan-300" />
                          )}
                        </div>
                        {modLabels[mod]}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 font-semibold hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!staffName.trim() || selectedModalities.length === 0 || submitRequestMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
              >
                {submitRequestMutation.isPending ? "Submitting..." : "Request Access"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}