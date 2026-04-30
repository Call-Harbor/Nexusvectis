import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ElectronLoginHelper from '@/components/ElectronLoginHelper';
import HolographicInterface from './pages/HolographicInterface';
import BlogPostDetail from './pages/BlogPostDetail';
import BlogAIAnalysis from './pages/BlogAIAnalysis';
import CEODashboard from './pages/CEODashboard';
import BillingDashboard from './pages/BillingDashboard';
import NexusOrbit from './pages/NexusOrbit';
import TransitControl from './pages/TransitControl';
import ScenarioStudio from './pages/ScenarioStudio';
import PortCommandCenter from './pages/PortCommandCenter';
import AirportOpsCenter from './pages/AirportOpsCenter';
import StaffPortal from './pages/StaffPortal';
import AirportReports from './pages/AirportReports';
import StaffManagement from './pages/StaffManagement';
import RegulatoryIntelligence from './pages/RegulatoryIntelligence';
import EnergyOpsCenter from './pages/EnergyOpsCenter';
import MobileAppPublisher from './pages/MobileAppPublisher';
import HarborIntellectProduct from './pages/HarborIntellectProduct';
import GridManagement from './pages/GridManagement';
import AdminPlatformHealth from './pages/AdminPlatformHealth';
import AdminOrganizations from './pages/AdminOrganizations';
import AdminSecurityCenter from './pages/AdminSecurityCenter';
import AdminCompetitiveIntel from './pages/AdminCompetitiveIntel';
import AdminRevenueEngine from './pages/AdminRevenueEngine';
import AdminScenarioSimulator from './pages/AdminScenarioSimulator';
import AdminCustomerHealth from './pages/AdminCustomerHealth';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [user, setUser] = useState(null);

  // Gem token til LoginSession når Electron logger ind via web
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const electronSessionId = params.get('electron_session');
    const token = localStorage.getItem('base44_access_token');

    if (electronSessionId && token && !isLoadingAuth) {
      base44.entities.LoginSession.create({
        session_id: electronSessionId,
        access_token: token,
        device_type: 'web',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
      }).catch(err => console.error('Failed to save login session:', err));
    }
  }, [isLoadingAuth]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {}
    };
    if (!authError) fetchUser();
  }, [authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const isElectron = typeof navigator !== 'undefined' && (navigator.userAgent.toLowerCase().includes('electron') || !!window.__todesktop);
      if (isElectron) {
        return <ElectronLoginHelper />;
      }
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route 
        path="/HolographicInterface" 
        element={
          <LayoutWrapper currentPageName="HolographicInterface">
            <HolographicInterface />
          </LayoutWrapper>
        } 
      />

      <Route 
        path="/BlogPostDetail" 
        element={
          <LayoutWrapper currentPageName="BlogPostDetail">
            <BlogPostDetail />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/BlogAIAnalysis" 
        element={
          <LayoutWrapper currentPageName="BlogAIAnalysis">
            <BlogAIAnalysis />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/CEODashboard" 
        element={
          <LayoutWrapper currentPageName="CEODashboard">
            <CEODashboard />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/NexusOrbit" 
        element={<NexusOrbit />}
      />
      <Route 
        path="/TransitControl" 
        element={
          <LayoutWrapper currentPageName="TransitControl">
            <TransitControl />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/ScenarioStudio" 
        element={
          <LayoutWrapper currentPageName="ScenarioStudio">
            <ScenarioStudio />
          </LayoutWrapper>
        }
      />
      <Route 
        path="/PortCommandCenter" 
        element={
          <LayoutWrapper currentPageName="PortCommandCenter">
            <PortCommandCenter />
          </LayoutWrapper>
        }
      />
      <Route 
        path="/AirportOpsCenter" 
        element={
          <LayoutWrapper currentPageName="AirportOpsCenter">
            <AirportOpsCenter />
          </LayoutWrapper>
        }
      />
      <Route path="/StaffPortal" element={<StaffPortal />} />
      <Route
        path="/AirportReports"
        element={
          <LayoutWrapper currentPageName="AirportReports">
            <AirportReports />
          </LayoutWrapper>
        }
      />
      <Route path="/StaffManagement" element={<StaffManagement />} />
      <Route
        path="/RegulatoryIntelligence"
        element={
          <LayoutWrapper currentPageName="RegulatoryIntelligence">
            <RegulatoryIntelligence />
          </LayoutWrapper>
        }
      />
      <Route
        path="/GridManagement"
        element={
          <LayoutWrapper currentPageName="GridManagement">
            <GridManagement />
          </LayoutWrapper>
        }
      />
      <Route
        path="/EnergyOpsCenter"
        element={
          <LayoutWrapper currentPageName="EnergyOpsCenter">
            <EnergyOpsCenter />
          </LayoutWrapper>
        }
      />
      <Route
        path="/MobileAppPublisher"
        element={
          <LayoutWrapper currentPageName="MobileAppPublisher">
            <MobileAppPublisher />
          </LayoutWrapper>
        }
      />
      <Route
        path="/HarborIntellectProduct"
        element={<HarborIntellectProduct />}
      />
      <Route
        path="/BillingDashboard"
        element={
          <LayoutWrapper currentPageName="BillingDashboard">
            <BillingDashboard />
          </LayoutWrapper>
        }
      />

      <Route path="/AdminPlatformHealth" element={<LayoutWrapper currentPageName="AdminPlatformHealth"><AdminPlatformHealth /></LayoutWrapper>} />
      <Route path="/AdminOrganizations" element={<LayoutWrapper currentPageName="AdminOrganizations"><AdminOrganizations /></LayoutWrapper>} />
      <Route path="/AdminSecurityCenter" element={<LayoutWrapper currentPageName="AdminSecurityCenter"><AdminSecurityCenter /></LayoutWrapper>} />
      <Route path="/AdminCompetitiveIntel" element={<LayoutWrapper currentPageName="AdminCompetitiveIntel"><AdminCompetitiveIntel /></LayoutWrapper>} />
      <Route path="/AdminRevenueEngine" element={<LayoutWrapper currentPageName="AdminRevenueEngine"><AdminRevenueEngine /></LayoutWrapper>} />
      <Route path="/AdminScenarioSimulator" element={<LayoutWrapper currentPageName="AdminScenarioSimulator"><AdminScenarioSimulator /></LayoutWrapper>} />
      <Route path="/AdminCustomerHealth" element={<LayoutWrapper currentPageName="AdminCustomerHealth"><AdminCustomerHealth /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App