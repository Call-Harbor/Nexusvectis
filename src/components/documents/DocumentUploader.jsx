import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function DocumentUploader({ onClose, onUpload }) {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    document_type: "CMR",
    document_number: "",
    title: "",
    shipment_id: "",
    customer_id: "",
    issue_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments-for-docs'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Shipment.filter({ organization_id: user.organization_id }, '-created_date', 50);
    },
    enabled: !!user?.organization_id
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-docs'],
    queryFn: async () => {
      if (!user?.organization_id) return [];
      return await base44.entities.Customer.filter({ organization_id: user.organization_id });
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData({...formData, title: selectedFile.name});
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!formData.title || !formData.document_number) {
      toast.error("Please fill in required fields");
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      // Create document record
      await base44.entities.Document.create({
        ...formData,
        organization_id: user.organization_id,
        file_url: uploadResult.file_url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "draft"
      });
      
      toast.success("Document uploaded successfully");
      onUpload();
    } catch (error) {
      toast.error("Error uploading document");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Upload Document</h1>
            <p className="text-slate-400">Add a new document to the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">File *</Label>
                <div className="relative">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FileText className="w-4 h-4" />
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Document Type *</Label>
                  <Select value={formData.document_type} onValueChange={(value) => setFormData({...formData, document_type: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CMR">CMR</SelectItem>
                      <SelectItem value="BOL">Bill of Lading</SelectItem>
                      <SelectItem value="POD">Proof of Delivery</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="packing_list">Packing List</SelectItem>
                      <SelectItem value="customs">Customs</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Document Number *</Label>
                  <Input
                    value={formData.document_number}
                    onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="DOC-2026-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  placeholder="Document title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Related Shipment</Label>
                  <Select value={formData.shipment_id} onValueChange={(value) => setFormData({...formData, shipment_id: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Select shipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {shipments.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.tracking_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Customer</Label>
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
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
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
              disabled={uploading || !file}
              className="bg-gradient-to-r from-cyan-600 to-violet-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}