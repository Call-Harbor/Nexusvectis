import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, MapPin, Clock, Search, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function CustomerPortal() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuickTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    setLoading(true);
    try {
      const shipments = await base44.entities.Shipment.filter({ tracking_number: trackingNumber.trim() });
      if (shipments.length === 0) {
        toast.error("Shipment not found");
      } else {
        navigate(createPageUrl("CustomerTracking") + `?tracking=${trackingNumber.trim()}`);
      }
    } catch (error) {
      toast.error("Error tracking shipment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerLogin = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const customers = await base44.entities.Customer.filter({ email: email.trim() });
      if (customers.length === 0) {
        toast.error("Customer not found");
      } else {
        // Store customer info in session
        sessionStorage.setItem("customer_id", customers[0].id);
        sessionStorage.setItem("customer_email", customers[0].email);
        navigate(createPageUrl("CustomerDashboard"));
      }
    } catch (error) {
      toast.error("Error logging in");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis" 
                className="h-24 w-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Track Your Shipments
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Real-time tracking and visibility for all your logistics needs
            </p>
          </div>

          {/* Quick Track Card */}
          <Card className="max-w-2xl mx-auto bg-slate-900/50 border-slate-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                Quick Track
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your tracking number to see shipment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickTrack()}
                  className="bg-slate-800/50 border-slate-700 text-white flex-1"
                />
                <Button
                  onClick={handleQuickTrack}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Real-Time Tracking</h3>
                <p className="text-slate-400 text-sm">
                  Track your shipments in real-time with GPS precision
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">ETA Updates</h3>
                <p className="text-slate-400 text-sm">
                  Get accurate delivery time estimates powered by AI
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Shipment History</h3>
                <p className="text-slate-400 text-sm">
                  Access complete history of all your shipments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Login Section */}
        <Card className="max-w-2xl mx-auto bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-cyan-400" />
              Customer Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access your customer dashboard and view all shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={handleCustomerLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}