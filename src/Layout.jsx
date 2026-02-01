import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
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
  Users,
  Shield,
  Settings,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Fleet", icon: Truck, page: "Fleet" },
  { name: "Routes", icon: Route, page: "Routes" },
  { name: "Resources", icon: Warehouse, page: "Resources" },
  { name: "AI Optimization", icon: Sparkles, page: "AIOptimization" },
  { name: "GPS Integration", icon: Satellite, page: "GPSIntegration" },
  { name: "Alerts", icon: Bell, page: "Alerts" },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 z-40 hidden lg:block">
        <div className="p-6">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/1c0bebde9_FullLogo_Transparent.png" 
              alt="NexusVectis Logo" 
              className="h-24 w-auto"
            />
          </Link>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
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

          <div className="pt-4 mt-4 border-t border-slate-800/50 space-y-1">
            <Link
              to={createPageUrl("UserManagement")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                currentPageName === "UserManagement"
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <Users className={cn("w-5 h-5", currentPageName === "UserManagement" && "text-cyan-400")} />
              <span>Brugere</span>
              {currentPageName === "UserManagement" && <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />}
            </Link>

            <Link
              to={createPageUrl("Security")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                currentPageName === "Security"
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <Shield className={cn("w-5 h-5", currentPageName === "Security" && "text-cyan-400")} />
              <span>Sikkerhed</span>
              {currentPageName === "Security" && <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />}
            </Link>

            <Link
              to={createPageUrl("Invoices")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                currentPageName === "Invoices"
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <FileText className={cn("w-5 h-5", currentPageName === "Invoices" && "text-cyan-400")} />
              <span>Fakturaer</span>
              {currentPageName === "Invoices" && <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />}
            </Link>

            <Link
              to={createPageUrl("Settings")}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                currentPageName === "Settings"
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/10 text-white border border-cyan-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <Settings className={cn("w-5 h-5", currentPageName === "Settings" && "text-cyan-400")} />
              <span>Indstillinger</span>
              {currentPageName === "Settings" && <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />}
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white">AI Status</span>
            </div>
            <p className="text-xs text-slate-400">System running optimally</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 z-40 lg:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/1c0bebde9_FullLogo_Transparent.png" 
            alt="NexusVectis Logo" 
            className="h-16 w-auto"
          />
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 z-40 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all",
                  isActive ? "text-cyan-400" : "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}