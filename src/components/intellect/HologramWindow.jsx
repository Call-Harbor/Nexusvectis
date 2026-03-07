import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Minimize2, X, ExternalLink, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const HologramWindow = React.memo(({ id, title, icon: Icon, children, position, onClose, onMinimize, isMinimized, onSendToScreen, windowType, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [size] = useState({ width: 480, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showScreenMenu, setShowScreenMenu] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePointerDown = (e) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
      onFocus(id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    } else if (e.currentTarget === e.target) {
      onFocus(id);
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (isDragging && !isMobile) {
      setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  }, [isDragging, dragOffset, isMobile]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging && !isMobile) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp, isMobile]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={isMobile ? { display: isMinimized ? 'none' : undefined } : { left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex: isFocused ? 9999 : 50, display: isMinimized ? 'none' : undefined }}
      className={isMobile ? "fixed inset-4" : "fixed resize overflow-auto"}
      onPointerDown={handlePointerDown}
    >
      <div className="border overflow-hidden h-full flex flex-col relative group" style={{ 
        borderColor: 'rgba(6, 182, 212, 0.6)',
        borderWidth: '2px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(20,20,50,0.93) 100%)',
        boxShadow: '0 0 30px rgba(6,182,212,0.25), inset 0 0 20px rgba(6,182,212,0.08), 0 0 60px rgba(6,182,212,0.1)',
      }}>
        {/* Scan line */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-px"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)' }}
        />

        {/* Corner brackets - cyan top, amber bottom */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: 'rgba(6, 182, 212, 0.7)' }} />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: 'rgba(6, 182, 212, 0.7)' }} />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: 'rgba(251, 146, 60, 0.7)' }} />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: 'rgba(251, 146, 60, 0.7)' }} />

        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 25px rgba(6,182,212,0.12)' }} />

        <div className="relative flex flex-col h-full">
          <div ref={headerRef} className="flex items-center justify-between px-3 py-2 border-b cursor-move touch-none font-mono" style={{ borderColor: 'rgba(6, 182, 212, 0.5)', background: 'rgba(0, 0, 0, 0.4)' }}>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5">
               {Icon && <Icon style={{ width: 12, height: 12, color: 'rgba(6, 182, 212, 0.8)' }} />}
             </div>
             <span className="text-[10px] font-bold text-white truncate uppercase tracking-wider" style={{ color: 'rgba(6, 182, 212, 0.9)', textShadow: '0 0 8px rgba(6,182,212,0.3)' }}>{title}</span>
           </div>
            <div className="flex gap-1 sm:gap-2 items-center">
              {onSendToScreen && (
                <div className="relative">
                  <Button size="icon" variant="ghost" title="Send to screen" onClick={() => setShowScreenMenu(s => !s)}
                    className="h-6 w-6 text-orange-400 hover:text-orange-300 transition-all" style={{ fontSize: '10px' }}>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  {showScreenMenu && (
                    <div className="absolute right-0 top-7 z-[9999] border-2 shadow-xl min-w-[160px] py-1 font-mono" style={{ borderColor: 'rgba(6, 182, 212, 0.6)', background: 'rgba(15,23,42,0.95)' }}>
                      <p className="text-cyan-400 text-[9px] px-2 pt-1 pb-0.5 uppercase tracking-wider">Send</p>
                      {onSendToScreen.screens.map((s, i) => (
                        <button key={i} onClick={() => { onSendToScreen.send(s, windowType); setShowScreenMenu(false); }}
                          className="flex items-center gap-1.5 w-full px-2 py-1 text-[9px] text-cyan-300 hover:text-white transition-colors" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
                          <Monitor className="w-3 h-3 text-cyan-400" />
                          <span>{s.label}</span>
                        </button>
                      ))}
                      {onSendToScreen.screens.length === 0 && (
                        <p className="text-slate-500 text-[8px] px-2 py-1">No screens</p>
                      )}
                    </div>
                  )}
                  </div>
                  )}
                  <Button size="icon" variant="ghost" onClick={onMinimize}
                  className="h-6 w-6 text-cyan-400 hover:text-cyan-300 transition-all">
                  <Minimize2 className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onClose}
                  className="h-6 w-6 text-red-400 hover:text-red-300 transition-all">
                  <X className="w-3 h-3" />
                  </Button>
                  </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0" style={{ background: 'rgba(10,10,25,0.8)' }}>
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

HologramWindow.displayName = 'HologramWindow';
export default HologramWindow;