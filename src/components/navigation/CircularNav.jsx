import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Truck, Route, Warehouse, Sparkles, 
  Settings, Users, Shield, FileText, Package, 
  DollarSign, Target, Menu, X, Zap, Home, AlertCircle, Code2, BarChart2, Brain, Bus,
  Wrench, Receipt, BarChart3, Leaf, Satellite, Bell, TrendingUp, GitBranch, Box, GraduationCap, MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "../notifications/NotificationCenter";

const menuCategories = [
  { 
    name: "Dashboard", 
    icon: Home, 
    color: "cyan",
    items: [
      { name: "Dashboard", icon: Home, page: "Dashboard" },
      { name: "Alerts", icon: AlertCircle, page: "Alerts" },
      { name: "Transit Control", icon: Bus, page: "TransitControl" },
      { name: "Scenario Studio", icon: GitBranch, page: "ScenarioStudio" },
      { name: "Map Monitor", icon: MapPin, page: "MapMonitor" },
    ]
  },
  { 
    name: "Fleet", 
    icon: Truck, 
    color: "cyan",
    items: [
      { name: "Fleet", icon: Truck, page: "Fleet" },
      { name: "Drivers", icon: Users, page: "DriverManagement" },
      { name: "Assets", icon: Package, page: "AssetManagement" },
      { name: "Maintenance", icon: Wrench, page: "MaintenanceManagement" },
      { name: "GPS Integration", icon: Satellite, page: "GPSIntegration" },
    ]
  },
  { 
    name: "Logistics", 
    icon: Route, 
    color: "violet",
    items: [
      { name: "Shipments", icon: Package, page: "Shipments" },
      { name: "Routes", icon: Route, page: "Routes" },
      { name: "Resources", icon: Warehouse, page: "Resources" },
      { name: "Warehouse", icon: Box, page: "WarehouseAutomation" },
      { name: "Documents", icon: FileText, page: "DocumentManagement" },
    ]
  },
  { 
    name: "Business", 
    icon: DollarSign, 
    color: "emerald",
    items: [
      { name: "CRM", icon: Target, page: "CRM" },
      { name: "Customers", icon: Users, page: "CustomerManagement" },
      { name: "Contracts", icon: FileText, page: "ContractManagement" },
      { name: "Invoices", icon: Receipt, page: "Invoices" },
      { name: "Reports", icon: BarChart3, page: "Reports" },
    ]
  },
  { 
    name: "AI", 
    icon: Sparkles, 
    color: "pink",
    items: [
      { name: "Intellect Mode", icon: Sparkles, page: "IntellectMode", badge: "BETA" },
      { name: "AI Optimization", icon: Brain, page: "AIOptimization" },
      { name: "Demand Forecast", icon: TrendingUp, page: "DemandForecasting" },
      { name: "Green TMS", icon: Leaf, page: "GreenTMS" },
    ]
  },
  {
    name: "HR",
    icon: GraduationCap,
    color: "amber",
    items: [
      { name: "HR Management", icon: GraduationCap, page: "HRManagement" },
    ]
  },
  { 
    name: "System", 
    icon: Settings, 
    color: "amber",
    items: [
      { name: "Users", icon: Users, page: "UserManagement" },
      { name: "Security", icon: Shield, page: "Security" },
      { name: "Settings", icon: Settings, page: "Settings" },
      { name: "Notifications", icon: Bell, page: "NotificationSettings" },
    ]
  },
  {
    name: "Developer",
    icon: Code2,
    color: "violet",
    items: [
      { name: "API Docs", icon: FileText, page: "APIDocumentation" },
      { name: "API Metrics", icon: BarChart2, page: "APIMetrics" },
    ]
  },
];

