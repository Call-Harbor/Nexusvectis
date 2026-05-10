/**
 * pages.config.js — central route table for the SPA.
 *
 * Previously described as auto-generated; routing is now maintained here so App.jsx
 * has a single source of truth. Add one import + one `PAGES` entry per page component.
 * URL path = `/${key}` (key must match React Router path segment exactly).
 *
 * `mainPage`: landing route `/` (must exist as a key in PAGES).
 */
import AIOptimization from './pages/AIOptimization';
import APIDocumentation from './pages/APIDocumentation';
import APIMetrics from './pages/APIMetrics';
import AdminDashboard from './pages/AdminDashboard';
import AdminInvoices from './pages/AdminInvoices';
import AdminMessages from './pages/AdminMessages';
import AdminMonitor from './pages/AdminMonitor';
import AdminPlatformHealth from './pages/AdminPlatformHealth';
import AdminOrganizations from './pages/AdminOrganizations';
import AdminSecurityCenter from './pages/AdminSecurityCenter';
import AdminCompetitiveIntel from './pages/AdminCompetitiveIntel';
import AdminRevenueEngine from './pages/AdminRevenueEngine';
import AdminScenarioSimulator from './pages/AdminScenarioSimulator';
import AdminCustomerHealth from './pages/AdminCustomerHealth';
import AgentComparisonPage from './pages/AgentComparisonPage';
import AirportOpsCenter from './pages/AirportOpsCenter';
import AirportReports from './pages/AirportReports';
import Alerts from './pages/Alerts';
import AnalyticsPage from './pages/AnalyticsPage';
import AssetManagement from './pages/AssetManagement';
import Assignment from './pages/Assignment';
import BlogAIAnalysis from './pages/BlogAIAnalysis';
import BlogPostDetail from './pages/BlogPostDetail';
import Blog from './pages/Blog';
import BillingDashboard from './pages/BillingDashboard';
import CRM from './pages/CRM';
import CEODashboard from './pages/CEODashboard';
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
import EnergyOpsCenter from './pages/EnergyOpsCenter';
import Fleet from './pages/Fleet';
import FleetAIPage from './pages/FleetAIPage';
import FleetSlidePresenter from './pages/FleetSlidePresenter';
import GPSIntegration from './pages/GPSIntegration';
import GreenTMS from './pages/GreenTMS';
import GridManagement from './pages/GridManagement';
import HRManagement from './pages/HRManagement';
import HarborInfo from './pages/HarborInfo';
import HarborIntellectProduct from './pages/HarborIntellectProduct';
import HologramDesktop from './pages/HologramDesktop';
import HolographicInterface from './pages/HolographicInterface';
import Home from './pages/Home';
import IntegrationsPage from './pages/IntegrationsPage';
import IntellectMode from './pages/IntellectMode';
import Invoices from './pages/Invoices';
import LiveTrackingPage from './pages/LiveTrackingPage';
import MaintenanceManagement from './pages/MaintenanceManagement';
import MapMonitor from './pages/MapMonitor';
import MobileAppPublisher from './pages/MobileAppPublisher';
import NexusOrbit from './pages/NexusOrbit';
import Newsroom from './pages/Newsroom';
import PortCommandCenter from './pages/PortCommandCenter';
import PressAndMedia from './pages/PressAndMedia';
import NotificationSettings from './pages/NotificationSettings';
import OrganizationSetup from './pages/OrganizationSetup';
import PeopleSearch from './pages/PeopleSearch';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RegulatoryIntelligence from './pages/RegulatoryIntelligence';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import Routes from './pages/Routes';
import Security from './pages/Security';
import SecurityPage from './pages/SecurityPage';
import ScenarioStudio from './pages/ScenarioStudio';
import StaffManagement from './pages/StaffManagement';
import StaffPortal from './pages/StaffPortal';
import Settings from './pages/Settings';
import Shipments from './pages/Shipments';
import TermsOfService from './pages/TermsOfService';
import TransitControl from './pages/TransitControl';
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
    "AdminPlatformHealth": AdminPlatformHealth,
    "AdminOrganizations": AdminOrganizations,
    "AdminSecurityCenter": AdminSecurityCenter,
    "AdminCompetitiveIntel": AdminCompetitiveIntel,
    "AdminRevenueEngine": AdminRevenueEngine,
    "AdminScenarioSimulator": AdminScenarioSimulator,
    "AdminCustomerHealth": AdminCustomerHealth,
    "AgentComparison": AgentComparisonPage,
    "AirportOpsCenter": AirportOpsCenter,
    "AirportReports": AirportReports,
    "Alerts": Alerts,
    "AnalyticsPage": AnalyticsPage,
    "AssetManagement": AssetManagement,
    "Assignment": Assignment,
    "BillingDashboard": BillingDashboard,
    "Blog": Blog,
    "BlogAIAnalysis": BlogAIAnalysis,
    "BlogPostDetail": BlogPostDetail,
    "CEODashboard": CEODashboard,
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
    "EnergyOpsCenter": EnergyOpsCenter,
    "Fleet": Fleet,
    "FleetAIPage": FleetAIPage,
    "FleetSlidePresenter": FleetSlidePresenter,
    "GPSIntegration": GPSIntegration,
    "GreenTMS": GreenTMS,
    "GridManagement": GridManagement,
    "HRManagement": HRManagement,
    "HarborInfo": HarborInfo,
    "HarborIntellectProduct": HarborIntellectProduct,
    "HologramDesktop": HologramDesktop,
    "HolographicInterface": HolographicInterface,
    "Home": Home,
    "IntegrationsPage": IntegrationsPage,
    "IntellectMode": IntellectMode,
    "Invoices": Invoices,
    "LiveTrackingPage": LiveTrackingPage,
    "MaintenanceManagement": MaintenanceManagement,
    "MapMonitor": MapMonitor,
    "MobileAppPublisher": MobileAppPublisher,
    "Newsroom": Newsroom,
    "NexusOrbit": NexusOrbit,
    "PressAndMedia": PressAndMedia,
    "NotificationSettings": NotificationSettings,
    "OrganizationSetup": OrganizationSetup,
    "PeopleSearch": PeopleSearch,
    "PortCommandCenter": PortCommandCenter,
    "PrivacyPolicy": PrivacyPolicy,
    "RegulatoryIntelligence": RegulatoryIntelligence,
    "Reports": Reports,
    "Resources": Resources,
    "Routes": Routes,
    "Security": Security,
    "SecurityPage": SecurityPage,
    "ScenarioStudio": ScenarioStudio,
    "Settings": Settings,
    "Shipments": Shipments,
    "StaffManagement": StaffManagement,
    "StaffPortal": StaffPortal,
    "TermsOfService": TermsOfService,
    "TransitControl": TransitControl,
    "UserManagement": UserManagement,
    "WarehouseAutomation": WarehouseAutomation,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};