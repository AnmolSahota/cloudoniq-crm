// src/pages/superadmin/FeatureAccess.jsx

import axios from "axios";
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader, PlanBadge } from "./SharedComponents";
import { BASE_URL } from "./config";

// Feature key → display config (icon + label)
const FEATURE_META = {
  property_listing: { label: "Property Listing", icon: "🏠" },
  email_support: { label: "Email Support", icon: "📧" },
  ai_chat_assistant: { label: "AI Chat Assistant", icon: "🤖" },
  bulk_marketing: { label: "Bulk Marketing", icon: "📣" },
  priority_support: { label: "Priority Support", icon: "⚡" },
  advanced_analytics: { label: "Advanced Analytics", icon: "📊" },
  custom_domain: { label: "Custom Domain", icon: "🌐" },
  api_access: { label: "API Access", icon: "🔌" },
};

const FeatureAccess = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});

  /* ── Fetch all plans on mount ──────────────────────────────────────── */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${BASE_URL}/subscriptions/plans`);
        setPlans(res.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setError("Failed to load feature access data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  /* ── Toggle a feature flag for a plan ─────────────────────────────── */
  const toggleFeature = async (planKey, featureKey, currentValue) => {
    const cellKey = `${planKey}__${featureKey}`;
    if (saving[cellKey]) return; // prevent double-click

    // Optimistic update
    setPlans((prev) =>
      prev.map((p) =>
        p.plan === planKey
          ? { ...p, features: { ...p.features, [featureKey]: !currentValue } }
          : p,
      ),
    );

    try {
      setSaving((s) => ({ ...s, [cellKey]: true }));
      await axios.patch(`${BASE_URL}/subscriptions/plans/${planKey}`, {
        [featureKey]: !currentValue,
      });
    } catch (err) {
      console.error("Failed to update feature:", err);
      // Revert on failure
      setPlans((prev) =>
        prev.map((p) =>
          p.plan === planKey
            ? { ...p, features: { ...p.features, [featureKey]: currentValue } }
            : p,
        ),
      );
    } finally {
      setSaving((s) => ({ ...s, [cellKey]: false }));
    }
  };

  // All feature keys (union across all plans, ordered by FEATURE_META)
  const featureKeys = Object.keys(FEATURE_META);

  /* ── Loading ───────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="Feature Access Control"
          description="Control which features are available per subscription plan"
        />
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading feature access…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="Feature Access Control"
          description="Control which features are available per subscription plan"
        />
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-semibold text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Feature Access Control"
        description="Control which features are available per subscription plan"
      />

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                  Feature
                </th>
                {plans.map((p) => (
                  <th
                    key={p.plan}
                    className="text-center px-5 py-4 font-semibold text-gray-600"
                  >
                    <PlanBadge plan={p.plan.toUpperCase()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {featureKeys.map((featureKey) => {
                const meta = FEATURE_META[featureKey];
                return (
                  <tr key={featureKey} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="font-medium text-gray-800">
                          {meta.label}
                        </span>
                      </div>
                    </td>
                    {plans.map((p) => {
                      const has = p.features?.[featureKey] ?? false;
                      const cellKey = `${p.plan}__${featureKey}`;
                      const isSaving = saving[cellKey];
                      return (
                        <td key={p.plan} className="px-5 py-4 text-center">
                          <button
                            onClick={() =>
                              toggleFeature(p.plan, featureKey, has)
                            }
                            disabled={isSaving}
                            title={
                              has ? `Remove from ${p.plan}` : `Add to ${p.plan}`
                            }
                            className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition ${
                              isSaving
                                ? "bg-gray-50 cursor-wait"
                                : has
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {isSaving ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-gray-400"
                              />
                            ) : has ? (
                              <Unlock size={16} />
                            ) : (
                              <Lock size={16} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <AlertTriangle size={12} />
        Changes here affect all dealers on the corresponding plan in real-time.
      </p>
    </div>
  );
};

export default FeatureAccess;
