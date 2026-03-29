import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import StaffRequestManager from "@/components/staff/StaffRequestManager";
import { Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StaffManagement() {
  const [orgId, setOrgId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.organization_id) {
        setOrgId(u.organization_id);
        setIsAdmin(u?.role === "admin");
      }
    }).catch(() => navigate("/"));
  }, [navigate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Du har ikke adgang til denne side</p>
          <button onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
            Tilbage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-20 px-4 py-4 flex items-center gap-3"
        style={{ background: "rgba(2,6,23,0.97)", borderBottom: "1px solid rgba(30,41,59,0.8)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-xl font-black">Staff Management</h1>
        </div>
      </div>

      <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
        {orgId && <StaffRequestManager orgId={orgId} />}
      </div>
    </div>
  );
}