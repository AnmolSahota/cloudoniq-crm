// src/pages/dealer/DealerDashboard.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Globe,
  TrendingUp,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { PageHeader, StageBadge, StatCard } from "./SharedComponents";
import {
  STAGE_COLORS,
  CALL_FEEDBACK_OPTIONS,
  CALL_FEEDBACK_COLORS,
} from "./mockData";
import { BASE_URL } from "./config";

const getDealerId = () =>
  JSON.parse(localStorage.getItem("auth_user"))?.id || "";

// ── Read dealer info from localStorage (set on login) ────────────────────────
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

// ── Website base URL from env ─────────────────────────────────────────────────
const SITE_BASE_URL =
  process.env.REACT_APP_SITE_BASE_URL || "https://propertyai.in";

// ── Derive FEEDBACK_COLS dynamically from mockData constants ──────────────────
// Key = option label lowercased + spaces replaced with underscore
// e.g. "Not Interested" → "not_interested", "Visit Scheduled" → "visit_scheduled"
const optionToKey = (option) => option.toLowerCase().replace(/\s+/g, "_");

const FEEDBACK_COLS = CALL_FEEDBACK_OPTIONS.map((option) => ({
  key: optionToKey(option),
  label: option,
  color: CALL_FEEDBACK_COLORS[option]?.text || "text-gray-500",
}));

// ── Excel download — fully dynamic, driven by FEEDBACK_COLS ──────────────────
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

/* ─── PUBLIC WEBSITE CARD ────────────────────────────────────────────────────── */
const WebsiteCard = ({ businessName, slug, city }) => {
  const [copied, setCopied] = useState(false);
  const websiteUrl = slug ? `${SITE_BASE_URL}/${slug}` : null;

  const handleCopy = () => {
    if (!websiteUrl) return;
    navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Globe size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-0.5">
              Your Public Website
            </p>
            <p className="font-bold text-base truncate">{businessName}</p>
            {city && <p className="text-white/60 text-xs mt-0.5">{city}</p>}
          </div>
        </div>
        {websiteUrl && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              title="Copy link"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open website"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-indigo-600 hover:bg-white/90 text-xs font-semibold transition"
            >
              <ExternalLink size={13} />
              Visit
            </a>
          </div>
        )}
      </div>
      {websiteUrl ? (
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5">
          <span className="text-sm font-mono text-white/90 truncate">
            {websiteUrl}
          </span>
        </div>
      ) : (
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 text-white/50 text-sm">
          No slug configured — contact support to set up your website.
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

  // ── Call Feedback report — computed from real leads, grouped by assigned user
  // Each lead has: assigned_to, assigned_name, call_feedback
  // Unassigned leads are excluded — no user to attribute to
  const userFeedbackReport = useMemo(() => {
    const userMap = {};

    leads.forEach((lead) => {
      if (!lead.assigned_to) return; // skip unassigned

      const key = lead.assigned_to;

      if (!userMap[key]) {
        userMap[key] = {
          user_name: lead.assigned_name || "Unknown",
          assigned: 0,
        };
        // Init all feedback option keys to 0
        FEEDBACK_COLS.forEach((col) => {
          userMap[key][col.key] = 0;
        });
      }

      userMap[key].assigned += 1;

      // Map call_feedback label → snake_case key
      // Falls back to "assign" if null/missing (default DB value is "Assign")
      const feedbackKey = lead.call_feedback
        ? optionToKey(lead.call_feedback)
        : "assign";

      if (userMap[key][feedbackKey] !== undefined) {
        userMap[key][feedbackKey] += 1;
      }
    });

    // Sort by total assigned descending
    return Object.values(userMap).sort((a, b) => b.assigned - a.assigned);
  }, [leads]);

  // ── Feedback totals row — sum across all users ──────────────────────────────
  const feedbackTotals = useMemo(() => {
    const totals = { assigned: 0 };
    FEEDBACK_COLS.forEach((c) => (totals[c.key] = 0));
    userFeedbackReport.forEach((row) => {
      totals.assigned += row.assigned;
      FEEDBACK_COLS.forEach((c) => (totals[c.key] += row[c.key] ?? 0));
    });
    return totals;
  }, [userFeedbackReport]);

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

      {/* ── Public Website Card ────────────────────────────────────── */}
      {/* <WebsiteCard
        businessName={dealerInfo.businessName}
        slug={dealerInfo.slug}
        city={dealerInfo.city}
      /> */}

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
        {/* ── Lead Pipeline ───────────────────────────────────────── */}
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

        {/* ── Recent Leads ────────────────────────────────────────── */}
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
        <div className="p-5 border-b flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-800">Call Feedback Overview</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Per team member breakdown of call outcomes
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

        {userFeedbackReport.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No assigned lead data available yet
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
                    Total Assigned
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
                    {/* Team member */}
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

                    {/* Total assigned */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-600">
                        {row.assigned}
                      </span>
                    </td>

                    {/* Per feedback counts — badge styled from CALL_FEEDBACK_COLORS */}
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
                            {row.assigned > 0 && (
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

              {/* ✅ Totals footer row */}
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
                          {feedbackTotals.assigned > 0 && (
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
