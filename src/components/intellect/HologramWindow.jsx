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

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={isMobile ? {} : { left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex: isFocused ? 9999 : 50 }}
      className={isMobile ? "fixed inset-4" : "fixed resize overflow-auto"}
      onPointerDown={handlePointerDown}
    >
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/40 overflow-hidden h-full flex flex-col relative group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.2),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 animate-pulse" style={{ animationDuration: '0.1s' }} />
        </div>
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/50 rounded-br-2xl" />

        <div className="relative flex flex-col h-full">
          <div ref={headerRef} className="flex items-center justify-between p-3 sm:p-4 border-b border-cyan-500/30 cursor-move touch-none bg-slate-900/40">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
              </div>
              <span className="text-white font-semibold tracking-wide text-sm sm:text-base">{title}</span>
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
          <div className="flex-1 overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

HologramWindow.displayName = 'HologramWindow';
export default HologramWindow;