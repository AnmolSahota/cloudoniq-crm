// src/pages/dealer/SalesTargets.jsx
// Sales Targets — day-wise targets + team progress
// Static data only — backend to be wired later

import { useState } from "react";
import {
  Phone,
  Building2,
  TrendingUp,
  Target,
  ChevronDown,
  Check,
  Users,
  Calendar,
  Award,
  Flame,
  BarChart3,
  Edit3,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";

/* ─── STATIC DATA ────────────────────────────────────────────────────────── */

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const DAY_FULL = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_TARGETS = {
  monday: { calls: 20, visits: 5, closed: 2 },
  tuesday: { calls: 20, visits: 5, closed: 2 },
  wednesday: { calls: 20, visits: 5, closed: 2 },
  thursday: { calls: 20, visits: 5, closed: 2 },
  friday: { calls: 20, visits: 5, closed: 2 },
  saturday: { calls: 30, visits: 8, closed: 3 },
  sunday: { calls: 30, visits: 8, closed: 3 },
};

// Today's day name
const getTodayName = () =>
  [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][new Date().getDay()];

// Static team members with performance data
const STATIC_TEAM = [
  {
    id: "u1",
    name: "Rahul Sharma",
    avatar: "R",
    color: "from-indigo-500 to-violet-600",
    today: { calls: 16, visits: 3, closed: 1 },
    thisWeek: { calls: 88, visits: 21, closed: 7 },
    thisMonth: { calls: 312, visits: 74, closed: 24 },
  },
  {
    id: "u2",
    name: "Priya Mehta",
    avatar: "P",
    color: "from-pink-500 to-rose-600",
    today: { calls: 22, visits: 6, closed: 2 },
    thisWeek: { calls: 110, visits: 32, closed: 11 },
    thisMonth: { calls: 401, visits: 98, closed: 33 },
  },
  {
    id: "u3",
    name: "Arjun Patel",
    avatar: "A",
    color: "from-emerald-500 to-teal-600",
    today: { calls: 8, visits: 1, closed: 0 },
    thisWeek: { calls: 52, visits: 12, closed: 3 },
    thisMonth: { calls: 198, visits: 41, closed: 9 },
  },
  {
    id: "u4",
    name: "Sneha Gupta",
    avatar: "S",
    color: "from-amber-500 to-orange-600",
    today: { calls: 20, visits: 5, closed: 2 },
    thisWeek: { calls: 98, visits: 28, closed: 9 },
    thisMonth: { calls: 356, visits: 88, closed: 28 },
  },
  {
    id: "u5",
    name: "Vikram Singh",
    avatar: "V",
    color: "from-cyan-500 to-blue-600",
    today: { calls: 12, visits: 2, closed: 1 },
    thisWeek: { calls: 71, visits: 18, closed: 5 },
    thisMonth: { calls: 245, visits: 59, closed: 16 },
  },
];

// Period target multipliers (week = 6 working days, month = 26 working days approx)
const PERIOD_MULTIPLIERS = {
  today: 1,
  thisWeek: 6,
  thisMonth: 26,
};

const PERIOD_LABELS = {
  today: "Today",
  thisWeek: "This Week",
  thisMonth: "This Month",
};

const METRICS = [
  { key: "calls", label: "Calls", icon: Phone, color: "indigo" },
  { key: "visits", label: "Visits", icon: Building2, color: "violet" },
  { key: "closed", label: "Closed", icon: TrendingUp, color: "emerald" },
];

const COLOR_MAP = {
  indigo: {
    bar: "bg-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
    light: "bg-indigo-100",
  },
  violet: {
    bar: "bg-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-200",
    light: "bg-violet-100",
  },
  emerald: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    light: "bg-emerald-100",
  },
};

