// src/pages/dealer/DealerDashboard.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  TrendingUp,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { PageHeader, StageBadge, StatCard } from "./SharedComponents";
import { STAGE_COLORS } from "./mockData";
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
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
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

  // ── Computed Stats ─────────────────────────────────────────────────────────
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
        {/* Pipeline */}
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

        {/* Recent Leads */}
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

      {/* Property Summary */}
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
    </div>
  );
};

export default DealerDashboard;