export default function CircularNav({ currentPageName, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  // Auto-close menu when page changes
  useEffect(() => {
    setIsOpen(false);
    setActiveCategory(null);
  }, [currentPageName]);

  const colorMap = useMemo(() => ({
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-400/30 text-cyan-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-400/30 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-400/30 text-emerald-400",
    pink: "from-pink-500/20 to-pink-500/5 border-pink-400/30 text-pink-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-400/30 text-amber-400",
  }), []);

  const getColorClasses = (color) => colorMap[color] || colorMap.cyan;

  const toggleCategory = (categoryName) => {
    setActiveCategory(activeCategory === categoryName ? null : categoryName);
  };

  return (
    <>
    <div className="fixed bottom-[360px] left-1/2 -translate-x-1/2 z-50">
      {/* Main Menu Button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setActiveCategory(null);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-16 h-16 rounded-full backdrop-blur-2xl border-2 shadow-2xl relative overflow-hidden flex items-center justify-center",
          isOpen 
            ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50" 
            : "bg-slate-900/80 border-slate-700/50 hover:border-slate-600/80"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        >
          {isOpen ? (
            <X className="w-7 h-7 text-cyan-400" />
          ) : (
            <Menu className="w-7 h-7 text-white" />
          )}
        </motion.div>
        
        {/* Pulsing ring when closed */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-cyan-400"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Category Menu Items (First Circle) */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {menuCategories.map((category, index) => {
               const angle = (index / menuCategories.length) * 2 * Math.PI - Math.PI / 2;
               const radius = 130;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isActive = activeCategory === category.name;

              return (
                <motion.button
                  key={`cat-${category.name}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    x, 
                    y
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    delay: index * 0.04,
                    type: "spring",
                    stiffness: 350,
                    damping: 25
                  }}
                  onClick={() => toggleCategory(category.name)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "absolute w-14 h-14 rounded-full backdrop-blur-2xl border-2 shadow-xl flex items-center justify-center",
                    "bg-gradient-to-br",
                    isActive 
                      ? getColorClasses(category.color)
                      : "from-slate-900/80 to-slate-800/80 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600"
                  )}
                  style={{ bottom: 8, left: 8 }}
                >
                  <category.icon className="w-6 h-6" strokeWidth={1.5} />
                </motion.button>
              );
            })}


          </>
        )}
      </AnimatePresence>

      {/* Submenu Items (Second Circle) */}
      <AnimatePresence mode="wait">
        {isOpen && activeCategory && (
          <>
            {(() => {
              const activeMenu = menuCategories.find(c => c.name === activeCategory);
              const categoryIndex = menuCategories.findIndex(c => c.name === activeCategory);
              const categoryAngle = (categoryIndex / menuCategories.length) * 2 * Math.PI - Math.PI / 2;
              const totalItems = activeMenu?.items.length || 1;
              const spreadAngle = Math.min(Math.PI / 2, (totalItems - 1) * 0.32);
              const startAngle = categoryAngle - spreadAngle / 2;

              return activeMenu?.items.map((item, index) => {
                const itemAngle = startAngle + (index / (totalItems - 1 || 1)) * spreadAngle;
                const radius = 240;
                const x = Math.cos(itemAngle) * radius;
                const y = Math.sin(itemAngle) * radius;
                const isActive = currentPageName === item.page;

                return (
                  <motion.div
                    key={`item-${item.page}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      x, 
                      y
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      delay: index * 0.04,
                      type: "spring",
                      stiffness: 350,
                      damping: 25
                    }}
                    className="absolute bottom-2 left-2 max-w-48"
                  >
                    <Link
                      to={createPageUrl(item.page)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-2xl border shadow-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-xl",
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-cyan-400/50 text-white"
                          : "bg-slate-900/90 border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600/70"
                      )}
                    >
                      <item.icon className="w-4 h-4" strokeWidth={1.5} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </motion.div>
                );
              });
            })()}
          </>
        )}
      </AnimatePresence>
    </div>

    {/* Bottom Action Bar - Fleet AI & User Info - Always visible */}
    <div className="fixed bottom-4 left-4 flex flex-col gap-2 pointer-events-auto z-50">
      {/* Fleet AI Button */}
      <motion.button
        onClick={() => navigate(createPageUrl("IntellectMode"))}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30 backdrop-blur-2xl border border-cyan-400/50 text-white text-sm font-medium shadow-lg hover:shadow-xl hover:border-cyan-400/70 flex items-center gap-2 transition-shadow whitespace-nowrap"
      >
        <Zap className="w-4 h-4" strokeWidth={1.5} />
        FLEET AI
        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px]">BETA</Badge>
      </motion.button>

      {/* User Info */}
      {user && (
        <div className="px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 whitespace-nowrap">
          <span className="text-sm text-slate-300">{user.full_name || user.email}</span>
          <NotificationCenter user={user} />
        </div>
      )}
    </div>
    </>
  );
}