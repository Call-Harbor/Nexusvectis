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

export default function DriverEditor({ driver, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    hire_date: moment().format('YYYY-MM-DD'),
    status: "active",
    license_number: "",
    license_type: "",
    license_expiry: "",
    home_base: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    ...driver
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
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        organization_id: user.organization_id
      };

      if (driver?.id) {
        await base44.entities.Driver.update(driver.id, data);
        toast.success("Driver updated");
      } else {
        await base44.entities.Driver.create(data);
        toast.success("Driver added");
      }
      
      onSave();
    } catch (error) {
      toast.error("Error saving driver");
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
            <h1 className="text-3xl font-bold text-white">{driver ? "Edit Driver" : "Add Driver"}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">First Name *</Label>
                  <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Last Name *</Label>
                  <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Date of Birth</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Employee ID</Label>
                  <Input value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">License Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">License Number</Label>
                  <Input value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">License Type</Label>
                  <Input value={formData.license_type} onChange={(e) => setFormData({...formData, license_type: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" placeholder="CE, C1" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Expiry Date</Label>
                  <Input type="date" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Hire Date</Label>
                  <Input type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Home Base</Label>
                  <Input value={formData.home_base} onChange={(e) => setFormData({...formData, home_base: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Contact Name</Label>
                  <Input value={formData.emergency_contact_name} onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Contact Phone</Label>
                  <Input value={formData.emergency_contact_phone} onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="bg-slate-800/50 border-slate-700 text-white" rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-cyan-600 to-violet-600">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Driver</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}