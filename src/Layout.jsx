import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import CircularNav from "./components/navigation/CircularNav";
import { ADMIN_SHELL_PAGE_KEYS, PUBLIC_PAGE_KEYS } from "./routeZones";

export default function Layout({ children, currentPageName }) {
  const isHologram = new URLSearchParams(window.location.search).get('hologram') === 'true';
  // IA: hide CircularNav on public/marketing, customer portals, immersive views, and platform admin shell (admin uses AdminLayout).
  const hideNav =
    isHologram ||
    ADMIN_SHELL_PAGE_KEYS.has(currentPageName) ||
    PUBLIC_PAGE_KEYS.has(currentPageName) ||
    currentPageName === "MapMonitor" ||
    currentPageName === "Landing" ||
    currentPageName === "IntellectMode" ||
    currentPageName === "HologramDesktop" ||
    currentPageName === "FleetSlidePresenter" ||
    currentPageName === "CustomerPortal" ||
    currentPageName === "CustomerTracking" ||
    currentPageName === "CustomerDashboard" ||
    currentPageName === "About" ||
    currentPageName === "LiveTrackingPage" ||
    currentPageName === "AnalyticsPage";
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {!hideNav && (
        <CircularNav currentPageName={currentPageName} user={user} />
      )}

      <main>
        {children}
      </main>
    </div>
  );
}