// src/pages/dealer/DealerDashboard.jsx

import axios from "axios";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronDown,
  Download,
  Loader2,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { PageHeader, StageBadge, StatCard } from "./SharedComponents";
import { BASE_URL } from "./config";
import {
  CALL_FEEDBACK_COLORS,
  CALL_FEEDBACK_OPTIONS,
  STAGE_COLORS,
} from "./mockData";

const getDealerId = () => {
  const user = JSON.parse(localStorage.getItem("auth_user")) || {};
  // ✅ DEALER → their own id; DEALER_USER should not land on this dashboard
  return user.dealer_id || user.id || "";
};

const getDealerInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem("auth_user")) || {};
    return {
      businessName: user.dealer?.business_name ?? user.email ?? "—",
      slug: user.dealer?.slug ?? null,
      city: user.dealer?.city ?? null,
      logoUrl: user.dealer?.logo_url ?? null,
    };
  } catch {
    return { businessName: "—", slug: null, city: null, logoUrl: null };
  }
};

const SITE_BASE_URL =
  process.env.REACT_APP_SITE_BASE_URL || "https://propertyai.in";

// ── Feedback column config ────────────────────────────────────────────────────
const optionToKey = (option) => option.toLowerCase().replace(/\s+/g, "_");

const FEEDBACK_COLS = CALL_FEEDBACK_OPTIONS.map((option) => ({
  key: optionToKey(option),
  label: option,
  color: CALL_FEEDBACK_COLORS[option]?.text || "text-gray-500",
}));

// ── Date filter presets ───────────────────────────────────────────────────────
const FILTER_PRESETS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const getPresetRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (key === "today") {
    return { from: today, to: new Date(today.getTime() + 86399999) };
  }
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
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { from, to };
  }
  return null; // "all" and "custom" return null — no range filter
};

const fmtDisplay = (d) =>
  d
    ? d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

