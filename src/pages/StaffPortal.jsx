import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Shield, Plane, Car, Clock, LogOut, Users, Zap,
  ChevronRight, Activity, AlertTriangle, Wrench, Map, AlertCircle, CheckCircle2
} from "lucide-react";
import GateAgentTab from "@/components/staff/GateAgentTab";
import StaffRequestModal from "@/components/staff/StaffRequestModal";
import TerminalMapBuilder from "@/components/staff/TerminalMapBuilder";
import SecurityTab from "@/components/staff/SecurityTab";
import LandsideTab from "@/components/staff/LandsideTab";
import GroundHandlingTab from "@/components/staff/GroundHandlingTab";
import IncidentTab from "@/components/staff/IncidentTab";
import SupervisorTab from "@/components/staff/SupervisorTab";

const MODALITIES = {
  airport: {
    name: "Airport",
    roles: [
      {
        id: "gate_agent", label: "Gate Agent", icon: Plane, color: "#06b6d4", desc: "Gates, boarding & flight status",
        tabs: [
          { id: "gates", label: "Gates", icon: Plane },
          { id: "ground", label: "Handling", icon: Wrench },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "security_officer", label: "Security", icon: Shield, color: "#f59e0b", desc: "Lanes, queues & wait times",
        tabs: [
          { id: "security", label: "Lanes", icon: Shield },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "landside_staff", label: "Landside", icon: Car, color: "#8b5cf6", desc: "Zones & departures",
        tabs: [
          { id: "landside", label: "Zones", icon: Car },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "supervisor", label: "Supervisor", icon: Users, color: "#f43f5e", desc: "Full overview & AI insights",
        tabs: [
          { id: "supervisor", label: "Overview", icon: Zap },
          { id: "map", label: "Terminal Map", icon: Map },
          { id: "gates", label: "Gates", icon: Plane },
          { id: "security", label: "Security", icon: Shield },
          { id: "landside", label: "Landside", icon: Car },
          { id: "ground", label: "Handling", icon: Wrench },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
    ]
  },
  port: {
    name: "Port",
    roles: [
      {
        id: "berth_operator", label: "Berth Operator", icon: Car, color: "#10b981", desc: "Berth management & vessel docking",
        tabs: [
          { id: "gates", label: "Berths", icon: Car },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "crane_operator", label: "Crane Operator", icon: Wrench, color: "#f59e0b", desc: "Crane scheduling & loading",
        tabs: [
          { id: "ground", label: "Crane Ops", icon: Wrench },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "yard_staff", label: "Yard Staff", icon: Car, color: "#8b5cf6", desc: "Container yard & zones",
        tabs: [
          { id: "landside", label: "Yard", icon: Car },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "port_supervisor", label: "Supervisor", icon: Users, color: "#f43f5e", desc: "Full operations overview",
        tabs: [
          { id: "supervisor", label: "Overview", icon: Zap },
          { id: "gates", label: "Gates", icon: Car },
          { id: "ground", label: "Crane Ops", icon: Wrench },
          { id: "landside", label: "Yard", icon: Car },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
    ]
  },
  transit: {
    name: "Transit",
    roles: [
      {
        id: "bus_driver", label: "Bus Driver", icon: Car, color: "#06b6d4", desc: "Route & passenger updates",
        tabs: [
          { id: "landside", label: "Routes", icon: Car },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "depot_staff", label: "Depot Staff", icon: Wrench, color: "#f59e0b", desc: "Maintenance & fleet checks",
        tabs: [
          { id: "ground", label: "Fleet", icon: Wrench },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
      {
        id: "control_center", label: "Control Center", icon: Users, color: "#f43f5e", desc: "Network oversight & AI insights",
        tabs: [
          { id: "supervisor", label: "Overview", icon: Zap },
          { id: "landside", label: "Routes", icon: Car },
          { id: "ground", label: "Fleet", icon: Wrench },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ]
      },
    ]
  }
};

function useShiftLog() {
  const [log, setLog] = useState([]);
  const add = (msg, type = "info") =>
    setLog(l => [{ msg, type, time: new Date() }, ...l].slice(0, 30));
  return { log, add };
}

function ShiftLog({ log }) {
  if (!log.length) return null;
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(2,8,23,0.5)" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5" /> Shift Log ({log.length})
      </p>
      <div className="space-y-2">
        {log.slice(0, 8).map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 w-10 flex-shrink-0">{e.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className={e.type === "success" ? "text-emerald-400" : e.type === "alert" ? "text-amber-400" : "text-slate-400"}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalitySelector({ onSelect, modalities = MODALITIES }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-5">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-900/50">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Staff Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Select your operation type</p>
        </div>
        <div className="space-y-3">
          {Object.entries(modalities).map(([key, mod]) => (
            <button key={key} onClick={() => onSelect(key)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl active:scale-98 transition-all"
              style={{ background: "#06b6d410", border: "2px solid #06b6d430" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#06b6d425" }}>
                <Zap className="w-7 h-7 text-cyan-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-white text-lg">{mod.name}</p>
                <p className="text-sm text-slate-400">{mod.roles.length} roles available</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleSelector({ modality, onSelect, onBack, org }) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const roles = MODALITIES[modality].roles;
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-5">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <button onClick={onBack} className="mx-auto mb-4 text-slate-400 hover:text-slate-300 flex items-center gap-1 justify-center text-sm">
            ← Back
          </button>
          <h1 className="text-3xl font-black text-white">{MODALITIES[modality].name}</h1>
          <p className="text-slate-400 mt-2 text-sm">Select your role for the shift</p>
        </div>
        <div className="space-y-3">
          {roles.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onSelect(r)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl active:scale-98 transition-all"
                style={{ background: `${r.color}10`, border: `2px solid ${r.color}30` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}25` }}>
                  <Icon className="w-7 h-7" style={{ color: r.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-lg">{r.label}</p>
                  <p className="text-sm text-slate-400">{r.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            );
          })}
          </div>
          <div className="mt-6 p-4 border-t border-slate-800/50 pt-6">
          <p className="text-slate-500 text-xs text-center mb-3">Ny medarbejder?</p>
          <button onClick={() => setShowRequestModal(true)}
           className="w-full py-3 px-4 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-semibold hover:bg-violet-500/30 transition-all text-sm">
           Anmod om adgang
          </button>
          </div>
          </div>
          {showRequestModal && org && <StaffRequestModal org={org} onClose={() => setShowRequestModal(false)} />}
          </div>
          );
          }

const TAB_PANELS = {
  gates: (props) => <GateAgentTab {...props} />,
  security: (props) => <SecurityTab {...props} />,
  landside: (props) => <LandsideTab {...props} />,
  ground: (props) => <GroundHandlingTab {...props} />,
  incidents: (props) => <IncidentTab {...props} />,
  supervisor: (props) => <SupervisorTab {...props} />,
  map: ({ orgId }) => <TerminalMapBuilder orgId={orgId} />,
};

const getModality = (roleId) => {
  if (roleId.includes('airport') || roleId.includes('gate_agent') || roleId.includes('security')) return 'airport';
  if (roleId.includes('port') || roleId.includes('berth') || roleId.includes('crane') || roleId.includes('yard')) return 'port';
  if (roleId.includes('transit') || roleId.includes('bus') || roleId.includes('depot') || roleId.includes('control')) return 'transit';
  return 'airport';
};

export default function StaffPortal() {
  const [modality, setModality] = useState(null);
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [org, setOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffRequest, setStaffRequest] = useState(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [allOrgs, setAllOrgs] = useState([]);
  const [time, setTime] = useState(new Date());
  const { log, add: logAdd } = useShiftLog();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const u = await base44.auth.me();
        setUser(u);
        
        // Fetch all organizations
        const orgs = await base44.entities.Organization.list("-created_date", 100);
        setAllOrgs(orgs);
        
        // Check for staff request
        if (u?.email) {
          const requests = await base44.entities.DriverRequest.filter({
            driver_email: u.email,
            request_type: "staff"
          }, "-created_date", 1);
          if (requests.length > 0) {
            setStaffRequest(requests[0]);
          }
          
          // If approved, set organization
          if (requests.length > 0 && requests[0].status === "approved") {
            const orgData = await base44.entities.Organization.filter({ id: requests[0].organization_id });
            if (orgData.length > 0) {
              setOrg(orgData[0]);
              setOrgId(orgData[0].id);
            }
          }
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const submitRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.DriverRequest.create(data),
    onSuccess: () => {
      setRequestSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["staff-request", user?.email] });
    },
  });

  const handleSubmitRequest = () => {
    if (!selectedOrgId || !staffName.trim() || !user?.email) return;
    submitRequestMutation.mutate({
      organization_id: selectedOrgId,
      driver_email: user.email,
      driver_name: staffName.trim(),
      driver_phone: staffPhone.trim() || null,
      request_type: "staff",
      status: "pending"
    });
  };

  const selectRole = (r) => {
    setRole(r);
    setActiveTab(r.tabs[0].id);
    logAdd(`Shift started as ${r.label}`, "info");
  };

  // Loading state
  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-violet-400 text-sm tracking-widest">LOADING STAFF PORTAL...</p>
      </div>
    </div>
  );

  // Not authenticated - show sign in
  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-violet-500/20 backdrop-blur-xl text-center">
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 border border-violet-500/30 w-fit mx-auto mb-6">
          <Zap className="w-6 h-6 text-violet-400" />
        </div>
        <h1 className="text-white font-black text-xl mb-2">Staff Portal</h1>
        <p className="text-violet-400/60 text-xs mb-6">Request Access</p>
        <p className="text-slate-400 text-sm mb-6">Log in to request access to your organization's staff portal.</p>
        <button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
          className="w-full py-3 px-4 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-semibold hover:bg-violet-500/30 transition-all text-sm">
          Sign In
        </button>
      </div>
    </div>
  );

  // Pending or rejected request state
  if (staffRequest && staffRequest.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-xl text-center">
          <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-white font-black text-xl mb-2">Request Pending</h1>
          <p className="text-slate-400 text-sm mb-2">
            Your request to join <span className="text-violet-400 font-semibold">{allOrgs.find(o => o.id === staffRequest.organization_id)?.name || "organization"}</span> is awaiting approval.
          </p>
          <p className="text-slate-600 text-xs">You'll be notified once an administrator approves your request.</p>
        </div>
      </div>
    );
  }

  if (staffRequest && staffRequest.status === "rejected") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-red-500/20 backdrop-blur-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-white font-black text-xl mb-2">Request Rejected</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your request to join {allOrgs.find(o => o.id === staffRequest.organization_id)?.name || "the organization"} was not approved.
          </p>
          <button onClick={() => setStaffRequest(null)}
            className="w-full py-3 px-4 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-semibold hover:bg-violet-500/30 transition-all text-sm">
            Request Another Organization
          </button>
        </div>
      </div>
    );
  }

  // No request yet - show form
  if (!staffRequest) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-violet-500/20 backdrop-blur-xl">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 border border-violet-500/30 w-fit mb-6">
              <Zap className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-white font-black text-xl mb-1">Staff Portal</h1>
            <p className="text-violet-400/60 text-xs mb-6">Request Organization Access</p>

            {requestSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-2">Request Submitted!</p>
                <p className="text-slate-400 text-sm">
                  Your request has been sent to the organization. You'll receive access once approved.
                </p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-6">
                  To use Staff Portal, request access to your organization. An administrator will approve your request.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Your Full Name</label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Select Organization</label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-violet-500/40"
                    >
                      <option value="">Choose organization...</option>
                      {allOrgs.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={!selectedOrgId || !staffName.trim() || submitRequestMutation.isPending}
                    className="w-full py-3 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-semibold hover:bg-violet-500/30 disabled:opacity-50 transition-all"
                  >
                    {submitRequestMutation.isPending ? "Submitting..." : "Request Access"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Approved - show modality selector with filtered options
  const getApprovedModalities = () => {
    if (!org || !staffRequest) return [];
    const addonMap = {
      airport: org.addon_airport_ops,
      port: org.addon_port_command,
      transit: org.addon_transit_control
    };
    // Only show modalities that are approved AND have active add-on
    return (staffRequest.approved_modalities || []).filter(m => addonMap[m]);
  };

  const approvedModalities = getApprovedModalities();
  const filteredModalities = Object.fromEntries(
    Object.entries(MODALITIES).filter(([key]) => approvedModalities.includes(key))
  );

  if (!modality) return <ModalitySelector onSelect={setModality} modalities={filteredModalities} />;
  if (!role) return <RoleSelector modality={modality} onSelect={selectRole} onBack={() => setModality(null)} org={org} />;

  const RoleIcon = role.icon;
  const CurrentPanel = TAB_PANELS[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ WebkitTapHighlightColor: "transparent" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.97)", borderBottom: `3px solid ${role.color}25`, backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
            <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <p className="font-black text-white text-base leading-tight">{role.label}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
                {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {log.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${role.color}20`, color: role.color }}>
                  {log.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setRole(null)}
          className="w-10 h-10 rounded-xl flex items-center justify-center active:bg-slate-800 transition-colors"
          style={{ border: "1.5px solid rgba(51,65,85,0.5)" }}>
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[61px] z-10 flex gap-1 px-4 py-2 overflow-x-auto scrollbar-none"
        style={{ background: "rgba(2,6,23,0.95)", borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
        {role.tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isActive ? `${role.color}20` : "transparent",
                color: isActive ? role.color : "#64748b",
                border: `1.5px solid ${isActive ? role.color + "50" : "transparent"}`
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {CurrentPanel && <CurrentPanel orgId={orgId} logAdd={logAdd} modality={modality} />}
        <ShiftLog log={log} />
      </div>
    </div>
  );
}