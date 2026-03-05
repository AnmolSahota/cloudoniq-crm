// src/pages/SharedComponents.jsx
// Reusable UI primitives used across Dealer and Super Admin sections

import { ArrowUpRight, ArrowDownRight, CheckCircle } from "lucide-react";
import { PLAN_CONFIG, STAGE_COLORS } from "./mockData";

/* ── Plan Badge ──────────────────────────────────────────────────────────────── */
export const PlanBadge = ({ plan }) => (
  <span
    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${PLAN_CONFIG[plan]?.badge ?? "bg-gray-100 text-gray-600"}`}
  >
    {plan}
  </span>
);

/* ── Stage Badge ─────────────────────────────────────────────────────────────── */
export const StageBadge = ({ stage }) => {
  const c = STAGE_COLORS[stage] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {stage}
    </span>
  );
};

/* ── Status Dot ──────────────────────────────────────────────────────────────── */
export const StatusDot = ({ status }) => (
  <span
    className={`flex items-center gap-1.5 text-xs font-semibold ${status === "ACTIVE" ? "text-emerald-600" : "text-red-500"}`}
  >
    <span
      className={`w-2 h-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}
    />
    {status}
  </span>
);

/* ── Stat Card ───────────────────────────────────────────────────────────────── */
export const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = "from-blue-500 to-indigo-600",
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow`}
      >
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span
          className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}
        >
          {trend >= 0 ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-gray-900">{value}</div>
    <div className="text-sm font-medium text-gray-500 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

/* ── Page Header ─────────────────────────────────────────────────────────────── */
export const PageHeader = ({ title, description, action }) => (
  <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
    <div>
      <h1 className="text-2xl font-black text-gray-900">{title}</h1>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ── Avatar ──────────────────────────────────────────────────────────────────── */
export const Avatar = ({
  name,
  size = "md",
  gradient = "from-indigo-500 to-violet-600",
}) => {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  return (
    <div
      className={`${sizes[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0`}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
};

/* ── Empty State ─────────────────────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <Icon size={28} className="text-gray-400" />
    </div>
    <div className="font-bold text-gray-700 text-lg">{title}</div>
    {description && (
      <div className="text-sm text-gray-400 mt-1">{description}</div>
    )}
  </div>
);

/* ── Source Badge ────────────────────────────────────────────────────────────── */
const SOURCE_STYLES = {
  Chatbot: "bg-violet-100 text-violet-700",
  Website: "bg-blue-100 text-blue-700",
  Manual: "bg-gray-100 text-gray-700",
  Broadcast: "bg-orange-100 text-orange-700",
};
export const SourceBadge = ({ source }) => (
  <span
    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${SOURCE_STYLES[source] ?? "bg-gray-100 text-gray-600"}`}
  >
    {source}
  </span>
);

/* ── DealerAvatar (alias for Avatar, used in superadmin) ─────────────────────── */
export const DealerAvatar = ({ name, size = "md" }) => (
  <Avatar name={name} size={size} />
);
