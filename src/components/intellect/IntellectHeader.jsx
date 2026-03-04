import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Brain, Sparkles, Zap, Activity, LayoutDashboard, Search,
  MessageSquare, FileText, BarChart3, Truck, AlertTriangle, Route,
  Package, Warehouse, Users, Satellite, ChevronDown, GraduationCap, FileCode, Globe, Image, X, Wrench, HardDrive, ListTodo, MonitorPlay
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AI_PROMPT_SECTIONS = [
  ['Fleet Operations', [
    ['Vehicle Efficiency Analysis', "Analyze all vehicles and identify those with the lowest efficiency scores."],
    ['Route Optimization', "Optimize all active routes based on current traffic and weather conditions."],
    ['Shipment Risk Assessment', "Review all shipments in transit and identify risk of late delivery."],
  ]],
  ['Predictive Analytics', [
    ['Predictive Maintenance', "Predict maintenance needs for all vehicles in the next 30 days."],
    ['Demand Forecasting', "Create a 90-day demand forecast based on historical data."],
    ['ETA Accuracy Analysis', "Analyze ETA accuracy over the last 60 days."],
  ]],
  ['Risk & Compliance', [
    ['Risk Assessment', "Perform comprehensive risk assessment of the entire fleet."],
    ['Safety Analysis', "Analyze all safety and security alerts from the last 90 days."],
    ['Compliance Check', "Check compliance with all applicable transport regulations."],
  ]],
  ['Financial & Performance', [
    ['Cost Analysis', "Analyze transportation costs per km, per unit, per route."],
    ['Sustainability Report', "Calculate CO2 emissions for all shipments."],
    ['Driver Performance', "Evaluate performance for each driver."],
  ]],
  ['Strategic Planning', [
    ['Capacity Planning', "Analyze fleet capacity against demand."],
    ['Root Cause Analysis', "Identify patterns in delays, rejections and errors."],
  ]],
];

const APP_CATEGORIES = [
  ['Fleet & Logistics', [
    ['fleet', Truck, 'Fleet'],
    ['routes', Route, 'Routes'],
    ['shipments', Package, 'Shipments'],
    ['resources', Warehouse, 'Resources'],
    ['gpsintegration', Satellite, 'GPS Integration'],
    ['route_optimization', Route, 'Route Optimization'],
  ]],
  ['Business', [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['crm', Users, 'CRM'],
    ['invoices', FileText, 'Invoices'],
    ['hr', Users, 'HR Management'],
    ['alerts', AlertTriangle, 'Alerts'],
  ]],
  ['AI & Intelligence', [
    ['aioptimization', Sparkles, 'AI Optimization'],
    ['predictive_maintenance', Wrench, 'Predictive Maintenance'],
    ['advanced_intelligence', Brain, 'Advanced Intelligence'],
    ['deep_analysis', Activity, 'Anomaly Detection + What-If'],
    ['course_ai', GraduationCap, 'Fleet AI Courses'],
    ['parallel_processor', Zap, 'Parallel Processor'],
  ]],
  ['Productivity', [
    ['document_editor', FileText, 'FleetDocs'],
    ['spreadsheet_editor', BarChart3, 'FleetSheet'],
    ['hologram_presentation', MonitorPlay, 'FleetSlide'],
    ['project_management', ListTodo, 'PM Dashboard'],
    ['fleet_drive', HardDrive, 'Fleet Drive'],
    ['web_browser', Globe, 'Web Browser'],
    ['profile_search', Search, 'People Intelligence'],
  ]],
  ['Creative', [
    ['image_generator', Image, 'AI Image Generator'],
    ['image_editor', Image, 'AI Image Editor'],
  ]],
];

