import { motion } from "framer-motion";
import { Thermometer, Droplets, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function ColdChainMonitor({ shipments = [] }) {
  const coldChainShipments = shipments.filter(s => s.cargo_type === 'cold_chain');
  
  const temperatureAlerts = coldChainShipments.filter(s => {
    if (!s.current_temperature || !s.temperature_min || !s.temperature_max) return false;
    return s.current_temperature < s.temperature_min || s.current_temperature > s.temperature_max;
  });

  // Generate mock temperature history for demo
  const generateTempHistory = (shipment) => {
    const hours = 12;
    const data = [];
    for (let i = hours; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * 2;
      data.push({
        time: `${i}h ago`,
        temp: (shipment.current_temperature || 4) + variance,
        min: shipment.temperature_min,
        max: shipment.temperature_max,
      });
    }
    return data;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Cold Chain Active</p>
              <p className="text-2xl font-bold text-white mt-1">{coldChainShipments.length}</p>
            </div>
            <Thermometer className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Temperature Alerts</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{temperatureAlerts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Compliance</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {Math.round(((coldChainShipments.length - temperatureAlerts.length) / (coldChainShipments.length || 1)) * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </motion.div>
      </div>

      {/* Cold Chain Shipments */}
      <div className="space-y-4">
        {coldChainShipments.slice(0, 5).map((shipment, index) => {
          const isAlert = temperatureAlerts.includes(shipment);
          const tempData = generateTempHistory(shipment);
          
          return (
            <motion.div
              key={shipment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-slate-800/50 border-slate-700/50 ${isAlert ? 'border-rose-500/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Thermometer className={`w-5 h-5 ${isAlert ? 'text-rose-400' : 'text-cyan-400'}`} />
                      {shipment.tracking_number}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isAlert && (
                        <Badge variant="outline" className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Alert
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        {shipment.origin} → {shipment.destination}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Readings */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Current Temperature</span>
                          <div className="flex items-center gap-1">
                            {shipment.current_temperature < (shipment.temperature_min || 0) ? (
                              <TrendingDown className="w-4 h-4 text-blue-400" />
                            ) : shipment.current_temperature > (shipment.temperature_max || 10) ? (
                              <TrendingUp className="w-4 h-4 text-rose-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                        </div>
                        <p className={`text-3xl font-bold ${isAlert ? 'text-rose-400' : 'text-white'}`}>
                          {shipment.current_temperature?.toFixed(1) || '--'}°C
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Range: {shipment.temperature_min}°C - {shipment.temperature_max}°C
                        </p>
                      </div>

                      {shipment.humidity_current && (
                        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Humidity</span>
                            <Droplets className="w-4 h-4 text-cyan-400" />
                          </div>
                          <p className="text-2xl font-bold text-white">{shipment.humidity_current}%</p>
                        </div>
                      )}
                    </div>

                    {/* Temperature History Chart */}
                    <div>
                      <p className="text-sm text-slate-400 mb-3">Temperature History (12h)</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={tempData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="time" 
                            stroke="#64748b" 
                            fontSize={10}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10}
                            domain={[
                              (shipment.temperature_min || 0) - 2,
                              (shipment.temperature_max || 10) + 2
                            ]}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '8px'
                            }}
                          />
                          <ReferenceLine 
                            y={shipment.temperature_min} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3"
                            label={{ value: 'Min', fill: '#3b82f6', fontSize: 10 }}
                          />
                          <ReferenceLine 
                            y={shipment.temperature_max} 
                            stroke="#ef4444" 
                            strokeDasharray="3 3"
                            label={{ value: 'Max', fill: '#ef4444', fontSize: 10 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="temp" 
                            stroke={isAlert ? "#f87171" : "#06b6d4"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {coldChainShipments.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="py-12 text-center">
              <Thermometer className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400">No cold chain shipments currently active</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}