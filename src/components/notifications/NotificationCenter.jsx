import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, Check, CheckCheck, AlertTriangle, Info, AlertCircle,
  Truck, Package, Route, Wrench, ExternalLink, Settings,
  Search, Filter, Bookmark, BookmarkCheck, ChevronDown, RotateCcw, Mail, Smartphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "../../utils";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

const severityConfig = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Advarsel" },
  critical: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Kritisk" },
};

const entityIcons = { Vehicle: Truck, Shipment: Package, Route, Maintenance: Wrench };
const entityLabels = { Vehicle: "Køretøj", Shipment: "Forsendelse", Route: "Rute", Maintenance: "Vedligeholdelse", Alert: "Alert", Exception: "Undtagelse" };
const eventLabels = { fuel_low: "Lav brændstof", status_change: "Statusændring", delayed: "Forsinkelse", maintenance_due: "Vedligeholdelse", temperature_breach: "Temperaturoverskridelse", route_blocked: "Blokeret rute", created: "Oprettet", updated: "Opdateret" };

const PAGE_SIZE = 10;
const SAVED_KEY = "nc_saved_searches";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}
function saveSaved(arr) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(arr)); } catch {}
}

const defaultFilters = { q: "", severity: "", entity_type: "", event_type: "", is_read: "", channels: "" };

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [savedSearches, setSavedSearches] = useState(loadSaved);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [page, setPage] = useState(1);
  const ref = useRef(null);

  const orgId = user?.organization_id || user?.data?.organization_id;
  const email = user?.email;

  const loadNotifications = useCallback(async () => {
    if (!email || !orgId) return;
    try {
      const data = await base44.entities.Notification.filter(
        { organization_id: orgId, user_email: email },
        "-created_date",
        200
      );
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (_) {}
  }, [email, orgId]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!orgId) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_email === email) {
        setNotifications(prev => [event.data, ...prev].slice(0, 200));
        setUnreadCount(prev => prev + 1);
      } else if (event.type === "update") {
        setNotifications(prev => {
          const updated = prev.map(n => n.id === event.id ? event.data : n);
          setUnreadCount(updated.filter(n => !n.is_read).length);
          return updated;
        });
      }
    });
    return unsub;
  }, [orgId, email]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filters]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const inTitle = n.title?.toLowerCase().includes(q);
        const inMsg = n.message?.toLowerCase().includes(q);
        const inDetails = n.entity_details
          ? Object.values(n.entity_details).some(v => String(v).toLowerCase().includes(q))
          : false;
        if (!inTitle && !inMsg && !inDetails) return false;
      }
      if (filters.severity && n.severity !== filters.severity) return false;
      if (filters.entity_type && n.entity_type !== filters.entity_type) return false;
      if (filters.event_type && n.event_type !== filters.event_type) return false;
      if (filters.is_read === "unread" && n.is_read) return false;
      if (filters.is_read === "read" && !n.is_read) return false;
      if (filters.channels) {
        const ch = n.channels || [];
        if (!ch.includes(filters.channels)) return false;
      }
      return true;
    });
  }, [notifications, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== "").length;

  // Unique values for filter dropdowns
  const uniqueEntityTypes = [...new Set(notifications.map(n => n.entity_type).filter(Boolean))];
  const uniqueEventTypes = [...new Set(notifications.map(n => n.event_type).filter(Boolean))];

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val === prev[key] ? "" : val }));
  const resetFilters = () => { setFilters(defaultFilters); setPage(1); };

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

  const saveSearch = () => {
    if (!saveName.trim()) return;
    const entry = { name: saveName.trim(), filters: { ...filters }, id: Date.now() };
    const updated = [entry, ...savedSearches].slice(0, 8);
    setSavedSearches(updated);
    saveSaved(updated);
    setSaveName("");
    setShowSaveInput(false);
  };

  const deleteSaved = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    saveSaved(updated);
  };

  const applySearch = (s) => setFilters(s.filters);

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
            className="absolute right-0 top-full mt-2 w-[420px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white text-sm">Notifikationer</span>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] px-1.5">{unreadCount} ulæste</Badge>
                )}
                <span className="text-[10px] text-slate-600">{filtered.length}/{notifications.length}</span>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-cyan-400" onClick={markAllRead} title="Marker alle som læst">
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon" variant="ghost"
                  className={`w-7 h-7 transition-colors ${showFilters ? "text-cyan-400" : "text-slate-400 hover:text-white"}`}
                  onClick={() => setShowFilters(v => !v)}
                  title="Filtre"
                >
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <Link to={createPageUrl("NotificationSettings")}>
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-white" title="Indstillinger">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  value={filters.q}
                  onChange={e => setFilter("q", e.target.value)}
                  placeholder="Søg i titel, besked, detaljer..."
                  className="pl-8 pr-8 h-8 text-xs bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                />
                {filters.q && (
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setFilter("q", "")}>
                    <X className="w-3 h-3 text-slate-500 hover:text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-slate-800/60"
                >
                  <div className="px-3 py-2.5 bg-slate-950/40 space-y-2.5">
                    {/* Severity */}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Alvorlighedsniveau</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(severityConfig).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setFilter("severity", k)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filters.severity === k ? `${v.bg} ${v.color} border-current` : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Entity type */}
                    {uniqueEntityTypes.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Entitetstype</p>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueEntityTypes.map(et => (
                            <button
                              key={et}
                              onClick={() => setFilter("entity_type", et)}
                              className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filters.entity_type === et ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40" : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                            >
                              {entityLabels[et] || et}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event type */}
                    {uniqueEventTypes.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Hændelsestype</p>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueEventTypes.map(et => (
                            <button
                              key={et}
                              onClick={() => setFilter("event_type", et)}
                              className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filters.event_type === et ? "bg-violet-500/15 text-violet-400 border-violet-500/40" : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                            >
                              {eventLabels[et] || et}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Read status + channels */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Læst status</p>
                        <div className="flex gap-1.5">
                          {[["unread", "Ulæste"], ["read", "Læste"]].map(([v, label]) => (
                            <button
                              key={v}
                              onClick={() => setFilter("is_read", v)}
                              className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filters.is_read === v ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Kanal</p>
                        <div className="flex gap-1.5">
                          {[["email", <Mail className="w-3 h-3" />, "E-mail"], ["in_app", <Bell className="w-3 h-3" />, "App"]].map(([v, icon, label]) => (
                            <button
                              key={v}
                              onClick={() => setFilter("channels", v)}
                              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${filters.channels === v ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/40" : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}
                            >
                              {icon}{label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active filter chips + reset */}
                    {activeFilterCount > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(filters).filter(([, v]) => v !== "").map(([k, v]) => (
                            <span key={k} className="flex items-center gap-1 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                              {k === "q" ? `"${v}"` : v}
                              <button onClick={() => setFilter(k, "")}><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                        <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
                          <RotateCcw className="w-2.5 h-2.5" /> Nulstil
                        </button>
                      </div>
                    )}

                    {/* Saved searches */}
                    <div className="pt-1 border-t border-slate-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Gemte søgninger</p>
                        <button
                          onClick={() => setShowSaveInput(v => !v)}
                          className="flex items-center gap-1 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors"
                        >
                          <Bookmark className="w-3 h-3" /> Gem nuværende
                        </button>
                      </div>
                      {showSaveInput && (
                        <div className="flex gap-1.5 mb-1.5">
                          <Input
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            placeholder="Navn på søgning..."
                            className="h-7 text-[11px] bg-slate-800/60 border-slate-700/60 text-white"
                            onKeyDown={e => e.key === "Enter" && saveSearch()}
                          />
                          <Button size="sm" onClick={saveSearch} className="h-7 text-[11px] bg-cyan-600 hover:bg-cyan-500 px-2">Gem</Button>
                        </div>
                      )}
                      {savedSearches.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">Ingen gemte søgninger endnu</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {savedSearches.map(s => (
                            <div key={s.id} className="flex items-center gap-0.5 bg-slate-800/60 border border-slate-700/60 rounded px-1.5 py-0.5">
                              <button onClick={() => applySearch(s)} className="text-[10px] text-slate-300 hover:text-cyan-400 transition-colors">
                                <BookmarkCheck className="w-2.5 h-2.5 inline mr-0.5" />{s.name}
                              </button>
                              <button onClick={() => deleteSaved(s.id)} className="ml-0.5">
                                <X className="w-2.5 h-2.5 text-slate-600 hover:text-rose-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter summary bar (when filters closed) */}
            {!showFilters && activeFilterCount > 0 && (
              <div className="px-3 py-1.5 bg-cyan-500/5 border-b border-cyan-500/10 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(filters).filter(([, v]) => v !== "").map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                      {k === "q" ? `"${v}"` : v}
                      <button onClick={() => setFilter(k, "")}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
                <button onClick={resetFilters} className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors ml-2 flex-shrink-0">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto">
              {paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-9 h-9 text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm">
                    {activeFilterCount > 0 ? "Ingen resultater matcher filtrene" : "Ingen notifikationer"}
                  </p>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="mt-2 text-xs text-cyan-500 hover:text-cyan-300">Nulstil filtre</button>
                  )}
                </div>
              ) : (
                <>
                  {paginated.map(notif => {
                    const cfg = severityConfig[notif.severity] || severityConfig.info;
                    const Icon = cfg.icon;
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
                                <button onClick={() => markAsRead(notif.id)} className="flex-shrink-0 mt-0.5" title="Marker som læst">
                                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>

                            {/* Chips: entity/event type */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {notif.entity_type && (
                                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded cursor-pointer hover:text-cyan-400"
                                  onClick={() => setFilter("entity_type", notif.entity_type)}>
                                  {entityLabels[notif.entity_type] || notif.entity_type}
                                </span>
                              )}
                              {notif.event_type && (
                                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded cursor-pointer hover:text-violet-400"
                                  onClick={() => setFilter("event_type", notif.event_type)}>
                                  {eventLabels[notif.event_type] || notif.event_type}
                                </span>
                              )}
                              {notif.channels?.map(ch => (
                                <span key={ch} className="text-[10px] bg-slate-800/60 text-slate-600 px-1.5 py-0.5 rounded">{ch}</span>
                              ))}
                            </div>

                            {notif.entity_details && Object.keys(notif.entity_details).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
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
                  })}

                  {/* Load more */}
                  {hasMore && (
                    <div className="px-4 py-2.5 text-center border-t border-slate-800/60">
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs text-cyan-500 hover:text-cyan-300 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Indlæs flere ({filtered.length - page * PAGE_SIZE} tilbage)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                {filtered.length} {filtered.length !== notifications.length ? `af ${notifications.length}` : ""} notifikationer
              </span>
              <Link to={createPageUrl("NotificationSettings")} onClick={() => setOpen(false)}>
                <p className="text-xs text-cyan-500 hover:text-cyan-300 transition-colors">
                  Administrer regler →
                </p>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}