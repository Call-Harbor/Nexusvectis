import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, AlertCircle, Truck, Package, Route, Wrench, ExternalLink, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../../utils";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

const severityConfig = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  critical: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

const entityIcons = {
  Vehicle: Truck,
  Shipment: Package,
  Route: Route,
  Maintenance: Wrench,
};

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const orgId = user?.organization_id || user?.data?.organization_id;
  const email = user?.email;

  const loadNotifications = async () => {
    if (!email || !orgId) return;
    const data = await base44.entities.Notification.filter(
      { organization_id: orgId, user_email: email },
      "-created_date",
      30
    );
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [email, orgId]);

  // Real-time subscription
  useEffect(() => {
    if (!orgId) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_email === email) {
        setNotifications(prev => [event.data, ...prev].slice(0, 30));
        setUnreadCount(prev => prev + 1);
      } else if (event.type === "update") {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
        setUnreadCount(prev => {
          const updated = notifications.map(n => n.id === event.id ? event.data : n);
          return updated.filter(n => !n.is_read).length;
        });
      }
    });
    return unsub;
  }, [orgId, email]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white text-sm">Notifikationer</span>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] px-1.5">{unreadCount} ulæste</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-cyan-400" onClick={markAllRead} title="Marker alle som læst">
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Link to={createPageUrl("NotificationSettings")}>
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-white" title="Indstillinger">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm">Ingen notifikationer</p>
                  <p className="text-slate-600 text-xs mt-1">Konfigurer regler for at modtage notifikationer</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const cfg = severityConfig[notif.severity] || severityConfig.info;
                  const Icon = cfg.icon;
                  const EntityIcon = entityIcons[notif.entity_type] || Info;
                  return (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-slate-800/60 last:border-0 transition-colors ${!notif.is_read ? "bg-slate-800/30" : "hover:bg-slate-800/20"}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-sm font-medium leading-tight ${notif.is_read ? "text-slate-300" : "text-white"}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <button onClick={() => markAsRead(notif.id)} className="flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>

                          {/* Entity details */}
                          {notif.entity_details && Object.keys(notif.entity_details).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(notif.entity_details).slice(0, 3).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  {k}: <span className="text-slate-300">{String(v)}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-slate-600">
                              {notif.created_date && formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: da })}
                            </span>
                            {notif.action_url && (
                              <Link to={notif.action_url} onClick={() => { markAsRead(notif.id); setOpen(false); }}>
                                <span className="text-[10px] text-cyan-500 hover:text-cyan-300 flex items-center gap-0.5">
                                  Gå til <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/50">
              <Link to={createPageUrl("NotificationSettings")} onClick={() => setOpen(false)}>
                <p className="text-xs text-cyan-500 hover:text-cyan-300 text-center transition-colors">
                  Administrer notifikationsregler →
                </p>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}