function AppSearchDropdown({ onSelect, children }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return APP_CATEGORIES;
    return APP_CATEGORIES.map(([cat, items]) => [
      cat,
      items.filter(([, , label]) => label.toLowerCase().includes(search.toLowerCase()))
    ]).filter(([, items]) => items.length > 0);
  }, [search]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 w-80 p-0">
        <div className="sticky top-0 p-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="max-h-[480px] overflow-y-auto p-3 space-y-4">
          {filtered.length > 0 ? filtered.map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">{category}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(([type, Icon, label]) => (
                  <button
                    key={type}
                    onClick={() => onSelect(type)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-800/60 transition-all text-left group"
                  >
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-slate-500 text-xs">No apps found</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PromptSearchDropdown({ sections, onSelect, children }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const results = [];
    sections.forEach(([section, items]) => {
      const sectionItems = items.filter(([label]) => label.toLowerCase().includes(search.toLowerCase()));
      if (sectionItems.length > 0) results.push([section, sectionItems]);
    });
    return results;
  }, [sections, search]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 w-96 p-0">
        <div className="sticky top-0 p-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {filtered.length > 0 ? (
            filtered.map(([section, items]) => (
              <div key={section}>
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">{section}</p>
                <div className="space-y-1">
                  {items.map(([label, prompt]) => (
                    <button
                      key={label}
                      onClick={() => onSelect(prompt)}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">No prompts found</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function IntellectHeader({ orgId, openWindow, executePrompt, setShowAdvancedPanel, setShowParallelProcessor }) {
  const navigate = useNavigate();

  return (
    <div className="relative backdrop-blur-sm" style={{ background: "rgba(0,10,25,0.15)", borderBottom: "1px solid rgba(6,182,212,0.15)" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" className="absolute">
                <polygon points="16,2 28,8 28,24 16,30 4,24 4,8" fill="rgba(6,182,212,0.1)" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />
              </svg>
              <Brain style={{ width: 13, height: 13, color: "#06b6d4", position: "relative", zIndex: 1 }} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-[0.2em] uppercase font-mono" style={{ color: "#06b6d4", textShadow: "0 0 10px rgba(6,182,212,0.5)" }}>
                FLEET AI
                <Badge className="text-[8px] px-1 py-0 tracking-widest font-mono uppercase" style={{ color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}>BETA</Badge>
              </h1>
              <p className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>AI-POWERED FLEET OPERATIONS</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => openWindow('global_search', { x: 120, y: 80 }, { orgId })}
              className="px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase font-mono transition-all"
              style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", background: "rgba(6,182,212,0.05)" }}>
              <Search className="w-3 h-3 inline mr-1" />SEARCH
            </button>

            {/* Apps Dropdown */}
            <AppSearchDropdown
              onSelect={(type) => {
                if (type === 'image_generator') openWindow('image_generator', { x: 120, y: 80 });
                else if (type === 'image_editor') openWindow('image_editor', { x: 140, y: 100 });
                else if (type === 'advanced_intelligence') setShowAdvancedPanel(true);
                else if (type === 'deep_analysis') openWindow('deep_analysis', { x: 100, y: 80 });
                else if (type === 'course_ai') openWindow('course_ai', { x: 120, y: 60 });
                else if (type === 'parallel_processor') setShowParallelProcessor(true);
                else openWindow(type);
              }}
            >
              <button className="px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase font-mono transition-all"
                style={{ color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", background: "rgba(6,182,212,0.05)" }}>
                <FileCode className="w-3 h-3 inline mr-1" />APPS<ChevronDown className="w-3 h-3 inline ml-1" />
              </button>
            </AppSearchDropdown>

            {/* AI Prompts Dropdown */}
            <PromptSearchDropdown
              sections={AI_PROMPT_SECTIONS}
              onSelect={executePrompt}
            >
              <button className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase font-mono transition-all"
                style={{ color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.05)" }}>
                <Sparkles className="w-3 h-3 inline mr-1" />AI PROMPTS<ChevronDown className="w-3 h-3 inline ml-1" />
              </button>
            </PromptSearchDropdown>

            <button onClick={() => navigate(createPageUrl("Dashboard"))}
              className="px-3 py-1 text-[9px] font-bold tracking-widest uppercase font-mono transition-all hidden sm:inline-block"
              style={{ color: "rgba(148,163,184,0.6)", border: "1px solid rgba(148,163,184,0.15)", background: "transparent" }}>
              <LayoutDashboard className="w-3 h-3 inline mr-1" />EXIT
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-mono tracking-widest uppercase"
              style={{ color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)" }}>
              <Activity className="w-2.5 h-2.5 animate-pulse" style={{ color: "#10b981" }} />
              OPERATIONAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}