/* ─── PROGRESS BAR ───────────────────────────────────────────────────────── */
const ProgressBar = ({ value, target, color }) => {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const done = value >= target;
  const c = COLOR_MAP[color];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold ${done ? c.text : "text-gray-700"}`}>
          {value}
          <span className="text-gray-400 font-normal"> / {target}</span>
        </span>
        {done && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-bold ${c.text}`}
          >
            <Check size={10} strokeWidth={3} /> Done
          </span>
        )}
        {!done && (
          <span className="text-[10px] text-gray-400 font-medium">
            {Math.round(pct)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? c.bar : c.bar} opacity-${done ? "100" : "70"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/* ─── USER PROGRESS CARD ─────────────────────────────────────────────────── */
const UserProgressCard = ({ member, period, targets }) => {
  const todayName = getTodayName();
  const dayTarget = targets[todayName];
  const multiplier = PERIOD_MULTIPLIERS[period];
  const perf = member[period];

  const totalTarget = {
    calls: dayTarget.calls * multiplier,
    visits: dayTarget.visits * multiplier,
    closed: dayTarget.closed * multiplier,
  };

  // Overall score
  const totalPossible =
    totalTarget.calls + totalTarget.visits + totalTarget.closed;
  const totalAchieved = perf.calls + perf.visits + perf.closed;
  const overallPct =
    totalPossible > 0
      ? Math.min((totalAchieved / totalPossible) * 100, 100)
      : 0;

  const allDone = METRICS.every((m) => perf[m.key] >= totalTarget[m.key]);
  const isOnFire = overallPct >= 80;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${allDone ? "border-emerald-200 ring-1 ring-emerald-100" : "border-gray-100"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-black text-base shrink-0`}
        >
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 truncate">
              {member.name}
            </span>
            {isOnFire && (
              <Flame size={14} className="text-orange-500 shrink-0" />
            )}
            {allDone && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">
                <Award size={10} /> All done
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Overall {Math.round(overallPct)}% achieved
          </div>
        </div>
        {/* Mini donut-style indicator */}
        <div className="shrink-0 w-10 h-10 relative flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={
                allDone ? "#10b981" : overallPct >= 60 ? "#6366f1" : "#f59e0b"
              }
              strokeWidth="4"
              strokeDasharray={`${overallPct * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-gray-700">
            {Math.round(overallPct)}%
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const c = COLOR_MAP[m.color];
          return (
            <div key={m.key}>
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className={`w-5 h-5 rounded-md ${c.light} flex items-center justify-center`}
                >
                  <Icon size={11} className={c.text} />
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {m.label}
                </span>
              </div>
              <ProgressBar
                value={perf[m.key]}
                target={totalTarget[m.key]}
                color={m.color}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── TARGET EDITOR ──────────────────────────────────────────────────────── */
const TargetEditor = ({ targets, onSave, onCancel }) => {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(targets)));
  const todayName = getTodayName();

  const set = (day, metric, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], [metric]: num },
    }));
  };

  const applyWeekdayToAll = () => {
    const weekday = draft.monday;
    const next = { ...draft };
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((d) => {
      next[d] = { ...weekday };
    });
    setDraft(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Edit3 size={15} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Edit Daily Targets</h3>
            <p className="text-xs text-gray-400">Set targets per day of week</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={applyWeekdayToAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            Copy Mon → Fri
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-2 mb-5">
        {DAYS.map((day) => {
          const isToday = day === todayName;
          const isWeekend = day === "saturday" || day === "sunday";
          return (
            <div
              key={day}
              className={`rounded-xl border p-3 space-y-2.5 ${
                isToday
                  ? "border-indigo-300 bg-indigo-50/50"
                  : isWeekend
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${isToday ? "text-indigo-600" : isWeekend ? "text-amber-600" : "text-gray-600"}`}
                >
                  {DAY_LABELS[day]}
                </span>
                {isToday && (
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-100 px-1 rounded">
                    Today
                  </span>
                )}
              </div>

              {METRICS.map((m) => {
                const Icon = m.icon;
                const c = COLOR_MAP[m.color];
                return (
                  <div key={m.key}>
                    <div className={`flex items-center gap-1 mb-1`}>
                      <Icon size={9} className={c.text} />
                      <span className="text-[10px] text-gray-500">
                        {m.label}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={draft[day][m.key]}
                      onChange={(e) => set(day, m.key, e.target.value)}
                      className={`w-full text-center text-sm font-bold rounded-lg border py-1.5 outline-none transition
                        ${c.bg} ${c.border} ${c.text}
                        focus:ring-2 focus:ring-indigo-100`}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertTriangle size={11} className="text-amber-400" />
          Changes apply to all team members from today
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
          >
            <Save size={14} /> Save Targets
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── SUMMARY STATS ──────────────────────────────────────────────────────── */
const SummaryStats = ({ team, period, targets }) => {
  const todayName = getTodayName();
  const dayTarget = targets[todayName];
  const multiplier = PERIOD_MULTIPLIERS[period];
  const totalTarget = {
    calls: dayTarget.calls * multiplier * team.length,
    visits: dayTarget.visits * multiplier * team.length,
    closed: dayTarget.closed * multiplier * team.length,
  };
  const totals = team.reduce(
    (acc, m) => ({
      calls: acc.calls + m[period].calls,
      visits: acc.visits + m[period].visits,
      closed: acc.closed + m[period].closed,
    }),
    { calls: 0, visits: 0, closed: 0 },
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {METRICS.map((m) => {
        const Icon = m.icon;
        const c = COLOR_MAP[m.color];
        const pct =
          totalTarget[m.key] > 0
            ? Math.min(
                Math.round((totals[m.key] / totalTarget[m.key]) * 100),
                100,
              )
            : 0;
        return (
          <div
            key={m.key}
            className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl ${c.light} flex items-center justify-center`}
              >
                <Icon size={18} className={c.text} />
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${c.bg} ${c.text}`}
              >
                {pct}%
              </span>
            </div>
            <div className={`text-3xl font-black ${c.text}`}>
              {totals[m.key]}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              of {totalTarget[m.key]} target · {m.label}
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── TODAY'S TARGET BANNER ──────────────────────────────────────────────── */
const TodayBanner = ({ targets }) => {
  const todayName = getTodayName();
  const dayTarget = targets[todayName];
  const isWeekend = todayName === "saturday" || todayName === "sunday";

  return (
    <div
      className={`rounded-2xl border px-5 py-4 flex items-center gap-6 flex-wrap ${
        isWeekend
          ? "bg-amber-50 border-amber-200"
          : "bg-indigo-50 border-indigo-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <Calendar
          size={16}
          className={isWeekend ? "text-amber-500" : "text-indigo-500"}
        />
        <span
          className={`text-sm font-bold ${isWeekend ? "text-amber-700" : "text-indigo-700"}`}
        >
          {DAY_FULL[todayName]}'s Target
          {isWeekend && (
            <span className="ml-1.5 text-xs font-semibold text-amber-500">
              (Weekend)
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const c = COLOR_MAP[m.color];
          return (
            <div key={m.key} className="flex items-center gap-1.5">
              <Icon size={13} className={c.text} />
              <span className={`text-sm font-black ${c.text}`}>
                {dayTarget[m.key]}
              </span>
              <span className="text-xs text-gray-400">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function SalesTargets() {
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [editing, setEditing] = useState(false);
  const [period, setPeriod] = useState("today");
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (newTargets) => {
    setTargets(newTargets);
    setEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="p-6 space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Target size={24} className="text-indigo-600" />
            Sales Targets
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track daily performance against targets for each team member
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === key
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Edit targets button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
            >
              <Edit3 size={15} /> Edit Targets
            </button>
          )}
        </div>
      </div>

      {/* ── Saved toast ── */}
      {savedToast && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-semibold">
          <Check size={16} className="text-emerald-500" />
          Targets updated successfully!
        </div>
      )}

      {/* ── Target Editor ── */}
      {editing && (
        <TargetEditor
          targets={targets}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* ── Today's target banner ── */}
      {!editing && <TodayBanner targets={targets} />}

      {/* ── Summary stats ── */}
      {!editing && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={15} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Team Total · {PERIOD_LABELS[period]}
            </span>
          </div>
          <SummaryStats team={STATIC_TEAM} period={period} targets={targets} />
        </div>
      )}

      {/* ── Per user progress ── */}
      {!editing && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Individual Progress · {PERIOD_LABELS[period]}
            </span>
            <span className="text-xs text-gray-400">
              ({STATIC_TEAM.length} members)
            </span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {STATIC_TEAM.map((member) => (
              <UserProgressCard
                key={member.id}
                member={member}
                period={period}
                targets={targets}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
