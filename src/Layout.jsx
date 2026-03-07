import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, rgba(2,13,30,0.98) 0%, rgba(15,10,40,0.95) 100%)' }}>
      {/* Sidebar */}
      {!hideNav && (
      <aside className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl z-40 hidden lg:block" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,10,30,0.92) 100%)', borderRight: '2px solid rgba(6,182,212,0.3)' }}>
        <div className="p-6">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis Logo" 
              className="h-32 w-auto"
            />
          </Link>
        </div>

        <nav className="px-3 space-y-1">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  fleetMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Truck className={cn("w-5 h-5", fleetMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>Fleet Operations</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  logisticsMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Route className={cn("w-5 h-5", logisticsMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>Logistics & Planning</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  businessMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <DollarSign className={cn("w-5 h-5", businessMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>Business Management</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  aiMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Sparkles className={cn("w-5 h-5", aiMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>AI & Automation</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  systemMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Settings className={cn("w-5 h-5", systemMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>System</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full",
                  developerMenuItems.some(item => item.page === currentPageName)
                    ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Activity className={cn("w-5 h-5", developerMenuItems.some(item => item.page === currentPageName) && "text-cyan-400")} />
                <span>Developer</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-white ml-3">
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
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {user && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <span className="text-xs text-slate-400 truncate">{user.full_name || user.email}</span>
              <NotificationCenter user={user} />
            </div>
          )}
          <Button
            onClick={() => navigate(createPageUrl("IntellectMode"))}
            className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 border-0"
          >
            <Zap className="w-4 h-4 mr-2" />
            FLEET AI Mode
            <Badge className="ml-2 bg-amber-500/30 text-amber-300 border-amber-500/50 text-[10px] font-bold">BETA</Badge>
          </Button>
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">AI Status</span>
              </div>
              <p className="text-xs text-slate-400">System operating normally</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
        </div>
      </aside>
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
      <main className={`flex-1 ${!hideNav ? 'lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}