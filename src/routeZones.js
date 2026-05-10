/**
 * IA: Route zones for SaaS structure — public (marketing), app (tenant workspace),
 * admin (platform shell; pages wrap themselves with AdminLayout).
 * Used by App.jsx (which shell wraps each route) and Layout.jsx (hide CircularNav on admin-only views).
 */

/** Marketing / legal / product storytelling — CircularNav hidden via Layout.jsx */
export const PUBLIC_PAGE_KEYS = new Set([
  "Home",
  "Blog",
  "BlogPostDetail",
  "BlogAIAnalysis",
  "Careers",
  "Contact",
  "HarborInfo",
  "PressAndMedia",
  "Newsroom",
  "SecurityPage",
  "TermsOfService",
  "PrivacyPolicy",
  "FleetAIPage",
  "IntegrationsPage",
]);

/**
 * Platform operator shell — no root LayoutWrapper: each page uses AdminLayout and would double-wrap.
 * TODO(P1-RBAC): gate these routes at router level for user.role === 'admin', not only inside pages.
 */
export const ADMIN_SHELL_PAGE_KEYS = new Set([
  "AdminDashboard",
  "AdminInvoices",
  "AdminMessages",
  "AdminMonitor",
  "AdminPlatformHealth",
  "AdminOrganizations",
  "AdminSecurityCenter",
  "AdminCompetitiveIntel",
  "AdminRevenueEngine",
  "AdminScenarioSimulator",
  "AdminCustomerHealth",
  "BillingDashboard",
  "CEODashboard",
  "MobileAppPublisher",
]);

/**
 * Full-screen experiences that ship their own chrome (no root Layout / CircularNav).
 * Routing: single entry in pages.config — excluded from LayoutWrapper in App.jsx.
 * HarborIntellectProduct: standalone only (not in PUBLIC_PAGE_KEYS — avoids double shell).
 */
export const STANDALONE_PAGE_KEYS = new Set([
  "StaffPortal",
  "StaffManagement",
  "NexusOrbit",
  "HarborIntellectProduct",
]);

/**
 * Tenant workspace: root Layout + CircularNav (nav visibility still refined per page in Layout.jsx).
 * Not used by App.jsx yet — kept for future IA guards.
 */
export function isWorkspacePageKey(pageKey) {
  return (
    !PUBLIC_PAGE_KEYS.has(pageKey) &&
    !ADMIN_SHELL_PAGE_KEYS.has(pageKey) &&
    !STANDALONE_PAGE_KEYS.has(pageKey)
  );
}

// Sync: zone keys must match `PAGES` keys in pages.config.js (verify when adding routes).
