import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function AssetEditor({ asset, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    asset_number: "",
    asset_type: "trailer",
    name: "",
    status: "available",
    location: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: 0,
    maintenance_interval_days: 90,
    notes: "",
    ...asset
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.asset_number || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        organization_id: user.organization_id
      };

      if (asset?.id) {
        await base44.entities.Asset.update(asset.id, data);
        toast.success("Asset updated");
      } else {
        await base44.entities.Asset.create(data);
        toast.success("Asset added");
      }
      
      onSave();
    } catch (error) {
      toast.error("Error saving asset");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onClose} variant="outline" size="icon" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{asset ? "Edit Asset" : "Add Asset"}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Asset Number *</Label>
                  <Input value={formData.asset_number} onChange={(e) => setFormData({...formData, asset_number: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Asset Type</Label>
                  <Select value={formData.asset_type} onValueChange={(value) => setFormData({...formData, asset_type: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="container">Container</SelectItem>
                      <SelectItem value="pallet">Pallet</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="scanner">Scanner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Location</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Manufacturer</Label>
                  <Input value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Model</Label>
                  <Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Serial Number</Label>
                <Input value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Purchase & Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Purchase Date</Label>
                  <Input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Purchase Cost</Label>
                  <Input type="number" value={formData.purchase_cost} onChange={(e) => setFormData({...formData, purchase_cost: parseFloat(e.target.value)})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Maintenance Interval (days)</Label>
                <Input type="number" value={formData.maintenance_interval_days} onChange={(e) => setFormData({...formData, maintenance_interval_days: parseInt(e.target.value)})} className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" rows={3} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-cyan-600 to-violet-600">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Asset</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}