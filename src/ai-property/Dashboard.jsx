// src/pages/Dashboard.jsx
import { Outlet } from "react-router-dom";
import { logoutUser } from "./authApi";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Calendar,
  Home,
  Layers,
  LayoutDashboard,
  List,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Star,
  Target,
  UserCog,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";


// Dealer CRM Views
import BroadcastSystem from "./BroadcastingCRM";
import CalendarView from "./CalendarView";
import DealerDashboard from "./DealerDashboard";
import LeadManagement from "./LeadManagement";
import ProspectView from "../ui/ProspectView";
import ManageSalesTeam from "./ManageSalesTeam";
import PropertyPerformance from "./PropertyAnalytics";
import SiteVisits from "./SiteVisits";
import TaskFollowUp from "./TaskFollowups";

// Existing Dealer Views
import AddPropertyForm from "./AddPropertyForm";
import ManageProperties from "./ManageProperties";

// Super Admin Views
import CreateDealer from "./CreateDealer";
import DealerOverview from "./DealerOverview";
import DealerUserDashboard from "./DealerUserDashboard";
import FeatureAccess from "./FeatureAccess";
import LeadsVisits from "./LeadsVisits";
import ManageDealers from "./ManageDealers";
import TopDealers from "./TopDealers";
import SalesTargets from "./SalesTargets";
import S3Tester from "./S3Tester";

/* ── Nav Config ─────────────────────────────────────────────────────────────── */
const NAV_CONFIG = {
  SUPER_ADMIN: [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      color: "from-indigo-600 to-violet-600",
      description: "System-wide stats",
      component: <DealerOverview />,
    },
    {
      id: "manage-dealers",
      label: "Manage Dealers",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      description: "Activate / deactivate dealers",
      component: <ManageDealers />,
    },
    {
      id: "leads-visits",
      label: "Leads & Visits",
      icon: Activity,
      color: "from-cyan-500 to-blue-600",
      description: "Monitor lead flow",
      component: <LeadsVisits />,
    },
    {
      id: "top-dealers",
      label: "Top Dealers",
      icon: Star,
      color: "from-rose-500 to-pink-600",
      description: "Leaderboard",
      component: <TopDealers />,
    },
    {
      id: "feature-access",
      label: "Feature Access",
      icon: Layers,
      color: "from-purple-500 to-violet-600",
      description: "Plan-based control",
      component: <FeatureAccess />,
    },
    {
      id: "create-dealer",
      label: "Create Dealer",
      icon: Plus,
      color: "from-teal-500 to-emerald-600",
      description: "Onboard new dealer",
      component: <CreateDealer />,
    },
  ],

  DEALER: [
    {
      id: "",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "from-indigo-600 to-violet-600",
      description: "Your CRM overview",
      component: <DealerDashboard />,
    },
    {
      id: "leads",
      label: "Lead Management",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      description: "Track & convert leads",
      component: <LeadManagement />,
    },
    {
      id: "visits",
      label: "Site Visits",
      icon: Home,
      color: "from-teal-500 to-cyan-600",
      description: "Manage property visits",
      component: <SiteVisits />,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      color: "from-purple-600 to-pink-600",
      description: "Visit & follow-up calendar",
      component: <CalendarView />,
    },
    {
      id: "tasks",
      label: "Tasks & Follow-ups",
      icon: Activity,
      color: "from-amber-500 to-orange-500",
      description: "Pending follow-ups",
      component: <TaskFollowUp />,
    },
    {
      id: "broadcast",
      label: "Broadcast",
      icon: Megaphone,
      color: "from-orange-500 to-red-600",
      description: "Send to prospects",
      component: <BroadcastSystem />,
    },
    {
      id: "analytics",
      label: "Property Analytics",
      icon: BarChart3,
      color: "from-emerald-500 to-green-600",
      description: "Performance per property",
      component: <PropertyPerformance />,
    },
    // {
    //   id: "ai-chat",
    //   label: "AI Chat",
    //   icon: MessageSquare,
    //   color: "from-violet-500 to-purple-600",
    //   description: "Chat with AI Assistant",
    //   component: <Chat />,
    // },
    {
      id: "add-property",
      label: "Add Property",
      icon: Plus,
      color: "from-green-600 to-emerald-600",
      description: "List a new property",
      component: <AddPropertyForm />,
    },
    {
      id: "properties",
      label: "Manage Properties",
      icon: List,
      color: "from-cyan-600 to-blue-600",
      description: "View, edit & delete",
      component: <ManageProperties />,
    },
    {
      id: "users",
      label: "Manage Users",
      icon: UserCog,
      color: "from-rose-500 to-pink-600",
      description: "Manage your team users",
      component: <ManageSalesTeam />,
    },
    {
  id: "prospect",
  label: "Prospect",
  icon: Target,
  color: "from-pink-500 to-rose-600",
  description: "View prospect details",
  component: <ProspectView />,
},
    // {
    //   id: "sales-targets",
    //   label: "S3 Tester",
    //   icon: Target,
    //   color: "from-orange-500 to-amber-500",
    //   description: "Daily targets & team progress",
    //   component: <S3Tester />,
    // },
  ],

  // ── Dealer User (sales team member) ────────────────────────────────────────
  DEALER_USER: [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "from-indigo-600 to-violet-600",
      description: "Your CRM overview",
      component: <DealerUserDashboard />, // 👈 changed
    },
    {
      id: "add-property",
      label: "Add Property",
      icon: Plus,
      color: "from-green-600 to-emerald-600",
      description: "List a new property",
      component: <AddPropertyForm />,
    },
    {
      id: "site-visits",
      label: "Site Visits",
      icon: Home,
      color: "from-teal-500 to-cyan-600",
      description: "Manage property visits",
      component: <SiteVisits />,
    },
    {
      id: "tasks",
      label: "Tasks & Follow-ups",
      icon: Activity,
      color: "from-amber-500 to-orange-500",
      description: "Pending follow-ups",
      component: <TaskFollowUp />,
    },
    {
      id: "leads",
      label: "Lead Management",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      description: "Track & convert leads",
      component: <LeadManagement />,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      color: "from-purple-600 to-pink-600",
      description: "Visit & follow-up calendar",
      component: <CalendarView />,
    },
  ],
};

