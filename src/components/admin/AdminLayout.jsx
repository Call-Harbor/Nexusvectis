import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FileText, Mail, Globe, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
  { name: "Invoices", icon: FileText, page: "AdminInvoices" },
  { name: "Messages", icon: Mail, page: "AdminMessages" },
  { name: "Monitor", icon: Globe, page: "AdminMonitor" },
];

export default function AdminLayout({ children, currentPage }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

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
          <Link to={createPageUrl("Dashboard")} className="text-cyan-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-56 bg-slate-900/70 border-r border-slate-800/50 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span className="text-white font-bold text-sm tracking-wide">ADMIN PANEL</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-red-500/20 text-white border border-red-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-red-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <Link
            to={createPageUrl("Dashboard")}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}