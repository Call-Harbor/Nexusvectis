import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function ContractEditor({ contract, customers, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    contract_number: "",
    contract_name: "",
    contract_type: "term",
    status: "draft",
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(1, 'year').format('YYYY-MM-DD'),
    auto_renew: false,
    renewal_notice_days: 30,
    currency: "EUR",
    payment_terms: "Net 30 days",
    credit_limit: 0,
    minimum_volume: 0,
    volume_unit: "shipments",
    discount_percentage: 0,
    sla_delivery_time: 48,
    sla_on_time_percentage: 95,
    penalty_per_day: 0,
    insurance_included: false,
    insurance_value_percentage: 0,
    fuel_surcharge_applicable: true,
    fuel_surcharge_percentage: 5,
    notes: "",
    terms_conditions: "",
    ...contract
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
    
    if (!formData.contract_number || !formData.contract_name || !formData.customer_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        organization_id: user.organization_id
      };

      if (contract?.id) {
        await base44.entities.Contract.update(contract.id, data);
        toast.success("Contract updated");
      } else {
        await base44.entities.Contract.create(data);
        toast.success("Contract created");
      }
      
      onSave();
    } catch (error) {
      toast.error("Error saving contract");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onClose}
            variant="outline"
            size="icon"
            className="border-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {contract ? "Edit Contract" : "New Contract"}
            </h1>
            <p className="text-slate-400">Configure contract details and terms</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Contract Number *</Label>
                  <Input
                    value={formData.contract_number}
                    onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="CTR-2026-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Contract Name *</Label>
                  <Input
                    value={formData.contract_name}
                    onChange={(e) => setFormData({...formData, contract_name: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Annual Transport Agreement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Customer *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spot">Spot</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="framework">Framework</SelectItem>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Renewal */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Contract Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">End Date *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Auto-Renew</Label>
                  <p className="text-slate-500 text-sm">Automatically renew contract on expiry</p>
                </div>
                <Switch
                  checked={formData.auto_renew}
                  onCheckedChange={(checked) => setFormData({...formData, auto_renew: checked})}
                />
              </div>
              {formData.auto_renew && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Renewal Notice (days)</Label>
                  <Input
                    type="number"
                    value={formData.renewal_notice_days}
                    onChange={(e) => setFormData({...formData, renewal_notice_days: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label className="text-slate-300">Payment Terms</Label>
                  <Input
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Net 30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Credit Limit</Label>
                  <Input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Minimum Volume</Label>
                  <Input
                    type="number"
                    value={formData.minimum_volume}
                    onChange={(e) => setFormData({...formData, minimum_volume: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Volume Unit</Label>
                  <Select value={formData.volume_unit} onValueChange={(value) => setFormData({...formData, volume_unit: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipments">Shipments</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="pallets">Pallets</SelectItem>
                      <SelectItem value="containers">Containers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Discount Percentage</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value)})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Level Agreement */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Service Level Agreement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Delivery Time (hours)</Label>
                  <Input
                    type="number"
                    value={formData.sla_delivery_time}
                    onChange={(e) => setFormData({...formData, sla_delivery_time: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">On-Time Target (%)</Label>
                  <Input
                    type="number"
                    value={formData.sla_on_time_percentage}
                    onChange={(e) => setFormData({...formData, sla_on_time_percentage: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Penalty per Day</Label>
                  <Input
                    type="number"
                    value={formData.penalty_per_day}
                    onChange={(e) => setFormData({...formData, penalty_per_day: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Additional Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Insurance Included</Label>
                  <p className="text-slate-500 text-sm">Include cargo insurance in rates</p>
                </div>
                <Switch
                  checked={formData.insurance_included}
                  onCheckedChange={(checked) => setFormData({...formData, insurance_included: checked})}
                />
              </div>
              {formData.insurance_included && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Insurance Coverage (%)</Label>
                  <Input
                    type="number"
                    value={formData.insurance_value_percentage}
                    onChange={(e) => setFormData({...formData, insurance_value_percentage: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Fuel Surcharge Applicable</Label>
                  <p className="text-slate-500 text-sm">Apply fuel surcharge to rates</p>
                </div>
                <Switch
                  checked={formData.fuel_surcharge_applicable}
                  onCheckedChange={(checked) => setFormData({...formData, fuel_surcharge_applicable: checked})}
                />
              </div>
              {formData.fuel_surcharge_applicable && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Fuel Surcharge (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fuel_surcharge_percentage}
                    onChange={(e) => setFormData({...formData, fuel_surcharge_percentage: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Terms & Conditions</Label>
                <Textarea
                  value={formData.terms_conditions}
                  onChange={(e) => setFormData({...formData, terms_conditions: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={5}
                  placeholder="Full terms and conditions..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
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
              className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Contract
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}