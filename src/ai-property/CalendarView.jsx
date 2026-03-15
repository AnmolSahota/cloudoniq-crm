// src/pages/dealer/CalendarView.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Building2,
  CheckSquare,
  Loader2,
  AlertTriangle,
  MapPin,
  Phone,
} from "lucide-react";
import { PageHeader } from "./SharedComponents";
import { BASE_URL } from "./config";

/* ─── AUTH HELPERS ─────────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};

// DEALER      → their own id IS the dealer_id
// DEALER_USER → belongs to a dealer, use dealer_id field
const getDealerId = () => {
  const authUser = getAuthUser();
  return authUser.role === "DEALER_USER"
    ? authUser.dealer_id || ""
    : authUser.id || "";
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const padZero = (n) => String(n).padStart(2, "0");

const TYPE_STYLES = {
  visit: {
    dot: "bg-blue-500",
    pill: "bg-blue-500 text-white",
    icon: Building2,
    label: "Site Visit",
    badge: "bg-blue-100 text-blue-700",
  },
  task: {
    dot: "bg-amber-400",
    pill: "bg-amber-400 text-white",
    icon: CheckSquare,
    label: "Task",
    badge: "bg-amber-100 text-amber-700",
  },
};

// ✅ Status-aware dot color for task items in sidebar and popover
const TASK_STATUS_DOT = {
  pending: "bg-gray-400",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
};

// ── Helpers: Extract data from nested lead object ────────────────────────────
const getLeadName = (item) =>
  item.lead?.contact_name ||
  item.contact_name ||
  item.lead_name ||
  item.name ||
  "—";

const getLeadPhone = (item) =>
  item.lead?.contact_phone ||
  item.contact_phone ||
  item.lead_phone ||
  item.phone ||
  "";

const getPropertyName = (item) =>
  item.lead?.property_name || item.property_name || item.property || null;

const getPropertyLocation = (item) =>
  item.lead?.property_location ||
  item.property_location ||
  item.location ||
  null;

/* ─── STATUS PILL ─────────────────────────────────────────────────────────── */
const StatusPills = ({ event }) => {
  if (event.type !== "task") return null;

  const statusStyleMap = {
    pending: { bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
    in_progress: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "In Progress",
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Completed",
    },
  };

  const s = statusStyleMap[event.taskStatus] || statusStyleMap.pending;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
      {event.taskType && (
        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
          {event.taskType}
        </span>
      )}
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}
      >
        {s.label}
      </span>
    </div>
  );
};

