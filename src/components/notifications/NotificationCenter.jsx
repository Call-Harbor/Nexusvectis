import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, CheckCheck, AlertTriangle, Info, AlertCircle,
  Truck, Package, Route, Wrench, ExternalLink, Settings,
  Search, Filter, Bookmark, BookmarkCheck, ChevronDown, RotateCcw,
  Mail, Loader2, SlidersHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "../../utils";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { da } from "date-fns/locale";

const severityConfig = {
  info:     { icon: Info,          color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/30",   dot: "bg-blue-400",   label: "Info"     },
  warning:  { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400",  label: "Warning"  },
  critical: { icon: AlertCircle,   color: "text-rose-400",  bg: "bg-rose-500/10 border-rose-500/30",   dot: "bg-rose-400",   label: "Critical" },
};

const entityLabels = { Vehicle: "Vehicle", Shipment: "Shipment", Route: "Route", Maintenance: "Maintenance", Alert: "Alert", Exception: "Exception" };
const eventLabels  = { fuel_low: "Low fuel", status_change: "Status change", delayed: "Delayed", maintenance_due: "Maintenance due", temperature_breach: "Temperature breach", route_blocked: "Route blocked", created: "Created", updated: "Updated" };

const filterLabels = { severity: "Severity", entity_type: "Entity", event_type: "Event", is_read: "Status", channels: "Channel", q: "Search" };
const filterValueLabels = {
  unread: "Unread", read: "Read", email: "E-mail", in_app: "App",
  ...Object.fromEntries(Object.entries(entityLabels)),
  ...Object.fromEntries(Object.entries(eventLabels)),
  ...Object.fromEntries(Object.entries(severityConfig).map(([k, v]) => [k, v.label])),
};

const PAGE_SIZE = 10;
const SAVED_KEY = "nc_saved_searches";

function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; } }
function persistSaved(arr) { try { localStorage.setItem(SAVED_KEY, JSON.stringify(arr)); } catch {} }

const defaultFilters = { q: "", severity: "", entity_type: "", event_type: "", is_read: "", channels: "" };

// A small pill that shows a filter value with remove button
function FilterChip({ label, value, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.12 }}
      className="inline-flex items-center gap-1 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-1.5 py-0.5 rounded-full"
    >
      <span className="text-cyan-600 font-medium">{label}:</span>
      {value}
      <button onClick={onRemove} className="hover:text-rose-400 transition-colors ml-0.5">
        <X className="w-2.5 h-2.5" />
      </button>
    </motion.span>
  );
}

