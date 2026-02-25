import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, TrendingUp, Euro, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DealsPanel({ customerId }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    deal_name: "",
    deal_value: "",
    stage: "prospect",
    probability: 20,
    expected_close_date: ""
  });

  useEffect(() => {
    loadDeals();
  }, [customerId]);

  const loadDeals = async () => {
    if (!customerId) return;
    setLoading(true);
    const data = await base44.entities.Deal.filter({
      customer_id: customerId
    });
    setDeals(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await base44.auth.me();
    await base44.entities.Deal.create({
      ...formData,
      deal_value: parseFloat(formData.deal_value),
      probability: parseFloat(formData.probability),
      customer_id: customerId,
      organization_id: user.organization_id,
      owner: user.email
    });
    setFormData({ deal_name: "", deal_value: "", stage: "prospect", probability: 20, expected_close_date: "" });
    setShowForm(false);
    loadDeals();
  };

  const handleDelete = async (id) => {
    await base44.entities.Deal.delete(id);
    loadDeals();
  };

  const stageColors = {
    prospect: "bg-slate-600",
    qualified: "bg-blue-600",
    proposal: "bg-cyan-600",
    negotiation: "bg-violet-600",
    won: "bg-emerald-600",
    lost: "bg-red-600"
  };

  const stageLabels = {
    prospect: "Prospect",
    qualified: "Kvalificeret",
    proposal: "Tilbud",
    negotiation: "Forhandling",
    won: "Vundet",
    lost: "Tabt"
  };

  if (loading) return <div className="text-slate-400">Indlæser deals...</div>;

  const totalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Deals ({deals.length})</h3>
          <p className="text-sm text-slate-400">Samlet værdi: €{totalValue.toLocaleString()}</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ny Deal
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Deal navn"
              value={formData.deal_name}
              onChange={(e) => setFormData({...formData, deal_name: e.target.value})}
              className="bg-slate-900 border-slate-700"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Værdi (EUR)"
                value={formData.deal_value}
                onChange={(e) => setFormData({...formData, deal_value: e.target.value})}
                className="bg-slate-900 border-slate-700"
                required
              />
              <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="qualified">Kvalificeret</SelectItem>
                  <SelectItem value="proposal">Tilbud</SelectItem>
                  <SelectItem value="negotiation">Forhandling</SelectItem>
                  <SelectItem value="won">Vundet</SelectItem>
                  <SelectItem value="lost">Tabt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Sandsynlighed %"
                value={formData.probability}
                onChange={(e) => setFormData({...formData, probability: e.target.value})}
                className="bg-slate-900 border-slate-700"
              />
              <Input
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-cyan-600">Gemme</Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1">Annuller</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {deals.map((deal) => (
          <Card key={deal.id} className="p-4 bg-slate-800 border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-semibold text-white">{deal.deal_name}</h4>
                </div>
                <div className="flex gap-3 items-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded text-white ${stageColors[deal.stage]}`}>
                    {stageLabels[deal.stage]}
                  </span>
                  <span className="text-sm text-slate-400">{deal.probability}% sandsynlighed</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                  <Euro className="w-4 h-4" />
                  <span className="font-semibold">{deal.deal_value.toLocaleString()}</span>
                </div>
              </div>
              <Button
                onClick={() => handleDelete(deal.id)}
                size="icon"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}