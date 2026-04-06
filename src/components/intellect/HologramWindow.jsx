import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Minimize2, X, ExternalLink, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const HologramWindow = React.memo(({ id, title, icon: Icon, children, position, onClose, onMinimize, isMinimized, onSendToScreen, windowType, isFocused, onFocus, windowRef }) => {
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
      <div className="rounded-lg border border-cyan-500/30 overflow-hidden h-full flex flex-col relative group" style={{ background: "rgba(0,10,25,0.93)", boxShadow: "0 0 20px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.05)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: "inset 0 0 20px rgba(6,182,212,0.08)" }} />
        <div className="absolute top-2 left-3 w-3 h-3 border-t border-l border-cyan-500/30" />
        <div className="absolute top-2 right-3 w-3 h-3 border-t border-r border-cyan-500/30" />
        <div className="absolute bottom-2 left-3 w-3 h-3 border-b border-l border-violet-500/30" />
        <div className="absolute bottom-2 right-3 w-3 h-3 border-b border-r border-violet-500/30" />

        <div className="relative flex flex-col h-full">
          <div ref={headerRef} className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/15 cursor-move touch-none" style={{ background: "rgba(0,0,0,0.3)" }}>
           <div className="flex items-center gap-2.5">
             <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 20, height: 20 }}>
               <svg width="20" height="20" viewBox="0 0 20 20" className="absolute">
                 <polygon points="10,1.5 17.5,5.5 17.5,14.5 10,18.5 2.5,14.5 2.5,5.5" fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="0.8" opacity="0.7" />
               </svg>
               <Icon style={{ width: 8, height: 8, color: "#06b6d4", position: "relative", zIndex: 1 }} />
             </div>
             <span className="text-[11px] font-bold text-white truncate font-mono uppercase tracking-[0.15em]" style={{ color: "#06b6d4", textShadow: "0 0 6px rgba(6,182,212,0.4)" }}>{title}</span>
           </div>
            <div className="flex gap-1 sm:gap-2 items-center">
              {onSendToScreen && (
                <div className="relative">
                  <Button size="icon" variant="ghost" title="Send to screen" onClick={() => setShowScreenMenu(s => !s)}
                    className="h-7 w-7 sm:h-8 sm:w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 transition-all">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  {showScreenMenu && (
                    <div className="absolute right-0 top-9 z-[9999] bg-slate-900 border border-violet-500/40 rounded-xl shadow-xl min-w-[180px] py-1">
                      <p className="text-slate-500 text-[10px] px-3 pt-1 pb-0.5 uppercase tracking-wide">Send to screen</p>
                      {onSendToScreen.screens.map((s, i) => (
                        <button key={i} onClick={() => { onSendToScreen.send(s, windowType); setShowScreenMenu(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/20 hover:text-white transition-colors">
                          <Monitor className="w-3.5 h-3.5 text-violet-400" />
                          {s.label}
                        </button>
                      ))}
                      {onSendToScreen.screens.length === 0 && (
                        <p className="text-slate-600 text-xs px-3 py-2">No Hologram Desktops open</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Button size="icon" variant="ghost" onClick={onMinimize}
                className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all">
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose}
                className="h-7 w-7 sm:h-8 sm:w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all">
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          <div ref={windowRef} className="flex-1 overflow-hidden min-h-0 bg-slate-950">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

HologramWindow.displayName = 'HologramWindow';
export default HologramWindow;