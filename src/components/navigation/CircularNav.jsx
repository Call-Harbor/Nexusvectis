import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Truck, Route, Warehouse, Bell, Sparkles, 
  Settings, Users, Shield, FileText, Package, Activity, 
  DollarSign, Target, Menu, X, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "../notifications/NotificationCenter";

const mainMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Alerts", icon: Bell, page: "Alerts" },
];

const fleetMenuItems = [
  { name: "Fleet", icon: Truck, page: "Fleet" },
  { name: "Drivers", icon: Users, page: "DriverManagement" },
  { name: "Assets", icon: Package, page: "AssetManagement" },
];

const logisticsMenuItems = [
  { name: "Shipments", icon: Package, page: "Shipments" },
  { name: "Routes", icon: Route, page: "Routes" },
  { name: "Resources", icon: Warehouse, page: "Resources" },
];

const businessMenuItems = [
  { name: "CRM", icon: Target, page: "CRM" },
  { name: "Customers", icon: Users, page: "CustomerManagement" },
  { name: "Contracts", icon: FileText, page: "ContractManagement" },
];

const aiMenuItems = [
  { name: "Intellect Mode", icon: Sparkles, page: "IntellectMode", badge: "BETA" },
  { name: "AI Optimization", icon: Sparkles, page: "AIOptimization" },
];

const systemMenuItems = [
  { name: "Users", icon: Users, page: "UserManagement" },
  { name: "Security", icon: Shield, page: "Security" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

const menuCategories = [
  { name: "Fleet", icon: Truck, items: fleetMenuItems, color: "cyan" },
  { name: "Logistics", icon: Route, items: logisticsMenuItems, color: "violet" },
  { name: "Business", icon: DollarSign, items: businessMenuItems, color: "emerald" },
  { name: "AI", icon: Sparkles, items: aiMenuItems, color: "pink" },
  { name: "System", icon: Settings, items: systemMenuItems, color: "amber" },
];

export default function CircularNav({ currentPageName, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    if (activeCategory === category.name) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category.name);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-400/30 text-cyan-400",
      violet: "from-violet-500/20 to-violet-500/5 border-violet-400/30 text-violet-400",
      emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-400/30 text-emerald-400",
      pink: "from-pink-500/20 to-pink-500/5 border-pink-400/30 text-pink-400",
      amber: "from-amber-500/20 to-amber-500/5 border-amber-400/30 text-amber-400",
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="fixed bottom-32 left-6 z-50">
      {/* Main Menu Button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveCategory(null);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "w-16 h-16 rounded-full backdrop-blur-2xl border-2 shadow-2xl transition-all relative overflow-hidden",
          isOpen 
            ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400/50" 
            : "bg-slate-900/80 border-slate-700/50"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-7 h-7 text-cyan-400" />
          ) : (
            <Menu className="w-7 h-7 text-white" />
          )}
        </motion.div>
        
        {/* Pulsing ring */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-cyan-400"
          />
        )}
      </motion.button>

      {/* Category Menu Items (First Circle) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {menuCategories.map((category, index) => {
              const angle = (index / menuCategories.length) * Math.PI - Math.PI / 2;
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.button
                  key={category.name}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    x, 
                    y, 
                    opacity: 1 
                  }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  onClick={() => handleCategoryClick(category)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "absolute w-14 h-14 rounded-full backdrop-blur-2xl border-2 shadow-xl flex items-center justify-center transition-all",
                    "bg-gradient-to-br",
                    activeCategory === category.name 
                      ? getColorClasses(category.color)
                      : "from-slate-900/80 to-slate-800/80 border-slate-700/50 text-slate-400 hover:text-white"
                  )}
                  style={{ bottom: 8, left: 8 }}
                >
                  <category.icon className="w-6 h-6" />
                </motion.button>
              );
            })}

            {/* Quick Actions */}
            <motion.button
              initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                x: 0, 
                y: -140, 
                opacity: 1 
              }}
              exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(createPageUrl("IntellectMode"))}
              whileHover={{ scale: 1.1 }}
              className="absolute bottom-2 left-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30 backdrop-blur-2xl border border-cyan-400/50 text-white text-sm font-medium shadow-xl flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              FLEET AI
              <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px]">BETA</Badge>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Submenu Items (Second Circle) */}
      <AnimatePresence>
        {isOpen && activeCategory && (
          <>
            {menuCategories
              .find(c => c.name === activeCategory)
              ?.items.map((item, index) => {
                const categoryIndex = menuCategories.findIndex(c => c.name === activeCategory);
                const totalItems = menuCategories.find(c => c.name === activeCategory).items.length;
                
                // Calculate angle for submenu spreading from category button
                const categoryAngle = (categoryIndex / menuCategories.length) * Math.PI - Math.PI / 2;
                const spreadAngle = Math.PI / 4; // 45 degrees spread
                const startAngle = categoryAngle - spreadAngle / 2;
                const itemAngle = startAngle + (index / (totalItems - 1 || 1)) * spreadAngle;
                
                const radius = 200;
                const x = Math.cos(itemAngle) * radius;
                const y = Math.sin(itemAngle) * radius;

                const isActive = currentPageName === item.page;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.page}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      x, 
                      y, 
                      opacity: 1 
                    }}
                    exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className="absolute bottom-2 left-2 max-w-48"
                  >
                    <Link
                      to={createPageUrl(item.page)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-2xl border shadow-xl text-sm font-medium transition-all whitespace-nowrap",
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-cyan-400/50 text-white"
                          : "bg-slate-900/90 border-slate-700/50 text-slate-300 hover:text-white hover:border-cyan-400/30"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
          </>
        )}
      </AnimatePresence>

      {/* User Info */}
      <AnimatePresence>
        {isOpen && user && (
          <motion.div
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              x: 180, 
              y: 0, 
              opacity: 1 
            }}
            exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-2 left-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 shadow-xl flex items-center gap-3"
          >
            <span className="text-sm text-slate-300">{user.full_name || user.email}</span>
            <NotificationCenter user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}