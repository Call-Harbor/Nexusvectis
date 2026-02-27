import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Search, X, Filter, SortAsc, SortDesc, Truck, Route, Package, Users,
  FileText, Warehouse, AlertTriangle, Wrench, ChevronDown, ChevronRight,
  ExternalLink, Loader2, Tag, Calendar, Hash, Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ENTITY_CONFIG = [
  {
    key: "Vehicle", label: "Køretøjer", icon: Truck, color: "cyan",
    fields: ["name", "type", "status", "driver", "destination"],
    filterFields: [
      { key: "status", label: "Status", options: ["active", "idle", "maintenance", "offline"] },
      { key: "type", label: "Type", options: ["truck", "ship", "drone", "train", "aircraft"] },
    ],
    sortFields: ["name", "status", "speed", "fuel_level", "efficiency_score"],
    page: "Fleet"
  },
  {
    key: "Route", label: "Ruter", icon: Route, color: "violet",
    fields: ["name", "origin", "destination", "status", "transport_type"],
    filterFields: [
      { key: "status", label: "Status", options: ["planned", "active", "completed", "delayed"] },
      { key: "transport_type", label: "Transport", options: ["truck", "ship", "drone", "train", "aircraft"] },
      { key: "priority", label: "Prioritet", options: ["low", "normal", "high", "critical"] },
    ],
    sortFields: ["name", "distance_km", "estimated_duration_hours", "status"],
    page: "Routes"
  },
  {
    key: "Shipment", label: "Forsendelser", icon: Package, color: "emerald",
    fields: ["tracking_number", "origin", "destination", "status", "customer_name"],
    filterFields: [
      { key: "status", label: "Status", options: ["pending", "in_transit", "delayed", "delivered", "cancelled"] },
      { key: "cargo_type", label: "Cargo", options: ["general", "cold_chain", "hazardous", "fragile", "bulk"] },
      { key: "priority", label: "Prioritet", options: ["low", "normal", "high", "urgent"] },
    ],
    sortFields: ["tracking_number", "status", "weight_kg", "eta"],
    page: "Shipments"
  },
  {
    key: "Customer", label: "Kunder", icon: Users, color: "blue",
    fields: ["name", "email", "company", "city", "country"],
    filterFields: [
      { key: "status", label: "Status", options: ["active", "inactive"] },
      { key: "customer_type", label: "Type", options: ["individual", "business"] },
    ],
    sortFields: ["name", "company", "city", "country"],
    page: "CustomerManagement"
  },
  {
    key: "Alert", label: "Alarmer", icon: AlertTriangle, color: "orange",
    fields: ["title", "message", "type", "category"],
    filterFields: [
      { key: "type", label: "Type", options: ["info", "warning", "critical", "success"] },
      { key: "category", label: "Kategori", options: ["maintenance", "delay", "weather", "fuel", "route", "system"] },
      { key: "is_resolved", label: "Løst", options: ["true", "false"] },
    ],
    sortFields: ["title", "type", "category"],
    page: "Alerts"
  },
  {
    key: "Maintenance", label: "Vedligehold", icon: Wrench, color: "yellow",
    fields: ["component", "description", "type", "priority", "status"],
    filterFields: [
      { key: "status", label: "Status", options: ["pending", "in_progress", "completed", "cancelled"] },
      { key: "priority", label: "Prioritet", options: ["low", "medium", "high", "critical"] },
      { key: "type", label: "Type", options: ["scheduled", "predictive", "emergency", "completed"] },
    ],
    sortFields: ["component", "priority", "scheduled_date", "cost_estimate"],
    page: "MaintenanceManagement"
  },
  {
    key: "Resource", label: "Ressourcer", icon: Warehouse, color: "teal",
    fields: ["name", "type", "location", "status"],
    filterFields: [
      { key: "status", label: "Status", options: ["operational", "limited", "offline"] },
      { key: "type", label: "Type", options: ["fuel_depot", "warehouse", "charging_station", "maintenance_hub", "port"] },
    ],
    sortFields: ["name", "type", "status", "capacity"],
    page: "Resources"
  },
  {
    key: "Contract", label: "Kontrakter", icon: FileText, color: "pink",
    fields: ["contract_name", "contract_number", "contract_type", "status"],
    filterFields: [
      { key: "status", label: "Status", options: ["draft", "pending_approval", "active", "expired", "terminated"] },
      { key: "contract_type", label: "Type", options: ["spot", "term", "master", "framework"] },
    ],
    sortFields: ["contract_name", "start_date", "end_date", "status"],
    page: "ContractManagement"
  },
];

