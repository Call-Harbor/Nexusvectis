import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Brain, Zap, Globe, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function Hero3D() {
  const canvasRef = useRef(null);
  const [capabilities, setCapabilities] = useState([
    { icon: Brain, label: "50+ Parallel AI Models", value: "Real-time analysis" },
    { icon: Zap, label: "100M+ Decisions/Day", value: "Sub-millisecond speed" },
    { icon: Globe, label: "99.99% Uptime", value: "Enterprise reliability" },
    { icon: Sparkles, label: "10x Faster", value: "Than legacy systems" }
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let time = 0;

    const drawNetwork = () => {
      ctx.fillStyle = 'rgba(2, 8, 23, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw animated nodes and connections
      const nodeCount = 8;
      const nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + time * 0.3;
        const radius = 150 + Math.sin(time * 0.5 + i) * 30;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        nodes.push({ x, y, angle });

        // Draw node glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 20, y - 20, 40, 40);

        // Draw core node
        ctx.fillStyle = 'rgba(6, 182, 212, 1)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if ((i + j) % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw central core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
      coreGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
      coreGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      time += 0.01;
      animationId = requestAnimationFrame(drawNetwork);
    };

    drawNetwork();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950" />

      {/* Content */}
      <div className="relative z-10 py-48 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Logo & Intro */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center mb-16"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-24 w-auto opacity-90"
              />
            </Link>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-20"
          >
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-tight">
              <span className="block mb-4">The Platform</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                That Thinks
              </span>
            </h1>
            
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-8">
              50+ parallel AI models orchestrating your entire fleet operation in real-time. 
              <span className="block text-cyan-400 font-semibold mt-4">
                One platform. Infinite intelligence.
              </span>
            </p>
          </motion.div>

          {/* Capability Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-4 gap-6 mb-16"
          >
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition-all group cursor-pointer"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="mb-4"
                  >
                    <Icon className="w-10 h-10 text-cyan-400 group-hover:text-violet-400 transition-colors" />
                  </motion.div>
                  <div className="text-sm font-semibold text-cyan-400 mb-2 group-hover:text-violet-400 transition-colors">
                    {cap.label}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    {cap.value}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* AI Power Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { number: "100M+", label: "Daily Optimizations", color: "cyan" },
              { number: "50+", label: "Parallel Analyses", color: "violet" },
              { number: "99.99%", label: "Model Accuracy", color: "fuchsia" },
              { number: "10x", label: "Speed Improvement", color: "emerald" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 + idx * 0.1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                  className={`text-5xl font-black bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent mb-2`}
                >
                  {stat.number}
                </motion.div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex items-center justify-center gap-6 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:shadow-2xl transition-all"
            >
              Explore Capabilities
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:shadow-2xl transition-all"
            >
              View Platform
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}