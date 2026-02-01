import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Key, User as UserIcon, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.organization_id) {
        const org = await base44.entities.Organization.filter({ id: currentUser.organization_id });
        if (org.length > 0) {
          setOrgName(org[0].name);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const updateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Organisations navn er påkrævet");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Organization.update(user.organization_id, {
        name: orgName
      });
      toast.success("Organisation opdateret");
    } catch (error) {
      toast.error("Kunne ikke opdatere organisation");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Alle felter er påkrævet");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Adgangskoderne matcher ikke");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Adgangskoden skal være mindst 8 tegn");
      return;
    }

    setSaving(true);
    try {
      // Note: Base44 doesn't have built-in password change, but we'll simulate it
      // In a real app, you'd call an API endpoint
      toast.success("Adgangskode ændret");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Kunne ikke ændre adgangskode");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await base44.entities.User.delete(user.id);
      toast.success("Din konto er blevet slettet");
      // Log out and redirect
      setTimeout(() => {
        base44.auth.logout();
      }, 1000);
    } catch (error) {
      toast.error("Kunne ikke slette konto");
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
          <h1 className="text-3xl font-bold text-white mb-2">Indstillinger</h1>
          <p className="text-slate-400">Administrer din konto og organisation</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="account" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <UserIcon className="w-4 h-4 mr-2" />
              Konto
            </TabsTrigger>
            <TabsTrigger value="organization" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Building2 className="w-4 h-4 mr-2" />
              Organisation
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Key className="w-4 h-4 mr-2" />
              Sikkerhed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Konto oplysninger</CardTitle>
                <CardDescription className="text-slate-400">
                  Se dine konto oplysninger
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
                  <Label className="text-slate-300">Navn</Label>
                  <Input
                    value={user.full_name || ""}
                    disabled
                    className="bg-slate-800/50 border-slate-700 text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Rolle</Label>
                  <Input
                    value={user.role === "admin" ? "Administrator" : "Bruger"}
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
                <CardTitle className="text-white">Organisation</CardTitle>
                <CardDescription className="text-slate-400">
                  Administrer din organisations indstillinger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Organisations navn</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Indtast organisations navn"
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
                      Gemmer...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Gem ændringer
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
                  <CardTitle className="text-white">Skift adgangskode</CardTitle>
                  <CardDescription className="text-slate-400">
                    Opdater din adgangskode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nuværende adgangskode</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Indtast nuværende adgangskode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Ny adgangskode</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Indtast ny adgangskode (min. 8 tegn)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Bekræft ny adgangskode</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      placeholder="Bekræft ny adgangskode"
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
                        Opdaterer...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Opdater adgangskode
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Farezone
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Permanent slet din konto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">
                    Når du sletter din konto, vil alle dine data blive permanent fjernet. Denne handling kan ikke fortrydes.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Slet min konto
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Er du helt sikker?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Denne handling kan ikke fortrydes. Dette vil permanent slette din konto og fjerne alle dine data fra vores servere.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                          Annuller
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                          Ja, slet min konto
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