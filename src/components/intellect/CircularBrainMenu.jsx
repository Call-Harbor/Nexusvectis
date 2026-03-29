import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Building2, Newspaper, Shield, Satellite, Zap, Package, Route, Activity, Sparkles, Plane, Ship } from "lucide-react";

export default function CircularBrainMenu({ onAction, size = "md", isLogo = false, onMenuToggle }) {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
    onMenuToggle?.(!showMenu);
  }

  const quickActions = [
    { icon: Brain, action: 'advanced_intelligence', label: 'Intelligence' },
    { icon: Zap, action: 'fleetai_trainer', label: 'AI Trainer' },
    { icon: Building2, action: 'company_analysis', label: 'Company' },
    { icon: Package, action: 'shipments', label: 'Shipments' },
    { icon: Satellite, action: 'satellite_weather', label: 'Weather' },
    { icon: Shield, action: 'neuro_risk', label: 'Risk' },
    { icon: Newspaper, action: 'news_intelligence', label: 'News' },
    { icon: Route, action: 'routes', label: 'Routes' },
    { icon: Activity, action: 'deep_analysis', label: 'Analysis' },
    { icon: Sparkles, action: 'image_generator', label: 'Image' },
    { icon: Plane, action: 'airport_ops', label: 'Airport' },
    { icon: Ship, action: 'port_command', label: 'Port' },
  ];

  const sizeConfig = {
    sm: { container: "w-32 h-32", brain: "w-5 h-5", button: "w-6 h-6", icon: "w-3 h-3", radius: 50 },
    md: { container: "w-48 h-48", brain: "w-8 h-8", button: "w-8 h-8", icon: "w-4 h-4", radius: 75 },
    lg: { container: "w-72 h-72", brain: "w-10 h-10", button: "w-10 h-10", icon: "w-5 h-5", radius: 120 },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex items-center justify-center">
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Center Brain Button */}
        <button
          onClick={handleMenuToggle}
          className={`rounded-full flex items-center justify-center transition-all z-20 cursor-pointer hover:scale-110`}
          style={{
            border: "2px solid rgba(6,182,212,0.5)",
            background: "rgba(6,182,212,0.08)",
            boxShadow: showMenu ? "0 0 30px rgba(6,182,212,0.4)" : "0 0 15px rgba(6,182,212,0.2)",
            width: size === "lg" ? "80px" : size === "md" ? "60px" : "40px",
            height: size === "lg" ? "80px" : size === "md" ? "60px" : "40px",
          }}
        >
          <Brain className={config.brain} style={{ color: "#06b6d4" }} />
        </button>

        {/* Circular Menu Items */}
        <AnimatePresence>
          {showMenu && (
              <div className="absolute inset-0">
                {quickActions.map((action, idx) => {
                  const angle = (idx / quickActions.length) * Math.PI * 2;
                  const Icon = action.icon;
                  const x = Math.cos(angle) * config.radius;
                  const y = Math.sin(angle) * config.radius;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ x, y }}
                    >
                      <button
                        onClick={() => {
                          onAction?.(action.action);
                          setShowMenu(false);
                        }}
                        className={`${config.button} rounded-full flex items-center justify-center border transition-all hover:scale-110`}
                        style={{
                          border: "1.5px solid rgba(139,92,246,0.4)",
                          background: "rgba(139,92,246,0.08)",
                          boxShadow: "0 0 12px rgba(139,92,246,0.2)",
                        }}
                      >
                        <Icon className={config.icon} style={{ color: "#8b5cf6" }} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}