const colorMap = {
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  violet: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  teal: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  pink: "text-pink-400 bg-pink-500/10 border-pink-500/30",
};

function highlight(text, query) {
  if (!query || !text) return text || "";
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return String(text);
  return (
    <>
      {String(text).slice(0, idx)}
      <mark className="bg-cyan-400/30 text-cyan-200 rounded px-0.5">{String(text).slice(idx, idx + query.length)}</mark>
      {String(text).slice(idx + query.length)}
    </>
  );
}

function EntityResult({ entity, item, query, onNavigate, onOpenWindow }) {
  const Icon = entity.icon;
  const colorClass = colorMap[entity.color];

  const mainField = item[entity.fields[0]] || item.name || item.title || item.tracking_number || item.id;
  const subFields = entity.fields.slice(1, 4).filter(f => item[f]).map(f => item[f]);

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors group border-b border-slate-800/40 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{highlight(mainField, query)}</p>
        <p className="text-slate-400 text-xs truncate">{subFields.map((v, i) => (
          <span key={i}>{i > 0 && <span className="mx-1 text-slate-600">·</span>}{highlight(v, query)}</span>
        ))}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7 text-slate-400 hover:text-cyan-400"
          title="Åbn i hologram vindue"
          onClick={() => onOpenWindow && onOpenWindow(entity.key.toLowerCase(), item)}
        >
          <Activity className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7 text-slate-400 hover:text-white"
          title="Gå til side"
          onClick={() => onNavigate(entity.page)}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function GlobalSearch({ orgId, onOpenWindow, onOpenPageWindow }) {
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeEntities, setActiveEntities] = useState(ENTITY_CONFIG.map(e => e.key));
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState({});
  const [sortDir, setSortDir] = useState({});
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const doSearch = useCallback(async () => {
    if (!debouncedQuery && Object.keys(filters).every(k => !filters[k])) {
      setResults({});
      setTotalCount(0);
      return;
    }

    setLoading(true);
    const newResults = {};
    let total = 0;

    await Promise.all(
      ENTITY_CONFIG
        .filter(e => activeEntities.includes(e.key))
        .map(async (entity) => {
          const filterObj = { organization_id: orgId };
          const entityFilters = filters[entity.key] || {};
          Object.entries(entityFilters).forEach(([k, v]) => {
            if (v) filterObj[k] = v === "true" ? true : v === "false" ? false : v;
          });

          const items = await base44.entities[entity.key].filter(filterObj, null, 200);

          const q = debouncedQuery.toLowerCase().trim();
          const filtered = q
            ? items.filter(item =>
                entity.fields.some(f => {
                  const val = item[f];
                  return val && String(val).toLowerCase().includes(q);
                })
              )
            : items;

          // Client-side sort
          const sort = sortBy[entity.key];
          const dir = sortDir[entity.key] || "asc";
          if (sort) {
            filtered.sort((a, b) => {
              const av = a[sort] ?? "";
              const bv = b[sort] ?? "";
              const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
              return dir === "asc" ? cmp : -cmp;
            });
          }

          newResults[entity.key] = filtered.slice(0, 30);
          total += filtered.length;
        })
    );

    setResults(newResults);
    setTotalCount(total);
    setLoading(false);
  }, [debouncedQuery, activeEntities, filters, sortBy, sortDir, orgId]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const toggleEntity = (key) => {
    setActiveEntities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const setFilter = (entityKey, fieldKey, value) => {
    setFilters(prev => ({
      ...prev,
      [entityKey]: { ...(prev[entityKey] || {}), [fieldKey]: value }
    }));
  };

  const toggleSort = (entityKey, field) => {
    if (sortBy[entityKey] === field) {
      setSortDir(prev => ({ ...prev, [entityKey]: prev[entityKey] === "asc" ? "desc" : "asc" }));
    } else {
      setSortBy(prev => ({ ...prev, [entityKey]: field }));
      setSortDir(prev => ({ ...prev, [entityKey]: "asc" }));
    }
  };

  const activeFilterCount = Object.values(filters).reduce((sum, obj) =>
    sum + Object.values(obj || {}).filter(v => v).length, 0
  );

  return (
    <div className="flex flex-col h-full bg-slate-950/95 rounded-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-900 rounded-xl border border-slate-700 px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
              placeholder="Søg på tværs af alle dataenheder..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={`text-xs gap-1.5 border ${showFilters ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" : "border-slate-700 text-slate-400"}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtre
            {activeFilterCount > 0 && (
              <Badge className="bg-cyan-500 text-white text-[10px] px-1 py-0 h-4 min-w-4">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        {/* Entity toggles */}
        <div className="flex flex-wrap gap-1.5">
          {ENTITY_CONFIG.map(entity => {
            const Icon = entity.icon;
            const active = activeEntities.includes(entity.key);
            const count = results[entity.key]?.length;
            return (
              <button
                key={entity.key}
                onClick={() => toggleEntity(entity.key)}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all ${
                  active
                    ? `${colorMap[entity.color]} border-current`
                    : "text-slate-500 bg-transparent border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <Icon className="w-3 h-3" />
                {entity.label}
                {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-800 overflow-hidden"
          >
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {ENTITY_CONFIG.filter(e => activeEntities.includes(e.key)).map(entity => (
                <div key={entity.key}>
                  <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <entity.icon className="w-3 h-3" /> {entity.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entity.filterFields.map(ff => (
                      <div key={ff.key} className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500">{ff.label}:</span>
                        <select
                          className="text-[11px] bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 outline-none focus:border-cyan-500/50"
                          value={filters[entity.key]?.[ff.key] || ""}
                          onChange={e => setFilter(entity.key, ff.key, e.target.value)}
                        >
                          <option value="">Alle</option>
                          {ff.options.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">Sorter:</span>
                      <select
                        className="text-[11px] bg-slate-800 border border-slate-700 text-white rounded px-1.5 py-0.5 outline-none focus:border-cyan-500/50"
                        value={sortBy[entity.key] || ""}
                        onChange={e => setSortBy(prev => ({ ...prev, [entity.key]: e.target.value }))}
                      >
                        <option value="">Standard</option>
                        {entity.sortFields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSortDir(prev => ({ ...prev, [entity.key]: prev[entity.key] === "desc" ? "asc" : "desc" }))}
                        className="text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        {sortDir[entity.key] === "desc"
                          ? <SortDesc className="w-3.5 h-3.5" />
                          : <SortAsc className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!debouncedQuery && activeFilterCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
            <Search className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium mb-1">Universel Søgning</p>
            <p className="text-slate-600 text-sm">Søg på tværs af køretøjer, ruter, forsendelser, kunder og mere</p>
          </div>
        ) : totalCount === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
            <Hash className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">Ingen resultater fundet</p>
            <p className="text-slate-600 text-sm mt-1">Prøv en anden søgning eller juster filtrene</p>
          </div>
        ) : (
          <div>
            {debouncedQuery && (
              <div className="px-4 py-2 border-b border-slate-800/60">
                <p className="text-xs text-slate-500">
                  {loading ? "Søger..." : `${totalCount} resultater for "${debouncedQuery}"`}
                </p>
              </div>
            )}
            {ENTITY_CONFIG
              .filter(e => activeEntities.includes(e.key) && results[e.key]?.length > 0)
              .map(entity => {
                const items = results[entity.key] || [];
                const isExpanded = expandedEntity === entity.key;
                const displayItems = isExpanded ? items : items.slice(0, 4);
                const Icon = entity.icon;

                return (
                  <div key={entity.key} className="border-b border-slate-800/40">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-900/50 transition-colors"
                      onClick={() => setExpandedEntity(isExpanded ? null : entity.key)}
                    >
                      <Icon className={`w-4 h-4 ${colorMap[entity.color].split(" ")[0]}`} />
                      <span className="text-sm font-semibold text-slate-200">{entity.label}</span>
                      <Badge className={`text-[10px] px-1.5 ${colorMap[entity.color]}`}>{items.length}</Badge>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-600 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <div>
                      {displayItems.map(item => (
                        <EntityResult
                          key={item.id}
                          entity={entity}
                          item={item}
                          query={debouncedQuery}
                          onNavigate={(page) => navigate(createPageUrl(page))}
                          onOpenWindow={onOpenWindow}
                        />
                      ))}
                      {!isExpanded && items.length > 4 && (
                        <button
                          className="w-full text-xs text-slate-500 hover:text-cyan-400 py-2 px-4 text-left transition-colors"
                          onClick={() => setExpandedEntity(entity.key)}
                        >
                          + {items.length - 4} flere resultater
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}