// src/pages/dealer/PropertyAnalytics.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Building2,
  Users,
  Eye,
  CheckCircle,
  Loader2,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { PageHeader, StatCard, StageBadge } from "./SharedComponents";
import { BASE_URL } from "./config";

const getDealerId = () =>
  JSON.parse(localStorage.getItem("auth_user"))?.id || "";

const PropertyAnalytics = () => {
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dealerId = getDealerId();
        const [propsRes, leadsRes, visitsRes] = await Promise.all([
          axios.get(`${BASE_URL}/properties/list`, {
            params: { dealer_id: dealerId },
          }),
          axios.get(`${BASE_URL}/leads/`, { params: { dealer_id: dealerId } }),
          axios.get(`${BASE_URL}/admin/visits`, {
            params: { dealer_id: dealerId },
          }),
        ]);

        setProperties(propsRes.data.properties || []);
        setLeads(leadsRes.data.data || []);
        setVisits(visitsRes.data.data || []);
      } catch (err) {
        console.error("Property Analytics fetch error:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Property Stats Calculation ─────────────────────────────────────────────
  const propertyStats = useMemo(() => {
    return properties.map((prop) => {
      const propId = prop._id;
      const propLeads = leads.filter((l) => l.property_id === propId);
      const propVisits = visits.filter((v) => v.property_id === propId);
      const propClosed = propLeads.filter((l) => l.stage === "Closed");

      return {
        id: propId,
        name: prop.project_name || prop.name || "Unnamed Property",
        location: prop.location || "Location not specified",
        price: prop.price || 0,
        leads: propLeads.length,
        visits: propVisits.length,
        closed: propClosed.length,
        conversionRate:
          propLeads.length > 0
            ? ((propClosed.length / propLeads.length) * 100).toFixed(1)
            : "0.0",
        leadsData: propLeads, // Store actual leads for this property
      };
    });
  }, [properties, leads, visits]);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalLeads = useMemo(
    () => propertyStats.reduce((sum, p) => sum + p.leads, 0),
    [propertyStats],
  );

  const totalVisits = useMemo(
    () => propertyStats.reduce((sum, p) => sum + p.visits, 0),
    [propertyStats],
  );

  const totalClosed = useMemo(
    () => propertyStats.reduce((sum, p) => sum + p.closed, 0),
    [propertyStats],
  );

  // ── Best Performer ─────────────────────────────────────────────────────────
  const bestProperty = useMemo(() => {
    if (propertyStats.length === 0) return null;
    return [...propertyStats].sort((a, b) => b.closed - a.closed)[0];
  }, [propertyStats]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Property Analytics"
          description="Lead flow and conversion per property"
        />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Loading property analytics...</p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Property Analytics"
          description="Lead flow and conversion per property"
        />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-red-500 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (properties.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Property Analytics"
          description="Lead flow and conversion per property"
        />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Building2 size={48} className="text-gray-300" />
          <p className="text-gray-500 text-sm">No properties added yet</p>
          <p className="text-gray-400 text-xs">
            Add properties to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Property Analytics"
        description="Lead flow and conversion per property"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Properties"
          value={properties.length}
          color="from-indigo-500 to-violet-600"
        />
        <StatCard
          icon={Users}
          label="Total Leads"
          value={totalLeads}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={Eye}
          label="Total Visits"
          value={totalVisits}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Closed Deals"
          value={totalClosed}
          color="from-emerald-500 to-green-600"
        />
      </div>

      {/* Best performer */}
      {bestProperty && bestProperty.leads > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-sm font-semibold opacity-80 mb-1">
            ⭐ Top Performing Property
          </div>
          <div className="text-xl font-black">{bestProperty.name}</div>
          <div className="text-white/70 text-sm mt-0.5 flex items-center gap-1">
            <MapPin size={12} />
            {bestProperty.location}
          </div>
          <div className="flex gap-6 mt-3">
            <div>
              <div className="text-2xl font-black">{bestProperty.leads}</div>
              <div className="text-xs opacity-70">Leads</div>
            </div>
            <div>
              <div className="text-2xl font-black">{bestProperty.visits}</div>
              <div className="text-xs opacity-70">Visits</div>
            </div>
            <div>
              <div className="text-2xl font-black">{bestProperty.closed}</div>
              <div className="text-xs opacity-70">Closed</div>
            </div>
            <div>
              <div className="text-2xl font-black">
                {bestProperty.leads > 0
                  ? ((bestProperty.closed / bestProperty.leads) * 100).toFixed(
                      0,
                    )
                  : 0}
                %
              </div>
              <div className="text-xs opacity-70">Conv. Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* No best performer message */}
      {(!bestProperty || bestProperty.leads === 0) && (
        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-sm font-semibold opacity-80 mb-1">
            📊 Top Performing Property
          </div>
          <div className="text-lg font-bold">No leads generated yet</div>
          <div className="text-white/70 text-sm mt-0.5">
            Start adding leads to see top performer
          </div>
        </div>
      )}

      {/* Property cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {propertyStats.map((p) => {
          const conv = p.conversionRate;
          const leadsW = Math.min((p.leads / (totalLeads || 1)) * 100, 100);
          const visitsW = Math.min((p.visits / (totalVisits || 1)) * 100, 100);
          const isHighConv = parseFloat(conv) >= 10;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} />
                    {p.location}
                  </div>
                </div>
                {p.price > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Price</div>
                    <div className="font-bold text-indigo-600 text-sm">
                      ₹
                      {p.price >= 10000000
                        ? `${(p.price / 10000000).toFixed(2)}Cr`
                        : `${(p.price / 100000).toFixed(0)}L`}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Leads", value: p.leads, color: "text-blue-600" },
                  {
                    label: "Visits",
                    value: p.visits,
                    color: "text-purple-600",
                  },
                  {
                    label: "Closed",
                    value: p.closed,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Conv.",
                    value: `${conv}%`,
                    color: isHighConv ? "text-emerald-600" : "text-amber-600",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="text-center bg-gray-50 rounded-xl p-2"
                  >
                    <div className={`font-black text-lg ${color}`}>{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Lead share</span>
                    <span>{leadsW.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${leadsW}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Visit share</span>
                    <span>{visitsW.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                      style={{ width: `${visitsW}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Leads in pipeline for this property */}
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-400 mb-1.5">
                  Leads in pipeline ({p.leadsData.length})
                </div>
                {p.leadsData.length === 0 ? (
                  <div className="text-xs text-gray-300">
                    No leads for this property
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {p.leadsData.slice(0, 5).map((lead) => (
                      <span
                        key={lead.id}
                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                      >
                        {lead.contact_name || lead.name || "Unknown"}
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            lead.stage === "Closed"
                              ? "bg-emerald-500"
                              : lead.stage === "Lost"
                                ? "bg-red-500"
                                : lead.stage === "New"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                          }`}
                        />
                      </span>
                    ))}
                    {p.leadsData.length > 5 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                        +{p.leadsData.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Conversion Summary */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-600" />
          Conversion Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-2xl font-black text-blue-600">
              {totalLeads}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Leads</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-black text-purple-600">
              {totalVisits}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Visits</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-black text-emerald-600">
              {totalClosed}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Closed</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-2xl font-black text-amber-600">
              {totalLeads > 0
                ? ((totalClosed / totalLeads) * 100).toFixed(1)
                : "0.0"}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">Overall Conv. Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalytics;
