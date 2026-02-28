import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Truck, AlertTriangle, Route, Package, LayoutDashboard, Settings,
  Sparkles, FileText, Warehouse, TrendingUp, Activity, Satellite,
  Network, Shield, Globe, Video, BarChart3, MessageSquare, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function getWindowIcon(type) {
  if (type.startsWith('chart_')) return BarChart3;
  const map = {
    fleet: Truck, alerts: AlertTriangle, routes: Route, shipments: Package,
    dashboard: LayoutDashboard, settings: Settings, aioptimization: Sparkles,
    invoices: FileText, apidocs: FileText, resources: Warehouse,
    warehouseautomation: Warehouse, demandforecasting: TrendingUp,
    greentms: Activity, gpsintegration: Satellite, assignment: Route,
    routeeditor: Route, swarm_intelligence: Network, neuro_risk: Shield,
    digital_twin: Globe, video_call: Video, document_editor: FileText,
    spreadsheet_editor: BarChart3, nexus_chat: MessageSquare, browser: Globe,
  };
  return map[type] || Activity;
}

export function getWindowTitle(type, data) {
  if (type.startsWith('chart_')) return data?.chartConfig?.title || 'Analysis Chart';
  const map = {
    fleet: 'Fleet', alerts: 'Alerts', routes: 'Routes', shipments: 'Shipments',
    dashboard: 'Dashboard', settings: 'Settings', aioptimization: 'AI Optimization',
    invoices: 'Invoices', apidocs: 'API Docs', resources: 'Resources',
    warehouseautomation: 'Warehouse Automation', demandforecasting: 'Demand Forecasting',
    greentms: 'Green TMS', gpsintegration: 'GPS Integration', assignment: 'Assignments',
    routeeditor: 'Route Editor', swarm_intelligence: '🐜 Swarm Intelligence',
    neuro_risk: '🧠 Neuro-Symbolic Risk', digital_twin: '🌐 Digital Twin Federation',
    video_call: '📞 Video Call', document_editor: '📄 Document Editor',
    spreadsheet_editor: '📊 Spreadsheet Editor', nexus_chat: '🛰️ Nexus Satellite Chat',
    browser: '🌐 Browser',
  };
  return map[type] || '';
}

export function MinimizedWindowsBar({ activeWindows, minimizedWindows, onRestore }) {
  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-40">
      <AnimatePresence>
        {activeWindows
          .filter(w => minimizedWindows.has(w.id))
          .map((window) => {
            const Icon = getWindowIcon(window.type);
            const title = getWindowTitle(window.type, window.data);
            return (
              <motion.div
                key={window.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Button
                  onClick={() => onRestore(window.id)}
                  className="bg-gradient-to-r from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/50 backdrop-blur-xl hover:from-cyan-500/40 hover:to-violet-500/40 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-cyan-400" />
                  <span className="text-white font-medium">{title}</span>
                </Button>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}