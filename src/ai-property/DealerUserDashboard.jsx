// src/pages/DealerUserDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Activity,
  BarChart2,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Home,
  Phone,
  StickyNote,
  Target,
  Users,
  AlertTriangle,
} from "lucide-react";
import { BASE_URL } from "./config";
import {
  CALL_FEEDBACK_COLORS,
  CALL_FEEDBACK_OPTIONS,
  LEAD_STAGES,
  STAGE_COLORS,
} from "./mockData";

/* ─── Auth helpers ─────────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};
const getDealerId = () => {
  const u = getAuthUser();
  return u.role === "DEALER_USER" ? u.dealer_id || "" : u.id || "";
};

/* ─── Date helpers ─────────────────────────────────────────────────────────── */
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

const fmtRangeDate = (d) =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const daysDiff = (dateStr) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

/* ─── Feedback helpers ─────────────────────────────────────────────────────── */
const optionToKey = (o) => o.toLowerCase().replace(/\s+/g, "_");

const getLatestFeedback = (callFeedback) => {
  if (!Array.isArray(callFeedback) || callFeedback.length === 0)
    return "To Be Called";
  const last = callFeedback[callFeedback.length - 1];
  if (
    last &&
    typeof last === "object" &&
    typeof last.stage === "string" &&
    last.stage.trim()
  )
    return last.stage.trim();
  if (typeof last === "string" && last.trim()) return last.trim();
  return "To Be Called";
};

/* ─── Static config ────────────────────────────────────────────────────────── */
const STAGE_BADGE = {
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

const REPORT_PRESETS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const getPresetRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === "today")
    return { from: today, to: new Date(today.getTime() + 86399999) };
  if (key === "week") {
    const day = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { from: mon, to: sun };
  }
  if (key === "month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return null;
};

