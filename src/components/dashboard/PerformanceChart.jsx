import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const mockData = [
  { name: 'Man', deliveries: 45, efficiency: 82, co2: 120 },
  { name: 'Tir', deliveries: 52, efficiency: 85, co2: 115 },
  { name: 'Ons', deliveries: 48, efficiency: 79, co2: 130 },
  { name: 'Tor', deliveries: 61, efficiency: 88, co2: 105 },
  { name: 'Fre', deliveries: 55, efficiency: 84, co2: 118 },
  { name: 'Lør', deliveries: 38, efficiency: 90, co2: 95 },
  { name: 'Søn', deliveries: 32, efficiency: 92, co2: 85 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name === 'deliveries' && 'Leveringer: '}
            {entry.name === 'efficiency' && 'Effektivitet: '}
            {entry.name === 'co2' && 'CO₂: '}
            {entry.value}{entry.name === 'efficiency' ? '%' : entry.name === 'co2' ? ' kg' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("deliveries");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
    >
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Præstationsanalyse</h3>
              <p className="text-sm text-slate-500">Ugentlig oversigt</p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="deliveries" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                Leveringer
              </TabsTrigger>
              <TabsTrigger value="efficiency" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                Effektivitet
              </TabsTrigger>
              <TabsTrigger value="co2" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                CO₂
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-5 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'deliveries' ? (
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="deliveries" 
                fill="url(#blueGradient)" 
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          ) : (
            <AreaChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              {activeTab === 'efficiency' && (
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#10b981" 
                  fill="url(#emeraldGradient)"
                  strokeWidth={2}
                />
              )}
              {activeTab === 'co2' && (
                <Area 
                  type="monotone" 
                  dataKey="co2" 
                  stroke="#f59e0b" 
                  fill="url(#amberGradient)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}