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
import AdminDashboard from './pages/AdminDashboard';
import AdminMonitor from './pages/AdminMonitor';
import Alerts from './pages/Alerts';
import Assignment from './pages/Assignment';
import Dashboard from './pages/Dashboard';
import DemandForecasting from './pages/DemandForecasting';
import Fleet from './pages/Fleet';
import GPSIntegration from './pages/GPSIntegration';
import GreenTMS from './pages/GreenTMS';
import Home from './pages/Home';
import IntellectMode from './pages/IntellectMode';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import MapMonitor from './pages/MapMonitor';
import OrganizationSetup from './pages/OrganizationSetup';
import Resources from './pages/Resources';
import Routes from './pages/Routes';
import Security from './pages/Security';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import WarehouseAutomation from './pages/WarehouseAutomation';
import Shipments from './pages/Shipments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIOptimization": AIOptimization,
    "APIDocumentation": APIDocumentation,
    "AdminDashboard": AdminDashboard,
    "AdminMonitor": AdminMonitor,
    "Alerts": Alerts,
    "Assignment": Assignment,
    "Dashboard": Dashboard,
    "DemandForecasting": DemandForecasting,
    "Fleet": Fleet,
    "GPSIntegration": GPSIntegration,
    "GreenTMS": GreenTMS,
    "Home": Home,
    "IntellectMode": IntellectMode,
    "Invoices": Invoices,
    "Landing": Landing,
    "MapMonitor": MapMonitor,
    "OrganizationSetup": OrganizationSetup,
    "Resources": Resources,
    "Routes": Routes,
    "Security": Security,
    "Settings": Settings,
    "UserManagement": UserManagement,
    "WarehouseAutomation": WarehouseAutomation,
    "Shipments": Shipments,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};