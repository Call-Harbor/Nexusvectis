import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { ADMIN_SHELL_PAGE_KEYS, STANDALONE_PAGE_KEYS } from './routeZones';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ElectronLoginHelper from '@/components/ElectronLoginHelper';

// IA: separate public vs app vs admin routes — zone is determined per page in routeZones.js and renderPageElement() below.
// Routing: single loop over pagesConfig.PAGES (one Route per path); duplicates removed — see git history / Newsroom.jsx for /Newsroom alias.

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/** Admin shell + standalone pages: skip root LayoutWrapper (AdminLayout or full-screen chrome inside page). */
function renderPageElement(pageKey, PageComponent) {
  if (ADMIN_SHELL_PAGE_KEYS.has(pageKey) || STANDALONE_PAGE_KEYS.has(pageKey)) {
    return <PageComponent />;
  }
  return (
    <LayoutWrapper currentPageName={pageKey}>
      <PageComponent />
    </LayoutWrapper>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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

  const rootElement =
    ADMIN_SHELL_PAGE_KEYS.has(mainPageKey) || STANDALONE_PAGE_KEYS.has(mainPageKey)
      ? <MainPage />
      : (
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      );

  return (
    <Routes>
      <Route path="/" element={rootElement} />
      {Object.entries(Pages).map(([path, PageComponent]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={renderPageElement(path, PageComponent)}
        />
      ))}
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
