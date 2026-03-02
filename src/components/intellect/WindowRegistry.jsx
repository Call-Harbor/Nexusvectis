import { 
  Truck, AlertTriangle, Route, Package, LayoutDashboard, Settings, Sparkles, 
  FileText, Warehouse, TrendingUp, Activity, Satellite, Network, Shield, 
  Globe, MessageSquare, BarChart3, Zap, Users, Newspaper, Building2, Image
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
  image_generator: { title: '🎨 AI Image Generator', icon: Image },
};

export function getWindowMeta(type) {
  if (type?.startsWith('chart_')) {
    return { title: null, icon: BarChart3 }; // title set from data
  }
  return WINDOW_META[type] || { title: type, icon: Activity };
}