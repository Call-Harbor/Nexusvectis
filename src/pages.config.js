/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIOptimization from './pages/AIOptimization';
import APIDocumentation from './pages/APIDocumentation';
import APIMetrics from './pages/APIMetrics';
import AdminDashboard from './pages/AdminDashboard';
import AdminInvoices from './pages/AdminInvoices';
import AdminMessages from './pages/AdminMessages';
import AdminMonitor from './pages/AdminMonitor';
import Alerts from './pages/Alerts';
import AnalyticsPage from './pages/AnalyticsPage';
import AssetManagement from './pages/AssetManagement';
import Assignment from './pages/Assignment';
import Blog from './pages/Blog';
import CRM from './pages/CRM';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import ContractManagement from './pages/ContractManagement';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerManagement from './pages/CustomerManagement';
import CustomerPortal from './pages/CustomerPortal';
import CustomerTracking from './pages/CustomerTracking';
import Dashboard from './pages/Dashboard';
import DemandForecasting from './pages/DemandForecasting';
import DocumentManagement from './pages/DocumentManagement';
import DriverManagement from './pages/DriverManagement';
import Fleet from './pages/Fleet';
import FleetAIPage from './pages/FleetAIPage';
import FleetSlidePresenter from './pages/FleetSlidePresenter';
import GPSIntegration from './pages/GPSIntegration';
import GreenTMS from './pages/GreenTMS';
import HRManagement from './pages/HRManagement';
import HarborInfo from './pages/HarborInfo';
import HologramDesktop from './pages/HologramDesktop';
import Home from './pages/Home';
import IntegrationsPage from './pages/IntegrationsPage';
import IntellectMode from './pages/IntellectMode';
import Invoices from './pages/Invoices';
import LiveTrackingPage from './pages/LiveTrackingPage';
import MaintenanceManagement from './pages/MaintenanceManagement';
import MapMonitor from './pages/MapMonitor';
import Newsroom from './pages/Newsroom';
import NotificationSettings from './pages/NotificationSettings';
import OrganizationSetup from './pages/OrganizationSetup';
import PeopleSearch from './pages/PeopleSearch';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import Routes from './pages/Routes';
import Security from './pages/Security';
import SecurityPage from './pages/SecurityPage';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import TermsOfService from './pages/TermsOfService';
import UserManagement from './pages/UserManagement';
import WarehouseAutomation from './pages/WarehouseAutomation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIOptimization": AIOptimization,
    "APIDocumentation": APIDocumentation,
    "APIMetrics": APIMetrics,
    "AdminDashboard": AdminDashboard,
    "AdminInvoices": AdminInvoices,
    "AdminMessages": AdminMessages,
    "AdminMonitor": AdminMonitor,
    "Alerts": Alerts,
    "AnalyticsPage": AnalyticsPage,
    "AssetManagement": AssetManagement,
    "Assignment": Assignment,
    "Blog": Blog,
    "CRM": CRM,
    "Careers": Careers,
    "Contact": Contact,
    "ContractManagement": ContractManagement,
    "CustomerDashboard": CustomerDashboard,
    "CustomerManagement": CustomerManagement,
    "CustomerPortal": CustomerPortal,
    "CustomerTracking": CustomerTracking,
    "Dashboard": Dashboard,
    "DemandForecasting": DemandForecasting,
    "DocumentManagement": DocumentManagement,
    "DriverManagement": DriverManagement,
    "Fleet": Fleet,
    "FleetAIPage": FleetAIPage,
    "FleetSlidePresenter": FleetSlidePresenter,
    "GPSIntegration": GPSIntegration,
    "GreenTMS": GreenTMS,
    "HRManagement": HRManagement,
    "HarborInfo": HarborInfo,
    "HologramDesktop": HologramDesktop,
    "Home": Home,
    "IntegrationsPage": IntegrationsPage,
    "IntellectMode": IntellectMode,
    "Invoices": Invoices,
    "LiveTrackingPage": LiveTrackingPage,
    "MaintenanceManagement": MaintenanceManagement,
    "MapMonitor": MapMonitor,
    "Newsroom": Newsroom,
    "NotificationSettings": NotificationSettings,
    "OrganizationSetup": OrganizationSetup,
    "PeopleSearch": PeopleSearch,
    "PrivacyPolicy": PrivacyPolicy,
    "Reports": Reports,
    "Resources": Resources,
    "Routes": Routes,
    "Security": Security,
    "SecurityPage": SecurityPage,
    "Settings": Settings,
    "Shipments": Shipments,
    "TermsOfService": TermsOfService,
    "UserManagement": UserManagement,
    "WarehouseAutomation": WarehouseAutomation,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};