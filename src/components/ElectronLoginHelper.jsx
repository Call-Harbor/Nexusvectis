import { useState, useEffect } from "react";
import { appParams } from "@/lib/app-params";

export default function ElectronLoginHelper() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Lytte på deep links og localStorage token fra browser-login
  useEffect(() => {
    // Handle ToDesktop deep link (nexusvectis://auth?token=xxx)
    if (window.__todesktop?.deepLink) {
      window.__todesktop.deepLink.addEventListener('url', (url) => {
        if (url && url.startsWith('nexusvectis://')) {
          const urlParams = new URL(url.replace('nexusvectis://', 'http://localhost/')).searchParams;
          const token = urlParams.get('token');
          if (token) {
            localStorage.setItem('base44_access_token', token);
            window.location.reload();
          }
        }
      });
    }

    // Fallback: monitor localStorage fra browser-login
    if (isLoggingIn) {
      const checkInterval = setInterval(() => {
        const storedToken = localStorage.getItem('base44_access_token');
        if (storedToken) {
          clearInterval(checkInterval);
          window.location.reload();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, [isLoggingIn]);

  const connect = () => {
    const raw = token.trim();
    if (!raw) {
      setError("Indsæt venligst dit personlige forbindelses-ID.");
      return;
    }
    localStorage.setItem("base44_access_token", raw);
    window.location.reload();
  };

  const openWebApp = () => {
    setIsLoggingIn(true);
    const returnUrl = encodeURIComponent('nexusvectis://auth');
    const url = `https://${appParams.appId}.base44.app?return_to=${returnUrl}`;
    if (window.__todesktop?.shell?.openExternal) {
      window.__todesktop.shell.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
      <div
        className="bg-slate-900 border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
        style={{ borderColor: "rgba(6,182,212,0.3)" }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔗</div>
          <h2 className="text-xl font-bold text-white">Forbind desktop-appen</h2>
          <p className="text-slate-400 text-sm mt-2">
            Log ind på platformen i din browser og hent dit personlige ID.
          </p>
        </div>

        <button
          onClick={openWebApp}
          className="w-full py-2.5 rounded-xl font-semibold text-white text-sm mb-5 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: isLoggingIn ? "linear-gradient(135deg, #10b981, #06b6d4)" : "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Åbner browser... Log ind og vent på automatisk synkronisering" : "1. Log ind i browser →"}
        </button>

        <div className="mb-1">
          <label className="text-slate-400 text-xs font-mono mb-1 block">2. Indsæt dit ID her</label>
          <textarea
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(""); }}
            placeholder="Indsæt dit personlige forbindelses-ID..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-mono resize-none focus:outline-none focus:border-cyan-500"
            rows={3}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        {isLoggingIn && <p className="text-green-400 text-xs mb-3">✓ Browser åbnet — login og vend tilbage hertil automatisk</p>}

        {!isLoggingIn && token && (
          <button
            onClick={connect}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 mt-2 bg-gradient-to-r from-green-600 to-cyan-600"
          >
            Forbind manuelt
          </button>
        )}
      </div>
    </div>
  );
}