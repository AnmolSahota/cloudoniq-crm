// src/pages/DealerUserDashboard.jsx
// Dynamic dashboard for DEALER_USER role

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Target,
  Users,
  AlertTriangle,
  Phone,
  Building2,
  MapPin,
  Loader2,
  CheckSquare,
  StickyNote,
} from "lucide-react";
import { BASE_URL } from "./config";

/* ─── AUTH HELPERS ─────────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};

const getDealerId = () => {
  const authUser = getAuthUser();
  return authUser.role === "DEALER_USER"
    ? authUser.dealer_id || ""
    : authUser.id || "";
};

/* ─── HELPERS ───────────────────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const daysDiff = (dateStr) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const VISIT_STATUS_COLORS = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-gray-100 text-gray-500",
  "No Show": "bg-red-100 text-red-600",
  Interested: "bg-teal-100 text-teal-700",
  "Not Interested": "bg-orange-100 text-orange-600",
};

const STAGE_COLORS = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-indigo-100 text-indigo-700",
  Interested: "bg-violet-100 text-violet-700",
  "Site Visit": "bg-teal-100 text-teal-700",
  Negotiating: "bg-amber-100 text-amber-700",
  Closed: "bg-emerald-100 text-emerald-700",
  Lost: "bg-gray-100 text-gray-500",
};

const TYPE_ICONS = {
  Call: Phone,
  Meeting: Users,
  Visit: Building2,
  Other: StickyNote,
};

/* ─── STAT CARD ─────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
      >
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-black text-gray-900">{value}</p>
      )}
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────────── */
export default function DealerUserDashboard() {
  const authUser = getAuthUser();
  const firstName = authUser?.name?.split(" ")?.[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [leadsRes, visitsRes, tasksRes] = await Promise.all([
          // ✅ Leads assigned to this DEALER_USER
          axios.get(`${BASE_URL}/leads/`, {
            params: { dealer_id: getDealerId(), assigned_to: authUser.id },
          }),
          // ✅ Visits assigned to this DEALER_USER
          axios.get(`${BASE_URL}/admin/visits`, {
            params: { assigned_to: authUser.id },
          }),
          // ✅ Tasks assigned to this DEALER_USER
          axios.get(`${BASE_URL}/tasks/`, {
            params: { dealer_id: getDealerId(), assigned_to: authUser.id },
          }),
        ]);

        setLeads(leadsRes.data.data || []);
        setVisits(
          (visitsRes.data.data || []).map((v) => ({
            ...v,
            id: v.booking_id || v.id,
          })),
        );
        setTasks(tasksRes.data.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Derived stats ── */
  const totalLeads = leads.length;
  const totalVisits = visits.length;
  const pendingTasks = tasks.filter((t) => !t.done);
  const overdueTasks = pendingTasks.filter((t) => daysDiff(t.date) < 0);
  const todayTasks = pendingTasks.filter((t) => daysDiff(t.date) === 0);
  const closedLeads = leads.filter((l) => l.stage === "Closed").length;

  /* ── Upcoming visits (next 30 days, scheduled only) ── */
  const upcomingVisits = visits
    .filter((v) => {
      const d = new Date(v.date).getTime();
      return d >= Date.now() && v.status === "Scheduled";
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  /* ── Recent leads (last 5) ── */
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  /* ── Pending tasks sorted by date ── */
  const sortedPendingTasks = [...pendingTasks]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const stats = [
    {
      label: "My Leads",
      value: totalLeads,
      sub: closedLeads > 0 ? `${closedLeads} closed` : null,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Site Visits",
      value: totalVisits,
      sub:
        upcomingVisits.length > 0 ? `${upcomingVisits.length} upcoming` : null,
      icon: Home,
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      label: "Pending Tasks",
      value: pendingTasks.length,
      sub:
        overdueTasks.length > 0
          ? `${overdueTasks.length} overdue`
          : todayTasks.length > 0
            ? `${todayTasks.length} due today`
            : null,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Conversions",
      value: closedLeads,
      sub:
        totalLeads > 0
          ? `${Math.round((closedLeads / totalLeads) * 100)}% rate`
          : null,
      icon: Target,
      gradient: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Here's what's happening with your pipeline today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2 w-fit shadow-sm">
          <Calendar size={13} />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Overdue warning ── */}
      {!loading && overdueTasks.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">
            {overdueTasks.length} overdue task
            {overdueTasks.length > 1 ? "s" : ""} need your attention
          </span>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* ── Recent Leads ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={13} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">My Leads</h3>
            </div>
            <span className="text-xs text-gray-400">{totalLeads} total</span>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 animate-pulse"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
              <Users size={24} className="text-gray-300" />
              No leads assigned yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600">
                      {(lead.contact_name || "?")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lead.contact_name || "—"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {lead.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {lead.contact_phone}
                        </span>
                      )}
                      {lead.property_name && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 size={10} className="shrink-0" />
                          <span className="truncate">{lead.property_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STAGE_COLORS[lead.stage] || "bg-gray-100 text-gray-600"}`}
                  >
                    {lead.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-4">
          {/* ── Upcoming Visits ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                  <Home size={13} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Upcoming Visits
                </h3>
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-3 animate-pulse"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-xs gap-1">
                <Home size={20} className="text-gray-300" />
                No upcoming visits
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingVisits.map((v) => {
                  const name =
                    v.lead?.contact_name ||
                    v.contact_name ||
                    v.lead_name ||
                    "—";
                  const prop = v.property_name || v.lead?.property_name || null;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {name}
                        </p>
                        {prop && (
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                            <Building2 size={9} className="shrink-0" /> {prop}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gray-700">
                          {fmtDate(v.date)}
                        </p>
                        {v.time && (
                          <p className="text-xs text-gray-400">{v.time}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Pending Tasks ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Activity size={13} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Pending Tasks
                </h3>
              </div>
              {pendingTasks.length > 0 && (
                <span className="text-xs text-gray-400">
                  {pendingTasks.length} pending
                </span>
              )}
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-5 py-3 animate-pulse"
                  >
                    <div className="w-4 h-4 rounded bg-gray-200 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-xs gap-1">
                <CheckCircle2 size={20} className="text-emerald-300" />
                All caught up!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sortedPendingTasks.map((t) => {
                  const dLeft = daysDiff(t.date);
                  const isOverdue = dLeft < 0;
                  const isToday = dLeft === 0;
                  const TaskIcon = TYPE_ICONS[t.type] || CheckSquare;
                  const leadName = t.lead?.contact_name || "—";
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition"
                    >
                      <CheckCircle2
                        size={15}
                        className={`mt-0.5 shrink-0 ${isOverdue ? "text-red-300" : "text-gray-300"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TaskIcon
                            size={11}
                            className="text-gray-400 shrink-0"
                          />
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {t.type} · {leadName}
                          </p>
                        </div>
                        {t.note && (
                          <p className="text-xs text-gray-400 truncate">
                            {t.note}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} className="text-gray-400" />
                          <span
                            className={`text-xs font-semibold ${
                              isOverdue
                                ? "text-red-500"
                                : isToday
                                  ? "text-orange-500"
                                  : "text-gray-400"
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(dLeft)}d overdue`
                              : isToday
                                ? "Due today"
                                : fmtDate(t.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
