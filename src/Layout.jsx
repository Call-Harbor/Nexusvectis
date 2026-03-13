import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  Warehouse, 
  Bell, 
  Globe,
  ChevronRight,
  Sparkles,
  Satellite,
  Menu,
  X,
  ChevronDown,
  Settings,
  Users,
  Shield,
  FileText,
  Package,
  Zap,
  Activity,
  Wrench,
  DollarSign,
  Target
} from "lucide-react";
import NotificationCenter from "./components/notifications/NotificationCenter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Alerts", icon: Bell, page: "Alerts" },
];

const fleetMenuItems = [
  { name: "Fleet", icon: Truck, page: "Fleet" },
  { name: "Fleet Monitor", icon: Globe, page: "MapMonitor" },
  { name: "Drivers", icon: Users, page: "DriverManagement" },
  { name: "Assets", icon: Package, page: "AssetManagement" },
  { name: "Assignments", icon: Route, page: "Assignment" },
  { name: "Maintenance", icon: Wrench, page: "MaintenanceManagement" },
];

const logisticsMenuItems = [
  { name: "Shipments", icon: Package, page: "Shipments" },
  { name: "Routes", icon: Route, page: "Routes" },
  { name: "Resources", icon: Warehouse, page: "Resources" },
  { name: "GPS Integration", icon: Satellite, page: "GPSIntegration" },
];

const businessMenuItems = [
  { name: "CRM & Pipeline", icon: Target, page: "CRM" },
  { name: "Customers", icon: Users, page: "CustomerManagement" },
  { name: "Contracts", icon: FileText, page: "ContractManagement" },
  { name: "Invoices", icon: FileText, page: "Invoices" },
  { name: "Documents", icon: FileText, page: "DocumentManagement" },
];

const aiMenuItems = [
  { name: "Intellect Mode", icon: Sparkles, page: "IntellectMode" },
  { name: "AI Optimization", icon: Sparkles, page: "AIOptimization" },
  { name: "Demand Forecasting", icon: Activity, page: "DemandForecasting" },
  { name: "Warehouse Automation", icon: Package, page: "WarehouseAutomation" },
  { name: "Green TMS", icon: Sparkles, page: "GreenTMS" },
];

