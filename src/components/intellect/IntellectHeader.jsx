import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Brain, Sparkles, Zap, Activity, LayoutDashboard, Search,
  MessageSquare, FileText, BarChart3, Truck, AlertTriangle, Route,
  Package, Warehouse, Users, Satellite, ChevronDown, GraduationCap, FileCode, Globe, Video
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AI_PROMPT_SECTIONS = [
  ['Fleet Operations', [
    ['Vehicle Efficiency Analysis', "Analyser alle køretøjer og identificer dem med laveste effektivitetsscore."],
    ['Route Optimization', "Optimer alle aktive ruter baseret på aktuel trafik og vejrforhold."],
    ['Shipment Risk Assessment', "Gennemgå alle forsendelser i transit og identificer risiko for forsinket levering."],
  ]],
  ['Predictive Analytics', [
    ['Predictive Maintenance', "Forudsig vedligeholdelsesbehov for alle køretøjer i næste 30 dage."],
    ['Demand Forecasting', "Lav 90-dages efterspørgselsprognose baseret på historiske data."],
    ['ETA Accuracy Analysis', "Analyser ETA-nøjagtighed over sidste 60 dage."],
  ]],
  ['Risk & Compliance', [
    ['Risk Assessment', "Udfør omfattende risikovurdering af hele flåden."],
    ['Safety Analysis', "Analyser alle sikkerheds- og sikkerhedsvarsler fra sidste 90 dage."],
    ['Compliance Check', "Kontroller compliance med alle gældende transportbestemmelser."],
  ]],
  ['Financial & Performance', [
    ['Cost Analysis', "Analyser transportomkostninger per km, per enhed, per rute."],
    ['Sustainability Report', "Beregn CO2-emissioner for alle forsendelser."],
    ['Driver Performance', "Evaluer præstationen for hver chauffør."],
  ]],
  ['Strategic Planning', [
    ['Capacity Planning', "Analyser flådekapacitet mod efterspørgsel."],
    ['Root Cause Analysis', "Identificer mønstre i forsinkelser, afvisninger og fejl."],
  ]],
];

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
            <Search className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Søg</span>
          </Button>

          {/* Apps Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm gap-1">
                <FileCode className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Apps</span><ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="text-cyan-400">Communication & Tools</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {[['nexus_chat', MessageSquare, 'Chat'], ['document_editor', FileText, 'Document Editor'], ['spreadsheet_editor', BarChart3, 'Spreadsheet'], ['web_browser', Globe, 'Web Browser']].map(([type, Icon, label]) => (
                <DropdownMenuItem key={type} onClick={() => openWindow(type)} className="text-slate-300 gap-2"><Icon className="w-4 h-4" />{label}</DropdownMenuItem>
              ))}
              <DropdownMenuLabel className="text-cyan-400 mt-2">Fleet & Operations</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {[['fleet', Truck, 'Fleet'], ['alerts', AlertTriangle, 'Alerts'], ['routes', Route, 'Routes'], ['shipments', Package, 'Shipments'], ['resources', Warehouse, 'Resources']].map(([type, Icon, label]) => (
                <DropdownMenuItem key={type} onClick={() => openWindow(type)} className="text-slate-300 gap-2"><Icon className="w-4 h-4" />{label}</DropdownMenuItem>
              ))}
              <DropdownMenuLabel className="text-cyan-400 mt-2">Business & Analytics</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {[['dashboard', LayoutDashboard, 'Dashboard'], ['crm', Users, 'CRM'], ['hr', Users, 'HR Management'], ['invoices', FileText, 'Invoices']].map(([type, Icon, label]) => (
                <DropdownMenuItem key={type} onClick={() => openWindow(type)} className="text-slate-300 gap-2"><Icon className="w-4 h-4" />{label}</DropdownMenuItem>
              ))}
              <DropdownMenuLabel className="text-cyan-400 mt-2">Advanced</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {[['aioptimization', Sparkles, 'AI Optimization'], ['gpsintegration', Satellite, 'GPS Integration']].map(([type, Icon, label]) => (
                <DropdownMenuItem key={type} onClick={() => openWindow(type)} className="text-slate-300 gap-2"><Icon className="w-4 h-4" />{label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Prompts Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm gap-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">AI Prompts</span><ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 max-h-96 overflow-y-auto w-80">
              {AI_PROMPT_SECTIONS.map(([section, items]) => (
                <React.Fragment key={section}>
                  <DropdownMenuLabel className="text-violet-400 mt-2">{section}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  {items.map(([label, prompt]) => (
                    <DropdownMenuItem key={label} onClick={() => executePrompt(prompt)} className="text-slate-300 text-xs">{label}</DropdownMenuItem>
                  ))}
                </React.Fragment>
              ))}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={() => setShowAdvancedPanel(true)} className="text-slate-300 text-xs"><Brain className="w-4 h-4 mr-2" />Advanced Intelligence Panel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openWindow('deep_analysis', { x: 100, y: 80 })} className="text-slate-300 text-xs"><Activity className="w-4 h-4 mr-2 text-cyan-400" />Anomaly Detection + What-If</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openWindow('course_ai', { x: 120, y: 60 })} className="text-slate-300 text-xs"><GraduationCap className="w-4 h-4 mr-2 text-amber-400" />Adaptive Fleet AI Courses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowParallelProcessor(true)} className="text-slate-300 text-xs"><Zap className="w-4 h-4 mr-2 text-amber-400" />Parallel Task Processor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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