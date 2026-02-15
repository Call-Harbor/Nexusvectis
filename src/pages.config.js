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
import AdminMonitor from './pages/AdminMonitor';
import Alerts from './pages/Alerts';
import AssetManagement from './pages/AssetManagement';
import Assignment from './pages/Assignment';
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
import GPSIntegration from './pages/GPSIntegration';
import GreenTMS from './pages/GreenTMS';
import Home from './pages/Home';
import IntellectMode from './pages/IntellectMode';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import MaintenanceManagement from './pages/MaintenanceManagement';
import MapMonitor from './pages/MapMonitor';
import OrganizationSetup from './pages/OrganizationSetup';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import Routes from './pages/Routes';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import UserManagement from './pages/UserManagement';
import WarehouseAutomation from './pages/WarehouseAutomation';
import FleetAIPage from './pages/FleetAIPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIOptimization": AIOptimization,
    "APIDocumentation": APIDocumentation,
    "APIMetrics": APIMetrics,
    "AdminDashboard": AdminDashboard,
    "AdminInvoices": AdminInvoices,
    "AdminMonitor": AdminMonitor,
    "Alerts": Alerts,
    "AssetManagement": AssetManagement,
    "Assignment": Assignment,
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
    "GPSIntegration": GPSIntegration,
    "GreenTMS": GreenTMS,
    "Home": Home,
    "IntellectMode": IntellectMode,
    "Invoices": Invoices,
    "Landing": Landing,
    "MaintenanceManagement": MaintenanceManagement,
    "MapMonitor": MapMonitor,
    "OrganizationSetup": OrganizationSetup,
    "Reports": Reports,
    "Resources": Resources,
    "Routes": Routes,
    "Security": Security,
    "Settings": Settings,
    "Shipments": Shipments,
    "UserManagement": UserManagement,
    "WarehouseAutomation": WarehouseAutomation,
    "FleetAIPage": FleetAIPage,
    "LiveTrackingPage": LiveTrackingPage,
    "AnalyticsPage": AnalyticsPage,
    "IntegrationsPage": IntegrationsPage,
    "About": About,
    "Careers": Careers,
    "Contact": Contact,
    "Blog": Blog,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};