// src/pages/MainApp.jsx

import {
  Calendar,
  Home,
  List,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AddPropertyForm from "./AddPropertyForm";
import AdminVisitsListing from "./AdminVisitsListing";
import BulkMarketing from "./BulkMarketing";
import CreateDealer from "./CreateDealer";
import Chat from "./Testing";
import ManageProperties from "./ManageProperties";

/* ----------------------------------------
   Role → Navigation Config (SCALABLE)
---------------------------------------- */
const NAV_CONFIG = {
  SUPER_ADMIN: [
    {
      id: "create-dealer",
      label: "Create Dealer",
      icon: Home,
      color: "from-indigo-600 to-violet-600",
      description: "Onboard a property dealer",
    },
  ],

  DEALER: [
    {
      id: "chat",
      label: "AI Chat",
      icon: MessageSquare,
      color: "from-blue-600 to-indigo-600",
      description: "Chat with AI Assistant",
    },
    {
      id: "admin",
      label: "All Visits",
      icon: Calendar,
      color: "from-purple-600 to-pink-600",
      description: "View all user visits",
    },
    {
      id: "add-property",
      label: "Add Property",
      icon: Plus,
      color: "from-green-600 to-emerald-600",
      description: "List a new property",
    },
    {
      id: "manage-properties",
      label: "Manage Properties",
      icon: List,
      color: "from-cyan-600 to-blue-600",
      description: "View, edit & delete properties",
    },
    {
      id: "bulk-marketing",
      label: "Bulk Marketing",
      icon: Megaphone,
      color: "from-orange-500 to-red-600",
      description: "Broadcast properties to users",
    },
  ],
};

export default function Dashboard() {
  const navigate = useNavigate();

  const role = JSON.parse(localStorage.getItem("auth_user"))?.role || null; // SUPER_ADMIN | DEALER
  console.log("role", role);

  const navigationItems = useMemo(() => NAV_CONFIG[role] || [], [role]);

  const [currentView, setCurrentView] = useState(navigationItems[0]?.id || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ----------------------------------------
     Redirect if not logged in
  ---------------------------------------- */
  useEffect(() => {
    if (!role) {
      navigate("/login");
    }
  }, [role, navigate]);

  /* ----------------------------------------
     Logout
  ---------------------------------------- */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const currentItem = navigationItems.find((item) => item.id === currentView);

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-72 bg-white border-r border-gray-200 flex-col shadow-xl">
        {/* Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">PropertyAI</h1>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold">{item.label}</div>
                  <div
                    className={`text-xs ${
                      isActive ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={18} />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="font-bold">{currentItem?.label}</h2>
          <button onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {currentView === "chat" && <Chat />}
          {currentView === "create-dealer" && <CreateDealer />}
          {currentView === "admin" && <AdminVisitsListing />}
          {currentView === "add-property" && <AddPropertyForm />}
          {currentView === "manage-properties" && <ManageProperties />}
          {currentView === "bulk-marketing" && <BulkMarketing />}
        </div>
      </div>
    </div>
  );
}
