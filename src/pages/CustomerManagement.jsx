import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, TrendingUp, Building, Filter, X, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import CustomerEditor from "../components/customers/CustomerEditor.jsx";
import CustomerDetails from "../components/customers/CustomerDetails.jsx";

// TODO(P1-RBAC): internal CRM view — should be ORG_ADMIN/ORG_USER only; do not conflate with CustomerPortal / CustomerDashboard (CUSTOMER_USER).
export default function CustomerManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Customer.filter({ organization_id: user.organization_id }, '-created_date', 200);
    },
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    return status === "active" 
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesType = typeFilter === "all" || c.customer_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
    if (sortBy === "type") return (a.customer_type || "").localeCompare(b.customer_type || "");
    if (sortBy === "location") return (a.city || "").localeCompare(b.city || "");
    return 0;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    business: customers.filter(c => c.customer_type === "business").length,
    individual: customers.filter(c => c.customer_type === "individual").length
  };

  const exportToCSV = () => {
    const headers = ["Name", "Company", "Type", "Status", "Email", "Phone", "City", "Country", "Address"];
    const rows = filteredCustomers.map(c => [
      c.name || "-",
      c.company || "-",
      c.customer_type || "-",
      c.status || "-",
      c.email || "-",
      c.phone || "-",
      c.city || "-",
      c.country || "-",
      c.address || "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showEditor) {
    return (
      <CustomerEditor
        customer={editingCustomer}
        onClose={() => {
          setShowEditor(false);
          setEditingCustomer(null);
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          setShowEditor(false);
          setEditingCustomer(null);
        }}
      />
    );
  }

  if (selectedCustomer) {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={(customer) => {
          setEditingCustomer(customer);
          setShowEditor(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customer Management</h1>
            <p className="text-slate-400">
              {filteredCustomers.length} of {customers.length} customers
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-700/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowEditor(true)}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Business</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.business}</p>
                </div>
                <Building className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Individual</p>
                  <p className="text-2xl font-bold text-violet-400">{stats.individual}</p>
                </div>
                <Users className="w-8 h-8 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, company, email, city, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "inactive"].map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === status ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Type:</label>
              <div className="flex gap-2">
                {["all", "business", "individual"].map((type) => (
                  <Button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    variant={typeFilter === type ? "default" : "outline"}
                    size="sm"
                    className={typeFilter === type ? "bg-violet-600" : "border-slate-700 text-slate-300"}
                  >
                    {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sort by:</label>
              <div className="flex gap-2">
                {[
                  { value: "name", label: "Name" },
                  { value: "company", label: "Company" },
                  { value: "type", label: "Type" },
                  { value: "location", label: "Location" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    className={sortBy === option.value ? "bg-emerald-600" : "border-slate-700 text-slate-300"}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Search: {searchTerm}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Status: {statusFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                  Type: {typeFilter}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setTypeFilter("all")}
                  />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading customers...</p>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 col-span-full">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No customers found</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">{customer.name}</h3>
                      {customer.company && (
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {customer.company}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{customer.customer_type}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email</span>
                        <span className="text-white truncate ml-2">{customer.email}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location</span>
                        <span className="text-white">{customer.city}, {customer.country}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}