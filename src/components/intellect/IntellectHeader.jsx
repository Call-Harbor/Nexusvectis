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
    ['document_editor', FileText, 'Document Editor'],
    ['spreadsheet_editor', BarChart3, 'Spreadsheet'],
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
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-7xl mx-auto">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400 relative z-10 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 tracking-wider">
              <span className="bg-gradient-to-r from-cyan-400 via-white to-violet-400 bg-clip-text text-transparent">FLEET AI</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/50 text-[10px] sm:text-xs font-bold animate-pulse">BETA</Badge>
            </h1>
            <p className="text-cyan-400 text-xs sm:text-sm">AI-Powered Fleet Operations</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button onClick={() => openWindow('global_search', { x: 120, y: 80 }, { orgId })} className="bg-slate-700 hover:bg-slate-600 text-xs sm:text-sm gap-1">
            <Search className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Search</span>
          </Button>

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
            <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm gap-1">
              <FileCode className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Apps</span><ChevronDown className="w-3 h-3" />
            </Button>
          </AppSearchDropdown>

          {/* AI Prompts Dropdown */}
          <PromptSearchDropdown
            sections={AI_PROMPT_SECTIONS}
            onSelect={executePrompt}
          >
            <Button className="bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm gap-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">AI Prompts</span><ChevronDown className="w-3 h-3" />
            </Button>
          </PromptSearchDropdown>

          <Button onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm">
            <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exit FLEET AI</span>
            <span className="sm:hidden">Exit</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/50">
            <Activity className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs lg:text-sm font-semibold">System Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}