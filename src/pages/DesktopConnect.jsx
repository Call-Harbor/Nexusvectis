import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function DesktopConnect() {
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The access token is stored in localStorage by the SDK
    const t =
      localStorage.getItem("base44_access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");
    setToken(t);
  }, []);

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div
        className="bg-slate-900 border rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center"
        style={{ borderColor: "rgba(6,182,212,0.3)" }}
      >
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-2xl font-bold text-white mb-2">Desktop Forbindelses-ID</h1>
        <p className="text-slate-400 text-sm mb-8">
          Kopier dit personlige ID og indsæt det i desktop-appen for at logge ind.
          <br />
          <span className="text-yellow-400 font-semibold">Del ikke dette ID med andre.</span>
        </p>

        {token ? (
          <>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-left">
              <p className="text-cyan-300 font-mono text-xs break-all leading-relaxed">{token}</p>
            </div>
            <button
              onClick={copy}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 text-sm"
              style={{ background: copied ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
            >
              {copied ? "✓ Kopieret!" : "Kopier mit ID"}
            </button>
            <p className="text-slate-600 text-xs mt-4">
              Gå tilbage til desktop-appen og indsæt ID'et for at forbinde.
            </p>
          </>
        ) : (
          <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-red-400 text-sm">
              Ingen session fundet. Sørg for at du er logget ind på platformen.
            </p>
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
            >
              Log ind nu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}