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
  ChevronRight,
  Sparkles,
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
  { name: "Drivers", icon: Users, page: "DriverManagement" },
  { name: "Assets", icon: Package, page: "AssetManagement" },
  { name: "Assignments", icon: Route, page: "Assignment" },
  { name: "Maintenance", icon: Wrench, page: "MaintenanceManagement" },
];

const logisticsMenuItems = [
  { name: "Shipments", icon: Package, page: "Shipments" },
  { name: "Routes", icon: Route, page: "Routes" },
  { name: "Resources", icon: Warehouse, page: "Resources" },
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
];

const systemMenuItems = [
  { name: "Users", icon: Users, page: "UserManagement" },
  { name: "HR Management", icon: Users, page: "HRManagement" },
  { name: "Security", icon: Shield, page: "Security" },
  { name: "Reports", icon: FileText, page: "Reports" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

const NavButton = ({ item, isActive, isMapMonitor }) => {
  const Icon = item.icon;
  const className = cn(
    "flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all w-full",
    isActive
      ? "hologram-border"
      : "text-slate-400 hover:text-cyan-300 border border-transparent"
  );
  const style = isActive ? { borderColor: 'rgba(6,182,212,0.5)', background: 'rgba(6,182,212,0.05)' } : {};
  
  if (isMapMonitor) {
    return (
      <a href={createPageUrl(item.page)} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <Icon className="w-4 h-4" />
        <span>{item.name}</span>
      </a>
    );
  }
  return (
    <Link to={createPageUrl(item.page)} className={className} style={style}>
      <Icon className="w-4 h-4" />
      <span>{item.name}</span>
    </Link>
  );
};

export default function Layout({ children, currentPageName }) {
  const isHologram = new URLSearchParams(window.location.search).get('hologram') === 'true';
  const hideNav = isHologram || currentPageName === "MapMonitor" || currentPageName === "AdminMonitor" || currentPageName === "Landing" || currentPageName === "Home" || currentPageName === "IntellectMode" || currentPageName === "HologramDesktop" || currentPageName === "FleetSlidePresenter" || currentPageName === "CustomerPortal" || currentPageName === "CustomerTracking" || currentPageName === "CustomerDashboard" || currentPageName === "About" || currentPageName === "Careers" || currentPageName === "Contact" || currentPageName === "Blog" || currentPageName === "FleetAIPage" || currentPageName === "LiveTrackingPage" || currentPageName === "AnalyticsPage" || currentPageName === "IntegrationsPage" || currentPageName === "PrivacyPolicy" || currentPageName === "TermsOfService" || currentPageName === "SecurityPage" || currentPageName === "Newsroom" || currentPageName === "HarborInfo";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
      <aside className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl z-40 hidden lg:flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,10,30,0.92) 100%)', borderRight: '2px solid rgba(6,182,212,0.3)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'rgba(6,182,212,0.4)' }}>
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center hologram-border" style={{ background: 'rgba(6,182,212,0.1)' }}>
              <span className="text-xs font-bold hologram-text">[•]</span>
            </div>
            <span className="text-xs font-mono font-bold hologram-text uppercase tracking-widest">NEXUS</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return <NavButton key={item.name} item={item} isActive={isActive} />;
          })}

          <div className="pt-2">
            <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">Fleet</p>
            {fleetMenuItems.map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">Logistics</p>
            {logisticsMenuItems.map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">Business</p>
            {businessMenuItems.map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">AI</p>
            {aiMenuItems.map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">System</p>
            {systemMenuItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
          </div>
        </nav>

        <div className="p-3 border-t space-y-3" style={{ borderColor: 'rgba(6,182,212,0.4)' }}>
          {user && (
            <div className="px-2 py-2 text-xs hologram-border" style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.05)' }}>
              <p className="hologram-text truncate uppercase font-mono">{user.full_name || user.email}</p>
            </div>
          )}
          <Button
            onClick={() => navigate(createPageUrl("IntellectMode"))}
            className="w-full text-xs font-mono uppercase tracking-wider h-8"
            style={{ background: 'rgba(6,182,212,0.2)', border: '2px solid rgba(6,182,212,0.5)', color: 'rgba(6,182,212,0.9)' }}
          >
            <Zap className="w-3 h-3 mr-1" />
            Fleet AI
          </Button>
        </div>
      </aside>
      )}

      {/* Mobile Header */}
      {!hideNav && (
      <header className="fixed top-0 left-0 right-0 h-14 backdrop-blur-xl z-50 lg:hidden flex items-center justify-between px-4" style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(10,10,30,0.95) 100%)', borderBottom: '2px solid rgba(6,182,212,0.3)' }}>
        <div className="w-8 h-8 flex items-center justify-center hologram-border" style={{ background: 'rgba(6,182,212,0.1)' }}>
          <span className="text-xs font-bold hologram-text">[•]</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-cyan-400 w-8 h-8"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>
      )}

      {/* Mobile Slide-out Menu */}
      {!hideNav && mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 right-0 bottom-0 w-72 backdrop-blur-xl z-40 lg:hidden overflow-y-auto p-3 space-y-2" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,10,30,0.95) 100%)', borderLeft: '2px solid rgba(6,182,212,0.3)' }}>
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return <NavButton key={item.name} item={item} isActive={isActive} />;
            })}
            <div className="pt-2 space-y-1">
              <p className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase">Fleet</p>
              {fleetMenuItems.map((item) => {
                const isActive = currentPageName === item.page;
                return <NavButton key={item.name} item={item} isActive={isActive} />;
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!hideNav ? 'lg:ml-64 pt-14 lg:pt-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}