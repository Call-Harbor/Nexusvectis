import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Search, Filter, Truck, Users, DollarSign, ChevronRight,
  ChevronDown, MoreHorizontal, Mail, Ban, CheckCircle2, Zap, Globe,
  TrendingUp, Calendar, Shield, Eye, Edit3, Loader2, X, Plus,
  Package, Database, AlertTriangle, Clock
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const STATUS_COLORS = {
  active: "bg-green-500/15 text-green-400 border-green-500/25",
  suspended: "bg-red-500/15 text-red-400 border-red-500/25",
  trial: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

function OrgRow({ org, vehicles, resources, invoices, users, onSelect, isSelected }) {
  const orgVehicles = vehicles.filter(v => v.organization_id === org.id);
  const orgResources = resources.filter(r => r.organization_id === org.id);
  const orgInvoices = invoices.filter(i => i.organization_id === org.id);
  const orgUsers = users.filter(u => u.organization_id === org.id);
  const revenue = orgInvoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const hasOverdue = orgInvoices.some(i => i.status === "overdue");
  const addons = [
    org.addon_airport_ops && "Airport",
    org.addon_port_command && "Port",
    org.addon_transit_control && "Transit",
  ].filter(Boolean);

  return (
    <motion.div
      layout
      onClick={() => onSelect(org)}
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-cyan-500/30 ${isSelected ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800/60 bg-slate-900/40"}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">{org.name?.[0]?.toUpperCase() || "?"}</span>
        </div>

        {/* Name + location */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm truncate">{org.name}</p>
            {hasOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-400" title="Overdue invoice" />}
            {addons.map(a => (
              <Badge key={a} className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">{a}</Badge>
            ))}
          </div>
          <p className="text-slate-500 text-xs">{org.headquarters_city}, {org.headquarters_country} · {org.admin_email}</p>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-center">
          <div>
            <p className="text-white font-bold text-sm">{orgVehicles.length}</p>
            <p className="text-[10px] text-slate-500">Units</p>
          </div>
          <div>
            <p className="text-white font-bold text-sm">{orgResources.length}</p>
            <p className="text-[10px] text-slate-500">Resources</p>
          </div>
          <div>
            <p className="text-white font-bold text-sm">€{revenue.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">Revenue</p>
          </div>
          <div>
            <p className="text-white font-bold text-sm">{orgInvoices.length}</p>
            <p className="text-[10px] text-slate-500">Invoices</p>
          </div>
        </div>

        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? "rotate-90 text-cyan-400" : ""}`} />
      </div>
    </motion.div>
  );
}

function OrgDetailPanel({ org, vehicles, resources, invoices, onClose }) {
  const orgVehicles = vehicles.filter(v => v.organization_id === org.id);
  const orgResources = resources.filter(r => r.organization_id === org.id);
  const orgInvoices = invoices.filter(i => i.organization_id === org.id);
  const revenue = orgInvoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const queryClient = useQueryClient();

  const vehicleTypes = orgVehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(vehicleTypes).map(([type, count]) => ({ name: type, value: count }));
  const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

  const revenueByMonth = orgInvoices
    .filter(i => i.status === "paid")
    .slice(-6)
    .map(i => ({ month: i.period_month?.slice(-5) || "", amount: i.total_amount || 0 }));

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: org.admin_email,
        subject: "Message from NexusVectis Admin",
        body: `<p>Hello ${org.name},</p><p>This is a message from your NexusVectis account manager. Please log in to your dashboard for the latest updates.</p>`
      });
    },
    onSuccess: () => toast.success("Email sent to " + org.admin_email),
    onError: () => toast.error("Failed to send email"),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="fixed right-0 top-0 h-full w-[480px] bg-slate-950/98 border-l border-slate-800 overflow-y-auto z-50 shadow-2xl"
      style={{ backdropFilter: "blur(20px)" }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/95 border-b border-slate-800 p-5 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-xl">{org.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-white font-bold">{org.name}</h3>
              <p className="text-slate-400 text-xs">{org.headquarters_city}, {org.headquarters_country}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Revenue", value: `€${revenue.toLocaleString()}`, icon: DollarSign, color: "#10b981" },
            { label: "Vehicles", value: orgVehicles.length, icon: Truck, color: "#06b6d4" },
            { label: "Resources", value: orgResources.length, icon: Package, color: "#f59e0b" },
            { label: "Invoices", value: orgInvoices.length, icon: Database, color: "#8b5cf6" },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <m.icon className="w-4 h-4 mb-2 opacity-70" style={{ color: m.color }} />
              <p className="text-xl font-bold text-white">{m.value}</p>
              <p className="text-xs text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Org details */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40 space-y-2 text-sm">
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Organization Details</p>
          {[
            { label: "Admin Email", value: org.admin_email },
            { label: "VAT Number", value: org.vat_number || "—" },
            { label: "Address", value: org.address || "—" },
            { label: "Registration", value: org.company_registration || "—" },
            { label: "Member Since", value: new Date(org.created_date).toLocaleDateString("da-DK") },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-slate-500">{label}</span>
              <span className="text-white text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Active Modules</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Airport Ops", active: org.addon_airport_ops },
              { label: "Port Command", active: org.addon_port_command },
              { label: "Transit Control", active: org.addon_transit_control },
            ].map(m => (
              <Badge key={m.label} className={m.active ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-slate-800/50 text-slate-600 border-slate-700/30"}>
                {m.active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                {m.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fleet composition */}
        {pieData.length > 0 && (
          <div>
            <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Fleet Composition</p>
            <div className="flex items-center gap-4">
              <PieChart width={120} height={120}>
                <Pie data={pieData} cx={55} cy={55} outerRadius={50} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300 capitalize">{d.name}</span>
                    <span className="text-slate-500">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue chart */}
        {revenueByMonth.length > 0 && (
          <div>
            <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Revenue History</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={revenueByMonth}>
                <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 9 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="amount" fill="#06b6d4" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent invoices */}
        <div>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Recent Invoices</p>
          <div className="space-y-2">
            {orgInvoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/40">
                <div>
                  <p className="text-white text-xs font-medium">{inv.invoice_number}</p>
                  <p className="text-slate-500 text-[10px]">{inv.period_month}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-bold">€{(inv.total_amount || 0).toLocaleString()}</span>
                  <Badge className={`text-[9px] ${STATUS_COLORS[inv.status] || STATUS_COLORS.trial}`}>{inv.status}</Badge>
                </div>
              </div>
            ))}
            {orgInvoices.length === 0 && <p className="text-slate-600 text-xs text-center py-3">No invoices</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <Button
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
            className="w-full bg-violet-600/80 hover:bg-violet-600 text-white gap-2"
          >
            {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Email to Admin
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminOrganizations() {
  const [search, setSearch] = useState("");
  const [filterAddon, setFilterAddon] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedOrg, setSelectedOrg] = useState(null);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["allVehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["allResources"],
    queryFn: () => base44.entities.Resource.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const filtered = organizations
    .filter(org => {
      const q = search.toLowerCase();
      return org.name?.toLowerCase().includes(q) || org.admin_email?.toLowerCase().includes(q) || org.headquarters_city?.toLowerCase().includes(q);
    })
    .filter(org => {
      if (filterAddon === "airport") return org.addon_airport_ops;
      if (filterAddon === "port") return org.addon_port_command;
      if (filterAddon === "transit") return org.addon_transit_control;
      if (filterAddon === "addons") return org.addon_airport_ops || org.addon_port_command || org.addon_transit_control;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "vehicles") return vehicles.filter(v => v.organization_id === b.id).length - vehicles.filter(v => v.organization_id === a.id).length;
      if (sortBy === "revenue") {
        const ra = invoices.filter(i => i.organization_id === a.id && i.status === "paid").reduce((s, i) => s + i.total_amount, 0);
        const rb = invoices.filter(i => i.organization_id === b.id && i.status === "paid").reduce((s, i) => s + i.total_amount, 0);
        return rb - ra;
      }
      return a.name?.localeCompare(b.name);
    });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);
  const addonCount = organizations.filter(o => o.addon_airport_ops || o.addon_port_command || o.addon_transit_control).length;

  return (
    <AdminLayout currentPage="AdminOrganizations">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Organization Intelligence</h1>
            </div>
            <p className="text-slate-400 text-sm">Deep insights across all {organizations.length} customer organizations</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Organizations", value: organizations.length, icon: Building2, color: "#06b6d4" },
            { label: "Total Vehicles", value: vehicles.length, icon: Truck, color: "#10b981" },
            { label: "Total Revenue", value: `€${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
            { label: "With Add-ons", value: addonCount, icon: Zap, color: "#8b5cf6" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-5 rounded-2xl border border-slate-800/60 bg-slate-900/60">
              <kpi.icon className="w-5 h-5 mb-3 opacity-60" style={{ color: kpi.color }} />
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations..."
              className="pl-9 bg-slate-900/60 border-slate-800 text-white" />
          </div>
          <div className="flex gap-2">
            {["all", "addons", "airport", "port", "transit"].map(f => (
              <button key={f} onClick={() => setFilterAddon(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border ${filterAddon === f ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"}`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 border border-slate-800 text-white outline-none">
            <option value="name">Sort: Name</option>
            <option value="vehicles">Sort: Vehicles</option>
            <option value="revenue">Sort: Revenue</option>
          </select>
          <span className="text-slate-500 text-xs">{filtered.length} results</span>
        </div>

        {/* Org List */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(org => (
              <OrgRow
                key={org.id}
                org={org}
                vehicles={vehicles}
                resources={resources}
                invoices={invoices}
                users={users}
                isSelected={selectedOrg?.id === org.id}
                onSelect={(o) => setSelectedOrg(selectedOrg?.id === o.id ? null : o)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-500">No organizations match your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedOrg && (
          <OrgDetailPanel
            org={selectedOrg}
            vehicles={vehicles}
            resources={resources}
            invoices={invoices}
            onClose={() => setSelectedOrg(null)}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}