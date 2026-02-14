import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function CMRGenerator({ onClose, onGenerate }) {
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    shipment_id: "",
    document_number: `CMR-${moment().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}`,
    sender_name: "",
    sender_address: "",
    consignee_name: "",
    consignee_address: "",
    place_of_loading: "",
    place_of_delivery: "",
    goods_description: "",
    number_of_packages: "",
    weight: "",
    carrier_name: "",
    vehicle_registration: ""
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-cmr'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Shipment.filter({ organization_id: user.organization_id }, '-created_date', 50);
    },
    enabled: !!user?.organization_id
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

  const handleShipmentSelect = async (shipmentId) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      setFormData({
        ...formData,
        shipment_id: shipmentId,
        place_of_loading: shipment.origin || "",
        place_of_delivery: shipment.destination || "",
        weight: shipment.weight_kg?.toString() || "",
        goods_description: `${shipment.cargo_type || 'General'} cargo`
      });

      // Load vehicle info if available
      if (shipment.vehicle_id) {
        const vehicles = await base44.entities.Vehicle.filter({ id: shipment.vehicle_id });
        if (vehicles.length > 0) {
          setFormData(prev => ({
            ...prev,
            vehicle_registration: vehicles[0].name || ""
          }));
        }
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!formData.document_number || !formData.place_of_loading || !formData.place_of_delivery) {
      toast.error("Please fill in required fields");
      return;
    }

    setGenerating(true);
    try {
      // Generate CMR document content
      const cmrContent = `
CMR CONSIGNMENT NOTE
Document No: ${formData.document_number}
Date: ${moment().format('DD/MM/YYYY')}

SENDER
Name: ${formData.sender_name}
Address: ${formData.sender_address}

CONSIGNEE
Name: ${formData.consignee_name}
Address: ${formData.consignee_address}

TRANSPORT DETAILS
Place of Loading: ${formData.place_of_loading}
Place of Delivery: ${formData.place_of_delivery}

GOODS
Description: ${formData.goods_description}
Number of Packages: ${formData.number_of_packages}
Weight: ${formData.weight} kg

CARRIER
Name: ${formData.carrier_name}
Vehicle Registration: ${formData.vehicle_registration}

This CMR consignment note is issued in accordance with the Convention on the Contract
for the International Carriage of Goods by Road (CMR).
      `;

      // Create a blob and upload it
      const blob = new Blob([cmrContent], { type: 'text/plain' });
      const file = new File([blob], `${formData.document_number}.txt`, { type: 'text/plain' });
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      // Create document record
      await base44.entities.Document.create({
        organization_id: user.organization_id,
        document_type: "CMR",
        document_number: formData.document_number,
        title: `CMR - ${formData.place_of_loading} to ${formData.place_of_delivery}`,
        shipment_id: formData.shipment_id || null,
        file_url: uploadResult.file_url,
        file_name: `${formData.document_number}.txt`,
        file_size: blob.size,
        mime_type: 'text/plain',
        status: "draft",
        issue_date: moment().format('YYYY-MM-DD'),
        metadata: {
          sender: formData.sender_name,
          consignee: formData.consignee_name,
          carrier: formData.carrier_name
        }
      });
      
      toast.success("CMR document generated successfully");
      onGenerate();
    } catch (error) {
      toast.error("Error generating CMR document");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Generate CMR Document</h1>
            <p className="text-slate-400">Create international road transport consignment note</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Link to Shipment (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.shipment_id} onValueChange={handleShipmentSelect}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select shipment to auto-fill" />
                </SelectTrigger>
                <SelectContent>
                  {shipments.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.tracking_number} - {s.origin} → {s.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Sender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Sender Name</Label>
                <Input
                  value={formData.sender_name}
                  onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Sender Address</Label>
                <Input
                  value={formData.sender_address}
                  onChange={(e) => setFormData({...formData, sender_address: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Consignee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Consignee Name</Label>
                <Input
                  value={formData.consignee_name}
                  onChange={(e) => setFormData({...formData, consignee_name: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Consignee Address</Label>
                <Input
                  value={formData.consignee_address}
                  onChange={(e) => setFormData({...formData, consignee_address: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Transport & Goods Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Place of Loading *</Label>
                  <Input
                    value={formData.place_of_loading}
                    onChange={(e) => setFormData({...formData, place_of_loading: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Place of Delivery *</Label>
                  <Input
                    value={formData.place_of_delivery}
                    onChange={(e) => setFormData({...formData, place_of_delivery: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Goods Description</Label>
                <Input
                  value={formData.goods_description}
                  onChange={(e) => setFormData({...formData, goods_description: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Number of Packages</Label>
                  <Input
                    type="number"
                    value={formData.number_of_packages}
                    onChange={(e) => setFormData({...formData, number_of_packages: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Carrier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Carrier Name</Label>
                  <Input
                    value={formData.carrier_name}
                    onChange={(e) => setFormData({...formData, carrier_name: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Vehicle Registration</Label>
                  <Input
                    value={formData.vehicle_registration}
                    onChange={(e) => setFormData({...formData, vehicle_registration: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
              disabled={generating}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Generate CMR
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}