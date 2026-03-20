import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  MessageCircle, Send, Radio, MapPin, Navigation,
  CheckCircle2, Clock, AlertCircle, Menu, X,
  Satellite, ChevronRight, User, Users, Map, Locate
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// GPS position tracking component
function GPSTracker({ onPositionUpdate }) {
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        onPositionUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
      },
      (error) => console.error("GPS error:", error),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onPositionUpdate]);
  
  return null;
}

// Map auto-center component
function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function NexusOrbit() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [activeView, setActiveView] = useState("setup"); // setup, chat, routes, map
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOrgId, setJoinOrgId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [authError, setAuthError] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // ── Load user & org ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }

        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser?.email) {
          const members = await base44.entities.OrganizationMember.filter({
            user_email: currentUser.email,
            status: "active"
          });
          if (members.length > 0) {
            const orgs = await base44.entities.Organization.filter({
              id: members[0].organization_id
            });
            if (orgs.length > 0) setOrg(orgs[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    loadUser();
  }, []);

  // ── Check if driver has pending/approved request ──────────────────────────
  const { data: myRequest } = useQuery({
    queryKey: ["my-driver-request", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const requests = await base44.entities.DriverRequest.filter({
        driver_email: user.email
      }, "-created_date", 1);
      return requests[0] || null;
    },
    enabled: !!user?.email,
  });

  // ── Determine user role (driver/coordinator based on app role or vehicle assignment) ──
  const userRole = user?.role === "admin" ? "coordinator" : "driver";

  // ── Check if driver needs to join organization first ──
  const needsSetup = userRole === "driver" && !org && (!myRequest || myRequest.status === "rejected");

  // ── Fetch messages ───────────────────────────────────────────────────────
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["orbit-messages", org?.id, user?.email],
    queryFn: async () => {
      if (!org?.id || !user?.email) return [];
      const sent = await base44.entities.OrbitMessage.filter({
        organization_id: org.id,
        sender_email: user.email
      }, "-created_date", 100);
      const received = await base44.entities.OrbitMessage.filter({
        organization_id: org.id,
        recipient_email: user.email
      }, "-created_date", 100);
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!org?.id && !!user?.email,
    refetchInterval: 1000,
  });

  // ── Fetch routes ─────────────────────────────────────────────────────────
  // ── Fetch all organizations (for driver to select) ──────────────────────
  const { data: allOrgs = [] } = useQuery({
    queryKey: ["all-organizations"],
    queryFn: () => base44.entities.Organization.list("-created_date", 100),
    enabled: needsSetup,
  });

  // ── Submit join request mutation ─────────────────────────────────────────
  const submitRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.DriverRequest.create(data),
    onSuccess: () => {
      setRequestSubmitted(true);
      queryClient.invalidateQueries(["my-driver-request"]);
    },
  });

  const handleSubmitRequest = () => {
    if (!joinOrgId || !driverName.trim() || !user?.email) return;
    submitRequestMutation.mutate({
      organization_id: joinOrgId,
      driver_email: user.email,
      driver_name: driverName.trim(),
      driver_phone: driverPhone.trim() || null,
      status: "pending"
    });
  };

  const { data: routes = [] } = useQuery({
    queryKey: ["orbit-routes", org?.id],
    queryFn: () => org?.id ? base44.entities.Route.filter({ organization_id: org.id }, "-created_date", 50) : [],
    enabled: !!org?.id,
  });

  // ── Fetch vehicles (for driver to see assigned vehicle) ─────────────────
  const { data: vehicles = [] } = useQuery({
    queryKey: ["orbit-vehicles", org?.id],
    queryFn: () => org?.id ? base44.entities.Vehicle.filter({ organization_id: org.id }, "-created_date", 50) : [],
    enabled: !!org?.id,
  });

  // ── Fetch coordinators (for drivers to chat with) ───────────────────────
  const { data: coordinators = [] } = useQuery({
    queryKey: ["orbit-coordinators", org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const members = await base44.entities.OrganizationMember.filter({
        organization_id: org.id,
        status: "active"
      });
      const adminMembers = members.filter(m => m.role === "admin");
      return adminMembers.map(m => ({ email: m.user_email, name: m.user_email.split("@")[0] }));
    },
    enabled: !!org?.id && userRole === "driver",
  });

  // ── Fetch drivers (for coordinators to chat with) ───────────────────────
  const { data: drivers = [] } = useQuery({
    queryKey: ["orbit-drivers", org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const members = await base44.entities.OrganizationMember.filter({
        organization_id: org.id,
        status: "active"
      });
      const driverMembers = members.filter(m => m.role === "user");
      return driverMembers.map(m => ({ email: m.user_email, name: m.user_email.split("@")[0] }));
    },
    enabled: !!org?.id && userRole === "coordinator",
  });

  // ── Send message mutation ────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.OrbitMessage.create(data),
    onSuccess: () => {
      refetchMessages();
      setMessageText("");
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRecipient || !org?.id || !user?.email) return;
    sendMutation.mutate({
      organization_id: org.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email.split("@")[0],
      sender_role: userRole,
      recipient_email: selectedRecipient.email,
      message: messageText.trim(),
      message_type: "text",
    });
  };

  // ── Filter messages for selected recipient ──────────────────────────────
  const conversationMessages = selectedRecipient
    ? messages.filter(m =>
        (m.sender_email === user?.email && m.recipient_email === selectedRecipient.email) ||
        (m.recipient_email === user?.email && m.sender_email === selectedRecipient.email)
      ).reverse()
    : [];

  // ── Auto-scroll to bottom ────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  // ── Assign route mutation ────────────────────────────────────────────────
  const assignRouteMutation = useMutation({
    mutationFn: async (routeId) => {
      // Match vehicle by user ID (preferred) or fall back to email/name for legacy data
      const myVehicle = vehicles.find(v => 
        v.driver === user?.id || 
        v.driver === user?.email || 
        v.driver === user?.full_name
      );
      
      if (!myVehicle) {
        throw new Error("No vehicle assigned to you yet. Contact your coordinator to assign a vehicle.");
      }
      
      await base44.entities.Vehicle.update(myVehicle.id, { route_id: routeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orbit-vehicles"]);
      toast.success("Route selected successfully!");
      setActiveView("map");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to select route");
    },
  });

  // Match vehicle by user ID (preferred) or fall back to email/name for legacy data
  const myVehicle = vehicles.find(v => 
    v.driver === user?.id || 
    v.driver === user?.email || 
    v.driver === user?.full_name
  );
  const myRoute = routes.find(r => r.id === myVehicle?.route_id);

  const recipientList = userRole === "driver" ? coordinators : drivers;

  // Parse route waypoints for map display
  const routeCoordinates = myRoute?.waypoints?.map(wp => [wp.lat, wp.lng]) || [];
  const origin = myRoute?.waypoints?.[0];
  const destination = myRoute?.waypoints?.[myRoute.waypoints.length - 1];

  // Start navigation to destination
  const handleStartNavigation = () => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}${currentPosition ? `&origin=${currentPosition.lat},${currentPosition.lng}` : ''}`;
    window.open(url, '_blank');
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400 text-sm tracking-widest">CONNECTING TO ORBIT...</p>
      </div>
    </div>
  );

  // ── Setup flow for new drivers ───────────────────────────────────────────
  if (needsSetup || (myRequest?.status === "pending" && !org)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                <Satellite className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl">Nexus Orbit</h1>
                <p className="text-cyan-400/60 text-xs">Driver Registration</p>
              </div>
            </div>

            {myRequest?.status === "pending" ? (
              <div className="text-center py-6">
                <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
                <p className="text-white font-bold text-lg mb-2">Request Pending</p>
                <p className="text-slate-400 text-sm mb-4">
                  Your request to join <span className="text-cyan-400 font-semibold">{allOrgs.find(o => o.id === myRequest.organization_id)?.name || "organization"}</span> is awaiting approval.
                </p>
                <p className="text-slate-600 text-xs">You'll be notified once a coordinator approves your request.</p>
              </div>
            ) : requestSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-2">Request Submitted!</p>
                <p className="text-slate-400 text-sm">
                  Your request has been sent to the organization coordinators. You'll receive access once approved.
                </p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-6">
                  To use Nexus Orbit, request access to your organization. A coordinator will approve your request.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Your Full Name</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block">Select Organization</label>
                    <select
                      value={joinOrgId}
                      onChange={(e) => setJoinOrgId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="">Choose organization...</option>
                      {allOrgs.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={!joinOrgId || !driverName.trim() || submitRequestMutation.isPending}
                    className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/20"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Satellite className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight">Nexus Orbit</h1>
              <p className="text-cyan-400/60 text-[10px] tracking-wider uppercase">Satellite Comms</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-cyan-300 uppercase tracking-wider">{userRole}</span>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-cyan-500/10"
            >
              <div className="px-4 py-3 space-y-2">
                <button
                  onClick={() => { setActiveView("chat"); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activeView === "chat"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                      : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Chat</span>
                </button>
                <button
                  onClick={() => { setActiveView("routes"); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activeView === "routes"
                      ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                      : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm font-semibold">Routes</span>
                </button>
                {userRole === "driver" && (
                  <button
                    onClick={() => { setActiveView("map"); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      activeView === "map"
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    <span className="text-sm font-semibold">Live Map</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* GPS Tracker */}
      {userRole === "driver" && <GPSTracker onPositionUpdate={setCurrentPosition} />}

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 pt-20 pb-4 px-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col max-w-2xl mx-auto"
            >
              {/* Recipients list */}
              {!selectedRecipient ? (
                <div className="flex-1 overflow-y-auto">
                  <p className="text-slate-500 text-xs mb-4 uppercase tracking-wider">
                    {userRole === "driver" ? "Select coordinator" : "Select driver"}
                  </p>
                  <div className="space-y-2">
                    {recipientList.map((recipient, i) => {
                      const lastMsg = messages.find(m =>
                        (m.sender_email === recipient.email && m.recipient_email === user.email) ||
                        (m.recipient_email === recipient.email && m.sender_email === user.email)
                      );
                      const unread = messages.filter(m =>
                        m.sender_email === recipient.email &&
                        m.recipient_email === user.email &&
                        !m.is_read
                      ).length;
                      return (
                        <motion.button
                          key={i}
                          onClick={() => setSelectedRecipient(recipient)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 hover:border-cyan-500/40 transition-all text-left"
                        >
                          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            {userRole === "driver" ? <Users className="w-5 h-5 text-cyan-400" /> : <User className="w-5 h-5 text-violet-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{recipient.name}</p>
                            {lastMsg && (
                              <p className="text-slate-500 text-xs truncate mt-0.5">
                                {lastMsg.sender_email === user.email ? "You: " : ""}{lastMsg.message}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {unread > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-bold">{unread}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          </div>
                        </motion.button>
                      );
                    })}
                    {recipientList.length === 0 && (
                      <div className="p-8 text-center">
                        <Radio className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm">
                          {userRole === "driver" ? "No coordinators available" : "No drivers available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <button
                      onClick={() => setSelectedRecipient(null)}
                      className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="flex-1">
                      <p className="text-white font-bold">{selectedRecipient.name}</p>
                      <p className="text-cyan-400/60 text-xs">{selectedRecipient.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {conversationMessages.map((msg, i) => {
                      const isMine = msg.sender_email === user?.email;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-100"
                              : "bg-slate-800/60 border border-slate-700/40 text-slate-300"
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {new Date(msg.created_date).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type message..."
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMutation.isPending}
                      className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : activeView === "routes" ? (
            <motion.div
              key="routes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col max-w-2xl mx-auto overflow-y-auto"
            >
              <p className="text-slate-500 text-xs mb-4 uppercase tracking-wider">Available Routes</p>

              {/* Current route */}
              {myRoute && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Current Route</p>
                  </div>
                  <p className="text-white font-bold text-lg mb-1">{myRoute.name}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{myRoute.origin}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{myRoute.destination}</span>
                  </div>
                  {myRoute.distance_km && (
                    <p className="text-cyan-400 text-xs mt-2">{myRoute.distance_km} km · {myRoute.estimated_duration_hours}h</p>
                  )}
                </div>
              )}

              {/* Route list */}
              <div className="space-y-2">
                {routes.map((route, i) => {
                  const isCurrent = route.id === myRoute?.id;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-slate-800/40 border-slate-700/50 opacity-60"
                          : "bg-slate-900/60 border-slate-700/40 hover:border-violet-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm mb-1">{route.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{route.origin}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{route.destination}</span>
                          </div>
                          {route.distance_km && (
                            <p className="text-violet-400/70 text-xs mt-1.5">{route.distance_km} km · {route.estimated_duration_hours}h</p>
                          )}
                        </div>
                        {userRole === "driver" && !isCurrent && (
                          <button
                            onClick={() => {
                              console.log("Select button clicked for route:", route.id);
                              console.log("User role:", userRole);
                              console.log("Current route:", myRoute?.id);
                              assignRouteMutation.mutate(route.id);
                            }}
                            disabled={assignRouteMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/30 transition-all disabled:opacity-50"
                          >
                            Select
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        {route.status === "active" && <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active</span>}
                        {route.priority && <span className="px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400 uppercase tracking-wider">{route.priority}</span>}
                      </div>
                    </motion.div>
                  );
                })}
                {routes.length === 0 && (
                  <div className="p-8 text-center">
                    <Navigation className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-600 text-sm">No routes available</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeView === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider">Live GPS Navigation</p>
                {currentPosition && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Locate className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-xs font-semibold">GPS Active</span>
                  </div>
                )}
              </div>

              {myRoute ? (
                <>
                  {/* Route info card */}
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold text-lg mb-1">{myRoute.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{myRoute.origin}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{myRoute.destination}</span>
                        </div>
                        {myRoute.distance_km && (
                          <p className="text-cyan-400 text-xs mt-2">{myRoute.distance_km} km · {myRoute.estimated_duration_hours}h</p>
                        )}
                      </div>
                      <button
                        onClick={handleStartNavigation}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigate
                      </button>
                    </div>

                    {currentPosition && destination && (
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-emerald-500/20">
                        <span className="flex items-center gap-1">
                          <Locate className="w-3 h-3 text-emerald-400" />
                          Current: {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
                        </span>
                        {currentPosition.speed && (
                          <span className="flex items-center gap-1">
                            Speed: {Math.round(currentPosition.speed * 3.6)} km/h
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Map */}
                  <div className="flex-1 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/60">
                    {currentPosition || routeCoordinates.length > 0 ? (
                      <MapContainer
                        center={currentPosition ? [currentPosition.lat, currentPosition.lng] : routeCoordinates[0]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        className="z-0"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {currentPosition && <MapAutoCenter center={[currentPosition.lat, currentPosition.lng]} />}
                        
                        {/* Current position marker */}
                        {currentPosition && (
                          <Marker position={[currentPosition.lat, currentPosition.lng]}>
                            <Popup>
                              <div className="text-xs">
                                <p className="font-bold text-emerald-600 mb-1">Your Location</p>
                                <p>Lat: {currentPosition.lat.toFixed(5)}</p>
                                <p>Lng: {currentPosition.lng.toFixed(5)}</p>
                                {currentPosition.accuracy && <p className="text-slate-500 text-[10px] mt-1">±{Math.round(currentPosition.accuracy)}m accuracy</p>}
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {/* Route waypoints */}
                        {myRoute.waypoints?.map((wp, i) => (
                          <Marker key={i} position={[wp.lat, wp.lng]}>
                            <Popup>
                              <div className="text-xs">
                                <p className="font-bold text-cyan-600 mb-1">{wp.name || `Waypoint ${i + 1}`}</p>
                                <p>Lat: {wp.lat.toFixed(5)}</p>
                                <p>Lng: {wp.lng.toFixed(5)}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                        {/* Route line */}
                        {routeCoordinates.length > 1 && (
                          <Polyline
                            positions={routeCoordinates}
                            pathOptions={{ color: "#22d3ee", weight: 4, opacity: 0.7 }}
                          />
                        )}
                      </MapContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-6">
                          <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-600 text-sm">Waiting for GPS signal...</p>
                          <p className="text-slate-700 text-xs mt-1">Make sure location access is enabled</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-8 rounded-xl bg-slate-900/40 border border-slate-700/30">
                    <Map className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">No Active Route</p>
                    <p className="text-slate-600 text-sm">Select a route to view it on the map</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* ── Bottom nav (desktop only) ──────────────────────────────── */}
      <div className="hidden sm:flex fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/20 px-4 py-3">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-2">
          <button
            onClick={() => setActiveView("chat")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              activeView === "chat"
                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">Chat</span>
          </button>
          <button
            onClick={() => setActiveView("routes")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              activeView === "routes"
                ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
            }`}
          >
            <Navigation className="w-5 h-5" />
            <span className="text-sm font-semibold">Routes</span>
          </button>
          {userRole === "driver" && (
            <button
              onClick={() => setActiveView("map")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                activeView === "map"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white"
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="text-sm font-semibold">Live Map</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}