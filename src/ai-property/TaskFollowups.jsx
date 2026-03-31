import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  CheckCircle,
  AlertTriangle,
  Phone,
  Users,
  Calendar,
  Plus,
  X,
  ChevronDown,
  Search,
  User,
  FileText,
  Zap,
  ArrowRight,
  Pencil,
  StickyNote,
  Trash2,
  PlayCircle,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { BASE_URL } from "./config";

/* ─── AUTH HELPERS ─────────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};
const getDealerId = () => {
  const authUser = getAuthUser();
  return authUser.role === "DEALER_USER"
    ? authUser.dealer_id || ""
    : authUser.id || "";
};

/* ─── STATUS CONFIG ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: CircleDashed,
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
    pill: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  in_progress: {
    label: "In Progress",
    icon: PlayCircle,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
};

/* ─── TYPE CONFIG ───────────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  Call: {
    icon: Phone,
    bg: "bg-blue-50",
    text: "text-blue-600",
    pill: "bg-blue-50 text-blue-600",
  },
  Meeting: {
    icon: Users,
    bg: "bg-violet-50",
    text: "text-violet-600",
    pill: "bg-violet-50 text-violet-600",
  },
  Visit: {
    icon: Calendar,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    pill: "bg-emerald-50 text-emerald-600",
  },
  Other: {
    icon: StickyNote,
    bg: "bg-gray-50",
    text: "text-gray-600",
    pill: "bg-gray-100 text-gray-600",
  },
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

const daysDiff = (dateStr) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const initials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const getLeadName = (task) => task.lead?.contact_name || null;
const getLeadPhone = (task) => task.lead?.contact_phone || null;
const getLeadProp = (task) => task.lead?.property_name || null;
const getLeadStage = (task) => task.lead?.stage || null;

/* ─── STATUS BUTTON (portal dropdown — escapes table overflow clipping) ─────── */
const StatusButton = ({ status, onClick, disabled }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();
  const menuRef = useRef();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  // Close on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (
        !btnRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Close on scroll anywhere (table scroll, page scroll)
  useEffect(() => {
    if (!showMenu) return;
    const handler = () => setShowMenu(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [showMenu]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Position below the button; flip up if too close to viewport bottom
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 130; // approximate
    const top =
      spaceBelow < menuHeight + 8 ? rect.top - menuHeight - 4 : rect.bottom + 4;
    setMenuPos({ top, left: rect.left });
    setShowMenu((o) => !o);
  };

  const menu = showMenu
    ? createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left, position: "fixed" }}
          className="z-[9999] bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(STATUS_CONFIG).map(([key, s]) => {
            const SIcon = s.icon;
            const isActive = key === status;
            return (
              <button
                key={key}
                onClick={() => {
                  onClick(key);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                <SIcon size={12} className={s.text} />
                <span className={isActive ? s.text : "text-gray-600"}>
                  {s.label}
                </span>
                {isActive && (
                  <CheckCircle
                    size={11}
                    className="ml-auto text-indigo-500 shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        disabled={disabled}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${cfg.pill} hover:opacity-80 disabled:opacity-50`}
      >
        {disabled ? (
          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <Icon size={11} />
        )}
        {cfg.label}
        <ChevronDown
          size={9}
          className={`transition-transform ${showMenu ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </>
  );
};

/* ─── SEARCHABLE DROPDOWN ───────────────────────────────────────────────────── */
const SearchableDropdown = ({
  label,
  placeholder,
  items,
  value,
  onChange,
  renderItem,
  renderSelected,
  icon: Icon,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? items.filter((i) =>
        JSON.stringify(i).toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
            : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"
        }`}
      >
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <span className="flex-1">
          {value ? (
            renderSelected(value)
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 outline-none border border-transparent focus:border-indigo-200 focus:bg-white transition"
                placeholder={`Search ${label.toLowerCase()}...`}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setQuery("");
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 transition"
            >
              <X size={11} /> Clear selection
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center text-gray-400">
                No results
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left transition ${value?.id === item.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  {renderItem(item, value?.id === item.id)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── DELETE CONFIRM MODAL ──────────────────────────────────────────────────── */
const DeleteConfirmModal = ({ task, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
        <Trash2 size={22} className="text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="font-black text-gray-900 text-lg">Delete Task?</h3>
        <p className="text-sm text-gray-500 mt-1">
          {task.lead ? (
            <>
              This will permanently remove the follow-up task for{" "}
              <span className="font-semibold text-gray-700">
                {getLeadName(task)}
              </span>
              .
            </>
          ) : (
            "This will permanently remove this standalone task."
          )}{" "}
          This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Trash2 size={14} /> Delete
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ─── TASK PANEL ────────────────────────────────────────────────────────────── */
const TaskPanel = ({ onClose, onSave, editTask, leads, users }) => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";
  const isEdit = Boolean(editTask);

  const buildLeadOption = (task) => {
    if (!task?.lead_id) return null;
    return {
      id: task.lead_id,
      name: getLeadName(task) || "—",
      phone: getLeadPhone(task) || "—",
      stage: getLeadStage(task),
      property_name: getLeadProp(task),
    };
  };

  const STEPS = isDealer_User
    ? [
        { num: 1, label: "Type" },
        { num: 2, label: "Lead" },
        { num: 3, label: "Schedule" },
      ]
    : [
        { num: 1, label: "Type" },
        { num: 2, label: "Lead" },
        { num: 3, label: "Schedule" },
        { num: 4, label: "Assign" },
      ];

  const MAX_STEP = isDealer_User ? 3 : 4;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(
    isEdit
      ? {
          type: editTask.type || "Call",
          lead: buildLeadOption(editTask),
          assignedTo: editTask.assigned_to
            ? { id: editTask.assigned_to, name: editTask.assigned_name }
            : null,
          date: editTask.date ? editTask.date.split("T")[0] : "",
          note: editTask.note || "",
        }
      : { type: "Call", lead: null, assignedTo: null, date: "", note: "" },
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const leadItems = leads.map((l) => ({
    id: l.id,
    name: l.contact_name || "—",
    phone: l.contact_phone || "—",
    stage: l.stage,
    property_name: l.property_name || null,
  }));

  const canProceed = () => {
    if (step === 1) return !!form.type;
    if (step === 2) return true;
    if (step === 3) return !!form.date;
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!form.date) {
      setError("Please set a follow-up date.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        dealer_id: getDealerId(),
        lead_id: form.lead?.id || null,
        type: form.type,
        date: form.date,
        note: form.note,
        assigned_to: isDealer_User
          ? isEdit
            ? editTask.assigned_to
            : authUser.id
          : form.assignedTo?.id || null,
        assigned_name: isDealer_User
          ? isEdit
            ? editTask.assigned_name
            : authUser.name
          : form.assignedTo?.name || null,
        status: editTask?.status || "pending",
      };
      let res;
      if (isEdit) {
        res = await axios.patch(`${BASE_URL}/tasks/${editTask.id}`, payload);
      } else {
        res = await axios.post(`${BASE_URL}/tasks/`, payload);
      }
      onSave(res.data.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const stepDesc = isEdit
    ? `Updating task${editTask.lead ? ` for ${getLeadName(editTask)}` : ""}`
    : step === 1
      ? "Choose the type of follow-up"
      : step === 2
        ? "Link a lead (optional)"
        : step === 3
          ? "Set date and add notes"
          : "Assign to a team member";

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="font-black text-lg">
                {isEdit ? "Edit Task" : "New Task"}
              </div>
              <div className="text-white/70 text-sm mt-0.5">{stepDesc}</div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition mt-0.5"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      isEdit || step > s.num ? setStep(s.num) : null
                    }
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                      step > s.num
                        ? "bg-white text-indigo-600 border-white cursor-pointer"
                        : step === s.num
                          ? "bg-white/20 text-white border-white"
                          : "bg-transparent text-white/40 border-white/25"
                    }`}
                  >
                    {step > s.num ? <CheckCircle size={13} /> : s.num}
                  </button>
                  <span
                    className={`text-[10px] font-semibold whitespace-nowrap ${step >= s.num ? "text-white/90" : "text-white/35"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1.5 mb-4 transition-all ${step > s.num ? "bg-white/60" : "bg-white/20"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {step === 1 && (
            <>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
                <strong>Note:</strong> Choose the type of interaction you want
                to schedule.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Follow-up Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = form.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set("type", type)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-indigo-600" : "bg-white border border-gray-200"}`}
                        >
                          <Icon
                            size={16}
                            className={
                              isSelected ? "text-white" : "text-gray-400"
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <div
                            className={`font-semibold text-sm ${isSelected ? "text-indigo-700" : "text-gray-700"}`}
                          >
                            {type}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {type === "Call" && "Schedule a phone call"}
                            {type === "Meeting" &&
                              "Set up an in-person or virtual meeting"}
                            {type === "Visit" && "Plan a property site visit"}
                            {type === "Other" &&
                              "Any other type of follow-up activity"}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                            <CheckCircle size={11} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                <strong>Optional:</strong> Link this task to a lead, or skip to
                create a standalone task.
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Lead{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <SearchableDropdown
                  label="Lead"
                  placeholder="Search and select a lead..."
                  items={leadItems}
                  value={form.lead}
                  onChange={(v) => set("lead", v)}
                  icon={User}
                  renderSelected={(item) => (
                    <span className="font-semibold text-gray-800">
                      {item.name}
                      <span className="font-normal text-gray-400 ml-1">
                        · {item.phone}
                      </span>
                    </span>
                  )}
                  renderItem={(item, active) => (
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-indigo-50" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {initials(item.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.phone}
                          {item.stage ? ` · ${item.stage}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              {form.lead ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Selected Lead
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                      {initials(form.lead.name)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        {form.lead.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {form.lead.phone}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      Standalone Task
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      This task won't be linked to any lead
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Follow-up Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${inputCls} pl-9`}
                  />
                </div>
                {form.date && (
                  <p className="mt-1.5 text-xs text-indigo-600 font-semibold">
                    📅 {fmtDate(form.date)} ·{" "}
                    {daysDiff(form.date) === 0
                      ? "Today"
                      : daysDiff(form.date) > 0
                        ? `in ${daysDiff(form.date)} day(s)`
                        : "Past date — task will be overdue"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Notes{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FileText
                    size={14}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <textarea
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    rows={4}
                    placeholder="What should be discussed or prepared?"
                    className={`${inputCls} pl-9 resize-none`}
                  />
                </div>
              </div>
            </>
          )}

          {step === 4 && !isDealer_User && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Assign To{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <SearchableDropdown
                  label="Team member"
                  placeholder="Assign to a team member..."
                  items={users.filter((u) => u.is_active)}
                  value={form.assignedTo}
                  onChange={(v) => set("assignedTo", v)}
                  icon={Users}
                  renderSelected={(item) => (
                    <span className="font-semibold text-gray-800">
                      {item.name}
                      {item.phone && (
                        <span className="font-normal text-gray-400 ml-1">
                          · {item.phone}
                        </span>
                      )}
                    </span>
                  )}
                  renderItem={(item, active) => (
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-indigo-50" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {initials(item.name)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.phone}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-medium text-gray-400">
                  Review your task before saving
                </p>
                {[
                  {
                    label: "Type",
                    value: form.type,
                    icon: TYPE_CONFIG[form.type]?.icon,
                  },
                  {
                    label: "Lead",
                    value: form.lead?.name || "No lead (standalone)",
                  },
                  {
                    label: "Date",
                    value: form.date ? fmtDate(form.date) : "—",
                  },
                  {
                    label: "Assign",
                    value: form.assignedTo?.name || "Unassigned",
                  },
                ].map(({ label, value, icon: SIcon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                  >
                    <span className="text-xs text-gray-400 font-semibold">
                      {label}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1.5 ${label === "Lead" && !form.lead ? "text-gray-400 italic" : "text-gray-800"}`}
                    >
                      {SIcon && <SIcon size={11} className="text-indigo-400" />}
                      {value}
                    </span>
                  </div>
                ))}
                {form.note && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="text-xs text-gray-400 font-semibold block mb-1">
                      Notes
                    </span>
                    <span className="text-xs text-gray-600 italic">
                      "{form.note}"
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            type="button"
            onClick={step > 1 ? () => setStep((s) => s - 1) : onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {step > 1 ? "← Back" : "Cancel"}
          </button>
          {step < MAX_STEP ? (
            <button
              type="button"
              onClick={() => canProceed() && setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                <>
                  <Pencil size={14} /> Save Changes
                </>
              ) : (
                <>
                  <Zap size={14} /> Create Task
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ─── SORT ICON ─────────────────────────────────────────────────────────────── */
const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col)
    return (
      <ArrowUpDown size={12} className="text-gray-300 ml-1 inline-block" />
    );
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="text-indigo-500 ml-1 inline-block" />
  ) : (
    <ArrowDown size={12} className="text-indigo-500 ml-1 inline-block" />
  );
};

/* ─── MAIN ──────────────────────────────────────────────────────────────────── */
const TaskFollowups = () => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";

  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");

  const fetchTasks = async () => {
    try {
      const params = { dealer_id: getDealerId() };
      if (isDealer_User) params.assigned_to = authUser.id;
      const res = await axios.get(`${BASE_URL}/tasks/`, { params });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const params = { dealer_id: getDealerId() };
        if (isDealer_User) {
          params.assigned_to = authUser.id;
          params.include_unassigned = true;
        }
        const res = await axios.get(`${BASE_URL}/leads/`, { params });
        setLeads(res.data.data || []);
      } catch {}
    };
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/auth/dealer-users`, {
          params: { dealer_id: getDealerId() },
        });
        setUsers(res.data.data || []);
      } catch {}
    };
    Promise.all([fetchTasks(), fetchLeads(), fetchUsers()]).finally(() =>
      setLoading(false),
    );
  }, []);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery, rowsPerPage]);

  const openAdd = () => {
    setEditTask(null);
    setPanelOpen(true);
  };
  const openEdit = (task) => {
    setEditTask(task);
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    setEditTask(null);
  };

  const handleSave = (saved) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      return exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [saved, ...prev];
    });
  };

  const handleStatusChange = async (task, newStatus) => {
    setUpdatingId(task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    try {
      await axios.patch(`${BASE_URL}/tasks/${task.id}`, {
        dealer_id: getDealerId(),
        status: newStatus,
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${BASE_URL}/tasks/${deleteTarget.id}`, {
        data: { dealer_id: getDealerId() },
      });
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatus = (t) => t.status || "pending";

  const pending = tasks.filter((t) => getStatus(t) === "pending");
  const inProgress = tasks.filter((t) => getStatus(t) === "in_progress");
  const completed = tasks.filter((t) => getStatus(t) === "completed");
  const overdue = [...pending, ...inProgress].filter(
    (t) => daysDiff(t.date) < 0,
  );

  // Filter by tab
  let filtered =
    filter === "Pending"
      ? pending
      : filter === "In Progress"
        ? inProgress
        : filter === "Overdue"
          ? overdue
          : filter === "Completed"
            ? completed
            : tasks;

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        getLeadName(t)?.toLowerCase().includes(q) ||
        getLeadPhone(t)?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q) ||
        t.assigned_name?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q) ||
        getLeadProp(t)?.toLowerCase().includes(q),
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortCol === "name") {
      aVal = getLeadName(a) || "Standalone";
      bVal = getLeadName(b) || "Standalone";
    } else if (sortCol === "date") {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    } else if (sortCol === "type") {
      aVal = a.type || "";
      bVal = b.type || "";
    } else if (sortCol === "status") {
      aVal = getStatus(a);
      bVal = getStatus(b);
    } else if (sortCol === "assigned") {
      aVal = a.assigned_name || "";
      bVal = b.assigned_name || "";
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const FILTERS = [
    { key: "All", count: tasks.length },
    { key: "Pending", count: pending.length },
    { key: "In Progress", count: inProgress.length },
    { key: "Overdue", count: overdue.length, danger: true },
    { key: "Completed", count: completed.length },
  ];

  const TH = ({ col, label, className = "" }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 whitespace-nowrap ${className}`}
    >
      {label}
      <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="p-6 space-y-5 min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Tasks & Follow-ups
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Stay on top of every lead interaction
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            key: "Pending",
            label: "Pending",
            count: pending.length,
            gradient: "from-gray-500 to-gray-600",
            icon: CircleDashed,
            sub: "not started",
          },
          {
            key: "In Progress",
            label: "In Progress",
            count: inProgress.length,
            gradient: "from-blue-500 to-indigo-600",
            icon: PlayCircle,
            sub: "being worked on",
          },
          {
            key: "Overdue",
            label: "Overdue",
            count: overdue.length,
            gradient:
              overdue.length > 0
                ? "from-red-500 to-rose-600"
                : "from-gray-400 to-gray-500",
            icon: AlertTriangle,
            sub: overdue.length > 0 ? "need attention" : "all on track",
            subDanger: overdue.length > 0,
          },
          {
            key: "Completed",
            label: "Completed",
            count: completed.length,
            gradient: "from-emerald-500 to-teal-600",
            icon: CheckCircle,
            sub: "done",
          },
        ].map(({ key, label, count, gradient, icon: Icon, sub, subDanger }) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-md cursor-pointer transition hover:opacity-90 ${filter === key ? "ring-2 ring-white/60 ring-offset-2 ring-offset-gray-100" : ""}`}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
            <Icon size={20} className="opacity-80 mb-3" />
            <div className="text-4xl font-black leading-none">{count}</div>
            <div className="text-white/80 text-sm font-semibold mt-1">
              {label}
            </div>
            <div
              className={`text-xs mt-0.5 ${subDanger ? "text-red-200 font-semibold" : "text-white/50"}`}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Overdue banner */}
      {overdue.length > 0 && filter !== "Overdue" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">
              {overdue.length} overdue task{overdue.length > 1 ? "s" : ""} need
              attention
            </span>
          </div>
          <button
            onClick={() => setFilter("Overdue")}
            className="text-xs font-semibold text-red-600 underline hover:text-red-700 shrink-0"
          >
            View All
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(({ key, count, danger }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  filter === key
                    ? danger && count > 0
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-indigo-600 text-white border-indigo-600"
                    : danger && count > 0
                      ? "bg-white text-red-500 border-red-200 hover:bg-red-50"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {danger && count > 0 && <AlertTriangle size={11} />}
                {key}
                <span
                  className={`${filter === key ? "text-white/75" : danger && count > 0 ? "text-red-400" : "text-gray-400"}`}
                >
                  ({count})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="ml-auto relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-indigo-300 focus:bg-white transition w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 w-10">
                  #
                </th>
                <TH col="name" label="Lead / Task" />
                <TH col="type" label="Type" />
                <TH col="date" label="Due Date" />
                <TH col="status" label="Status" />
                <TH col="assigned" label="Assigned To" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={22} className="text-gray-300" />
                    </div>
                    <div className="font-bold text-gray-600">
                      No tasks found
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {filter === "All" && !searchQuery
                        ? "Create your first task to get started"
                        : `No ${filter.toLowerCase()} tasks matching your criteria`}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((task, idx) => {
                  const currentStatus = getStatus(task);
                  const daysLeft = daysDiff(task.date);
                  const isOverdueRow =
                    daysLeft < 0 && currentStatus !== "completed";
                  const tc = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.Call;
                  const TypeIcon = tc.icon;
                  const leadName = getLeadName(task);
                  const leadPhone = getLeadPhone(task);
                  const propName = getLeadProp(task);
                  const rowNum = (page - 1) * rowsPerPage + idx + 1;

                  return (
                    <tr
                      key={task.id}
                      className={`group transition-colors ${
                        currentStatus === "completed"
                          ? "opacity-60 bg-white"
                          : isOverdueRow
                            ? "bg-red-50/40 hover:bg-red-50/60"
                            : "bg-white hover:bg-indigo-50/30"
                      }`}
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                        {rowNum}
                      </td>

                      {/* Lead / Task */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 ${leadName ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-gray-200"}`}
                          >
                            {leadName ? (
                              initials(leadName)
                            ) : (
                              <FileText size={13} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-semibold truncate max-w-[160px] ${currentStatus === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}
                            >
                              {leadName || "Standalone Task"}
                            </div>
                            {leadPhone && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <Phone size={9} />
                                <span className="font-mono">{leadPhone}</span>
                              </div>
                            )}
                            {propName && (
                              <span className="mt-0.5 inline-block text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                                {propName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tc.pill}`}
                        >
                          <TypeIcon size={10} /> {task.type}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700 font-medium whitespace-nowrap">
                          {fmtDate(task.date)}
                        </div>
                        {isOverdueRow && (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-500 mt-0.5">
                            <AlertTriangle size={9} /> {Math.abs(daysLeft)}d
                            overdue
                          </div>
                        )}
                        {!isOverdueRow &&
                          currentStatus !== "completed" &&
                          daysLeft >= 0 &&
                          daysLeft <= 7 && (
                            <div
                              className={`text-xs font-semibold mt-0.5 ${daysLeft === 0 ? "text-orange-500" : "text-indigo-400"}`}
                            >
                              {daysLeft === 0 ? "Today" : `in ${daysLeft}d`}
                            </div>
                          )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusButton
                          status={currentStatus}
                          disabled={updatingId === task.id}
                          onClick={(newStatus) =>
                            handleStatusChange(task, newStatus)
                          }
                        />
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-3">
                        {task.assigned_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-black text-white">
                                {initials(task.assigned_name)}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[90px]">
                              {task.assigned_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3">
                        {task.note ? (
                          <p
                            className="text-xs text-gray-500 max-w-[160px] truncate"
                            title={task.note}
                          >
                            {task.note}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-200">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(task)}
                            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-1 rounded-lg transition whitespace-nowrap"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(task)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1 rounded-lg transition"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer — matches PropPilot CRM style */}
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          {/* Rows per page */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white outline-none focus:border-indigo-300 transition"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Range info */}
          <div className="text-sm text-gray-500">
            {totalRows === 0
              ? "0 tasks"
              : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, totalRows)} of ${totalRows} task${totalRows !== 1 ? "s" : ""}`}
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, page + 2);
              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push("...");
              }
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push("...");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e${i}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold border transition ${
                      page === p
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {panelOpen && (
        <TaskPanel
          editTask={editTask}
          onClose={closePanel}
          onSave={handleSave}
          leads={leads}
          users={users}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          task={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default TaskFollowups;
