import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bus, MapPin, Route, Save } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BusEditor from "./BusEditor";
import BusStopEditor from "./BusStopEditor";
import BusRouteEditor from "./BusRouteEditor";

export default function BusFleetSettings({ onBack }) {
  const [activeTab, setActiveTab] = useState("buses");
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-violet-950/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-12 h-12 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-slate-700 hover:border-slate-600 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Manual Configuration
            </h1>
            <p className="text-slate-400">Fine-tune your fleet settings</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-1">
            <TabsTrigger value="buses" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Bus className="w-4 h-4 mr-2" />
              Buses
            </TabsTrigger>
            <TabsTrigger value="stops" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <MapPin className="w-4 h-4 mr-2" />
              Stops
            </TabsTrigger>
            <TabsTrigger value="routes" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Route className="w-4 h-4 mr-2" />
              Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buses" className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditor('bus')}
              className="w-full p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
            >
              <Bus className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Add New Bus</h3>
              <p className="text-slate-400">Configure individual bus settings</p>
            </motion.button>
          </TabsContent>

          <TabsContent value="stops" className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditor('stop')}
              className="w-full p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500/50 transition-all"
            >
              <MapPin className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Add New Stop</h3>
              <p className="text-slate-400">Define stop locations</p>
            </motion.button>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditor('route')}
              className="w-full p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30 hover:border-violet-500/50 transition-all"
            >
              <Route className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Add New Route</h3>
              <p className="text-slate-400">Design route paths and schedules</p>
            </motion.button>
          </TabsContent>
        </Tabs>

        {/* Editors */}
        {showEditor === 'bus' && (
          <BusEditor
            onSave={() => setShowEditor(false)}
            onClose={() => setShowEditor(false)}
          />
        )}
        {showEditor === 'stop' && (
          <BusStopEditor
            onSave={() => setShowEditor(false)}
            onClose={() => setShowEditor(false)}
          />
        )}
        {showEditor === 'route' && (
          <BusRouteEditor
            onSave={() => setShowEditor(false)}
            onClose={() => setShowEditor(false)}
          />
        )}
      </div>
    </div>
  );
}