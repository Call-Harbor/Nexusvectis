import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Truck, Route, Warehouse, Sparkles, 
  Settings, Users, Shield, FileText, Package, 
  DollarSign, Target, Menu, X, Zap, Home, AlertCircle, Code2, BarChart2, Brain, Bus,
  Wrench, Receipt, BarChart3, Leaf, Satellite, Bell, TrendingUp, GitBranch, Box, GraduationCap, MapPin, ChevronRight, Anchor
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "../notifications/NotificationCenter";

const menuCategories = [
  { 
    name: "Dashboard", icon: Home, color: "cyan",
    items: [
      { name: "Dashboard", icon: Home, page: "Dashboard" },
      { name: "Alerts", icon: AlertCircle, page: "Alerts" },
      { name: "Transit Control", icon: Bus, page: "TransitControl" },
      { name: "Scenario Studio", icon: GitBranch, page: "ScenarioStudio" },
      { name: "Map Monitor", icon: MapPin, page: "MapMonitor" },
    ]
  },
  { 
    name: "Fleet", icon: Truck, color: "cyan",
    items: [
      { name: "Fleet", icon: Truck, page: "Fleet" },
      { name: "Drivers", icon: Users, page: "DriverManagement" },
      { name: "Assets", icon: Package, page: "AssetManagement" },
      { name: "Maintenance", icon: Wrench, page: "MaintenanceManagement" },
      { name: "GPS Integration", icon: Satellite, page: "GPSIntegration" },
    ]
  },
  { 
    name: "Logistics", icon: Route, color: "violet",
    items: [
      { name: "Port Command", icon: Anchor, page: "PortCommandCenter" },
      { name: "Shipments", icon: Package, page: "Shipments" },
      { name: "Routes", icon: Route, page: "Routes" },
      { name: "Resources", icon: Warehouse, page: "Resources" },
      { name: "Warehouse", icon: Box, page: "WarehouseAutomation" },
      { name: "Documents", icon: FileText, page: "DocumentManagement" },
    ]
  },
  { 
    name: "Business", icon: DollarSign, color: "emerald",
    items: [
      { name: "CRM", icon: Target, page: "CRM" },
      { name: "Customers", icon: Users, page: "CustomerManagement" },
      { name: "Contracts", icon: FileText, page: "ContractManagement" },
      { name: "Invoices", icon: Receipt, page: "Invoices" },
      { name: "Reports", icon: BarChart3, page: "Reports" },
    ]
  },
  { 
    name: "AI", icon: Sparkles, color: "pink",
    items: [
      { name: "Intellect Mode", icon: Sparkles, page: "IntellectMode", badge: "BETA" },
      { name: "AI Optimization", icon: Brain, page: "AIOptimization" },
      { name: "Demand Forecast", icon: TrendingUp, page: "DemandForecasting" },
      { name: "Green TMS", icon: Leaf, page: "GreenTMS" },
    ]
  },
  {
    name: "HR", icon: GraduationCap, color: "amber",
    items: [
      { name: "HR Management", icon: GraduationCap, page: "HRManagement" },
    ]
  },
  { 
    name: "System", icon: Settings, color: "amber",
    items: [
      { name: "Users", icon: Users, page: "UserManagement" },
      { name: "Security", icon: Shield, page: "Security" },
      { name: "Settings", icon: Settings, page: "Settings" },
      { name: "Notifications", icon: Bell, page: "NotificationSettings" },
    ]
  },
  {
    name: "Developer", icon: Code2, color: "violet",
    items: [
      { name: "API Docs", icon: FileText, page: "APIDocumentation" },
      { name: "API Metrics", icon: BarChart2, page: "APIMetrics" },
    ]
  },
];

const colorBorder = {
  cyan: "border-cyan-400/40 text-cyan-400",
  violet: "border-violet-400/40 text-violet-400",
  emerald: "border-emerald-400/40 text-emerald-400",
  pink: "border-pink-400/40 text-pink-400",
  amber: "border-amber-400/40 text-amber-400",
};

export default function CircularNav({ currentPageName, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsOpen(false);
    setActiveCategory(null);
  }, [currentPageName]);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); setActiveCategory(null); }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-700/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <span className="text-white font-semibold text-sm tracking-wide">Navigation</span>
              <button
                onClick={() => { setIsOpen(false); setActiveCategory(null); }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto py-3">
              {menuCategories.map((category) => {
                const isActive = activeCategory === category.name;
                const border = colorBorder[category.color] || colorBorder.cyan;

                return (
                  <div key={category.name}>
                    <button
                      onClick={() => setActiveCategory(isActive ? null : category.name)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3 text-left transition-all hover:bg-slate-800/50",
                        isActive ? "bg-slate-800/70" : ""
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 bg-slate-900/80", border)}>
                        <category.icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <span className={cn("text-sm font-medium flex-1", isActive ? "text-white" : "text-slate-300")}>
                        {category.name}
                      </span>
                      <ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform", isActive && "rotate-90")} />
                    </button>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {category.items.map((item) => {
                            const isCurrent = currentPageName === item.page;
                            return (
                              <Link
                                key={item.page}
                                to={createPageUrl(item.page)}
                                className={cn(
                                  "flex items-center gap-3 px-6 py-2.5 ml-5 border-l border-slate-700/50 text-sm transition-all hover:bg-slate-800/50",
                                  isCurrent ? "text-white border-l-cyan-400/60" : "text-slate-400 hover:text-white"
                                )}
                              >
                                <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                                <span>{item.name}</span>
                                {item.badge && (
                                  <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px] ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {user && (
              <div className="px-5 py-4 border-t border-slate-700/50 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{user.full_name || user.email}</p>
                </div>
                <NotificationCenter user={user} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="fixed bottom-20 left-6 z-50 flex flex-col gap-2">
        <motion.button
          onClick={() => { setIsOpen(!isOpen); if (isOpen) setActiveCategory(null); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-14 h-14 rounded-full backdrop-blur-2xl border-2 shadow-2xl flex items-center justify-center transition-all",
            isOpen
              ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50"
              : "bg-slate-900/90 border-slate-700/50 hover:border-slate-600/80"
          )}
        >
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.3 }}>
            {isOpen ? <X className="w-6 h-6 text-cyan-400" /> : <Menu className="w-6 h-6 text-white" />}
          </motion.div>
        </motion.button>

        <motion.button
          onClick={() => navigate(createPageUrl("IntellectMode"))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30 backdrop-blur-2xl border border-cyan-400/50 text-white text-sm font-medium shadow-lg hover:border-cyan-400/70 flex items-center gap-2 whitespace-nowrap fixed bottom-6 right-6 z-50"
        >
          <Zap className="w-4 h-4" strokeWidth={1.5} />
          FLEET AI
          <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px]">BETA</Badge>
        </motion.button>
      </div>
    </>
  );
}