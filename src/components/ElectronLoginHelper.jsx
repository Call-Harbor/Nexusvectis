import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { useAuth } from "@/lib/AuthContext";

export default function ElectronLoginHelper() {
  const { checkAppState } = useAuth();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("prompt"); // prompt | paste

  const openLoginInBrowser = () => {
    // Open Base44 login in system browser — user will end up on the web app
    // with the token visible in the URL bar
    const loginUrl = `https://base44.com/login?app_id=${appParams.appId}`;
    if (window.todesktop?.shell?.openExternal) {
      window.todesktop.shell.openExternal(loginUrl);
    } else if (window.__todesktop?.shell?.openExternal) {
      window.__todesktop.shell.openExternal(loginUrl);
    } else {
      window.open(loginUrl, "_blank");
    }
    setStep("paste");
  };

  const applyToken = async () => {
    const raw = token.trim();
    if (!raw) { setError("Indsæt venligst dit access token"); return; }

    // Support both raw token and full URL with access_token= param
    let accessToken = raw;
    try {
      const url = new URL(raw);
      const param = url.searchParams.get("access_token");
      if (param) accessToken = param;
    } catch (_) {}

    setLoading(true);
    setError("");
    try {
      localStorage.setItem("base44_access_token", accessToken);
      // Verify it works
      await base44.auth.me();
      checkAppState();
      window.location.reload();
    } catch (e) {
      localStorage.removeItem("base44_access_token");
      setError("Ugyldigt token. Prøv igen.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-white mb-2">Log ind på NexusVectis</h2>
          <p className="text-slate-400 text-sm">
            Google OAuth kan ikke køre direkte i desktop-appen. Brug nedenstående flow.
          </p>
        </div>

        {step === "prompt" && (
          <div className="space-y-4">
            <button
              onClick={openLoginInBrowser}
              className="w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
            >
              Åbn login i browser
            </button>
            <p className="text-slate-500 text-xs text-center">
              Logger ind via Google i din normale webbrowser
            </p>
          </div>
        )}

        {step === "paste" && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 space-y-2">
              <p><span className="text-cyan-400 font-bold">1.</span> Log ind med Google i browseren</p>
              <p><span className="text-cyan-400 font-bold">2.</span> Når du er logget ind, kopiér URL'en fra adresselinjen</p>
              <p><span className="text-cyan-400 font-bold">3.</span> Indsæt den herunder</p>
            </div>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Indsæt URL eller access_token her..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 resize-none font-mono"
              rows={3}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("prompt")}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-all"
              >
                Tilbage
              </button>
              <button
                onClick={applyToken}
                disabled={loading || !token.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
              >
                {loading ? "Bekræfter..." : "Log ind"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}