import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X, Sparkles, Loader2, CheckCircle, ExternalLink, Layout } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function MultiScreenManager({ onClose }) {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedScreens, setSelectedScreens] = useState(new Set());
  const [openedWindows, setOpenedWindows] = useState(new Set());

  useEffect(() => {
    detectScreens();
  }, []);

  const detectScreens = async () => {
    setLoading(true);
    if (!('getScreenDetails' in window)) {
      // Fallback: show mock based on screen.isExtended
      const fallbackScreens = [{ id: 'primary', label: 'Primary Screen', width: window.screen.width, height: window.screen.height, isPrimary: true, availLeft: 0, availTop: 0, availWidth: window.screen.availWidth, availHeight: window.screen.availHeight }];
      if (window.screen.isExtended) {
        fallbackScreens.push({ id: 'extended', label: 'Extended Screen', width: 1920, height: 1080, isPrimary: false, availLeft: window.screen.width, availTop: 0, availWidth: 1920, availHeight: 1080 });
      }
      setScreens(fallbackScreens);
      setLoading(false);
      return;
    }
    try {
      const details = await window.getScreenDetails();
      const mapped = details.screens.map((s, i) => ({
        id: i,
        raw: s,
        label: s.label || `Screen ${i + 1}`,
        width: s.width,
        height: s.height,
        isPrimary: s.isPrimary,
        availLeft: s.availLeft,
        availTop: s.availTop,
        availWidth: s.availWidth,
        availHeight: s.availHeight,
      }));
      setScreens(mapped);
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setPermissionDenied(true);
      } else {
        toast.error('Could not detect screens: ' + e.message);
      }
    }
    setLoading(false);
  };

  const toggleScreen = (id) => {
    const s = new Set(selectedScreens);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedScreens(s);
  };

  const openOnScreen = (screen) => {
    const url = window.location.href; // same page (IntellectMode)
    const features = [
      `left=${screen.availLeft}`,
      `top=${screen.availTop}`,
      `width=${screen.availWidth}`,
      `height=${screen.availHeight}`,
      'toolbar=no',
      'menubar=no',
      'scrollbars=no',
      'status=no',
    ].join(',');
    const w = window.open(url, `_intellect_screen_${screen.id}`, features);
    if (w) {
      setOpenedWindows(prev => new Set([...prev, screen.id]));
      toast.success(`Opened FLEET AI on ${screen.label}`);
    } else {
      toast.error('Popup blocked. Please allow popups for this site.');
    }
  };

  const openSelected = () => {
    screens.filter(s => selectedScreens.has(s.id)).forEach(openOnScreen);
  };

  const primaryScreen = screens.find(s => s.isPrimary) || screens[0];
  const secondaryScreens = screens.filter(s => !s.isPrimary);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(2,8,23,0.85)' }}>
      {/* Backdrop */}
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
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40 rounded-br-2xl pointer-events-none" />
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

          {permissionDenied && !loading && (
            <div className="text-center py-10 space-y-4">
              <Monitor className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-white font-semibold">Screen access permission required</p>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">Your browser needs permission to see all connected screens. Click below to grant access.</p>
              <Button onClick={detectScreens} className="bg-gradient-to-r from-violet-500 to-cyan-500">
                <Monitor className="w-4 h-4 mr-2" />
                Grant Screen Access
              </Button>
            </div>
          )}

          {!loading && !permissionDenied && screens.length > 0 && (
            <>
              {/* Screen grid visualizer */}
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
                  {screens.length} screen{screens.length > 1 ? 's' : ''} detected — click to select
                </p>
                <div className="flex flex-wrap gap-3">
                  {screens.map((screen) => {
                    const selected = selectedScreens.has(screen.id);
                    const opened = openedWindows.has(screen.id);
                    return (
                      <motion.button
                        key={screen.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => !screen.isPrimary && toggleScreen(screen.id)}
                        disabled={screen.isPrimary}
                        className={`relative flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all text-left ${
                          screen.isPrimary
                            ? 'border-slate-700/50 bg-slate-900/40 opacity-60 cursor-not-allowed'
                            : selected
                            ? 'border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/30'
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
                        {/* Mini monitor icon */}
                        <div className={`w-full aspect-video rounded-lg mb-3 flex items-center justify-center border ${
                          screen.isPrimary ? 'border-slate-700 bg-slate-800/50' : selected ? 'border-violet-500/50 bg-violet-500/20' : 'border-slate-700 bg-slate-800/50'
                        }`}>
                          <Monitor className={`w-6 h-6 ${screen.isPrimary ? 'text-slate-500' : selected ? 'text-violet-400' : 'text-slate-500'}`} />
                          {!screen.isPrimary && selected && (
                            <Sparkles className="w-3 h-3 text-cyan-400 absolute" />
                          )}
                        </div>
                        <p className="text-white text-xs font-semibold truncate">{screen.label}</p>
                        <p className="text-slate-500 text-[10px]">{screen.width}×{screen.height}</p>
                        {screen.isPrimary && <p className="text-slate-600 text-[10px]">Current screen (this window)</p>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {screens.length === 1 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-amber-400 text-sm font-medium">Only one screen detected</p>
                  <p className="text-slate-400 text-xs mt-1">Connect more displays to your PC and click "Refresh" to detect them.</p>
                  <Button onClick={detectScreens} variant="ghost" className="mt-2 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30">
                    Refresh screens
                  </Button>
                </div>
              )}

              {secondaryScreens.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    onClick={openSelected}
                    disabled={selectedScreens.size === 0}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 border-0 font-bold disabled:opacity-40"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open on {selectedScreens.size > 0 ? selectedScreens.size : ''} selected screen{selectedScreens.size !== 1 ? 's' : ''}
                  </Button>
                  <Button
                    onClick={() => {
                      const allSecondary = new Set(secondaryScreens.map(s => s.id));
                      setSelectedScreens(allSecondary);
                    }}
                    variant="ghost"
                    className="text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 text-sm"
                  >
                    <Layout className="w-4 h-4 mr-1.5" />
                    Select all
                  </Button>
                </div>
              )}

              <p className="text-slate-600 text-xs text-center">
                Each screen will open FLEET AI in a popup window — drag hologram windows freely across screens.
                {' '}Allow popups in your browser for this to work.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}