export default function NotificationCenter({ user }) {
  const [open, setOpen]               = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters]         = useState(defaultFilters);
  const [savedSearches, setSavedSearches] = useState(loadSaved);
  const [saveName, setSaveName]       = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [page, setPage]               = useState(1);
  const [markingAll, setMarkingAll]   = useState(false);
  const ref = useRef(null);

  const [orgId, setOrgId] = useState(user?.organization_id || user?.data?.organization_id || null);
  const email = user?.email;

  // Resolve organization_id from User entity if not present on the auth object
  useEffect(() => {
    if (orgId || !email) return;
    base44.entities.User.filter({ email }).then(users => {
      const found = users?.[0]?.organization_id;
      if (found) setOrgId(found);
    }).catch(() => {});
  }, [email, orgId]);

  const loadNotifications = useCallback(async () => {
    if (!email || !orgId) return;
    setLoading(true);
    try {
      const data = await base44.entities.Notification.filter(
        { organization_id: orgId, user_email: email },
        "-created_date", 200
      );
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (_) {}
    finally { setLoading(false); }
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

  useEffect(() => { setPage(1); }, [filters]);

  const filtered = useMemo(() => notifications.filter(n => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const match = [n.title, n.message, ...Object.values(n.entity_details || {}).map(String)]
        .some(s => s?.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.severity && n.severity !== filters.severity) return false;
    if (filters.entity_type && n.entity_type !== filters.entity_type) return false;
    if (filters.event_type && n.event_type !== filters.event_type) return false;
    if (filters.is_read === "unread" && n.is_read) return false;
    if (filters.is_read === "read" && !n.is_read) return false;
    if (filters.channels && !(n.channels || []).includes(filters.channels)) return false;
    return true;
  }), [notifications, filters]);

  const paginated   = filtered.slice(0, page * PAGE_SIZE);
  const hasMore     = page * PAGE_SIZE < filtered.length;
  const activeFilters = Object.entries(filters).filter(([, v]) => v !== "");
  const activeFilterCount = activeFilters.length;

  const uniqueEntityTypes = [...new Set(notifications.map(n => n.entity_type).filter(Boolean))];
  const uniqueEventTypes  = [...new Set(notifications.map(n => n.event_type).filter(Boolean))];

  // Per-severity counts for header stats
  const severityCounts = useMemo(() => {
    const c = { info: 0, warning: 0, critical: 0 };
    notifications.filter(n => !n.is_read).forEach(n => { if (c[n.severity] !== undefined) c[n.severity]++; });
    return c;
  }, [notifications]);

  const setFilter    = (key, val) => setFilters(prev => ({ ...prev, [key]: val === prev[key] ? "" : val }));
  const removeFilter = (key)      => setFilters(prev => ({ ...prev, [key]: "" }));
  const resetFilters = ()         => { setFilters(defaultFilters); setPage(1); };

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  const saveSearch = () => {
    if (!saveName.trim()) return;
    const entry = { name: saveName.trim(), filters: { ...filters }, id: Date.now() };
    const updated = [entry, ...savedSearches].slice(0, 8);
    setSavedSearches(updated);
    persistSaved(updated);
    setSaveName(""); setShowSaveInput(false);
  };

  const deleteSaved = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated); persistSaved(updated);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
      >
        <Bell className={`w-5 h-5 transition-colors ${open ? "text-cyan-400" : "text-slate-400 hover:text-white"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 bottom-full mb-2 w-[380px] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-slate-800 bg-slate-900/80">
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  {loading && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      size="icon" variant="ghost"
                      className="w-7 h-7 text-slate-400 hover:text-cyan-400 relative"
                      onClick={markAllRead}
                      disabled={markingAll}
                      title="Mark all as read"
                    >
                      {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    </Button>
                  )}
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`relative w-7 h-7 flex items-center justify-center rounded-md transition-all ${showFilters ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}
                    title="Filters and searches"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <Link to={createPageUrl("NotificationSettings")}>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-white" title="Indstillinger">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] text-slate-500">
                  <span className="text-white font-medium">{filtered.length}</span>
                  {filtered.length !== notifications.length && (
                    <span className="text-slate-600"> / {notifications.length}</span>
                  )} notifications
                </span>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    {Object.entries(severityCounts).map(([sev, count]) => count > 0 && (
                      <span key={sev} className="flex items-center gap-1 text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${severityConfig[sev].dot}`} />
                        <span className={severityConfig[sev].color}>{count}</span>
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-500">{unreadCount} unread</span>
                  </div>
                )}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <Input
                  value={filters.q}
                  onChange={e => setFilter("q", e.target.value)}
                  placeholder="Search title, message, details..."
                  className="pl-8 pr-8 h-8 text-xs bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-cyan-500/50 rounded-lg"
                />
                <AnimatePresence>
                  {filters.q && (
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      onClick={() => removeFilter("q")}
                    >
                      <X className="w-3 h-3 text-slate-500 hover:text-white" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Active filter chips (always visible when filters active) */}
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-800/60">
                      <AnimatePresence>
                        {activeFilters.filter(([k]) => k !== "q").map(([k, v]) => (
                          <FilterChip
                            key={k}
                            label={filterLabels[k] || k}
                            value={filterValueLabels[v] || v}
                            onRemove={() => removeFilter(k)}
                          />
                        ))}
                      </AnimatePresence>
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Reset all
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── FILTER PANEL ────────────────────────────────────── */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 overflow-hidden border-b border-slate-800/60 bg-slate-950/60"
                >
                  <div className="px-4 py-3 space-y-3">
                    {/* Severity */}
                    <FilterRow label="Severity">
                      {Object.entries(severityConfig).map(([k, v]) => (
                        <FilterPill
                          key={k} active={filters.severity === k}
                          activeClass={`${v.bg} ${v.color}`}
                          onClick={() => setFilter("severity", k)}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                          {v.label}
                          <span className="text-slate-600 ml-0.5">
                            ({notifications.filter(n => n.severity === k).length})
                          </span>
                        </FilterPill>
                      ))}
                    </FilterRow>

                    {/* Entity type */}
                    {uniqueEntityTypes.length > 0 && (
                      <FilterRow label="Entity">
                        {uniqueEntityTypes.map(et => (
                          <FilterPill
                            key={et} active={filters.entity_type === et}
                            activeClass="bg-cyan-500/15 text-cyan-400 border-cyan-500/40"
                            onClick={() => setFilter("entity_type", et)}
                          >
                            {entityLabels[et] || et}
                            <span className="text-slate-600 ml-0.5">
                              ({notifications.filter(n => n.entity_type === et).length})
                            </span>
                          </FilterPill>
                        ))}
                      </FilterRow>
                    )}

                    {/* Event type */}
                    {uniqueEventTypes.length > 0 && (
                      <FilterRow label="Event">
                        {uniqueEventTypes.map(et => (
                          <FilterPill
                            key={et} active={filters.event_type === et}
                            activeClass="bg-violet-500/15 text-violet-400 border-violet-500/40"
                            onClick={() => setFilter("event_type", et)}
                          >
                            {eventLabels[et] || et}
                          </FilterPill>
                        ))}
                      </FilterRow>
                    )}

                    {/* Read + Channel */}
                    <div className="flex gap-6">
                      <FilterRow label="Status" className="flex-1">
                        {[["unread", "Unread", `(${unreadCount})`], ["read", "Read", ""]].map(([v, label, count]) => (
                          <FilterPill key={v} active={filters.is_read === v}
                            activeClass="bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            onClick={() => setFilter("is_read", v)}>
                            {label} <span className="text-slate-600">{count}</span>
                          </FilterPill>
                        ))}
                      </FilterRow>
                      <FilterRow label="Kanal" className="flex-1">
                        {[["email", <Mail key="m" className="w-2.5 h-2.5" />, "E-mail"], ["in_app", <Bell key="b" className="w-2.5 h-2.5" />, "App"]].map(([v, icon, label]) => (
                          <FilterPill key={v} active={filters.channels === v}
                            activeClass="bg-indigo-500/15 text-indigo-400 border-indigo-500/40"
                            onClick={() => setFilter("channels", v)}>
                            {icon}{label}
                          </FilterPill>
                        ))}
                      </FilterRow>
                    </div>

                    {/* Saved searches */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide flex items-center gap-1">
                          <Bookmark className="w-3 h-3" /> Gemte søgninger
                          {savedSearches.length > 0 && (
                            <span className="bg-slate-700 text-slate-400 rounded px-1">{savedSearches.length}</span>
                          )}
                        </p>
                        <button
                          onClick={() => setShowSaveInput(v => !v)}
                          className={`text-[10px] transition-colors flex items-center gap-1 ${showSaveInput ? "text-cyan-300" : "text-cyan-500 hover:text-cyan-300"}`}
                        >
                          + Gem nuværende
                        </button>
                      </div>

                      <AnimatePresence>
                        {showSaveInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                          >
                            <div className="flex gap-1.5 mb-2">
                              <Input
                                value={saveName}
                                onChange={e => setSaveName(e.target.value)}
                                placeholder="Navn på søgning..."
                                className="h-7 text-[11px] bg-slate-800/60 border-slate-700/60 text-white"
                                onKeyDown={e => e.key === "Enter" && saveSearch()}
                                autoFocus
                              />
                              <Button size="sm" onClick={saveSearch} className="h-7 text-[11px] bg-cyan-600 hover:bg-cyan-500 px-3 flex-shrink-0">
                                Gem
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {savedSearches.length === 0 ? (
                        <p className="text-[10px] text-slate-600 italic">Ingen gemte søgninger endnu</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {savedSearches.map(s => {
                            const filterCount = Object.values(s.filters).filter(v => v !== "").length;
                            return (
                              <div key={s.id} className="flex items-center gap-0.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-full px-2 py-0.5 transition-colors">
                                <button
                                  onClick={() => { setFilters(s.filters); setShowFilters(false); }}
                                  className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-cyan-400 transition-colors"
                                >
                                  <BookmarkCheck className="w-2.5 h-2.5 text-cyan-600" />
                                  {s.name}
                                  {filterCount > 0 && (
                                    <span className="bg-slate-700 text-slate-500 rounded px-0.5 text-[8px]">{filterCount}</span>
                                  )}
                                </button>
                                <button onClick={() => deleteSaved(s.id)} className="ml-1 hover:text-rose-400 transition-colors">
                                  <X className="w-2.5 h-2.5 text-slate-600 hover:text-rose-400" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── NOTIFICATION LIST ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-slate-600 animate-spin mb-3" />
                  <p className="text-slate-500 text-sm">Indlæser notifikationer...</p>
                </div>
              ) : paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">
                    {activeFilterCount > 0 ? "Ingen resultater" : "Ingen notifikationer"}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {activeFilterCount > 0
                      ? "Prøv at justere dine filtre"
                      : "Konfigurer regler for at modtage notifikationer"}
                  </p>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="mt-3 text-xs text-cyan-500 hover:text-cyan-300 transition-colors border border-cyan-500/30 px-3 py-1 rounded-full">
                      Nulstil filtre
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {paginated.map(notif => {
                    const cfg = severityConfig[notif.severity] || severityConfig.info;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        className={`px-4 py-3 border-b border-slate-800/50 last:border-0 transition-colors cursor-default ${!notif.is_read ? "bg-slate-800/25" : "hover:bg-slate-800/15"}`}
                      >
                        <div className="flex gap-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            {!notif.is_read && (
                              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} ring-2 ring-slate-900`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[13px] font-medium leading-snug ${notif.is_read ? "text-slate-300" : "text-white"}`}>
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="flex-shrink-0 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors mt-0.5 whitespace-nowrap"
                                  title="Marker som læst"
                                >
                                  Marker læst
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>

                            {/* Clickable chips */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {notif.entity_type && (
                                <button
                                  onClick={() => setFilter("entity_type", notif.entity_type)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${filters.entity_type === notif.entity_type ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/40 hover:text-cyan-400 hover:border-cyan-500/20"}`}
                                >
                                  {entityLabels[notif.entity_type] || notif.entity_type}
                                </button>
                              )}
                              {notif.event_type && (
                                <button
                                  onClick={() => setFilter("event_type", notif.event_type)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${filters.event_type === notif.event_type ? "bg-violet-500/15 text-violet-400 border-violet-500/30" : "bg-slate-800/60 text-slate-500 border-slate-700/40 hover:text-violet-400 hover:border-violet-500/20"}`}
                                >
                                  {eventLabels[notif.event_type] || notif.event_type}
                                </button>
                              )}
                              {notif.channels?.map(ch => (
                                <span key={ch} className="text-[10px] bg-slate-800/40 text-slate-600 px-1.5 py-0.5 rounded border border-slate-700/30">
                                  {ch === "email" ? "E-mail" : ch === "in_app" ? "App" : ch}
                                </span>
                              ))}
                            </div>

                            {/* Entity details */}
                            {notif.entity_details && Object.keys(notif.entity_details).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.entries(notif.entity_details).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/30">
                                    {k}: <span className="text-slate-300">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-600">
                                {notif.created_date && formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: da })}
                              </span>
                              {notif.action_url && (
                                <Link to={notif.action_url} onClick={() => { markAsRead(notif.id); setOpen(false); }}>
                                  <span className="text-[10px] text-cyan-500 hover:text-cyan-300 flex items-center gap-0.5 transition-colors">
                                    Gå til <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Load more */}
                  {hasMore && (
                    <motion.div layout className="px-4 py-3 border-t border-slate-800/50 text-center">
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700/40 hover:border-cyan-500/30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Vis {Math.min(PAGE_SIZE, filtered.length - page * PAGE_SIZE)} flere · {filtered.length - page * PAGE_SIZE} tilbage
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* ── FOOTER ──────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                {activeFilterCount > 0
                  ? `${filtered.length} af ${notifications.length} notifikationer`
                  : `${notifications.length} notifikationer i alt`}
              </span>
              <Link to={createPageUrl("NotificationSettings")} onClick={() => setOpen(false)}>
                <span className="text-[11px] text-cyan-500 hover:text-cyan-300 transition-colors">
                  Administrer regler →
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small reusable sub-components ────────────────────────────────
function FilterRow({ label, children, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
        active
          ? `${activeClass} font-medium`
          : "border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}