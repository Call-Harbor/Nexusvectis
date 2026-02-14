import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Save,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RateCardManager({ contract, onClose }) {
  const [user, setUser] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
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

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['rate-cards', contract.id],
    queryFn: async () => {
      return await base44.entities.RateCard.filter(
        { contract_id: contract.id },
        '-created_date'
      );
    }
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateId) => base44.entities.RateCard.delete(rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-cards'] });
      toast.success("Rate card deleted");
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Rate Cards</h1>
              <p className="text-slate-400">{contract.contract_number} - {contract.contract_name}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingRate(null);
              setShowEditor(true);
            }}
            className="bg-gradient-to-r from-cyan-600 to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rate Card
          </Button>
        </div>

        {/* Rate Cards List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">Loading rate cards...</p>
              </CardContent>
            </Card>
          ) : rates.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No rate cards configured</p>
                <Button
                  onClick={() => setShowEditor(true)}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Rate Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            rates.map((rate) => (
              <Card key={rate.id} className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">{rate.rate_name}</h3>
                        <Badge className={rate.active 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }>
                          {rate.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Type</p>
                          <p className="text-white capitalize">{rate.rate_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Base Rate</p>
                          <p className="text-white">{rate.currency} {rate.base_rate}</p>
                        </div>
                        {rate.transport_mode && (
                          <div>
                            <p className="text-slate-400">Transport Mode</p>
                            <p className="text-white capitalize">{rate.transport_mode}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-400">Valid Period</p>
                          <p className="text-white">
                            {moment(rate.valid_from).format('MMM DD')} - {moment(rate.valid_until).format('MMM DD, YYYY')}
                          </p>
                        </div>
                      </div>
                      {(rate.origin_zone || rate.destination_zone) && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Lane:</span>
                          <span className="text-white">{rate.origin_zone || "Any"} → {rate.destination_zone || "Any"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingRate(rate);
                          setShowEditor(true);
                        }}
                        variant="outline"
                        size="icon"
                        className="border-slate-700 text-slate-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deleteRateMutation.mutate(rate.id)}
                        variant="outline"
                        size="icon"
                        className="border-red-700 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Rate Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingRate ? "Edit Rate Card" : "New Rate Card"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure pricing structure for this contract
              </DialogDescription>
            </DialogHeader>
            <RateCardEditor
              rate={editingRate}
              contract={contract}
              user={user}
              onClose={() => {
                setShowEditor(false);
                setEditingRate(null);
              }}
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ['rate-cards'] });
                setShowEditor(false);
                setEditingRate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function RateCardEditor({ rate, contract, user, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    rate_name: "",
    rate_type: "per_km",
    transport_mode: "truck",
    origin_zone: "",
    destination_zone: "",
    base_rate: 0,
    currency: contract.currency || "EUR",
    min_charge: 0,
    max_charge: 0,
    valid_from: moment().format('YYYY-MM-DD'),
    valid_until: moment(contract.end_date).format('YYYY-MM-DD'),
    active: true,
    notes: "",
    ...rate
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rate_name || !formData.base_rate) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        organization_id: user.organization_id,
        contract_id: contract.id
      };

      if (rate?.id) {
        await base44.entities.RateCard.update(rate.id, data);
        toast.success("Rate card updated");
      } else {
        await base44.entities.RateCard.create(data);
        toast.success("Rate card created");
      }
      
      onSave();
    } catch (error) {
      toast.error("Error saving rate card");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label className="text-slate-300">Rate Name *</Label>
          <Input
            value={formData.rate_name}
            onChange={(e) => setFormData({...formData, rate_name: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
            placeholder="Standard Freight Rate"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-slate-300">Rate Type *</Label>
          <Select value={formData.rate_type} onValueChange={(value) => setFormData({...formData, rate_type: value})}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_km">Per Kilometer</SelectItem>
              <SelectItem value="per_ton">Per Ton</SelectItem>
              <SelectItem value="per_pallet">Per Pallet</SelectItem>
              <SelectItem value="per_container">Per Container</SelectItem>
              <SelectItem value="per_shipment">Per Shipment</SelectItem>
              <SelectItem value="flat_rate">Flat Rate</SelectItem>
              <SelectItem value="zone_based">Zone Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Transport Mode</Label>
          <Select value={formData.transport_mode} onValueChange={(value) => setFormData({...formData, transport_mode: value})}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="ship">Ship</SelectItem>
              <SelectItem value="aircraft">Aircraft</SelectItem>
              <SelectItem value="train">Train</SelectItem>
              <SelectItem value="multimodal">Multimodal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Origin Zone</Label>
          <Input
            value={formData.origin_zone}
            onChange={(e) => setFormData({...formData, origin_zone: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
            placeholder="e.g., Copenhagen"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Destination Zone</Label>
          <Input
            value={formData.destination_zone}
            onChange={(e) => setFormData({...formData, destination_zone: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
            placeholder="e.g., Hamburg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Base Rate *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.base_rate}
            onChange={(e) => setFormData({...formData, base_rate: parseFloat(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="DKK">DKK</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Minimum Charge</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.min_charge}
            onChange={(e) => setFormData({...formData, min_charge: parseFloat(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Maximum Charge</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.max_charge}
            onChange={(e) => setFormData({...formData, max_charge: parseFloat(e.target.value)})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Valid From *</Label>
          <Input
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Valid Until *</Label>
          <Input
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label className="text-slate-300">Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="bg-slate-800/50 border-slate-700 text-white"
            rows={3}
            placeholder="Additional rate information..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="border-slate-700 text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-cyan-600 to-violet-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Rate Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
}