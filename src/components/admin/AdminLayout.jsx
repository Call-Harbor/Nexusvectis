import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, FileText, Mail, Globe, Loader2, ShieldAlert, Brain, 
  BarChart2, Building2, Activity, Shield, Users, 
  Zap, Database, ChevronLeft, AlertTriangle, TrendingUp, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const adminNavItems = [
  { 
    section: "COMMAND CENTER",
    items: [
      { name: "Overview", icon: LayoutDashboard, page: "AdminDashboard" },
      { name: "Global Monitor", icon: Globe, page: "AdminMonitor" },
      { name: "Platform Health", icon: Activity, page: "AdminPlatformHealth" },
    ]
  },
  {
    section: "ORGANIZATIONS",
    items: [
      { name: "Org Intelligence", icon: Building2, page: "AdminOrganizations" },
    ]
  },
  {
    section: "REVENUE",
    items: [
      { name: "Invoices", icon: FileText, page: "AdminInvoices" },
      { name: "Revenue Engine", icon: Database, page: "AdminRevenueEngine" },
    ]
  },
  {
    section: "SECURITY & OPS",
    items: [
      { name: "Security Center", icon: Shield, page: "AdminSecurityCenter" },
      { name: "Messages", icon: Mail, page: "AdminMessages" },
    ]
  },
  {
    section: "STRATEGIC AI",
    items: [
      { name: "CEO Intelligence", icon: Brain, page: "CEODashboard" },
      { name: "Competitive Intel", icon: TrendingUp, page: "AdminCompetitiveIntel" },
      { name: "Customer Health", icon: Users, page: "AdminCustomerHealth" },
      { name: "Scenario Simulator", icon: Layers, page: "AdminScenarioSimulator" },
    ]
  }
];

export default function AdminLayout({ children, currentPage }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["contactMessages"],
    queryFn: () => base44.entities.ContactMessage.list("-created_date", 50),
  });

  const unreadCount = messages.filter(m => m.status === "new").length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need admin privileges to view this page.</p>
          <Link to="/" className="text-cyan-400 hover:underline">Return to App</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-slate-950/90 border-r border-red-500/10 flex flex-col flex-shrink-0" style={{ backdropFilter: 'blur(20px)' }}>
        {/* Header */}
        <div className="p-4 border-b border-red-500/10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="text-white font-black text-xs tracking-widest uppercase">Admin Panel</div>
              <div className="text-red-400/60 text-[9px] font-mono tracking-wider uppercase">NexusVectis Internal</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500">{user.full_name || user.email}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {adminNavItems.map((section) => (
            <div key={section.section}>
              <p className="text-[9px] font-mono tracking-widest uppercase text-slate-600 px-3 mb-1.5">{section.section}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;
                  return (
                    <Link
                      key={item.name}
                      to={`/${item.page}`}
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        isActive
                          ? "bg-red-500/15 text-white border border-red-500/25"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-red-400" : "text-slate-500")} />
                        {item.name}
                      </div>
                      {item.page === "AdminMessages" && unreadCount > 0 && (
                        <Badge className="bg-red-500/30 text-red-300 border-red-500/40 text-[9px] h-4 px-1.5">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}