/* ─── Stat Card ────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
    <div
      className={
        "w-10 h-10 rounded-xl bg-gradient-to-br " +
        gradient +
        " flex items-center justify-center shadow-sm"
      }
    >
      <Icon size={18} className="text-white" />
    </div>
    <div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-black text-gray-900">{value}</p>
      )}
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
      {sub && (
        <p
          className={
            "text-xs mt-0.5 font-semibold " +
            (sub.includes("overdue") ? "text-red-500" : "text-gray-400")
          }
        >
          {sub}
        </p>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DealerUserDashboard() {
  const authUser = getAuthUser();
  const firstName = authUser?.name?.split(" ")?.[0] || "there";

  /* ── State ── */
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("feedback");
  const [reportPreset, setReportPreset] = useState("all");
  const [drilldown, setDrilldown] = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [leadsRes, visitsRes, tasksRes] = await Promise.all([
          axios.get(`${BASE_URL}/leads/`, {
            params: { dealer_id: getDealerId(), assigned_to: authUser.id },
          }),
          axios.get(`${BASE_URL}/admin/visits`, {
            params: { assigned_to: authUser.id },
          }),
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
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Derived basics ── */
  const totalLeads = leads.length;
  const totalVisits = visits.length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const overdueTasks = pendingTasks.filter((t) => daysDiff(t.date) < 0);
  const todayTasks = pendingTasks.filter((t) => daysDiff(t.date) === 0);
  const closedLeads = leads.filter((l) => l.stage === "Closed").length;

  const upcomingVisits = visits
    .filter(
      (v) =>
        new Date(v.date).getTime() >= Date.now() && v.status === "Scheduled",
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // ✅ Soonest due first
  const sortedPendingTasks = [...pendingTasks]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  /* ── Report date range ── */
  const reportDateRange = useMemo(
    () => getPresetRange(reportPreset),
    [reportPreset],
  );

  /* ── Feedback counts
      All time  → latest entry per lead (1 count per lead)
      Filtered  → latest entry within the range per lead (still 1 count per lead)
      ── */
  const feedbackCounts = useMemo(() => {
    const c = {};
    CALL_FEEDBACK_OPTIONS.forEach((o) => (c[optionToKey(o)] = 0));

    leads.forEach((l) => {
      if (!reportDateRange) {
        // All time — use the single latest entry for this lead
        const key = optionToKey(getLatestFeedback(l.call_feedback));
        if (c[key] !== undefined) c[key]++;
      } else {
        // Date filtered — find entries within range, take the LATEST one
        // Still 1 count per lead — shows where the lead's status ended up in that period
        if (!Array.isArray(l.call_feedback) || l.call_feedback.length === 0)
          return;

        const entriesInRange = l.call_feedback.filter((entry) => {
          if (!entry.datetime) return false;
          const dt = new Date(entry.datetime);
          return dt >= reportDateRange.from && dt <= reportDateRange.to;
        });

        // Lead had no activity in this period — skip
        if (entriesInRange.length === 0) return;

        // Latest entry in range = current status for this period
        const latestInRange = entriesInRange[entriesInRange.length - 1];
        const key = optionToKey(
          typeof latestInRange.stage === "string" && latestInRange.stage.trim()
            ? latestInRange.stage.trim()
            : "To Be Called",
        );
        if (c[key] !== undefined) c[key]++;
      }
    });

    return c;
  }, [leads, reportDateRange]);

  // Total active leads for the current filter period
  const filteredLeadCount = useMemo(() => {
    if (!reportDateRange) return totalLeads;
    return leads.filter(
      (l) =>
        Array.isArray(l.call_feedback) &&
        l.call_feedback.some((entry) => {
          if (!entry.datetime) return false;
          const dt = new Date(entry.datetime);
          return dt >= reportDateRange.from && dt <= reportDateRange.to;
        }),
    ).length;
  }, [leads, reportDateRange]);

  /* ── Stage counts — always all-time ── */
  const stageCounts = useMemo(() => {
    const c = {};
    LEAD_STAGES.forEach((s) => (c[s] = 0));
    leads.forEach((l) => {
      if (c[l.stage] !== undefined) c[l.stage]++;
    });
    return c;
  }, [leads]);

  /* ── Drilldown leads ── */
  const drilldownLeads = useMemo(() => {
    if (!drilldown) return [];
    if (drilldown.startsWith("f:")) {
      const key = drilldown.slice(2);
      if (!reportDateRange) {
        return leads.filter(
          (l) => optionToKey(getLatestFeedback(l.call_feedback)) === key,
        );
      }
      // Date filtered — leads whose latest-in-range entry matches this key
      return leads.filter((l) => {
        if (!Array.isArray(l.call_feedback)) return false;
        const inRange = l.call_feedback.filter((entry) => {
          if (!entry.datetime) return false;
          const dt = new Date(entry.datetime);
          return dt >= reportDateRange.from && dt <= reportDateRange.to;
        });
        if (inRange.length === 0) return false;
        const latest = inRange[inRange.length - 1];
        return optionToKey(latest.stage || "To Be Called") === key;
      });
    }
    if (drilldown.startsWith("s:")) {
      const stage = drilldown.slice(2);
      return leads.filter((l) => l.stage === stage);
    }
    return [];
  }, [leads, drilldown, reportDateRange]);

  /* ── Stat cards ── */
  const stats = [
    {
      label: "My Leads",
      value: totalLeads,
      sub: closedLeads > 0 ? closedLeads + " closed" : null,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Site Visits",
      value: totalVisits,
      sub:
        upcomingVisits.length > 0 ? upcomingVisits.length + " upcoming" : null,
      icon: Home,
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      label: "Pending Tasks",
      value: pendingTasks.length,
      sub:
        overdueTasks.length > 0
          ? overdueTasks.length + " overdue"
          : todayTasks.length > 0
            ? todayTasks.length + " due today"
            : null,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Conversions",
      value: closedLeads,
      sub:
        totalLeads > 0
          ? Math.round((closedLeads / totalLeads) * 100) + "% rate"
          : null,
      icon: Target,
      gradient: "from-emerald-500 to-green-600",
    },
  ];

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-4 md:p-6 space-y-5 min-h-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Hello, {firstName} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Here's your pipeline for today.
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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={12} className="text-white" />
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
                  className="flex items-center gap-3 px-5 py-3 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full w-14" />
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
              <Users size={22} className="text-gray-300" /> No leads assigned
              yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-500">
                      {(lead.contact_name || "?")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lead.contact_name || "—"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {lead.contact_phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone size={9} /> {lead.contact_phone}
                        </span>
                      )}
                      {lead.property_name && (
                        <span className="flex items-center gap-0.5 truncate">
                          <Building2 size={9} className="shrink-0" />
                          <span className="truncate">{lead.property_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 " +
                      (STAGE_BADGE[lead.stage] || "bg-gray-100 text-gray-600")
                    }
                  >
                    {lead.stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Upcoming Visits */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Home size={12} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">
                Upcoming Visits
              </h3>
            </div>
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-2.5 animate-pulse"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-10" />
                  </div>
                ))}
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-gray-400 text-xs gap-1">
                <Home size={18} className="text-gray-300" /> No upcoming visits
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
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {name}
                        </p>
                        {prop && (
                          <p className="text-xs text-gray-400 truncate">
                            {prop}
                          </p>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-600 shrink-0">
                        {fmtDate(v.date)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Activity size={12} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Pending Tasks
                </h3>
              </div>
              {pendingTasks.length > 0 && (
                <span className="text-xs text-gray-400">
                  {pendingTasks.length}
                </span>
              )}
            </div>
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-5 py-2.5 animate-pulse"
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
              <div className="flex flex-col items-center justify-center py-7 text-gray-400 text-xs gap-1">
                <CheckCircle2 size={18} className="text-emerald-300" /> All
                caught up!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sortedPendingTasks.map((t) => {
                  const dLeft = daysDiff(t.date);
                  const isOverdue = dLeft < 0;
                  const isToday = dLeft === 0;
                  const TaskIcon = TYPE_ICONS[t.type] || CheckSquare;
                  const leadName = t.lead?.contact_name || null;
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 px-5 py-2.5 hover:bg-gray-50 transition"
                    >
                      <CheckCircle2
                        size={14}
                        className={
                          "mt-0.5 shrink-0 " +
                          (isOverdue ? "text-red-300" : "text-gray-200")
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <TaskIcon
                            size={10}
                            className="text-gray-400 shrink-0"
                          />
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {t.type}
                            {leadName ? " · " + leadName : ""}
                          </p>
                        </div>
                        {t.note && (
                          <p className="text-xs text-gray-400 truncate">
                            {t.note}
                          </p>
                        )}
                        <span
                          className={
                            "text-[11px] font-semibold " +
                            (isOverdue
                              ? "text-red-500"
                              : isToday
                                ? "text-orange-500"
                                : "text-gray-400")
                          }
                        >
                          {isOverdue
                            ? Math.abs(dLeft) + "d overdue"
                            : isToday
                              ? "Due today"
                              : fmtDate(t.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          PIPELINE REPORT
         ══════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <BarChart2 size={12} className="text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Pipeline Report</h3>
            {!loading && totalLeads > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {totalLeads} leads
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date filter — only on Call Feedback tab */}
            {activeTab === "feedback" && (
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                {REPORT_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setReportPreset(p.key);
                      setDrilldown(null);
                    }}
                    className={
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition " +
                      (reportPreset === p.key
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700")
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {[
                { key: "feedback", label: "Call Feedback" },
                { key: "stage", label: "Lead Stages" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setDrilldown(null);
                    setReportPreset("all");
                  }}
                  className={
                    "px-3 py-1 rounded-md text-xs font-semibold transition " +
                    (activeTab === tab.key
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-5 space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-28 shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2" />
                <div className="h-3 bg-gray-100 rounded w-10 shrink-0" />
              </div>
            ))}
          </div>
        ) : totalLeads === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <BarChart2 size={22} className="text-gray-300" /> No leads yet
          </div>
        ) : (
          <div className="px-5 py-4">
            {/* ── Date range info bar — shown when a filter is active ── */}
            {activeTab === "feedback" &&
              reportPreset !== "all" &&
              (() => {
                const range = getPresetRange(reportPreset);
                return (
                  <div className="mb-3 flex items-center gap-2.5 flex-wrap">
                    {/* leads with activity count */}
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                      {filteredLeadCount} lead
                      {filteredLeadCount !== 1 ? "s" : ""} with activity
                    </span>
                    {/* date range */}
                    {range && (
                      <span className="text-xs text-gray-400 font-medium">
                        {fmtRangeDate(range.from)}
                        {reportPreset !== "today" &&
                          " — " + fmtRangeDate(range.to)}
                      </span>
                    )}
                  </div>
                );
              })()}

            {/* ── CALL FEEDBACK rows ── */}
            {activeTab === "feedback" && (
              <div className="space-y-1">
                {CALL_FEEDBACK_OPTIONS.map((option) => {
                  const key = optionToKey(option);
                  const count = feedbackCounts[key] ?? 0;
                  // For % — use filtered lead count when a date filter is active
                  const denominator =
                    reportPreset === "all"
                      ? totalLeads
                      : filteredLeadCount || 1;
                  const pct =
                    denominator > 0
                      ? Math.round((count / denominator) * 100)
                      : 0;
                  const colors = CALL_FEEDBACK_COLORS[option] || {
                    bg: "bg-gray-100",
                    text: "text-gray-400",
                    dot: "bg-gray-300",
                  };
                  const isActive = drilldown === "f:" + key;

                  return (
                    <button
                      key={key}
                      onClick={() =>
                        count > 0 && setDrilldown(isActive ? null : "f:" + key)
                      }
                      className={
                        "w-full flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all " +
                        (isActive
                          ? "bg-indigo-50 border border-indigo-100"
                          : count > 0
                            ? "hover:bg-gray-50 border border-transparent cursor-pointer"
                            : "border border-transparent cursor-default")
                      }
                    >
                      {/* Label */}
                      <span
                        className={
                          "text-xs font-semibold w-32 text-left shrink-0 truncate " +
                          colors.text
                        }
                      >
                        {option}
                      </span>

                      {/* Bar */}
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={
                            "h-2 rounded-full transition-all " +
                            (count === 0
                              ? "bg-transparent"
                              : colors.dot || "bg-gray-300")
                          }
                          style={{ width: pct + "%" }}
                        />
                      </div>

                      {/* Count + pct — always shown, 0 is informative */}
                      <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                        <span
                          className={
                            "text-xs font-black " +
                            (count === 0 ? "text-gray-300" : colors.text)
                          }
                        >
                          {count}
                        </span>
                        <span className="text-[11px] text-gray-400 w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── LEAD STAGES rows ── */}
            {activeTab === "stage" && (
              <div className="space-y-1">
                {LEAD_STAGES.map((stage) => {
                  const count = stageCounts[stage] ?? 0;
                  const pct =
                    totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                  const sc = STAGE_COLORS[stage] || {
                    bg: "bg-gray-100",
                    text: "text-gray-400",
                    dot: "bg-gray-300",
                  };
                  const isActive = drilldown === "s:" + stage;

                  return (
                    <button
                      key={stage}
                      onClick={() =>
                        count > 0 &&
                        setDrilldown(isActive ? null : "s:" + stage)
                      }
                      className={
                        "w-full flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all " +
                        (isActive
                          ? "bg-indigo-50 border border-indigo-100"
                          : count > 0
                            ? "hover:bg-gray-50 border border-transparent cursor-pointer"
                            : "border border-transparent cursor-default")
                      }
                    >
                      <span
                        className={
                          "text-xs font-semibold w-32 text-left shrink-0 truncate " +
                          sc.text
                        }
                      >
                        {stage}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={
                            "h-2 rounded-full transition-all " +
                            (count === 0
                              ? "bg-transparent"
                              : sc.dot || "bg-gray-300")
                          }
                          style={{ width: pct + "%" }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                        <span
                          className={
                            "text-xs font-black " +
                            (count === 0 ? "text-gray-300" : sc.text)
                          }
                        >
                          {count}
                        </span>
                        <span className="text-[11px] text-gray-400 w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Drilldown leads ── */}
            {drilldown && drilldownLeads.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-500">
                    {drilldownLeads.length} lead
                    {drilldownLeads.length > 1 ? "s" : ""} in this group
                  </span>
                  <button
                    onClick={() => setDrilldown(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    Clear ×
                  </button>
                </div>
                <div className="space-y-1.5">
                  {drilldownLeads.slice(0, 6).map((lead) => {
                    const fb = getLatestFeedback(lead.call_feedback);
                    const fbc = CALL_FEEDBACK_COLORS[fb] || {
                      bg: "bg-gray-100",
                      text: "text-gray-500",
                    };
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-500">
                            {(lead.contact_name || "?")[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {lead.contact_name || "—"}
                          </p>
                          {lead.contact_phone && (
                            <p className="text-[11px] text-gray-400">
                              {lead.contact_phone}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full " +
                              (STAGE_BADGE[lead.stage] ||
                                "bg-gray-100 text-gray-500")
                            }
                          >
                            {lead.stage}
                          </span>
                          <span
                            className={
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full " +
                              fbc.bg +
                              " " +
                              fbc.text
                            }
                          >
                            {fb}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {drilldownLeads.length > 6 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      +{drilldownLeads.length - 6} more — view all in Lead
                      Management
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
