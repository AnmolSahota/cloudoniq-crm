// src/pages/superadmin/DealerOverview.jsx

import axios from "axios";
import {
  Activity,
  Building2,
  CheckCircle,
  Crown,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DealerAvatar,
  PageHeader,
  PlanBadge,
  StatCard,
  StatusDot,
} from "./SharedComponents";
import { BASE_URL } from "./config";

/* ─── STATIC CONFIG (UI only) ────────────────────────────────────────────────── */
const PLAN_CONFIG = {
  BASIC: {
    color: "from-slate-600 to-slate-800",
    features: ["Up to 10 listings", "Basic analytics"],
  },
  PRO: {
    color: "from-indigo-500 to-violet-600",
    features: ["Unlimited listings", "Advanced analytics"],
  },
  ENTERPRISE: {
    color: "from-amber-400 to-orange-500",
    features: ["Custom domain", "Priority support"],
  },
};

/* ─── COMPONENT ──────────────────────────────────────────────────────────────── */
const DealerOverview = () => {
  const [dealers, setDealers] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // All three requests in parallel — no dealer_id = super admin view
        const [dealersRes, leadsRes, visitsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/auth/users`, { params: { role: "DEALER" } }),
          axios.get(`${BASE_URL}/leads/`), // all leads
          axios.get(`${BASE_URL}/admin/visits`, { params: { limit: 1 } }), // only need count
        ]);

        if (dealersRes.status === "fulfilled") {
          setDealers(dealersRes.value.data?.data ?? []);
        }
        if (leadsRes.status === "fulfilled") {
          setTotalLeads(leadsRes.value.data?.count ?? 0);
        }
        if (visitsRes.status === "fulfilled") {
          setTotalVisits(visitsRes.value.data?.count ?? 0);
        }
      } catch (err) {
        console.error("DealerOverview fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived stats from dealers ───────────────────────────────────────────
  const totalDealers = dealers.length;
  const activeDealers = dealers.filter((d) => d.is_active).length;

  const recentDealers = [...dealers]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const planCounts = {
    BASIC: dealers.filter((d) => (d.plan ?? "BASIC") === "BASIC").length,
    PRO: dealers.filter((d) => d.plan === "PRO").length,
    ENTERPRISE: dealers.filter((d) => d.plan === "ENTERPRISE").length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System Overview"
        description="Real-time platform statistics across all dealers"
      />

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Building2}
          label="Total Dealers"
          value={loading ? "—" : totalDealers}
          color="from-indigo-500 to-violet-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Dealers"
          value={loading ? "—" : activeDealers}
          color="from-emerald-500 to-green-600"
        />
        <StatCard
          icon={Activity}
          label="Total Leads"
          value={loading ? "—" : totalLeads.toLocaleString()}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={Eye}
          label="Total Visits"
          value={loading ? "—" : totalVisits.toLocaleString()}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Inactive Dealers"
          value={loading ? "—" : totalDealers - activeDealers}
          color="from-rose-500 to-red-600"
        />
      </div>

      {/* ── Plan Distribution ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(PLAN_CONFIG).map(([plan, cfg]) => (
          <div
            key={plan}
            className={`bg-gradient-to-br ${cfg.color} rounded-2xl p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <Crown size={22} className="opacity-80" />
              <span className="text-3xl font-black">
                {loading ? "—" : planCounts[plan]}
              </span>
            </div>
            <div className="font-bold text-lg">{plan}</div>
            <div className="text-white/70 text-xs mt-1">
              {cfg.features.slice(0, 2).join(" · ")}
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Dealers ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Dealers</h2>
          <span className="text-xs text-gray-400">Last 6 onboarded</span>
        </div>

        {loading ? (
          <div className="divide-y">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="h-5 bg-gray-100 rounded-lg w-16" />
                <div className="h-4 bg-gray-100 rounded-full w-14" />
              </div>
            ))}
          </div>
        ) : recentDealers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No dealers onboarded yet
          </div>
        ) : (
          <div className="divide-y">
            {recentDealers.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
              >
                <DealerAvatar name={d.dealer?.business_name ?? d.email} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm truncate">
                    {d.dealer?.business_name ?? "—"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {d.dealer?.city ?? "—"} · {d.name ?? d.email}
                  </div>
                </div>
                <PlanBadge plan={d.plan ?? "BASIC"} />
                <StatusDot status={d.is_active ? "ACTIVE" : "INACTIVE"} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerOverview;