// ── Excel download ────────────────────────────────────────────────────────────
const downloadFeedbackReport = (data) => {
  const rows = data.map((row) => {
    const out = {
      "Team Member": row.user_name,
      "Total Assigned": row.assigned,
    };
    FEEDBACK_COLS.forEach((col) => {
      out[col.label] = row[col.key] ?? 0;
    });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 20 },
    { wch: 16 },
    ...FEEDBACK_COLS.map(() => ({ wch: 14 })),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Call Feedback Report");
  XLSX.writeFile(wb, "call_feedback_report.xlsx");
};

/* ─── DATE FILTER BAR ────────────────────────────────────────────────────────── */
const FeedbackDateFilter = ({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [localFrom, setLocalFrom] = useState(customFrom || "");
  const [localTo, setLocalTo] = useState(customTo || "");
  const ref = useRef(null);

  // close custom popover on outside click
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowCustom(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleApply = () => {
    if (localFrom && localTo) {
      onCustomChange(localFrom, localTo);
      setShowCustom(false);
    }
  };

  const handlePreset = (key) => {
    if (key === "custom") {
      setShowCustom((v) => !v);
      onPresetChange("custom");
    } else {
      setShowCustom(false);
      onPresetChange(key);
    }
  };

  const range =
    preset !== "all" && preset !== "custom" ? getPresetRange(preset) : null;

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      {/* Preset pills */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {FILTER_PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              preset === p.key
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.key === "custom" ? (
              <span className="flex items-center gap-1">
                {p.label} <ChevronDown size={11} />
              </span>
            ) : (
              p.label
            )}
          </button>
        ))}
      </div>

      {/* Active range pill */}
      {range && (
        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
          {fmtDisplay(range.from)} – {fmtDisplay(range.to)}
        </span>
      )}
      {preset === "custom" && customFrom && customTo && (
        <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
          {fmtDisplay(new Date(customFrom))} – {fmtDisplay(new Date(customTo))}
          <button
            onClick={() => {
              onPresetChange("all");
              onCustomChange("", "");
            }}
            className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition"
          >
            <X size={11} />
          </button>
        </span>
      )}

      {/* Custom date popover */}
      {showCustom && (
        <div
          className="absolute z-50 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 w-72"
          style={{ top: "100%", left: 0 }}
        >
          <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Custom Date Range
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1 block">
                From
              </label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1 block">
                To
              </label>
              <input
                type="date"
                value={localTo}
                min={localFrom}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!localFrom || !localTo}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────────── */
const DealerDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Feedback filter state ──────────────────────────────────────────────────
  const [feedbackPreset, setFeedbackPreset] = useState("all");
  const [feedbackCustomFrom, setFeedbackCustomFrom] = useState("");
  const [feedbackCustomTo, setFeedbackCustomTo] = useState("");

  const dealerInfo = getDealerInfo();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dealerId = getDealerId();
        const [leadsRes, visitsRes, tasksRes, propsRes] = await Promise.all([
          axios.get(`${BASE_URL}/leads/`, { params: { dealer_id: dealerId } }),
          axios.get(`${BASE_URL}/admin/visits`, {
            params: { dealer_id: dealerId },
          }),
          axios.get(`${BASE_URL}/tasks/`, { params: { dealer_id: dealerId } }),
          axios.get(`${BASE_URL}/properties/list`, {
            params: { dealer_id: dealerId },
          }),
        ]);
        setLeads(leadsRes.data.data || []);
        setVisits(visitsRes.data.data || []);
        setTasks(tasksRes.data.data || []);
        setProperties(propsRes.data.properties || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.stage === "New").length;
  const closedLeads = leads.filter((l) => l.stage === "Closed").length;
  const lostLeads = leads.filter((l) => l.stage === "Lost").length;
  const scheduledVisits = visits.filter((v) => v.status === "Scheduled").length;
  const completedVisits = visits.filter((v) =>
    ["Completed", "Interested"].includes(v.status),
  ).length;
  const conversionRate =
    totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0.0";
  const pendingTasks = tasks.filter((t) => !t.done).length;

  const stageCounts = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      counts[l.stage] = (counts[l.stage] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [leads],
  );

  const propertyStats = useMemo(
    () =>
      properties
        .map((prop) => {
          const propId = prop._id;
          const propLeads = leads.filter(
            (l) => l.property_id === propId,
          ).length;
          const propVisits = visits.filter(
            (v) => v.property_id === propId,
          ).length;
          const propClosed = leads.filter(
            (l) => l.property_id === propId && l.stage === "Closed",
          ).length;
          const convRate =
            propLeads > 0 ? ((propClosed / propLeads) * 100).toFixed(1) : "0.0";
          return {
            id: propId,
            name: prop.project_name,
            location: prop.location,
            leads: propLeads,
            visits: propVisits,
            closed: propClosed,
            conversionRate: convRate,
          };
        })
        .sort((a, b) => b.leads - a.leads),
    [properties, leads, visits],
  );

  // ── Feedback date range resolver ───────────────────────────────────────────
  const feedbackDateRange = useMemo(() => {
    if (feedbackPreset === "custom" && feedbackCustomFrom && feedbackCustomTo) {
      return {
        from: new Date(feedbackCustomFrom),
        to: new Date(feedbackCustomTo + "T23:59:59.999"),
      };
    }
    if (feedbackPreset !== "all" && feedbackPreset !== "custom") {
      return getPresetRange(feedbackPreset);
    }
    return null; // all time — no filter
  }, [feedbackPreset, feedbackCustomFrom, feedbackCustomTo]);

  // ── Helper: get latest feedback entry that falls within date range ──────────
  const getFilteredLatestFeedback = (callFeedback) => {
    if (!Array.isArray(callFeedback) || callFeedback.length === 0)
      return "To Be Called";

    if (!feedbackDateRange) {
      const last = callFeedback[callFeedback.length - 1];
      // ✅ guard — stage must be a non-empty string
      return last && typeof last.stage === "string" && last.stage.trim()
        ? last.stage.trim()
        : "To Be Called";
    }

    const inRange = [...callFeedback].reverse().find((entry) => {
      if (!entry.datetime) return false;
      const dt = new Date(entry.datetime);
      return dt >= feedbackDateRange.from && dt <= feedbackDateRange.to;
    });

    // ✅ guard — ensure inRange.stage is a string before returning
    if (!inRange) return null;
    return typeof inRange.stage === "string" && inRange.stage.trim()
      ? inRange.stage.trim()
      : null;
  };

  // ── Call Feedback report — grouped by assigned user, filtered by date ───────
  const userFeedbackReport = useMemo(() => {
    const userMap = {};

    leads.forEach((lead) => {
      if (!lead.assigned_to) return;

      const latestStage = getFilteredLatestFeedback(lead.call_feedback);
      if (latestStage === null) return;

      // ✅ guard — skip if stage is not a usable string
      if (typeof latestStage !== "string" || !latestStage.trim()) return;

      const key = lead.assigned_to;

      if (!userMap[key]) {
        userMap[key] = {
          user_name: lead.assigned_name || "Unknown",
          assigned: 0,
        };
        FEEDBACK_COLS.forEach((col) => {
          userMap[key][col.key] = 0;
        });
      }

      userMap[key].assigned += 1;

      // ✅ guard — convert to key safely
      const feedbackKey = optionToKey(latestStage.trim());
      if (userMap[key][feedbackKey] !== undefined) {
        userMap[key][feedbackKey] += 1;
      }
    });

    return Object.values(userMap).sort((a, b) => b.assigned - a.assigned);
  }, [leads, feedbackDateRange]);

  // ── Feedback totals ──────────────────────────────────────────────────────────
  const feedbackTotals = useMemo(() => {
    const totals = { assigned: 0 };
    FEEDBACK_COLS.forEach((c) => (totals[c.key] = 0));
    userFeedbackReport.forEach((row) => {
      totals.assigned += row.assigned;
      FEEDBACK_COLS.forEach((c) => (totals[c.key] += row[c.key] ?? 0));
    });
    return totals;
  }, [userFeedbackReport]);

  // ── Active filter label for display ──────────────────────────────────────────
  const activeFilterLabel = useMemo(() => {
    if (feedbackPreset === "all") return "All Time";
    if (feedbackPreset === "custom" && feedbackCustomFrom && feedbackCustomTo)
      return `${fmtDisplay(new Date(feedbackCustomFrom))} – ${fmtDisplay(new Date(feedbackCustomTo))}`;
    return (
      FILTER_PRESETS.find((p) => p.key === feedbackPreset)?.label || "All Time"
    );
  }, [feedbackPreset, feedbackCustomFrom, feedbackCustomTo]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Dealer Dashboard"
          description="Your sales performance at a glance"
        />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dealer Dashboard"
        description="Your sales performance at a glance"
      />

      {/* ── KPI Row 1 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={totalLeads}
          color="from-indigo-500 to-violet-600"
        />
        <StatCard
          icon={Activity}
          label="New Leads"
          value={newLeads}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={Calendar}
          label="Visits Scheduled"
          value={scheduledVisits}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Closed Deals"
          value={closedLeads}
          color="from-emerald-500 to-green-600"
        />
      </div>

      {/* ── KPI Row 2 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Completed Visits"
          value={completedVisits}
          color="from-teal-500 to-emerald-600"
        />
        <StatCard
          icon={XCircle}
          label="Lost Deals"
          value={lostLeads}
          color="from-red-500 to-rose-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          color="from-amber-400 to-orange-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Follow-ups"
          value={pendingTasks}
          color="from-rose-400 to-red-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Lead Pipeline ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Lead Pipeline</h2>
          {Object.keys(stageCounts).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No leads yet
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageCounts).map(([stage, count]) => {
                const c = STAGE_COLORS[stage] || { dot: "bg-gray-400" };
                const pct =
                  totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{stage}</span>
                      <span className="font-bold text-gray-900">
                        {count}{" "}
                        <span className="text-gray-400 font-normal">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${c.dot || "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Leads ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Recent Leads</h2>
            <span className="text-xs text-gray-400">Latest activity</span>
          </div>
          <div className="divide-y">
            {recentLeads.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No leads yet
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(lead.contact_name || lead.name || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">
                      {lead.contact_name || lead.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {lead.property_name || "No property"}
                      {lead.property_location && (
                        <span className="text-gray-300">
                          {" "}
                          • {lead.property_location}
                        </span>
                      )}
                    </div>
                  </div>
                  <StageBadge stage={lead.stage} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Property Performance Summary ───────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b font-bold text-gray-800">
          Property Performance Summary
        </div>
        {propertyStats.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No properties added yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Property", "Leads", "Visits", "Closed", "Conv. Rate"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {propertyStats.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.location}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {p.leads}
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600">
                      {p.visits}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {p.closed}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          parseFloat(p.conversionRate) >= 10
                            ? "text-emerald-600"
                            : parseFloat(p.conversionRate) > 0
                              ? "text-amber-600"
                              : "text-gray-400"
                        }`}
                      >
                        {p.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Call Feedback Overview ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm">
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-800">
                Call Feedback Overview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Per team member breakdown of call outcomes
                {feedbackPreset !== "all" && (
                  <span className="ml-1 text-indigo-500 font-semibold">
                    · {activeFilterLabel}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => downloadFeedbackReport(userFeedbackReport)}
              disabled={userFeedbackReport.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export Excel
            </button>
          </div>

          {/* ── Date filter bar — relative positioned wrapper ──────── */}
          <div className="mt-4 relative">
            <FeedbackDateFilter
              preset={feedbackPreset}
              onPresetChange={(key) => {
                setFeedbackPreset(key);
                if (key !== "custom") {
                  setFeedbackCustomFrom("");
                  setFeedbackCustomTo("");
                }
              }}
              customFrom={feedbackCustomFrom}
              customTo={feedbackCustomTo}
              onCustomChange={(from, to) => {
                setFeedbackCustomFrom(from);
                setFeedbackCustomTo(to);
              }}
            />
          </div>
        </div>

        {/* Table */}
        {userFeedbackReport.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-semibold">
              No data for this period
            </p>
            <p className="text-gray-400 text-xs">
              {feedbackPreset !== "all"
                ? "Try a different date range or switch to All Time"
                : "No assigned lead data available yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Team Member
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Total
                  </th>
                  {FEEDBACK_COLS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {userFeedbackReport.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(row.user_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 whitespace-nowrap">
                          {row.user_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-600">
                        {row.assigned}
                      </span>
                    </td>
                    {FEEDBACK_COLS.map((col) => {
                      const colors = CALL_FEEDBACK_COLORS[col.label] || {
                        bg: "bg-gray-100",
                        text: "text-gray-500",
                      };
                      const count = row[col.key] ?? 0;
                      return (
                        <td key={col.key} className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text}`}
                            >
                              {count}
                            </span>
                            {row.assigned > 0 && count > 0 && (
                              <span className="text-[10px] text-gray-300">
                                {((count / row.assigned) * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Totals footer */}
              <tfoot className="border-t-2 border-gray-200 bg-gray-50/80">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Total
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-indigo-600">
                      {feedbackTotals.assigned}
                    </span>
                  </td>
                  {FEEDBACK_COLS.map((col) => {
                    const colors = CALL_FEEDBACK_COLORS[col.label] || {
                      bg: "bg-gray-100",
                      text: "text-gray-500",
                    };
                    const count = feedbackTotals[col.key] ?? 0;
                    return (
                      <td key={col.key} className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text}`}
                          >
                            {count}
                          </span>
                          {feedbackTotals.assigned > 0 && count > 0 && (
                            <span className="text-[10px] text-gray-300">
                              {(
                                (count / feedbackTotals.assigned) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerDashboard;