/* ─── DAY DETAIL POPOVER ─────────────────────────────────────────────────── */
const DayDetail = ({ dateKey, events, onClose }) => {
  if (!events?.length) return null;
  return (
    <div
      className="absolute z-30 top-full mt-1 left-0 w-72 bg-white rounded-2xl border shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-gray-50">
        <span className="text-xs font-bold text-gray-700">{dateKey}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm font-bold leading-none"
        >
          ✕
        </button>
      </div>

      <div className="divide-y max-h-72 overflow-y-auto">
        {events.map((e, i) => {
          const s = TYPE_STYLES[e.type];
          const Icon = s.icon;
          return (
            <div key={i} className="px-3 py-2.5 hover:bg-gray-50 transition">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    e.type === "task"
                      ? TASK_STATUS_DOT[e.taskStatus] || TASK_STATUS_DOT.pending
                      : s.dot
                  }`}
                />
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}
                >
                  {s.label}
                </span>
              </div>
              <div className="font-semibold text-sm text-gray-800 truncate">
                {e.leadName}
              </div>
              {e.leadPhone && (
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Phone size={10} className="shrink-0" /> {e.leadPhone}
                </div>
              )}
              <StatusPills event={e} />
              {e.meta && (
                <div className="text-xs text-gray-400 mt-0.5">{e.meta}</div>
              )}
              {e.propertyName && (
                <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                  <Building2 size={10} className="shrink-0 text-blue-400" />
                  {e.propertyName}
                </div>
              )}
              {e.propertyLocation && (
                <div className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0" />
                  {e.propertyLocation}
                </div>
              )}
              {e.note && (
                <div className="text-xs text-gray-400 truncate flex items-center gap-1 mt-1">
                  <Icon size={10} className="shrink-0" />
                  {e.note}
                </div>
              )}
              {e.time && (
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} /> {e.time}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const CalendarView = () => {
  const today = new Date();
  const [current, setCurrent] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const authUser = getAuthUser();
        const isDealer_User = authUser.role === "DEALER_USER";

        // ✅ Role-aware params:
        // DEALER      → filter by dealer_id only (sees all)
        // DEALER_USER → filter by dealer_id + assigned_to (sees only theirs)
        const visitParams = { dealer_id: getDealerId() };
        const taskParams = { dealer_id: getDealerId() };

        if (isDealer_User) {
          visitParams.assigned_to = authUser.id;
          taskParams.assigned_to = authUser.id;
        }

        const [vRes, tRes] = await Promise.all([
          axios.get(`${BASE_URL}/admin/visits`, { params: visitParams }),
          axios.get(`${BASE_URL}/tasks/`, { params: taskParams }),
        ]);

        setVisits(
          (vRes.data.data || []).map((v) => ({
            ...v,
            id: v.booking_id || v.id,
          })),
        );
        setTasks(tRes.data.data || []);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        setError("Failed to load calendar data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prev = () =>
    setCurrent((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { ...c, month: c.month - 1 },
    );
  const next = () =>
    setCurrent((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { ...c, month: c.month + 1 },
    );

  /* ── event map ── */
  const eventMap = {};
  const add = (dateStr, entry) => {
    if (!dateStr) return;
    const key = dateStr.slice(0, 10);
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(entry);
  };

  visits.forEach((v) =>
    add(v.date, {
      type: "visit",
      leadName: getLeadName(v),
      leadPhone: getLeadPhone(v),
      propertyName: getPropertyName(v),
      propertyLocation: getPropertyLocation(v),
      note: null,
      time: v.time,
      status: v.status,
      taskDone: null,
      meta: v.assigned_name ? `Assigned to ${v.assigned_name}` : null,
    }),
  );

  tasks.forEach((t) =>
    add(t.date, {
      type: "task",
      leadName: t.lead ? getLeadName(t) : "Standalone Task", // ✅ handle no lead
      leadPhone: t.lead ? getLeadPhone(t) : null,
      propertyName: getPropertyName(t),
      propertyLocation: null,
      note: t.note || null,
      time: t.time ?? null,
      taskType: t.type, // ✅ Call/Meeting/Visit/Other
      taskStatus: t.status || "pending", // ✅ replaces taskDone
      meta: t.assigned_name ? `Assigned to ${t.assigned_name}` : null,
    }),
  );

  /* ── grid ── */
  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  /* ── upcoming sidebar ── */
  const nowMs = Date.now();
  const ceilMs = nowMs + 30 * 24 * 60 * 60 * 1000;
  const upcoming = Object.entries(eventMap)
    .flatMap(([date, evts]) => evts.map((e) => ({ ...e, date })))
    .filter((e) => {
      const ms = new Date(e.date).getTime();
      return ms >= nowMs && ms <= ceilMs;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalVisits = visits.length;
  const pendingTasks = tasks.filter(
    (t) => (t.status || "pending") !== "completed",
  ).length;
  const todayEvents = (eventMap[todayStr] || []).length;

  return (
    <div className="p-6 space-y-5" onClick={() => setOpenDay(null)}>
      <PageHeader
        title="Calendar"
        description="Site visits and tasks at a glance"
      />

      {/* summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            label: "Site Visits",
            count: totalVisits,
            color: "bg-blue-50 text-blue-700 border-blue-100",
            dot: "bg-blue-500",
          },
          {
            label: "Pending Tasks",
            count: tasks.filter((t) => (t.status || "pending") === "pending")
              .length,
            color: "bg-gray-100 text-gray-700 border-gray-200",
            dot: "bg-gray-400",
          },
          {
            label: "In Progress",
            count: tasks.filter((t) => t.status === "in_progress").length,
            color: "bg-blue-50 text-blue-700 border-blue-100",
            dot: "bg-blue-500",
          },
          {
            label: "Today",
            count: todayEvents,
            color: "bg-indigo-50 text-indigo-700 border-indigo-100",
            dot: "bg-indigo-500",
          },
        ].map(({ label, count, color, dot }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${color}`}
          >
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {count} {label}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <button
              onClick={prev}
              className="p-1.5 rounded-lg hover:bg-white/20 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold">
              {MONTHS[current.month]} {current.year}
            </span>
            <button
              onClick={next}
              className="p-1.5 rounded-lg hover:bg-white/20 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-bold text-gray-400 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day)
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-16 border-r border-b last:border-r-0 bg-gray-50/50"
                  />
                );

              const dateKey = `${current.year}-${padZero(current.month + 1)}-${padZero(day)}`;
              const events = eventMap[dateKey] || [];
              const isToday = dateKey === todayStr;
              const isOpen = openDay === dateKey;

              return (
                <div
                  key={day}
                  className={`relative min-h-16 border-r border-b last:border-r-0 p-1.5 cursor-pointer transition ${isToday ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDay(
                      events.length ? (isOpen ? null : dateKey) : null,
                    );
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${isToday ? "bg-indigo-600 text-white" : "text-gray-700"}`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((e, i) => (
                      <div
                        key={i}
                        className={`${TYPE_STYLES[e.type].pill} text-[10px] rounded px-1 py-0.5 truncate`}
                        title={e.leadName}
                      >
                        {e.leadName}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[10px] text-gray-400 pl-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                  {isOpen && (
                    <DayDetail
                      dateKey={dateKey}
                      events={events}
                      onClose={() => setOpenDay(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 px-4 py-3 border-t bg-gray-50/50">
            {Object.entries(TYPE_STYLES).map(([key, s]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"
              >
                <span className={`w-2.5 h-2.5 rounded-sm ${s.dot}`} /> {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* upcoming sidebar */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" />
            Upcoming{" "}
            <span className="text-gray-400 font-normal text-sm ml-1">
              (next 30 days)
            </span>
          </div>

          <div className="divide-y overflow-y-auto flex-1 max-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 size={22} className="animate-spin text-indigo-400" />
                <span className="text-sm">Loading events…</span>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No upcoming events in the next 30 days
              </div>
            ) : (
              upcoming.map((e, i) => {
                const s = TYPE_STYLES[e.type];
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    className="px-4 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          e.type === "task"
                            ? TASK_STATUS_DOT[e.taskStatus] ||
                              TASK_STATUS_DOT.pending
                            : s.dot
                        }`}
                      />
                      <span className="font-semibold text-sm text-gray-800 truncate">
                        {e.leadName}
                      </span>
                      <span
                        className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${s.badge}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {e.leadPhone && (
                      <div className="text-xs text-gray-400 ml-4 flex items-center gap-1">
                        <Phone size={10} className="shrink-0" /> {e.leadPhone}
                      </div>
                    )}
                    <div className="ml-4">
                      <StatusPills event={e} />
                    </div>
                    {e.meta && (
                      <div className="text-xs text-gray-400 ml-4 mt-0.5">
                        {e.meta}
                      </div>
                    )}
                    {e.propertyName && (
                      <div className="text-xs text-gray-500 ml-4 mt-0.5 truncate flex items-center gap-1">
                        <Building2
                          size={10}
                          className="shrink-0 text-blue-400"
                        />
                        {e.propertyName}
                      </div>
                    )}
                    {e.propertyLocation && (
                      <div className="text-xs text-gray-400 ml-4 mt-0.5 truncate flex items-center gap-1">
                        <MapPin size={10} className="shrink-0" />
                        {e.propertyLocation}
                      </div>
                    )}
                    {e.note && (
                      <div className="text-xs text-gray-400 ml-4 mt-0.5 truncate flex items-center gap-1">
                        <Icon size={10} className="shrink-0" /> {e.note}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1 ml-4 flex items-center gap-1">
                      <Clock size={10} /> {e.date}
                      {e.time ? ` · ${e.time}` : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
