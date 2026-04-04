import { useEffect, useState } from "react";
import { appParams } from "@/lib/app-params";

const CALLBACK_SCHEME = "nexusvectis://auth";

export default function ElectronLoginHelper() {
  const [status, setStatus] = useState("idle"); // idle | waiting
  const [error, setError] = useState("");

  const openLogin = () => {
    const loginUrl = `https://base44.com/login?app_id=${appParams.appId}&from_url=${encodeURIComponent(CALLBACK_SCHEME)}`;

    // Open in system browser via ToDesktop shell API
    if (window.__todesktop?.shell?.openExternal) {
      window.__todesktop.shell.openExternal(loginUrl);
    } else {
      window.open(loginUrl, "_blank");
    }

    setStatus("waiting");
  };

  useEffect(() => {
    if (status !== "waiting") return;

    // ToDesktop/Electron calls handler as (event, url) where event is an Electron event object.
    // We accept both signatures to be safe.
    const handleOpenUrl = (eventOrUrl, maybeUrl) => {
      const url = typeof eventOrUrl === "string" ? eventOrUrl : (maybeUrl ?? "");
      if (!url || !url.startsWith("nexusvectis://")) return;

      try {
        const normalized = url.replace("nexusvectis://auth", "https://callback");
        const parsed = new URL(normalized);
        const token = parsed.searchParams.get("access_token");
        if (token) {
          localStorage.setItem("base44_access_token", token);
          window.location.reload();
        } else {
          setError("Intet token modtaget fra login. Prøv igen.");
          setStatus("idle");
        }
      } catch (e) {
        setError("Fejl ved behandling af login-link.");
        setStatus("idle");
      }
    };

    // Register listener on the ToDesktop app object
    if (window.__todesktop?.app?.on) {
      window.__todesktop.app.on("open-url", handleOpenUrl);
    }

    return () => {
      if (window.__todesktop?.app?.off) {
        window.__todesktop.app.off("open-url", handleOpenUrl);
      }
    };
  }, [status]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
      <div
        className="bg-slate-900 border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
        style={{ borderColor: "rgba(6,182,212,0.3)" }}
      >
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white mb-2">Log ind på NexusVectis</h2>

        {status === "idle" && (
          <>
            <p className="text-slate-400 text-sm mb-6">
              Klik nedenfor for at logge ind via din webbrowser. Du sendes automatisk tilbage til appen bagefter.
            </p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={openLogin}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
            >
              Åbn login i browser
            </button>
          </>
        )}

        {status === "waiting" && (
          <>
            <p className="text-slate-400 text-sm mb-6">
              Fuldfør login i din webbrowser. Appen opdateres automatisk, når du er logget ind.
            </p>
            <div className="flex items-center justify-center gap-3 text-cyan-400">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-mono">Venter på login...</span>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-slate-600 hover:text-slate-400 text-xs transition-all"
            >
              Annuller
            </button>
          </>
        )}
      </div>
    </div>
  );
}