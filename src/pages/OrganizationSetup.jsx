import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";

export default function OrganizationSetup() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserOrganization();
  }, []);

  const checkUserOrganization = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user already has organization
      if (currentUser.organization_id) {
        navigate(createPageUrl("Dashboard"));
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!orgName.trim()) return;

    setCreating(true);
    try {
      // Create organization
      const org = await base44.entities.Organization.create({
        name: orgName,
        admin_email: user.email
      });

      // Update user with organization_id
      await base44.auth.updateMe({
        organization_id: org.id
      });

      // Reload to ensure all data is fresh
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Error creating organization:", error);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/30">
              <Building2 className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Opret din organisation</CardTitle>
          <CardDescription className="text-slate-400">
            Du skal oprette en organisation for at fortsætte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Organisations navn</label>
            <Input
              placeholder="Indtast organisations navn"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createOrganization()}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Button
            onClick={createOrganization}
            disabled={!orgName.trim() || creating}
            className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opretter...
              </>
            ) : (
              "Opret organisation"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}