import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lock, Plane, Ship, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AddonAccessGate({ addonKey, icon: Icon, title, description, color, children }) {
  const [status, setStatus] = useState("loading"); // loading | active | locked

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      if (!user?.organization_id) { setStatus("locked"); return; }
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      const org = orgs[0];
      if (org && org[addonKey]) {
        setStatus("active");
      } else {
        setStatus("locked");
      }
    }).catch(() => setStatus("locked"));
  }, [addonKey]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (status === "active") {
    return children;
  }

  // Locked screen
  const accentColor = color || "#06b6d4";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Lock icon with module icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-28 h-28 rounded-2xl flex items-center justify-center" style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30` }}>
            <Icon className="w-14 h-14" style={{ color: accentColor }} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 mb-2 leading-relaxed">{description}</p>
        <p className="text-slate-500 text-sm mb-8">This module requires an active license and will be automatically billed on your monthly invoice.</p>

        {/* Pricing card */}
        <div className="rounded-2xl p-6 mb-8 text-left" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}25` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-lg">{title} — Add-on</span>
            <span className="text-3xl font-black" style={{ color: accentColor }}>€2.000<span className="text-base font-normal text-slate-400">/md.</span></span>
          </div>
          <ul className="space-y-2">
            {[
              "Full AI-powered operations command center",
                "Real-time data & live tracking",
                "AI Co-Pilot & scenario analysis",
                "Automatic billing via monthly invoice",
                "Can be disabled anytime from Settings"
            ].map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/Settings"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`, color: "white" }}
        >
          Enable in Settings
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-slate-600 text-xs mt-4">Only administrators can enable add-ons</p>
      </div>
    </div>
  );
}