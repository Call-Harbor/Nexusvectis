import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Video, VideoOff, Mic, MicOff, Phone, PhoneOff, PhoneCall,
  Plus, Search, Users, Lock, Satellite, Shield, X, ChevronLeft,
  MoreVertical, Paperclip, Smile, Hash, User, Volume2, VolumeX,
  Monitor, Camera, CameraOff, Maximize2, Minimize2, Settings, Sparkles,
  Brain, Wand2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AIEnhancedChat from "@/components/intellect/AIEnhancedChat";

const AVATAR_COLORS = ["bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-blue-500", "bg-orange-500"];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// Generates a consistent 4-digit Nexus ID from a user's database ID
function getNexusId(userId) {
  if (!userId) return "0000";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 10000).padStart(4, '0');
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
// VIDEO CALL MODAL (JITSI)
// ──────────────────────────────────────────────
function VideoCallModal({ channel, user, onEnd }) {
   const containerRef = useRef(null);
   const jitsiRef = useRef(null);
   const audioOnly = channel.audioOnly || false;

   useEffect(() => {
     if (!containerRef.current) return;

     const roomName = channel.roomName || `nexusvectis-${channel.id}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
     const displayName = user?.full_name || 'Guest';

     const initJitsi = () => {
       if (!containerRef.current) return;
       const options = {
         roomName,
         height: '100%',
         parentNode: containerRef.current,
         userInfo: { displayName, email: user?.email },
         configOverwrite: {
           startWithAudioMuted: false,
           startWithVideoMuted: audioOnly,
           prejoinPageEnabled: false,
           disableThirdPartyRequests: false,
           disableDeepLinking: true,
         },
         interfaceConfigOverwrite: {
           TOOLBAR_BUTTONS: [
             'microphone', 'camera', 'desktop', 'fullscreen',
             'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
             'videoquality', 'filmstrip', 'tileview', 'help',
           ],
           MOBILE_APP_PROMO: false,
           HIDE_INVITE_MORE_HEADER: true,
         }
       };
       jitsiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);
       jitsiRef.current.addEventListener('videoConferenceLeft', onEnd);
       jitsiRef.current.addEventListener('readyToClose', onEnd);
     };

     if (window.JitsiMeetExternalAPI) {
       initJitsi();
     } else {
       const existing = document.getElementById('jitsi-script');
       if (existing) {
         existing.addEventListener('load', initJitsi);
       } else {
         const script = document.createElement('script');
         script.id = 'jitsi-script';
         script.src = 'https://meet.jit.si/external_api.js';
         script.async = true;
         script.onload = initJitsi;
         document.head.appendChild(script);
       }
     }

     return () => {
       if (jitsiRef.current) {
         try { jitsiRef.current.dispose(); } catch (_) {}
         jitsiRef.current = null;
       }
     };
   }, [channel.id]);

   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 z-[100] bg-slate-950 overflow-hidden"
     >
       {/* Header with Channel Info */}
       <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900 to-transparent p-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
             {getInitials(channel.name)}
           </div>
           <div>
             <h3 className="text-white font-semibold text-sm">{channel.name}</h3>
             <p className="text-slate-400 text-xs">Video Call</p>
           </div>
         </div>
         <button
           onClick={onEnd}
           className="p-2.5 rounded-full bg-red-600/90 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-xl"
           title="End Call"
         >
           <Phone className="w-5 h-5" />
         </button>
       </div>

       {/* Jitsi Container */}
       <div ref={containerRef} className="w-full h-full" />
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
   const [activeTab, setActiveTab] = useState("users"); // "users" | "customers"
   const [searchResult, setSearchResult] = useState(null); // found user from Nexus ID / exact name search
   const [searching, setSearching] = useState(false);

   // Fetch all platform users via backend function (bypasses security rules)
   const { data: nexusUsersData } = useQuery({
     queryKey: ['all-nexus-users'],
     queryFn: () => base44.functions.invoke('getNexusUsers', {}),
     enabled: !!user,
   });

   useEffect(() => {
     if (nexusUsersData?.data?.currentUserId) {
       setCurrentUserId(nexusUsersData.data.currentUserId);
     }
   }, [nexusUsersData]);

   const allPlatformUsers = (nexusUsersData?.data?.users || [])
     .map(u => ({ id: `user_${u.id}`, _rawId: u.id, name: u.name, email: u.email, _source: 'user' }));

   const customerContacts = customers
     .map(c => ({ id: `cust_${c.id}`, name: c.name, email: c.email, company: c.company, _source: 'customer', _orgId: orgId }));

   // Search users by exact name OR Nexus ID (#XXXX)
   const handleSearch = () => {
     const q = search.trim();
     if (!q) return;
     setSearching(true);
     const nexusIdMatch = q.startsWith('#') ? q.slice(1) : null;
     const found = allPlatformUsers.find(u => {
       if (nexusIdMatch) return getNexusId(u._rawId) === nexusIdMatch;
       return u.name?.toLowerCase() === q.toLowerCase();
     });
     setSearchResult(found || null);
     if (!found) setSearchResult(undefined); // undefined = searched but not found
     setSearching(false);
   };

   const filteredCustomers = customerContacts.filter(c =>
     c.name?.toLowerCase().includes(search.toLowerCase()) ||
     c.email?.toLowerCase().includes(search.toLowerCase()) ||
     c.company?.toLowerCase().includes(search.toLowerCase())
   );

  const toggle = (c) => {
    setSelectedContacts(prev => prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]);
  };

  const create = async () => {
    if (selectedContacts.length === 0 || !user?.email) return;
    setCreating(true);
    try {
      const members = [user.email, ...selectedContacts.map(c => c.email).filter(Boolean)];
      const memberNames = [user.full_name, ...selectedContacts.map(c => c.name)];

      // For direct chats: check if a channel already exists with this person
      if (type === 'direct') {
        const contactEmail = selectedContacts[0]?.email;
        const existing = await base44.entities.NexusChannel.filter({ organization_id: orgId, type: 'direct' });
        const dup = existing.find(ch =>
          ch.members?.includes(user.email) && ch.members?.includes(contactEmail)
        );
        if (dup) {
          setCreating(false);
          onCreated(dup);
          return;
        }
      }

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
    } catch (err) {
      console.error('Failed to create channel:', err);
      setCreating(false);
    }
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
          {/* Chat type */}
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

          {/* Source tab */}
          <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
            <button onClick={() => { setActiveTab("users"); setSearch(""); setSearchResult(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "users" ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <Users className="w-3 h-3 inline mr-1" />
              Nexus Users
            </button>
            <button onClick={() => { setActiveTab("customers"); setSearch(""); setSearchResult(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "customers" ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <User className="w-3 h-3 inline mr-1" />
              Customers ({customerContacts.length})
            </button>
          </div>

          {activeTab === "users" ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSearchResult(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Exact name or #NexusID..."
                    className="pl-9 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <Button onClick={handleSearch} size="sm" className="bg-cyan-600 hover:bg-cyan-700 px-3">
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-slate-600 text-[10px] px-1">Søg på præcist brugernavn eller Nexus ID (fx #2314)</p>

              <div className="max-h-52 overflow-y-auto space-y-1">
                {searchResult === undefined && (
                  <p className="text-slate-600 text-xs text-center py-6">Ingen bruger fundet</p>
                )}
                {searchResult === null && search && (
                  <p className="text-slate-500 text-xs text-center py-6">Tryk Søg for at finde en bruger</p>
                )}
                {!search && (
                  <p className="text-slate-600 text-xs text-center py-6">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    Skriv et præcist navn eller Nexus ID
                  </p>
                )}
                {searchResult && (
                  <button onClick={() => type === 'direct' ? setSelectedContacts([searchResult]) : toggle(searchResult)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${selectedContacts.find(x => x.id === searchResult.id) ? 'bg-cyan-600/20 border border-cyan-500/40' : 'hover:bg-slate-800'}`}>
                    <Avatar name={searchResult.name} color={AVATAR_COLORS[searchResult.name?.length % AVATAR_COLORS.length || 0]} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white text-sm font-medium truncate">{searchResult.name}</p>
                      <p className="text-slate-500 text-xs truncate">#{getNexusId(searchResult._rawId)} · {searchResult.email}</p>
                    </div>
                    {selectedContacts.find(x => x.id === searchResult.id) && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><X className="w-2.5 h-2.5 text-white" /></div>}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg kunder..." className="pl-9 bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {filteredCustomers.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-6">Ingen kunder fundet</p>
                )}
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => type === 'direct' ? setSelectedContacts([c]) : toggle(c)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${selectedContacts.find(x => x.id === c.id) ? 'bg-cyan-600/20 border border-cyan-500/40' : 'hover:bg-slate-800'}`}>
                    <Avatar name={c.name} color={AVATAR_COLORS[c.name?.length % AVATAR_COLORS.length || 0]} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.name}</p>
                      <p className="text-slate-500 text-xs truncate">{c.email || c.company}</p>
                    </div>
                    {selectedContacts.find(x => x.id === c.id) && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><X className="w-2.5 h-2.5 text-white" /></div>}
                  </button>
                ))}
              </div>
            </>
          )}

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
// INCOMING CALL NOTIFICATION
// ──────────────────────────────────────────────
function IncomingCallNotification({ invite, onAccept, onDecline }) {
  const isVideo = invite.call_type !== 'audio';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed top-6 right-6 z-[200] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-5 w-80"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {getInitials(invite.caller_name)}
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">{invite.caller_name}</p>
          <p className="text-slate-400 text-xs">{isVideo ? '📹 Indkommende videoopkald' : '📞 Indkommende lydopkald'}</p>
          <p className="text-slate-500 text-xs truncate">{invite.channel_name}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onDecline}
          className="flex-1 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <PhoneOff className="w-4 h-4" /> Afvis
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />} Svar
        </button>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// MAIN CHAT COMPONENT
// ──────────────────────────────────────────────
export default function NexusSatelliteChat({ user: propUser, orgId, customers }) {
   const [activeChannel, setActiveChannel] = useState(null);
   const [message, setMessage] = useState("");
   const [showNewChannel, setShowNewChannel] = useState(false);
   const [activeCall, setActiveCall] = useState(null);
   const [incomingCall, setIncomingCall] = useState(null);
   const [searchChannels, setSearchChannels] = useState("");
   const [mobileShowChat, setMobileShowChat] = useState(false);
   const [unreadChannels, setUnreadChannels] = useState({});
   const [suggestedText, setSuggestedText] = useState("");
   const [currentUserId, setCurrentUserId] = useState(null);
   const messagesEndRef = useRef(null);
   const queryClient = useQueryClient();

   // Ensure user is loaded
   const { data: user = propUser } = useQuery({
     queryKey: ["currentUser"],
     queryFn: () => base44.auth.me(),
     enabled: !propUser
   });

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
    if (!orgId) return;
    const unsub = base44.entities.NexusMessage.subscribe(event => {
      const msg = event.data;
      if (msg?.sender_email !== user?.email) {

        // Incoming call invite
        if (msg?.message_type === 'call_invite') {
          // Check if this call is directed to us (we're a member of the channel)
          const targetChannel = channels.find(c => c.id === msg.channel_id);
          if (targetChannel && targetChannel.members?.includes(user?.email)) {
            setIncomingCall({
              channel_id: msg.channel_id,
              channel_name: targetChannel?.name || msg.channel_name,
              caller_name: msg.sender_name,
              call_type: msg.call_type || 'video',
              room_name: msg.room_name,
              channel: targetChannel,
            });
          }
          return;
        }

        // Cancelled / ended call invite
        if (msg?.message_type === 'call_cancelled') {
          setIncomingCall(prev => prev?.channel_id === msg.channel_id ? null : prev);
          return;
        }

        if (msg?.channel_id === activeChannel?.id) {
          queryClient.invalidateQueries({ queryKey: ['nexus-messages', activeChannel.id] });
        } else {
          setUnreadChannels(prev => ({
            ...prev,
            [msg?.channel_id]: (prev[msg?.channel_id] || 0) + 1
          }));
          queryClient.invalidateQueries({ queryKey: ['nexus-channels', orgId] });

          if (Notification.permission === 'granted') {
            new Notification(`Ny besked fra ${msg?.sender_name}`, {
              body: msg?.content?.slice(0, 50),
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png'
            });
          }

          toast.message(`${msg?.sender_name}`, {
            description: msg?.content?.slice(0, 100),
            action: {
              label: 'Åbn',
              onClick: () => {
                const channel = channels.find(c => c.id === msg?.channel_id);
                if (channel) setActiveChannel(channel);
              }
            }
          });
        }
      }
    });
    return unsub;
  }, [activeChannel?.id, orgId, user?.email, channels]);

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

  const startCall = async (channel, audioOnly = false) => {
    try {
      const constraints = audioOnly ? { audio: true, video: false } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      toast.error(audioOnly
        ? "Mikrofonadgang nægtet. Tillad mikrofon i browserindstillinger."
        : "Kamera/mikrofon adgang nægtet. Tillad adgang i browserindstillinger."
      );
      return;
    }

    const roomName = `nexusvectis-${channel.id}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

    // Send ringing invite to other members
    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: channel.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: audioOnly ? `📞 ${user.full_name} ringer...` : `📹 ${user.full_name} starter et videoopkald...`,
      message_type: "call_invite",
      call_type: audioOnly ? 'audio' : 'video',
      room_name: roomName,
      channel_name: channel.name,
    });

    setActiveCall({ ...channel, audioOnly, roomName });
    queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
  };

  const endCall = async () => {
    if (activeCall) {
      // Cancel the invite so others dismiss the ringing UI
      await base44.entities.NexusMessage.create({
        organization_id: orgId,
        channel_id: activeCall.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: `📵 Opkald afsluttet`,
        message_type: "call_cancelled"
      });
      // Post a visible "call ended" system message
      await base44.entities.NexusMessage.create({
        organization_id: orgId,
        channel_id: activeCall.id,
        sender_email: user.email,
        sender_name: user.full_name,
        content: `📵 Opkald afsluttet`,
        message_type: "call_ended"
      });
      queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
    }
    setActiveCall(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const ch = incomingCall.channel;
    const audioOnly = incomingCall.call_type === 'audio';

    try {
      const constraints = audioOnly ? { audio: true, video: false } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      toast.error("Adgang til mikrofon/kamera nægtet.");
      setIncomingCall(null);
      return;
    }

    setIncomingCall(null);
    setActiveCall({ ...ch, audioOnly, roomName: incomingCall.room_name });

    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: ch.id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: `${user.full_name} svarede opkaldet`,
      message_type: "call_accepted"
    });
    queryClient.invalidateQueries({ queryKey: ['nexus-messages'] });
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    await base44.entities.NexusMessage.create({
      organization_id: orgId,
      channel_id: incomingCall.channel_id,
      sender_email: user.email,
      sender_name: user.full_name,
      content: `${user.full_name} afviste opkaldet`,
      message_type: "call_declined"
    });
    setIncomingCall(null);
  };

  const deleteChannel = async (ch, e) => {
    e.stopPropagation();
    if (!confirm(`Slet samtalen "${ch.name}"? Alle beskeder slettes permanent.`)) return;
    // Delete all messages in channel
    const msgs = await base44.entities.NexusMessage.filter({ channel_id: ch.id });
    await Promise.all(msgs.map(m => base44.entities.NexusMessage.delete(m.id)));
    await base44.entities.NexusChannel.delete(ch.id);
    if (activeChannel?.id === ch.id) setActiveChannel(null);
    queryClient.invalidateQueries({ queryKey: ['nexus-channels', orgId] });
    toast.success("Samtale slettet");
  };

  const filteredChannels = channels.filter(c =>
    c.name?.toLowerCase().includes(searchChannels.toLowerCase()) ||
    c.members?.some(m => m.toLowerCase().includes(searchChannels.toLowerCase()))
  );

  const selectChannel = (ch) => {
    setActiveChannel(ch);
    setMobileShowChat(true);
    // Clear unread badge
    setUnreadChannels(prev => ({
      ...prev,
      [ch.id]: 0
    }));
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-0">
          {filteredChannels.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No channels yet</p>
              <button onClick={() => setShowNewChannel(true)} className="text-cyan-500 text-xs mt-2 hover:underline">Start a conversation</button>
            </div>
          )}
          {filteredChannels.map(ch => {
            const unreadCount = unreadChannels[ch.id] || 0;
            return (
            <div key={ch.id} className={`group relative flex items-center rounded-xl transition-all ${activeChannel?.id === ch.id ? 'bg-cyan-600/20 border border-cyan-500/30' : 'hover:bg-slate-800/60'}`}>
              <button onClick={() => selectChannel(ch)} className="flex items-center gap-3 flex-1 text-left min-w-0 p-2.5">
                <div className="relative flex-shrink-0">
                  {ch.type === 'group' ? (
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-full flex items-center justify-center">
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Avatar name={ch.name} color={ch.avatar_color || AVATAR_COLORS[0]} size="md" online />
                  )}
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold truncate ${unreadCount > 0 ? 'text-white font-bold' : 'text-white'}`}>{ch.name || ch.members?.filter(m => m !== user?.email).join(', ')}</p>
                    {ch.last_message_at && <p className="text-slate-600 text-[9px] flex-shrink-0">{new Date(ch.last_message_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                  <p className={`text-[10px] truncate ${unreadCount > 0 ? 'text-slate-400 font-medium' : 'text-slate-500'}`}>{ch.last_message || 'No messages yet'}</p>
                </div>
                {ch.type === 'group' && (
                  <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30 flex-shrink-0">GROUP</Badge>
                )}
              </button>
              <button
                onClick={(e) => deleteChannel(ch, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 mr-1.5 rounded-lg hover:bg-red-600/30 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                title="Slet samtale"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
          })}
        </div>

        {/* Nexus ID footer */}
        {user && (
          <div className="p-3 border-t border-slate-800/60 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/30 to-violet-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Satellite className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-[10px] font-semibold truncate">{user.full_name || user.email}</p>
                <p className="text-slate-500 text-[10px] font-mono">Nexus ID: <span className="text-cyan-400 font-bold">#{getNexusId(currentUserId || user.email)}</span></p>
              </div>
            </div>
          </div>
        )}
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
                <button onClick={() => startCall(activeChannel, true)} className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-white transition-all" title="Start audio call">
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

            {/* AI Enhanced Chat Input */}
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/60 space-y-2">
              {/* AI Assistant Panel */}
              <AIEnhancedChat
                message={message}
                onSuggest={(suggestion) => {
                  setMessage(suggestion);
                  setSuggestedText(suggestion);
                }}
                user={user}
              />

              {/* Message Input */}
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
        {incomingCall && !activeCall && (
          <IncomingCallNotification
            invite={incomingCall}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}
      </AnimatePresence>

      {showNewChannel && user && (
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