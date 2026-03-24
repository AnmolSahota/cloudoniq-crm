import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Pages
import Dashboard from "./ai-property/Dashboard";
import LoginForm from "./ai-property/AuthForm";

// Modules
import DealerDashboard from "./ai-property/DealerDashboard";
import LeadManagement from "./ai-property/LeadManagement";
import SiteVisits from "./ai-property/SiteVisits";
import CalendarView from "./ai-property/CalendarView";
import TaskFollowUp from "./ai-property/TaskFollowups";
import BroadcastSystem from "./ai-property/BroadcastingCRM";
import PropertyPerformance from "./ai-property/PropertyAnalytics";
import AddPropertyForm from "./ai-property/AddPropertyForm";
import ManageProperties from "./ai-property/ManageProperties";
import ManageSalesTeam from "./ai-property/ManageSalesTeam";
import ProspectView from "./ui/ProspectView";

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginForm />} />

        {/* Dashboard with nested routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DealerDashboard />} />
          <Route path="leads" element={<LeadManagement />} />
          <Route path="visits" element={<SiteVisits />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="tasks" element={<TaskFollowUp />} />
          <Route path="broadcast" element={<BroadcastSystem />} />
          <Route path="analytics" element={<PropertyPerformance />} />
          <Route path="add-property" element={<AddPropertyForm />} />
          <Route path="properties" element={<ManageProperties />} />
          <Route path="users" element={<ManageSalesTeam />} />
          <Route path="prospect" element={<ProspectView />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        toastStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
      />
      <AppContent />
    </BrowserRouter>
  );
}