import { useState } from "react";
import { motion } from "framer-motion";
import { Satellite, Copy, CheckCircle, Code, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function GPSIntegration() {
  const [copied, setCopied] = useState(false);
  const [testData, setTestData] = useState({
    vehicle_id: "TRUCK-001",
    latitude: "55.6761",
    longitude: "12.5683",
    speed: "85",
    heading: "180"
  });

  // Get the webhook URL (you'll need to update this with actual URL from dashboard)
  const webhookUrl = `${window.location.origin}/api/functions/gpsWebhook`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const testWebhook = async () => {
    try {
      const payload = {
        vehicle_id: testData.vehicle_id,
        latitude: parseFloat(testData.latitude),
        longitude: parseFloat(testData.longitude),
        speed: parseFloat(testData.speed),
        heading: parseFloat(testData.heading),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/functions/gpsWebhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("GPS data sent successfully!");
      } else {
        toast.error(result.error || "Error sending data");
      }
    } catch (error) {
      toast.error("Could not send data: " + error.message);
    }
  };

  const examplePayload = `{
  "vehicle_id": "TRUCK-001",
  "latitude": 55.6761,
  "longitude": 12.5683,
  "speed": 85,
  "heading": 180,
  "altitude": 45,
  "fuel_level": 75,
  "signal_strength": 95,
  "timestamp": "2026-02-01T10:30:00Z"
}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Satellite className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">GPS Integration</h1>
              <p className="text-slate-400 mt-1">Connect your GPS trackers to NexusVectis</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Webhook URL */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Webhook Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">GPS Tracker Configuration URL:</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={webhookUrl}
                    readOnly
                    className="bg-slate-900/50 border-slate-700 text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(webhookUrl)}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  * Go to your app dashboard → Code → Functions → gpsWebhook for the correct URL
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Example Payload */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">JSON Payload Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-slate-300 mb-2 block">Send GPS data in this format:</Label>
              <div className="relative">
                <Textarea 
                  value={examplePayload}
                  readOnly
                  className="bg-slate-900/50 border-slate-700 text-emerald-400 font-mono text-sm h-64"
                />
                <Button
                  onClick={() => copyToClipboard(examplePayload)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <h4 className="text-sm font-medium text-violet-300 mb-2">Required fields:</h4>
                <ul className="text-xs text-violet-400 space-y-1">
                  <li>• <code>vehicle_id</code> - Must match Vehicle.name in database</li>
                  <li>• <code>latitude</code> - GPS latitude (decimal format)</li>
                  <li>• <code>longitude</code> - GPS longitude (decimal format)</li>
                </ul>
                <h4 className="text-sm font-medium text-violet-300 mt-3 mb-2">Optional fields:</h4>
                <ul className="text-xs text-violet-400 space-y-1">
                  <li>• <code>speed</code>, <code>heading</code>, <code>altitude</code>, <code>fuel_level</code>, <code>signal_strength</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Test Tool */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                Test Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Vehicle ID</Label>
                  <Input 
                    value={testData.vehicle_id}
                    onChange={(e) => setTestData({...testData, vehicle_id: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Speed (km/h)</Label>
                  <Input 
                    type="number"
                    value={testData.speed}
                    onChange={(e) => setTestData({...testData, speed: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Latitude</Label>
                  <Input 
                    value={testData.latitude}
                    onChange={(e) => setTestData({...testData, latitude: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Longitude</Label>
                  <Input 
                    value={testData.longitude}
                    onChange={(e) => setTestData({...testData, longitude: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Heading (°)</Label>
                  <Input 
                    type="number"
                    value={testData.heading}
                    onChange={(e) => setTestData({...testData, heading: e.target.value})}
                    className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>
              <Button 
                onClick={testWebhook}
                className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="text-white font-medium">Copy Webhook URL</h4>
                    <p className="text-sm text-slate-400">Get the URL from your app dashboard under Functions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="text-white font-medium">Configure your GPS tracker</h4>
                    <p className="text-sm text-slate-400">Set tracker to send HTTP POST to the webhook URL</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="text-white font-medium">Map vehicle_id</h4>
                    <p className="text-sm text-slate-400">Ensure vehicle_id matches the vehicle name in Fleet</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="text-white font-medium">Test connection</h4>
                    <p className="text-sm text-slate-400">Use the test tool above or send live data from the tracker</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}