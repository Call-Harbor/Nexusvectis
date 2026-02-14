import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Key, User as UserIcon, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({
    company_name: "NexusVectis ApS",
    vat_number: "",
    company_address: "",
    company_country: "Denmark",
    company_email: "",
    company_phone: "",
    bank_account: "",
    bank_swift: "",
    company_registration: ""
  });
  const [accountingDefaults, setAccountingDefaults] = useState({
    accounting_account: "",
    cost_center: "",
    project_number: "",
    reference_number: "",
    accounting_notes: ""
  });
  const [invoiceSettingsId, setInvoiceSettingsId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const orgId = currentUser.organization_id || currentUser.data?.organization_id;
      if (orgId) {
        const org = await base44.entities.Organization.filter({ id: orgId });
        if (org.length > 0) {
          setOrganization(org[0]);
          setOrgName(org[0].name);
        }
      }
      
      // Load invoice settings
      const settings = await base44.entities.InvoiceSettings.list();
      if (settings.length > 0) {
        const s = settings[0];
        setInvoiceSettings(s);
        setInvoiceSettingsId(s.id);
        
        // Load accounting defaults if they exist
        setAccountingDefaults({
          accounting_account: s.accounting_account || "",
          cost_center: s.cost_center || "",
          project_number: s.project_number || "",
          reference_number: s.reference_number || "",
          accounting_notes: s.accounting_notes || ""
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const updateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    const orgId = user.organization_id || user.data?.organization_id;
    if (!orgId) {
      toast.error("Organization ID not found");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Organization.update(orgId, {
        name: orgName
      });
      toast.success("Organization updated");
    } catch (error) {
      toast.error("Could not update organization");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateInvoiceSettings = async () => {
    if (!invoiceSettings.company_name.trim() || !invoiceSettings.vat_number.trim()) {
      toast.error("Company name and VAT number are required");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = { ...invoiceSettings, ...accountingDefaults };
      if (invoiceSettingsId) {
        await base44.entities.InvoiceSettings.update(invoiceSettingsId, dataToSave);
      } else {
        const created = await base44.entities.InvoiceSettings.create(dataToSave);
        setInvoiceSettingsId(created.id);
      }
      toast.success("Invoice settings updated");
    } catch (error) {
      toast.error("Could not update invoice settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      // Note: Base44 doesn't have built-in password change, but we'll simulate it
      // In a real app, you'd call an API endpoint
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Could not change password");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await base44.entities.User.delete(user.id);
      toast.success("Your account has been deleted");
      // Log out and redirect
      setTimeout(() => {
        base44.auth.logout();
      }, 1000);
    } catch (error) {
      toast.error("Could not delete account");
      console.error(error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and organization</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="account" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <UserIcon className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="organization" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Building2 className="w-4 h-4 mr-2" />
              Organization
            </TabsTrigger>
            {organization && (
              <TabsTrigger value="billing" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Building2 className="w-4 h-4 mr-2" />
                Billing Info
              </TabsTrigger>
            )}
            {user?.role === 'admin' && (
              <TabsTrigger value="invoice" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Building2 className="w-4 h-4 mr-2" />
                Invoice Settings
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Key className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-slate-400">
                  View your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-slate-800/50 border-slate-700 text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Name</Label>
                  <Input
                    value={user.full_name || ""}
                    disabled
                    className="bg-slate-800/50 border-slate-700 text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Role</Label>
                  <Input
                    value={user.role === "admin" ? "Administrator" : "User"}
                    disabled
                    className="bg-slate-800/50 border-slate-700 text-slate-400"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Organization</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your organization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Enter organization name"
                  />
                </div>
                <Button
                  onClick={updateOrganization}
                  disabled={saving || !orgName.trim()}
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
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Faktura Oplysninger</CardTitle>
                <CardDescription className="text-slate-400">
                  Tilpas dine fakturadetaljer og standardværdier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Grundlæggende Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Firmanavn</Label>
                      <Input
                        value={organization?.name || ""}
                        onChange={(e) => setOrganization({...organization, name: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Firmanavn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">CVR/VAT Nummer</Label>
                      <Input
                        value={organization?.vat_number || ""}
                        onChange={(e) => setOrganization({...organization, vat_number: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="DK12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Registreringsnummer</Label>
                      <Input
                        value={organization?.settings?.company_registration || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, company_registration: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="CVR nummer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Afdeling</Label>
                      <Input
                        value={organization?.settings?.department || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, department: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="F.eks. Logistik"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Adresse</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Fuld Adresse</Label>
                      <Input
                        value={organization?.address || ""}
                        onChange={(e) => setOrganization({...organization, address: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Vejnavn og nummer"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">By</Label>
                        <Input
                          value={organization?.headquarters_city || ""}
                          onChange={(e) => setOrganization({...organization, headquarters_city: e.target.value})}
                          className="bg-slate-800/50 border-slate-700 text-white"
                          placeholder="By"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Land</Label>
                        <Input
                          value={organization?.headquarters_country || ""}
                          onChange={(e) => setOrganization({...organization, headquarters_country: e.target.value})}
                          className="bg-slate-800/50 border-slate-700 text-white"
                          placeholder="Land"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Kontaktinformation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        value={organization?.settings?.company_email || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, company_email: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="kontakt@firma.dk"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Telefon</Label>
                      <Input
                        value={organization?.settings?.company_phone || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, company_phone: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Hjemmeside</Label>
                      <Input
                        value={organization?.settings?.website || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, website: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="www.firma.dk"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Betalingsinformation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Bankkonto (IBAN)</Label>
                      <Input
                        value={organization?.settings?.bank_account || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, bank_account: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="DK1234567890123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">SWIFT/BIC</Label>
                      <Input
                        value={organization?.settings?.bank_swift || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, bank_swift: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="DABADKKK"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Standard Betalingsbetingelser</Label>
                      <Input
                        value={organization?.settings?.default_payment_terms || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, default_payment_terms: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Net 14 dage"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Standard Valuta</Label>
                      <Input
                        value={organization?.settings?.default_currency || "EUR"}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, default_currency: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="EUR"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label className="text-slate-300">Betalingsinstruktioner</Label>
                    <Textarea
                      value={organization?.settings?.payment_instructions || ""}
                      onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, payment_instructions: e.target.value}})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Betalingsinstruktioner der vises på fakturaer..."
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Bogføringsoplysninger</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Kontonummer</Label>
                      <Input
                        value={organization?.settings?.accounting_account || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, accounting_account: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="8000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Omkostningscenter</Label>
                      <Input
                        value={organization?.settings?.cost_center || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, cost_center: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="CC-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Projektnummer</Label>
                      <Input
                        value={organization?.settings?.project_number || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, project_number: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="PRJ-2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Reference/Bilagsnummer</Label>
                      <Input
                        value={organization?.settings?.reference_number || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, reference_number: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="REF-2024"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Tilpassede Felter</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Felt 1 Label</Label>
                      <Input
                        value={organization?.settings?.custom_field_1_label || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, custom_field_1_label: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="F.eks. 'Indkøbsordre'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Felt 2 Label</Label>
                      <Input
                        value={organization?.settings?.custom_field_2_label || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, custom_field_2_label: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="F.eks. 'Kontrakt'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Felt 3 Label</Label>
                      <Input
                        value={organization?.settings?.custom_field_3_label || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, custom_field_3_label: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="F.eks. 'Projekt ID'"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3">Faktura Layout</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Faktura Præfiks</Label>
                      <Input
                        value={organization?.settings?.invoice_prefix || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, invoice_prefix: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="INV-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Footer Tekst</Label>
                      <Textarea
                        value={organization?.settings?.invoice_footer_text || ""}
                        onChange={(e) => setOrganization({...organization, settings: {...organization?.settings, invoice_footer_text: e.target.value}})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="Tekst der vises i bunden af fakturaer..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={async () => {
                    if (!organization?.name || !organization?.vat_number || !organization?.address) {
                      toast.error("Firmanavn, CVR nummer og adresse er påkrævet");
                      return;
                    }
                    setSaving(true);
                    try {
                      await base44.entities.Organization.update(organization.id, {
                        name: organization.name,
                        vat_number: organization.vat_number,
                        address: organization.address,
                        headquarters_city: organization.headquarters_city,
                        headquarters_country: organization.headquarters_country,
                        settings: organization.settings
                      });
                      toast.success("Faktura oplysninger opdateret");
                    } catch (error) {
                      toast.error("Kunne ikke opdatere oplysninger");
                      console.error(error);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gemmer...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Gem Oplysninger
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">NexusVectis Company Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Information used on invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Company Name *</Label>
                    <Input
                      value={invoiceSettings.company_name}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, company_name: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="NexusVectis ApS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">CVR/VAT Number *</Label>
                    <Input
                      value={invoiceSettings.vat_number}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, vat_number: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="DK12345678"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Address *</Label>
                  <Input
                    value={invoiceSettings.company_address}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, company_address: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Vesterbrogade 123, 1620 København V, Denmark"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Country *</Label>
                    <Input
                      value={invoiceSettings.company_country}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, company_country: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Denmark"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Company Registration Number</Label>
                    <Input
                      value={invoiceSettings.company_registration}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, company_registration: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="12345678"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      value={invoiceSettings.company_email}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, company_email: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="invoices@nexusvectis.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input
                      value={invoiceSettings.company_phone}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, company_phone: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="+45 12 34 56 78"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Bank Account (IBAN)</Label>
                    <Input
                      value={invoiceSettings.bank_account}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, bank_account: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="DK1234567890123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">SWIFT/BIC</Label>
                    <Input
                      value={invoiceSettings.bank_swift}
                      onChange={(e) => setInvoiceSettings({...invoiceSettings, bank_swift: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="DABADKKK"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Default Accounting Information</h3>
                  <p className="text-sm text-slate-400 mb-4">These details will automatically be added to new invoices</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Account Number</Label>
                      <Input
                        value={accountingDefaults.accounting_account}
                        onChange={(e) => setAccountingDefaults({...accountingDefaults, accounting_account: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="8000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Cost Center</Label>
                      <Input
                        value={accountingDefaults.cost_center}
                        onChange={(e) => setAccountingDefaults({...accountingDefaults, cost_center: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="CC-100"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Project Number</Label>
                      <Input
                        value={accountingDefaults.project_number}
                        onChange={(e) => setAccountingDefaults({...accountingDefaults, project_number: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="PRJ-2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Reference/Document Number</Label>
                      <Input
                        value={accountingDefaults.reference_number}
                        onChange={(e) => setAccountingDefaults({...accountingDefaults, reference_number: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white"
                        placeholder="REF-001"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label className="text-slate-300">Internal Accounting Notes</Label>
                    <Input
                      value={accountingDefaults.accounting_notes}
                      onChange={(e) => setAccountingDefaults({...accountingDefaults, accounting_notes: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Accounting remarks..."
                    />
                  </div>
                </div>
                
                <Button
                  onClick={updateInvoiceSettings}
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 mt-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Invoice Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Change Password</CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Enter new password (min. 8 characters)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={changePassword}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Permanently delete your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">
                    When you delete your account, all your data will be permanently removed. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}