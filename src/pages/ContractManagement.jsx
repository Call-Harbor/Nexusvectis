import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import ContractEditor from "../components/contracts/ContractEditor.jsx";
import ContractDetails from "../components/contracts/ContractDetails.jsx";
import RateCardManager from "../components/contracts/RateCardManager.jsx";

export default function ContractManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showRateManager, setShowRateManager] = useState(false);
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

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Contract.filter(
        { organization_id: user.organization_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.organization_id
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Customer.filter({ organization_id: user.organization_id });
    },
    enabled: !!user?.organization_id
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId) => base44.entities.Contract.delete(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success("Contract deleted");
      setSelectedContract(null);
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "draft":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "pending_approval":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "terminated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "suspended":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-3 h-3" />;
      case "pending_approval":
        return <Clock className="w-3 h-3" />;
      case "expired":
      case "terminated":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const isExpiringSoon = (endDate) => {
    const daysUntilExpiry = moment(endDate).diff(moment(), 'days');
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contract_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find(cust => cust.id === c.customer_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === "active").length,
    expiringSoon: contracts.filter(c => c.status === "active" && isExpiringSoon(c.end_date)).length,
    draft: contracts.filter(c => c.status === "draft").length
  };

  if (showEditor) {
    return (
      <ContractEditor
        contract={editingContract}
        customers={customers}
        onClose={() => {
          setShowEditor(false);
          setEditingContract(null);
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['contracts'] });
          setShowEditor(false);
          setEditingContract(null);
        }}
      />
    );
  }

  if (showRateManager && selectedContract) {
    return (
      <RateCardManager
        contract={selectedContract}
        onClose={() => {
          setShowRateManager(false);
          setSelectedContract(null);
        }}
      />
    );
  }

  if (selectedContract) {
    return (
      <ContractDetails
        contract={selectedContract}
        customer={customers.find(c => c.id === selectedContract.customer_id)}
        onClose={() => setSelectedContract(null)}
        onEdit={(contract) => {
          setEditingContract(contract);
          setShowEditor(true);
        }}
        onDelete={(contractId) => deleteContractMutation.mutate(contractId)}
        onManageRates={() => setShowRateManager(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contract Management</h1>
            <p className="text-slate-400">Manage customer contracts and rate cards</p>
          </div>
          <Button
            onClick={() => setShowEditor(true)}
            className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Contracts</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-slate-600" />
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
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Expiring Soon</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Drafts</p>
                  <p className="text-2xl font-bold text-slate-400">{stats.draft}</p>
                </div>
                <Clock className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "draft", "pending_approval", "expired"].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                variant={statusFilter === status ? "default" : "outline"}
                className={statusFilter === status 
                  ? "bg-cyan-600 hover:bg-cyan-500" 
                  : "border-slate-700 text-slate-300"}
              >
                {status === "all" ? "All" : status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading contracts...</p>
              </CardContent>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No contracts found</p>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map((contract) => {
              const customer = customers.find(c => c.id === contract.customer_id);
              const isExpiring = isExpiringSoon(contract.end_date);
              
              return (
                <Card 
                  key={contract.id} 
                  className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedContract(contract)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-white font-semibold text-lg">{contract.contract_number}</span>
                          <Badge className={getStatusColor(contract.status)}>
                            {getStatusIcon(contract.status)}
                            <span className="ml-1 capitalize">{contract.status.replace('_', ' ')}</span>
                          </Badge>
                          {isExpiring && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white font-medium mb-2">{contract.contract_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Customer</p>
                            <p className="text-white">{customer?.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Type</p>
                            <p className="text-white capitalize">{contract.contract_type}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Valid Until</p>
                            <p className="text-white">{moment(contract.end_date).format('MMM DD, YYYY')}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Payment Terms</p>
                            <p className="text-white">{contract.payment_terms || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}