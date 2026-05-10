import { 
  Truck, AlertTriangle, Route, Package, LayoutDashboard, Settings, Sparkles, 
  FileText, Warehouse, TrendingUp, Activity, Satellite, Network, Shield, 
  Globe, MessageSquare, BarChart3, Zap, Users, Newspaper, Building2, Image, ListTodo, HardDrive, MonitorPlay, Cpu, Layers, Store, Code2
} from "lucide-react";

export const WINDOW_META = {
  fleet: { title: 'Fleet', icon: Truck },
  alerts: { title: 'Alerts', icon: AlertTriangle },
  routes: { title: 'Routes', icon: Route },
  shipments: { title: 'Shipments', icon: Package },
  dashboard: { title: 'Dashboard', icon: LayoutDashboard },
  settings: { title: 'Settings', icon: Settings },
  aioptimization: { title: 'AI Optimization', icon: Sparkles },
  invoices: { title: 'Invoices', icon: FileText },
  apidocs: { title: 'API Docs', icon: FileText },
  resources: { title: 'Resources', icon: Warehouse },
  warehouseautomation: { title: 'Warehouse Automation', icon: Warehouse },
  demandforecasting: { title: 'Demand Forecasting', icon: TrendingUp },
  greentms: { title: 'Green TMS', icon: Activity },
  gpsintegration: { title: 'GPS Integration', icon: Satellite },
  assignment: { title: 'Assignments', icon: Route },
  routeeditor: { title: 'Route Editor', icon: Route },
  swarm_intelligence: { title: '🐜 Swarm Intelligence', icon: Network },
  neuro_risk: { title: '🧠 Neuro-Symbolic Risk', icon: Shield },
  digital_twin: { title: '🌐 Digital Twin Federation', icon: Globe },
  document_editor: { title: '📄 Document Editor', icon: FileText },
  spreadsheet_editor: { title: '📊 Spreadsheet Editor', icon: BarChart3 },
  nexus_chat: { title: '🛰️ Nexus Satellite Chat', icon: MessageSquare },
  crm: { title: 'CRM', icon: Users },
  vehicles: { title: 'Fleet', icon: Truck },
  drivers: { title: 'Drivers', icon: Users },
  maintenance: { title: 'Maintenance', icon: Activity },
  hr: { title: 'HR Management', icon: Users },
  deep_analysis: { title: 'Deep Analysis Engine', icon: Activity },
  course_ai: { title: 'AI Learning Engine', icon: Sparkles },
  global_search: { title: 'Global Search', icon: Satellite },
  web_browser: { title: '🌐 Web Browser', icon: Globe },
  profile_search: { title: '🔍 People Intelligence', icon: Users },
  parallel_processor: { title: 'Parallel Task Processor', icon: Zap },
  satellite_weather: { title: '🛰️ Satellite & Weather', icon: Satellite },
  news_intelligence: { title: '📰 News Intelligence', icon: Newspaper },
  article_iframe: { title: '📄 Article', icon: Newspaper },
  company_analytics: { title: '🏢 Company Analytics', icon: Building2 },
  image_generator: { title: '🎨 AI Image Studio — Generate', icon: Image },
  image_editor: { title: '✏️ AI Image Studio — Edit', icon: Image },
  project_management: { title: '📋 Project Management AI', icon: ListTodo },
  fleet_drive: { title: '💾 Fleet Drive', icon: HardDrive },
  hologram_presentation: { title: '🎯 FleetSlide', icon: MonitorPlay },
  fleet_ai_trainer: { title: '⚡ H.A.R.B.O.R Trainer', icon: Cpu },
  fleet_3d_viewer: { title: '🚛 Fleet 3D Viewer', icon: Layers },
  vehicle_builder: { title: '🔧 Transport Builder & Simulator', icon: Layers },
  harbor_app_builder: { title: '⚡ H.A.R.B.O.R App Builder', icon: Cpu },
  fleet_store: { title: '🛒 Fleet Store', icon: Store },
  nexus_orbit: { title: '🛰️ Nexus Orbit', icon: Satellite },
  airport_ops: { title: '✈️ Airport Ops Center', icon: Layers },
  port_command: { title: '🚢 Port Command Center', icon: Layers },
  ai_dev_ide: { title: '🖥️ Fleet AI IDE & DevOps', icon: Code2 },
  orchestrator_load_map: { title: '📡 Orchestrator Load Map', icon: Activity },
};

export function getWindowMeta(type) {
  if (type?.startsWith('chart_')) {
    return { title: null, icon: BarChart3 }; // title set from data
  }
  return WINDOW_META[type] || { title: type, icon: Activity };
}