const ROLE_BRAND = {
  SUPER_ADMIN: {
    label: "Super Admin",
    gradient: "from-indigo-600 to-violet-600",
  },
  DEALER: {
    label: "Dealer",
    gradient: "from-blue-600 to-indigo-600",
  },
  DEALER_USER: {
    label: "User",
    gradient: "from-teal-500 to-cyan-600",
  },
};

/* ── Helper: avatar initials ─────────────────────────────────────────────── */
const getAvatarInitials = (name) => {
  if (!name) return "D";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 1)
    .toUpperCase();
};

const getBusinessName = () => {
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  return (
    authUser.dealer_business_name ||
    authUser.dealer?.business_name ||
    "PropPilot CRM"
  );
};

const getLogoUrl = () => {
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  // DEALER role — logo is inside dealer object
  // DEALER_USER role — logo is inside dealer object (fetched at login)
  return authUser?.dealer?.logo_url || null;
};

/* ── Dashboard ────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
const [sidebarOpen, setSidebarOpen] = useState(false);

  const authUserRaw = localStorage.getItem("auth_user");
let role = null;

try {
  const authUser = JSON.parse(authUserRaw || "{}");
  role = authUser.role;
} catch (e) {
  console.error("Invalid auth_user JSON");
}
  const navigationItems = useMemo(() => NAV_CONFIG[role] || [], [role]);
  const currentItem = navigationItems.find((item) =>
  location.pathname.includes(item.id)
);
  const brand = ROLE_BRAND[role] || ROLE_BRAND.DEALER;

  // Get current view from URL params, fallback to first item


  



  useEffect(() => {
    if (!authUserRaw || !role) {
  console.log("No role found, redirecting...");
  navigate("/login");
}
  }, [role, navigate]);

 const handleLogout = async () => {
  try {
    await logoutUser(); // call backend
  } catch (e) {
    console.log("Logout API failed");
  }

  localStorage.removeItem("auth_user");

  navigate("/login");
};

  

  const SidebarInner = () => (
    <>
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-lg">
            {getLogoUrl() ? (
              <img
                src={getLogoUrl()}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // fallback to default if S3 image fails to load
                  e.target.src = "/Finayer Logo.png";
                }}
              />
            ) : (
              <img
                src="/Finayer Logo.png"
                alt="Finayer Logo"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-gray-800 leading-none">
              PropPilot CRM
            </h1>
            {/* ✅ Show business name instead of "Dealer" / "User" */}
            <p className="text-xs text-indigo-500 font-semibold mt-0.5 truncate">
              {getBusinessName()}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          


const isActive = location.pathname === `/dashboard/${item.id}`;
          return (
            <button
              key={item.id}
              onClick={() => navigate(`/dashboard/${item.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-semibold text-sm leading-none">
                  {item.label}
                </div>
                <div
                  className={`text-xs mt-0.5 truncate ${
                    isActive ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col shadow-sm shrink-0">
        <SidebarInner />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full flex flex-col shadow-2xl overflow-y-auto">
            <SidebarInner />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 shrink-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} className="text-gray-600" />
          </button>

          {/* Page title + breadcrumb */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {currentItem && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                <currentItem.icon size={15} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm leading-none truncate">
                {currentItem?.label ?? ""}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 truncate hidden sm:block">
                {currentItem?.description ?? ""}
              </p>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {getAvatarInitials(
                  JSON.parse(localStorage.getItem("auth_user") || "{}").dealer
                    ?.business_name,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Active view ── */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