const systemMenuItems = [
  { name: "Users", icon: Users, page: "UserManagement" },
  { name: "HR Management", icon: Users, page: "HRManagement" },
  { name: "Security", icon: Shield, page: "Security" },
  { name: "Reports", icon: FileText, page: "Reports" },
  { name: "Notifications", icon: Bell, page: "NotificationSettings" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

const developerMenuItems = [
  { name: "API Docs", icon: FileText, page: "APIDocumentation" },
  { name: "API Metrics", icon: Activity, page: "APIMetrics" },
];

export default function Layout({ children, currentPageName }) {
  const isHologram = new URLSearchParams(window.location.search).get('hologram') === 'true';
  const hideNav = isHologram || currentPageName === "MapMonitor" || currentPageName === "AdminMonitor" || currentPageName === "Landing" || currentPageName === "Home" || currentPageName === "IntellectMode" || currentPageName === "HologramDesktop" || currentPageName === "FleetSlidePresenter" || currentPageName === "CustomerPortal" || currentPageName === "CustomerTracking" || currentPageName === "CustomerDashboard" || currentPageName === "About" || currentPageName === "Careers" || currentPageName === "Contact" || currentPageName === "Blog" || currentPageName === "FleetAIPage" || currentPageName === "LiveTrackingPage" || currentPageName === "AnalyticsPage" || currentPageName === "IntegrationsPage" || currentPageName === "PrivacyPolicy" || currentPageName === "TermsOfService" || currentPageName === "SecurityPage" || currentPageName === "Newsroom" || currentPageName === "HarborInfo";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isIntellectMode = currentPageName === "IntellectMode";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Futuristic Top Navigation */}
      {!hideNav && (
      <nav className="fixed top-0 left-0 right-0 z-50 hidden lg:block">
        <div className="mx-6 mt-4">
          <div className="bg-slate-900/40 backdrop-blur-2xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Logo */}
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    NexusVectis
                  </h1>
                  <p className="text-[10px] text-slate-400">Neural Fleet Intelligence</p>
                </div>
              </Link>

              {/* Main Navigation */}
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  const isMapMonitor = item.page === "MapMonitor";
          
                  return isMapMonitor ? (
                    <a
                      key={item.name}
                      href={createPageUrl(item.page)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 relative",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-xl border border-cyan-400/50 -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        fleetMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Truck className={cn("w-4 h-4", fleetMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>Fleet</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
                    <DropdownMenuLabel>Fleet Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {fleetMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      const isMapMonitor = item.page === "MapMonitor";

                      return isMapMonitor ? (
                        <DropdownMenuItem key={item.name} asChild>
                          <a
                            href={createPageUrl(item.page)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </a>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        logisticsMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Route className={cn("w-4 h-4", logisticsMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>Logistics</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-cyan-500/20 text-white shadow-2xl">
                    <DropdownMenuLabel>Logistics & Planning</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {logisticsMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        businessMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <DollarSign className={cn("w-4 h-4", businessMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-cyan-500/20 text-white shadow-2xl">
                    <DropdownMenuLabel>Business Management</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {businessMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        aiMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Sparkles className={cn("w-4 h-4", aiMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>AI</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-cyan-500/20 text-white shadow-2xl">
                    <DropdownMenuLabel>AI & Automation</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {aiMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                            {item.page === "IntellectMode" && (
                              <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-semibold">BETA</Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        systemMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Settings className={cn("w-4 h-4", systemMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>System</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-cyan-500/20 text-white shadow-2xl">
                    <DropdownMenuLabel>System</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {systemMenuItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        developerMenuItems.some(item => item.page === currentPageName)
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      )}
                    >
                      <Activity className={cn("w-4 h-4", developerMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                      <span>Dev</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-900/95 backdrop-blur-xl border-cyan-500/20 text-white shadow-2xl">
                    <DropdownMenuLabel>Developer</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    {developerMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={createPageUrl(item.page)}
                            className={cn(
                              "flex items-center gap-3 cursor-pointer",
                              isActive && "text-cyan-400"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">
                {user && <NotificationCenter user={user} />}
                <Button
                  onClick={() => navigate(createPageUrl("IntellectMode"))}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 border-0 px-4 py-2"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  FLEET AI
                  <Badge className="ml-2 bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px] font-bold">BETA</Badge>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      )}

      {/* Mobile Header */}
      {!hideNav && (
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 z-50 lg:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
            alt="NexusVectis Logo" 
            className="h-16 w-auto"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>
      )}

      {/* Mobile Slide-out Menu */}
      {!hideNav && mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 right-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/50 z-40 lg:hidden overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const isMapMonitor = item.page === "MapMonitor";

                return isMapMonitor ? (
                  <a
                    key={item.name}
                    href={createPageUrl(item.page)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive 
                        ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                    <span>{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />}
                  </Link>
                );
              })}

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Fleet Operations</p>
                {fleetMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  const isMapMonitor = item.page === "MapMonitor";
                  return isMapMonitor ? (
                    <a
                      key={item.name}
                      href={createPageUrl(item.page)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Logistics & Planning</p>
                {logisticsMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Business Management</p>
                {businessMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">AI & Automation</p>
                {aiMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                      {item.page === "IntellectMode" && (
                        <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-semibold">BETA</Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">System</p>
                {systemMenuItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Developer</p>
                {developerMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Mobile Bottom Nav */}
      {!hideNav && (
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 z-40 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            const isMapMonitor = item.page === "MapMonitor";

            return isMapMonitor ? (
              <a
                key={item.name}
                href={createPageUrl(item.page)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all",
                  "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </a>
            ) : (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all",
                  isActive ? "text-cyan-400" : "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate max-w-[60px]">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all text-slate-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main className={`${!hideNav ? 'pt-28 lg:pt-24 pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}