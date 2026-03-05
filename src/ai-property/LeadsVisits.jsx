// src/pages/superadmin/LeadsVisits.jsx

import axios from "axios";
import { Activity, Building2, Eye, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DealerAvatar,
  PageHeader,
  PlanBadge,
  StatCard,
} from "./SharedComponents";
import { BASE_URL } from "./config";

const LeadsVisits = () => {
  const [dealers, setDealers] = useState([]);
  const [leadsMap, setLeadsMap] = useState({});
  const [visitsMap, setVisitsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dealersRes, leadsRes, visitsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/auth/users`, { params: { role: "DEALER" } }),
          axios.get(`${BASE_URL}/leads/`),
          axios.get(`${BASE_URL}/admin/visits`, { params: { limit: 500 } }),
        ]);

        const rawDealers =
          dealersRes.status === "fulfilled"
            ? (dealersRes.value.data?.data ?? [])
            : [];

        const lMap = {};
        const vMap = {};

        if (leadsRes.status === "fulfilled") {
          for (const lead of leadsRes.value.data?.data ?? []) {
            if (lead.dealer_id)
              lMap[lead.dealer_id] = (lMap[lead.dealer_id] ?? 0) + 1;
          }
        }

        if (visitsRes.status === "fulfilled") {
          for (const visit of visitsRes.value.data?.data ?? []) {
            if (visit.dealer_id)
              vMap[visit.dealer_id] = (vMap[visit.dealer_id] ?? 0) + 1;
          }
        }

        setDealers(rawDealers);
        setLeadsMap(lMap);
        setVisitsMap(vMap);
      } catch (err) {
        console.error("LeadsVisits fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalLeads = Object.values(leadsMap).reduce((s, v) => s + v, 0);
  const totalVisits = Object.values(visitsMap).reduce((s, v) => s + v, 0);
  const avgConv =
    totalLeads > 0 ? ((totalVisits / totalLeads) * 100).toFixed(1) : "0.0";
  const activeCount = dealers.filter((d) => d.is_active).length;

  // Sort dealers by leads desc
  const sorted = [...dealers].sort(
    (a, b) => (leadsMap[b.id] ?? 0) - (leadsMap[a.id] ?? 0),
  );

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Leads & Visits Monitor"
        description="Platform-wide lead and visit data across all dealers"
      />

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total Leads"
          value={loading ? "—" : totalLeads.toLocaleString()}
          trend={12.3}
          color="from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={Eye}
          label="Total Visits"
          value={loading ? "—" : totalVisits.toLocaleString()}
          trend={8.7}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Conv. Rate"
          value={loading ? "—" : `${avgConv}%`}
          color="from-emerald-500 to-green-600"
        />
        <StatCard
          icon={Building2}
          label="Active Dealers"
          value={loading ? "—" : activeCount}
          color="from-amber-400 to-orange-500"
        />
      </div>

      {/* ── Breakdown Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b font-bold text-gray-800">
          Dealer Breakdown
        </div>

        {loading ? (
          <div className="divide-y">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 animate-pulse"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-12" />
                <div className="h-3 bg-gray-100 rounded w-12" />
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    "Dealer",
                    "City",
                    "Plan",
                    "Leads",
                    "Visits",
                    "Conv. Rate",
                    "Lead Share",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((d) => {
                  const leads = leadsMap[d.id] ?? 0;
                  const visits = visitsMap[d.id] ?? 0;
                  const conv =
                    leads > 0 ? ((visits / leads) * 100).toFixed(1) : "0.0";
                  const share =
                    totalLeads > 0
                      ? ((leads / totalLeads) * 100).toFixed(1)
                      : "0.0";
                  const name = d.dealer?.business_name ?? d.email;
                  const city = d.dealer?.city ?? "—";

                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DealerAvatar name={name} size="sm" />
                          <span className="font-medium text-gray-800">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{city}</td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={d.plan ?? "BASIC"} />
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-600">
                        {leads}
                      </td>
                      <td className="px-4 py-3 font-bold text-purple-600">
                        {visits}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${parseFloat(conv) > 15 ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {conv}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                              style={{
                                width: `${Math.min(parseFloat(share), 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      No dealer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsVisits;
