import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Plus, Search, Users, Lock, Satellite, Shield, X, ChevronLeft,
  MoreVertical, Paperclip, Smile, Hash, User, Volume2, VolumeX,
  Monitor, Camera, CameraOff, Maximize2, Minimize2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AVATAR_COLORS = ["bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-blue-500", "bg-orange-500"];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, color = "bg-cyan-500", size = "md", online }) {
  const sizes = { sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-12 h-12 text-sm" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold text-white`}>
        {getInitials(name)}
      </div>
      {online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />}
    </div>
  );
}

// ──────────────────────────────────────────────
// VIDEO CALL MODAL
// ──────────────────────────────────────────────
function VideoCallModal({ channel, user, onEnd }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Start local camera
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => {});

    const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => {
      clearInterval(timer);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(v => !v);
  };
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(v => !v);
  };

  const formatDuration = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const participants = channel.type === 'group' ? channel.member_names || channel.members : [channel.name || channel.contact_email, user?.full_name];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed z-[100] bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
        fullscreen ? 'inset-0 rounded-none' : 'inset-4 md:inset-8 lg:inset-16'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-900 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
          </div>
          <span className="text-white font-semibold">{channel.name || channel.contact_email}</span>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
            <Lock className="w-2.5 h-2.5 mr-1" /> E2E Encrypted
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-mono">{formatDuration(callDuration)}</span>
          <button onClick={() => setFullscreen(v => !v)} className="text-slate-400 hover:text-white">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative bg-slate-950 p-3 grid gap-3" style={{ gridTemplateColumns: participants.length > 2 ? 'repeat(2, 1fr)' : '1fr' }}>
        {/* Remote participants (placeholder tiles) */}
        {participants.filter(p => p !== user?.full_name).map((name, i) => (
          <div key={i} className="relative bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700/50 min-h-[200px]">
            <div className="text-center">
              <div className={`w-20 h-20 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3`}>
                {getInitials(name)}
              </div>
              <p className="text-white text-sm font-medium">{name}</p>
              <p className="text-slate-500 text-xs mt-1">Connecting via Nexus Satellite...</p>
            </div>
            <div className="absolute top-3 right-3 flex gap-1">
              <div className="bg-slate-800/80 rounded-lg px-2 py-1 flex items-center gap-1">
                <Satellite className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-400">SAT</span>
              </div>
            </div>
          </div>
        ))}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-6 right-6 w-36 h-28 bg-slate-800 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-xl">
          {camOn ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-12 h-12 ${AVATAR_COLORS[0]} rounded-full flex items-center justify-center font-bold text-white`}>
                {getInitials(user?.full_name)}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 rounded px-1">You</div>
          {!micOn && <div className="absolute top-1 right-1 bg-red-500/80 rounded p-0.5"><MicOff className="w-2.5 h-2.5 text-white" /></div>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-slate-900/80 border-t border-slate-700/50">
        <button onClick={toggleMic} className={`p-3 rounded-full transition-all ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </button>
        <button onClick={toggleCam} className={`p-3 rounded-full transition-all ${camOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {camOn ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setSpeakerOn(v => !v)} className={`p-3 rounded-full transition-all ${speakerOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {speakerOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => { setScreenShare(v => !v); toast.info(screenShare ? "Screen share stopped" : "Screen share started"); }} className={`p-3 rounded-full transition-all ${screenShare ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
          <Monitor className="w-5 h-5 text-white" />
        </button>
        <button onClick={onEnd} className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all">
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// NEW CHANNEL MODAL
// ──────────────────────────────────────────────
function NewChannelModal({ customers, user, orgId, onClose, onCreated }) {
  const [type, setType] = useState("direct");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (c) => {
    setSelectedContacts(prev => prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]);
  };

  const create = async () => {
    if (selectedContacts.length === 0) return;
    setCreating(true);
    const members = [user.email, ...selectedContacts.map(c => c.email).filter(Boolean)];
    const memberNames = [user.full_name, ...selectedContacts.map(c => c.name)];
    const colorIdx = Math.floor(Math.random() * AVATAR_COLORS.length);
    const channel = await base44.entities.NexusChannel.create({
      organization_id: orgId,
      name: type === 'group' ? (groupName || selectedContacts.map(c => c.name).join(', ')) : selectedContacts[0]?.name,
      type,
      members,
      member_names: memberNames,
      contact_id: type === 'direct' ? selectedContacts[0]?.id : undefined,
      contact_email: type === 'direct' ? selectedContacts[0]?.email : undefined,
      avatar_color: AVATAR_COLORS[colorIdx],
      last_message_at: new Date().toISOString()
    });
    // System message
    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: channel.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: `${user.full_name} created this ${type === 'group' ? 'group' : 'conversation'}. 🔒 End-to-end encrypted via Nexus Satellite.`,
      message_type: "system"
    });
    setCreating(false);
    onCreated(channel);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            New Satellite Channel
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {["direct", "group"].map(t => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${type === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {t === 'direct' ? <><User className="w-3.5 h-3.5 inline mr-1.5" />Direct</> : <><Users className="w-3.5 h-3.5 inline mr-1.5" />Group</>}
              </button>
            ))}
          </div>
          {type === 'group' && (
            <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..." className="bg-slate-800/50 border-slate-700 text-white" />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 bg-slate-800/50 border-slate-700 text-white" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map(c => (
              <button key={c.id} onClick={() => type === 'direct' ? setSelectedContacts([c]) : toggle(c)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${selectedContacts.find(x => x.id === c.id) ? 'bg-cyan-600/20 border border-cyan-500/40' : 'hover:bg-slate-800'}`}>
                <Avatar name={c.name} color={AVATAR_COLORS[c.name?.length % AVATAR_COLORS.length || 0]} size="sm" />
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">{c.name}</p>
                  <p className="text-slate-500 text-xs">{c.email || c.company}</p>
                </div>
                {selectedContacts.find(x => x.id === c.id) && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></div>}
              </button>
            ))}
          </div>
          {selectedContacts.length > 0 && type === 'group' && (
            <div className="flex flex-wrap gap-1.5">
              {selectedContacts.map(c => (
                <Badge key={c.id} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                  {c.name} <button onClick={() => toggle(c)} className="ml-1"><X className="w-2.5 h-2.5" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-700/50">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-sm">Cancel</Button>
          <Button onClick={create} disabled={creating || selectedContacts.length === 0} className="bg-gradient-to-r from-cyan-600 to-violet-600 text-sm">
            {creating ? "Creating..." : `Start ${type === 'group' ? 'Group' : 'Chat'}`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN CHAT COMPONENT
// ──────────────────────────────────────────────
export default function NexusSatelliteChat({ user, orgId, customers }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [message, setMessage] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [searchChannels, setSearchChannels] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: channels = [], refetch: refetchChannels } = useQuery({
    queryKey: ['nexus-channels', orgId],
    queryFn: () => base44.entities.NexusChannel.filter({ organization_id: orgId }, '-last_message_at', 100),
    enabled: !!orgId,
    refetchInterval: 5000
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['nexus-messages', activeChannel?.id],
    queryFn: () => base44.entities.NexusMessage.filter({ channel_id: activeChannel.id }, 'created_date', 200),
    enabled: !!activeChannel?.id,
    refetchInterval: 2000
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!activeChannel?.id) return;
    const unsub = base44.entities.NexusMessage.subscribe(event => {
      if (event.data?.channel_id === activeChannel.id) {
        queryClient.invalidateQueries({ queryKey: ['nexus-messages', activeChannel.id] });
      }
    });
    return unsub;
  }, [activeChannel?.id]);

  const sendMessage = async () => {
    if (!message.trim() || !activeChannel) return;
    const text = message.trim();
    setMessage("");
    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: activeChannel.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: text,
      message_type: "text",
      is_encrypted: true
    });
    await base44.entities.NexusChannel.update(activeChannel.id, {
      last_message: text.slice(0, 80),
      last_message_at: new Date().toISOString()
    });
    queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
    queryClient.invalidateQueries({ queryKey: ['nexus-channels'] });
  };

  const startCall = async (channel) => {
    setActiveCall(channel);
    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: channel.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: `📹 ${user.full_name} started a video call`,
      message_type: "call_started"
    });
    queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
  };

  const endCall = async () => {
    if (activeCall) {
      await base44.entities.NexusMessage.create({
        organization_id: orgId,
        channel_id: activeCall.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: `📵 Call ended`,
        message_type: "call_ended"
      });
      queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
    }
    setActiveCall(null);
  };

  const filteredChannels = channels.filter(c =>
    c.name?.toLowerCase().includes(searchChannels.toLowerCase()) ||
    c.members?.some(m => m.toLowerCase().includes(searchChannels.toLowerCase()))
  );

  const selectChannel = (ch) => {
    setActiveChannel(ch);
    setMobileShowChat(true);
  };

  return (
    <div className="flex h-[75vh] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Sidebar – Channel List */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-slate-800/60 bg-slate-900/60`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/30 to-violet-500/30 rounded-lg border border-cyan-500/30">
                <Satellite className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Nexus Satellite</h3>
                <div className="flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">End-to-End Encrypted</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowNewChannel(true)} className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={searchChannels} onChange={e => setSearchChannels(e.target.value)} placeholder="Search channels..." className="w-full pl-8 pr-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-xs placeholder:text-slate-600 outline-none focus:border-cyan-500/50" />
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No channels yet</p>
              <button onClick={() => setShowNewChannel(true)} className="text-cyan-500 text-xs mt-2 hover:underline">Start a conversation</button>
            </div>
          )}
          {filteredChannels.map(ch => (
            <button key={ch.id} onClick={() => selectChannel(ch)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${activeChannel?.id === ch.id ? 'bg-cyan-600/20 border border-cyan-500/30' : 'hover:bg-slate-800/60'}`}>
              <div className="relative">
                {ch.type === 'group' ? (
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-full flex items-center justify-center">
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Avatar name={ch.name} color={ch.avatar_color || AVATAR_COLORS[0]} size="md" online />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white text-xs font-semibold truncate">{ch.name || ch.members?.filter(m => m !== user?.email).join(', ')}</p>
                  {ch.last_message_at && <p className="text-slate-600 text-[9px] flex-shrink-0">{new Date(ch.last_message_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <p className="text-slate-500 text-[10px] truncate">{ch.last_message || 'No messages yet'}</p>
              </div>
              {ch.type === 'group' && (
                <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30 flex-shrink-0">GROUP</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <Satellite className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-white font-bold mb-1">Nexus Satellite Chat</h3>
              <p className="text-slate-500 text-sm mb-4">Select a channel or start a new conversation</p>
              <Button onClick={() => setShowNewChannel(true)} className="bg-gradient-to-r from-cyan-600 to-violet-600" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Channel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden text-slate-400 mr-1"><ChevronLeft className="w-5 h-5" /></button>
                {activeChannel.type === 'group' ? (
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-full flex items-center justify-center">
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <Avatar name={activeChannel.name} color={activeChannel.avatar_color || AVATAR_COLORS[0]} size="md" online />
                )}
                <div>
                  <h4 className="text-white font-semibold text-sm">{activeChannel.name}</h4>
                  <div className="flex items-center gap-2">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[10px]">Encrypted</span>
                    {activeChannel.type === 'group' && (
                      <span className="text-slate-500 text-[10px]">· {activeChannel.members?.length} members</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startCall(activeChannel)} className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-all" title="Start video call">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => {
                const isMe = msg.sender_email === user?.email;
                const isSystem = msg.message_type === 'system' || msg.message_type === 'call_started' || msg.message_type === 'call_ended';
                if (isSystem) return (
                  <div key={msg.id} className="text-center">
                    <span className="text-slate-500 text-xs bg-slate-800/60 px-3 py-1 rounded-full">{msg.content}</span>
                  </div>
                );
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && <Avatar name={msg.sender_name} color={AVATAR_COLORS[msg.sender_name?.length % AVATAR_COLORS.length || 1]} size="sm" />}
                    <div className={`max-w-[75%]`}>
                      {!isMe && <p className="text-slate-500 text-[10px] mb-1 px-1">{msg.sender_name}</p>}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-br from-cyan-600/80 to-violet-600/80 text-white rounded-tr-sm' : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-slate-700/40'}`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-slate-600 text-[9px]">{new Date(msg.created_date).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
                        {isMe && <Lock className="w-2 h-2 text-slate-600" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/60">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${activeChannel.name || 'channel'}...`}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 outline-none"
                />
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" title="Encrypted" />
                  <button onClick={sendMessage} disabled={!message.trim()} className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all disabled:opacity-40">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeCall && (
          <VideoCallModal channel={activeCall} user={user} onEnd={endCall} />
        )}
      </AnimatePresence>

      {showNewChannel && (
        <NewChannelModal
          customers={customers}
          user={user}
          orgId={orgId}
          onClose={() => setShowNewChannel(false)}
          onCreated={(ch) => {
            setShowNewChannel(false);
            refetchChannels();
            selectChannel(ch);
          }}
        />
      )}
    </div>
  );
}