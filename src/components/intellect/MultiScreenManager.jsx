import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X, Sparkles, Loader2, CheckCircle, ExternalLink, Layout, RefreshCw, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function MultiScreenManager({ onClose, onWindowOpened }) {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSupported, setApiSupported] = useState(false);
  const [selectedScreens, setSelectedScreens] = useState(new Set());
  const [openedWindows, setOpenedWindows] = useState(new Set());
  const [manualCount, setManualCount] = useState(2);
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    detectScreens();
  }, []);

  const detectScreens = async () => {
    setLoading(true);
    setSelectedScreens(new Set());

    // Check if Window Management API is available
    if ('getScreenDetails' in window) {
      try {
        const details = await window.getScreenDetails();
        const mapped = details.screens.map((s, i) => ({
          id: i,
          label: s.label || `Screen ${i + 1}`,
          width: s.width,
          height: s.height,
          isPrimary: s.isPrimary,
          availLeft: s.availLeft,
          availTop: s.availTop,
          availWidth: s.availWidth || s.width,
          availHeight: s.availHeight || s.height,
        }));
        setScreens(mapped);
        setApiSupported(true);
        setUseManual(false);
        setLoading(false);
        return;
      } catch (e) {
        // Fall through to manual mode
        console.warn('Screen details API failed:', e.message);
      }
    }

    // Fallback: check isExtended
    if (window.screen.isExtended) {
      // Hub/dock case: isExtended=true but API unavailable — use manual
      setUseManual(true);
      setApiSupported(false);
    } else {
      // Single screen
      setScreens([{
        id: 0,
        label: 'Primary Screen',
        width: window.screen.width,
        height: window.screen.height,
        isPrimary: true,
        availLeft: 0,
        availTop: 0,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      }]);
      setUseManual(false);
      setApiSupported(false);
    }
    setLoading(false);
  };

  // Build manual "virtual" screens for hub users
  const manualScreens = Array.from({ length: manualCount }, (_, i) => ({
    id: i,
    label: i === 0 ? 'Primary Screen' : `Screen ${i + 1}`,
    isPrimary: i === 0,
    virtual: true,
  }));

  const displayScreens = useManual ? manualScreens : screens;

  const toggleScreen = (id) => {
    const s = new Set(selectedScreens);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedScreens(s);
  };

  const openOnScreen = (screen, secondaryIndex) => {
    // Secondary screens get the Hologram Desktop, not another IntellectMode chat
    // Pass screen index so each window knows which slot it is (affects default widgets)
    const url = window.location.origin + createPageUrl(`HologramDesktop?screen=${secondaryIndex}`);

    let features;
    if (screen.virtual || useManual) {
      features = [
        `width=1280`,
        `height=800`,
        'toolbar=no',
        'menubar=no',
        'scrollbars=no',
        'status=no',
      ].join(',');
    } else {
      features = [
        `left=${screen.availLeft}`,
        `top=${screen.availTop}`,
        `width=${screen.availWidth}`,
        `height=${screen.availHeight}`,
        'toolbar=no',
        'menubar=no',
        'scrollbars=no',
        'status=no',
      ].join(',');
    }

    const w = window.open(url, `_holo_desktop_${screen.id}`, features);
    if (w) {
      setOpenedWindows(prev => new Set([...prev, screen.id]));
      toast.success(`Opened Hologram Desktop on ${screen.label}`);
      if (onWindowOpened) onWindowOpened(screen.label, w);
    } else {
      toast.error('Popup blocked — please allow popups for this site in your browser settings.');
    }
  };

  const openSelected = () => {
    const secondaryScreensList = displayScreens.filter(s => !s.isPrimary);
    displayScreens.filter(s => selectedScreens.has(s.id)).forEach((screen) => {
      const secondaryIndex = secondaryScreensList.findIndex(s => s.id === screen.id);
      openOnScreen(screen, Math.max(0, secondaryIndex));
    });
  };

  const secondaryScreens = displayScreens.filter(s => !s.isPrimary);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(2,8,23,0.85)' }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl rounded-2xl border-2 border-violet-500/60 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-violet-500/30 overflow-hidden"
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400/60 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-violet-400/60 rounded-tr-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-violet-500/30 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/40">
              <Monitor className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Multi-Screen Spread</h2>
              <p className="text-violet-400 text-xs">Open FLEET AI hologram desktop on your other screens</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-slate-400 text-sm">Detecting connected screens...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Hub/dock warning with manual mode */}
              {useManual && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-semibold text-sm">Screens detected via hub/dock</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Your browser cannot pinpoint exact screen positions when using a USB hub or docking station.
                        Set how many screens you have and we'll open a window for each — then drag them to the right screen manually.
                      </p>
                    </div>
                  </div>
                  {/* Manual screen count picker */}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-slate-300 text-sm font-medium">Number of screens:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setManualCount(c => Math.max(2, c - 1))}
                        className="h-8 w-8 border border-slate-700 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-white font-bold text-lg w-6 text-center">{manualCount}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setManualCount(c => Math.min(6, c + 1))}
                        className="h-8 w-8 border border-slate-700 text-slate-300 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Screen grid */}
              {!useManual && (
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                    {displayScreens.length} screen{displayScreens.length > 1 ? 's' : ''} detected — select secondary screens
                  </p>
                  <Button onClick={detectScreens} variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </Button>
                </div>
              )}

              {useManual && (
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                  Select which screens to open FLEET AI on
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {displayScreens.map((screen) => {
                  const selected = selectedScreens.has(screen.id);
                  const opened = openedWindows.has(screen.id);
                  return (
                    <motion.button
                      key={screen.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => !screen.isPrimary && toggleScreen(screen.id)}
                      disabled={screen.isPrimary}
                      className={`relative flex-1 min-w-[130px] p-4 rounded-xl border-2 transition-all text-left ${
                        screen.isPrimary
                          ? 'border-slate-700/50 bg-slate-900/40 opacity-60 cursor-not-allowed'
                          : selected
                          ? 'border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/30 cursor-pointer'
                          : 'border-slate-700/60 bg-slate-900/40 hover:border-violet-500/50 hover:bg-violet-500/10 cursor-pointer'
                      }`}
                    >
                      {selected && !screen.isPrimary && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 text-violet-400" />
                        </div>
                      )}
                      {opened && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                      )}
                      <div className={`w-full aspect-video rounded-lg mb-3 flex items-center justify-center border ${
                        screen.isPrimary ? 'border-slate-700 bg-slate-800/50' : selected ? 'border-violet-500/50 bg-violet-500/20' : 'border-slate-700 bg-slate-800/50'
                      }`}>
                        <Monitor className={`w-6 h-6 ${screen.isPrimary ? 'text-slate-500' : selected ? 'text-violet-400' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-white text-xs font-semibold truncate">{screen.label}</p>
                      {screen.width && <p className="text-slate-500 text-[10px]">{screen.width}×{screen.height}</p>}
                      {screen.isPrimary && <p className="text-slate-600 text-[10px]">This window</p>}
                      {useManual && !screen.isPrimary && <p className="text-slate-600 text-[10px]">Drag window to this screen</p>}
                    </motion.button>
                  );
                })}
              </div>

              {/* Single screen + not using manual */}
              {displayScreens.length === 1 && !useManual && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                  <p className="text-amber-400 text-sm font-medium">Only one screen detected</p>
                  <p className="text-slate-400 text-xs">Using a hub or docking station?</p>
                  <Button
                    onClick={() => setUseManual(true)}
                    variant="ghost"
                    className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30"
                  >
                    Set screen count manually
                  </Button>
                </div>
              )}

              {/* Action buttons */}
              {secondaryScreens.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    onClick={openSelected}
                    disabled={selectedScreens.size === 0}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 border-0 font-bold disabled:opacity-40"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on {selectedScreens.size > 0 ? `${selectedScreens.size} ` : ''}selected screen{selectedScreens.size !== 1 ? 's' : ''}
                  </Button>
                  <Button
                    onClick={() => setSelectedScreens(new Set(secondaryScreens.map(s => s.id)))}
                    variant="ghost"
                    className="text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 text-sm"
                  >
                    <Layout className="w-4 h-4 mr-1.5" />
                    All
                  </Button>
                </div>
              )}

              <p className="text-slate-600 text-xs text-center">
                {useManual
                  ? "After opening, drag each window to the correct screen and press F11 for fullscreen."
                  : "Each screen will open FLEET AI in a popup. Allow popups in your browser for this to work."}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}