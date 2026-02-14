import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, TrendingUp, Wrench } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import AssetEditor from "../components/assets/AssetEditor.jsx";
import AssetDetails from "../components/assets/AssetDetails.jsx";

export default function AssetManagement() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
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

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Asset.filter({ organization_id: user.organization_id }, '-created_date', 200);
    },
    enabled: !!user?.organization_id
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "in_use":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "maintenance":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "retired":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.asset_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || a.asset_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === "available").length,
    inUse: assets.filter(a => a.status === "in_use").length,
    maintenance: assets.filter(a => a.status === "maintenance").length
  };

  if (showEditor) {
    return (
      <AssetEditor
        asset={editingAsset}
        onClose={() => {
          setShowEditor(false);
          setEditingAsset(null);
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['assets'] });
          setShowEditor(false);
          setEditingAsset(null);
        }}
      />
    );
  }

  if (selectedAsset) {
    return (
      <AssetDetails
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onEdit={(asset) => {
          setEditingAsset(asset);
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
            <h1 className="text-3xl font-bold text-white mb-2">Asset Management</h1>
            <p className="text-slate-400">Track and manage logistics assets</p>
          </div>
          <Button
            onClick={() => setShowEditor(true)}
            className="bg-gradient-to-r from-cyan-600 to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Assets</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Available</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.available}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Use</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.inUse}</p>
                </div>
                <Package className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Maintenance</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.maintenance}</p>
                </div>
                <Wrench className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {["all", "trailer", "container", "forklift"].map((type) => (
              <Button
                key={type}
                onClick={() => setTypeFilter(type)}
                variant={typeFilter === type ? "default" : "outline"}
                className={typeFilter === type ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading assets...</p>
              </CardContent>
            </Card>
          ) : filteredAssets.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 col-span-full">
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No assets found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAssets.map((asset) => (
              <Card 
                key={asset.id} 
                className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">{asset.name}</h3>
                      <p className="text-slate-400 text-sm">{asset.asset_number}</p>
                    </div>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{asset.asset_type}</span>
                    </div>
                    {asset.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location</span>
                        <span className="text-white">{asset.location}</span>
                      </div>
                    )}
                    {asset.utilization_rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Utilization</span>
                        <span className="text-cyan-400">{asset.utilization_rate}%</span>
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