import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import CircularNav from "./components/navigation/CircularNav";

export default function Layout({ children, currentPageName }) {
  const isHologram = new URLSearchParams(window.location.search).get('hologram') === 'true';
  const hideNav = isHologram || currentPageName === "MapMonitor" || currentPageName === "AdminMonitor" || currentPageName === "Landing" || currentPageName === "Home" || currentPageName === "BlogPostDetail" || currentPageName === "IntellectMode" || currentPageName === "HologramDesktop" || currentPageName === "FleetSlidePresenter" || currentPageName === "CustomerPortal" || currentPageName === "CustomerTracking" || currentPageName === "CustomerDashboard" || currentPageName === "About" || currentPageName === "Careers" || currentPageName === "Contact" || currentPageName === "Blog" || currentPageName === "FleetAIPage" || currentPageName === "LiveTrackingPage" || currentPageName === "AnalyticsPage" || currentPageName === "IntegrationsPage" || currentPageName === "PrivacyPolicy" || currentPageName === "TermsOfService" || currentPageName === "SecurityPage" || currentPageName === "Newsroom" || currentPageName === "HarborInfo";
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
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {!hideNav && (
        <CircularNav currentPageName={currentPageName} user={user} />
      )}

      <main>
        {children}
      </main>
    </div>
  );
}