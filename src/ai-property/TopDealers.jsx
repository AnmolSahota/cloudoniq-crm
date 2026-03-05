// src/pages/superadmin/TopDealers.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import { DealerAvatar, PageHeader, PlanBadge } from "./SharedComponents";
import { BASE_URL } from "./config";

const MEDALS = ["🥇", "🥈", "🥉"];

const TopDealers = () => {
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
        console.error("TopDealers fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Sort by leads desc
  const ranked = [...dealers].sort(
    (a, b) => (leadsMap[b.id] ?? 0) - (leadsMap[a.id] ?? 0),
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="Top Performing Dealers"
          description="Ranked by total leads generated"
        />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border shadow-sm p-5 animate-pulse space-y-3"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border shadow-sm divide-y">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3 animate-pulse"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
              <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-5 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-10" />
              <div className="h-4 bg-gray-100 rounded w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Top Performing Dealers"
        description="Ranked by total leads generated"
      />

      {/* ── Podium ─────────────────────────────────────────────────────── */}
      {ranked.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No dealer data available
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {ranked.slice(0, 3).map((d, i) => {
            const name = d.dealer?.business_name ?? d.email;
            const city = d.dealer?.city ?? "—";
            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 text-center ${
                  i === 0
                    ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white"
                    : ""
                }`}
              >
                <div className="text-3xl mb-2">{MEDALS[i]}</div>
                <DealerAvatar name={name} size="lg" />
                <div className="mt-3 font-bold text-gray-900">{name}</div>
                <div className="text-xs text-gray-400 mb-3">{city}</div>
                <div className="text-3xl font-black text-indigo-600">
                  {leadsMap[d.id] ?? 0}
                </div>
                <div className="text-xs text-gray-500 mb-2">leads</div>
                <PlanBadge plan={d.plan ?? "BASIC"} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Leaderboard ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b font-bold text-gray-800">
          Full Leaderboard
        </div>
        <div className="divide-y">
          {ranked.map((d, i) => {
            const name = d.dealer?.business_name ?? d.email;
            const city = d.dealer?.city ?? "—";
            const admin = d.name ?? d.email; // admin name (top-level u.name)

            return (
              <div
                key={d.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition"
              >
                {/* Rank badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                    i < 3
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </div>

                <DealerAvatar name={name} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">
                    {name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {city} · {admin}
                  </div>
                </div>

                <PlanBadge plan={d.plan ?? "BASIC"} />

                <div className="text-right shrink-0">
                  <div className="font-black text-indigo-600">
                    {leadsMap[d.id] ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">leads</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-purple-600">
                    {visitsMap[d.id] ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">visits</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopDealers;
