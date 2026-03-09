// src/pages/dealer/SiteVisits.jsx

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  ChevronDown,
  Plus,
  X,
  ArrowRight,
  Search,
  Phone,
  MapPin,
  Zap,
  Pencil,
} from "lucide-react";
import { BASE_URL } from "./config";

/* ─── AUTH HELPERS ───────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};

// DEALER      → their own id IS the dealer_id
// DEALER_USER → belongs to a dealer, use dealer_id field
const getDealerId = () => {
  const authUser = getAuthUser();
  return authUser.role === "DEALER_USER"
    ? authUser.dealer_id || ""
    : authUser.id || "";
};

const isDealerUser = () => getAuthUser().role === "DEALER_USER";

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const VISIT_STATUSES = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "No Show",
  "Interested",
  "Not Interested",
];

const STATUS_STYLES = {
  Scheduled: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
  Completed: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
  Cancelled: { bg: "bg-gray-100", text: "text-gray-600", icon: XCircle },
  "No Show": { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
  Interested: { bg: "bg-teal-100", text: "text-teal-700", icon: CheckCircle },
  "Not Interested": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    icon: XCircle,
  },
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtPrice = (p) =>
  p >= 10000000
    ? `₹${(p / 10000000).toFixed(1)}Cr`
    : p >= 100000
      ? `₹${(p / 100000).toFixed(0)}L`
      : `₹${p}`;

const initials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

// ── Helpers: read enriched contact data from visit ───────────────────────────
const getVisitName = (v) =>
  v.lead?.contact_name || v.contact_name || v.lead_name || v.name || "—";

const getVisitPhone = (v) =>
  v.lead?.contact_phone || v.contact_phone || v.lead_phone || v.phone || null;

const getVisitProp = (v) =>
  v.lead?.property_name || v.property_name || v.property || null;

const getVisitPropLocation = (v) =>
  v.lead?.property_location || v.property_location || v.location || null;

/* ─── STATUS BADGE ───────────────────────────────────────────────────────── */
const VisitStatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  const Icon = s.icon ?? Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
    >
      <Icon size={12} /> {status}
    </span>
  );
};

/* ─── SEARCHABLE DROPDOWN ────────────────────────────────────────────────── */
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
    const h = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
          <div className="max-h-48 overflow-y-auto py-1">
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

/* ─── EDIT VISIT PANEL ───────────────────────────────────────────────────── */
const EditVisitPanel = ({ visit, onClose, onSave, leads, users }) => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";

  const [properties, setProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildLeadOption = () => {
    const fromList = leads.find((l) => l.id === visit.lead_id);
    if (fromList)
      return {
        id: fromList.id,
        name: fromList.contact_name || "—",
        phone: fromList.contact_phone || "—",
        stage: fromList.stage,
        property_name: fromList.property_name || null,
      };
    return {
      id: visit.lead_id,
      name: getVisitName(visit),
      phone: getVisitPhone(visit) || "",
    };
  };

  const [form, setForm] = useState({
    lead: buildLeadOption(),
    property: visit.property_id
      ? {
          id: visit.property_id,
          name: getVisitProp(visit),
          location: getVisitPropLocation(visit),
        }
      : null,
    date: visit.date || "",
    time: visit.time || "",
    notes: visit.notes || "",
    status: visit.status || "Scheduled",
    assignedTo: visit.assigned_to
      ? { id: visit.assigned_to, name: visit.assigned_name }
      : null,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ Always use getDealerId() — returns dealer's ID for both roles
        const res = await axios.get(`${BASE_URL}/properties/list`, {
          params: { dealer_id: getDealerId() },
        });
        if (res.data.success)
          setProperties(
            (res.data.properties || []).map((p) => ({
              id: p._id,
              name: p.project_name,
              location: p.location,
              bhk: p.bhk,
              price: p.price,
              possession: p.possession,
            })),
          );
      } catch {
      } finally {
        setPropsLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!form.lead || !form.date || !form.time) {
      setError("Lead, date and time are required.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        dealer_id: getDealerId(), // ✅ correct dealer_id for both roles
        lead_id: form.lead.id,
        property_id: form.property?.id || null,
        property_name: form.property?.name || null,
        date: form.date,
        time: form.time,
        notes: form.notes,
        status: form.status,
        // ✅ DEALER_USER cannot change assigned_to — keep original
        assigned_to: isDealer_User
          ? visit.assigned_to
          : form.assignedTo?.id || null,
        assigned_name: isDealer_User
          ? visit.assigned_name
          : form.assignedTo?.name || null,
      };
      const res = await axios.patch(
        `${BASE_URL}/admin/visits/${visit.id}`,
        payload,
      );
      onSave({ ...visit, ...res.data.data });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-black text-lg">Edit Site Visit</div>
              <div className="text-white/70 text-sm mt-0.5">
                Update details for{" "}
                <span className="font-semibold text-white">
                  {getVisitName(visit)}
                </span>
                's visit
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition mt-0.5"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Lead */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Lead <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              label="Lead"
              placeholder="Search and select a lead..."
              items={leads.map((l) => ({
                id: l.id,
                name: l.contact_name || "—",
                phone: l.contact_phone || "—",
                stage: l.stage,
                property_name: l.property_name || null,
              }))}
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
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {item.phone}
                      {item.stage ? ` · ${item.stage}` : ""}
                    </div>
                  </div>
                  {item.property_name && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                      {item.property_name}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Property */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Property
            </label>
            {propsLoading ? (
              <div
                className={`${inputCls} flex items-center gap-2 text-gray-400`}
              >
                <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />{" "}
                Loading…
              </div>
            ) : (
              <SearchableDropdown
                label="Property"
                placeholder="Select a property..."
                items={properties}
                value={form.property}
                onChange={(v) => set("property", v)}
                icon={Building2}
                renderSelected={(item) => (
                  <span className="font-semibold text-gray-800">
                    {item.name}
                    {item.location && (
                      <span className="font-normal text-gray-400 ml-1">
                        · {item.location}
                      </span>
                    )}
                  </span>
                )}
                renderItem={(item, active) => (
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-indigo-50" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                      <Building2 size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <MapPin size={10} className="shrink-0" />{" "}
                        {item.location}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-600">
                        {fmtPrice(item.price)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.bhk}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Visit Date <span className="text-red-500">*</span>
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
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Visit Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Visit Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VISIT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    form.status === s
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Assign salesperson — hidden for DEALER_USER */}
          {!isDealer_User && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Assigned Sales Person
              </label>
              <SearchableDropdown
                label="Sales person"
                placeholder="Assign to a sales person..."
                // ✅ Fetch users scoped to dealer — getDealerId() handles both roles
                items={users.filter((u) => u.is_active)}
                value={form.assignedTo}
                onChange={(v) => set("assignedTo", v)}
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                      {initials(item.name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400">{item.phone}</div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Any instructions or details for this visit..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ─── NEW VISIT PANEL ────────────────────────────────────────────────────── */
const VisitPanel = ({ onClose, onSave, leads, users }) => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";

  // ✅ DEALER_USER skips the Assign step entirely
  const STEPS = isDealer_User
    ? [
        { num: 1, label: "Lead" },
        { num: 2, label: "Property" },
        { num: 3, label: "Schedule" },
      ]
    : [
        { num: 1, label: "Lead" },
        { num: 2, label: "Property" },
        { num: 3, label: "Schedule" },
        { num: 4, label: "Assign" },
      ];

  const MAX_STEP = isDealer_User ? 3 : 4;

  const [step, setStep] = useState(1);
  const [properties, setProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [form, setForm] = useState({
    lead: null,
    property: null,
    date: "",
    time: "",
    notes: "",
    assignedTo: null,
  });
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

  useEffect(() => {
    const load = async () => {
      setPropsLoading(true);
      try {
        // ✅ getDealerId() now returns the correct dealer ID for both roles
        const res = await axios.get(`${BASE_URL}/properties/list`, {
          params: { dealer_id: getDealerId() },
        });
        if (res.data.success)
          setProperties(
            (res.data.properties || []).map((p) => ({
              id: p._id,
              name: p.project_name,
              location: p.location,
              bhk: p.bhk,
              price: p.price,
              possession: p.possession,
            })),
          );
      } catch {
      } finally {
        setPropsLoading(false);
      }
    };
    load();
  }, []);

  const canProceed = () => {
    if (step === 1) return !!form.lead;
    if (step === 2) return !!form.property;
    if (step === 3) return !!form.date && !!form.time;
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.lead || !form.property || !form.date || !form.time) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        dealer_id: getDealerId(), // ✅ correct dealer_id for both roles
        lead_id: form.lead.id,
        property_id: form.property.id,
        property_name: form.property.name,
        date: form.date,
        time: form.time,
        notes: form.notes,
        // ✅ DEALER_USER auto-assigns to themselves
        assigned_to: isDealer_User ? authUser.id : form.assignedTo?.id || null,
        assigned_name: isDealer_User
          ? authUser.name
          : form.assignedTo?.name || null,
        status: "Scheduled",
      };
      const res = await axios.post(`${BASE_URL}/admin/visits`, payload);
      const saved = {
        ...res.data.data,
        id: res.data.data.booking_id || res.data.data.id,
      };
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header + stepper */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="font-black text-lg">New Site Visit</div>
              <div className="text-white/70 text-sm mt-0.5">
                {step === 1
                  ? "Select the lead for this visit"
                  : step === 2
                    ? "Choose the property to visit"
                    : step === 3
                      ? "Set visit date and time"
                      : "Assign a sales person"}
              </div>
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
                    onClick={() => (step > s.num ? setStep(s.num) : null)}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP 1 — Lead */}
          {step === 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Lead <span className="text-red-500">*</span>
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
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone size={10} /> {item.phone}
                        {item.stage ? ` · ${item.stage}` : ""}
                      </div>
                    </div>
                    {item.property_name && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                        {item.property_name}
                      </span>
                    )}
                  </div>
                )}
              />
              {form.lead && (
                <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1.5">
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
                  {form.lead.stage && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs text-gray-400">Stage:</span>
                      <span className="text-xs font-semibold bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded-full">
                        {form.lead.stage}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Property */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Property <span className="text-red-500">*</span>
                </label>
                {propsLoading ? (
                  <div
                    className={`${inputCls} flex items-center gap-2 text-gray-400`}
                  >
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin shrink-0" />{" "}
                    Loading properties...
                  </div>
                ) : properties.length === 0 ? (
                  <div className="w-full border border-dashed border-gray-200 rounded-xl px-4 py-5 text-center">
                    <Building2
                      size={22}
                      className="text-gray-300 mx-auto mb-1"
                    />
                    <p className="text-xs text-gray-400 font-medium">
                      No properties found
                    </p>
                    <p className="text-xs text-gray-400">
                      Add properties from Manage Properties first
                    </p>
                  </div>
                ) : (
                  <SearchableDropdown
                    label="Property"
                    placeholder="Search and select a property..."
                    items={properties}
                    value={form.property}
                    onChange={(v) => set("property", v)}
                    icon={Building2}
                    renderSelected={(item) => (
                      <span className="font-semibold text-gray-800">
                        {item.name}
                        <span className="font-normal text-gray-400 ml-1">
                          · {item.location}
                        </span>
                      </span>
                    )}
                    renderItem={(item, active) => (
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-indigo-50" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                          <Building2 size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                            <MapPin size={10} className="shrink-0" />{" "}
                            {item.location}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-600">
                            {fmtPrice(item.price)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {item.bhk}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}
              </div>
              {form.property && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Selected Property
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">
                        {form.property.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {form.property.location}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Notes{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Any instructions or details for this visit..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Date & Time */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Visit Date <span className="text-red-500">*</span>
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
                    📅 {fmtDate(form.date)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Visit Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Assign & Review — ✅ hidden for DEALER_USER */}
          {step === 4 && !isDealer_User && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Assign Sales Person{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <SearchableDropdown
                  label="Sales person"
                  placeholder="Assign to a sales person..."
                  // ✅ users already fetched with correct dealer_id from main component
                  items={users.filter((u) => u.is_active)}
                  value={form.assignedTo}
                  onChange={(v) => set("assignedTo", v)}
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
                  Review before saving
                </p>
                {[
                  { label: "Lead", value: form.lead?.name || "—", icon: User },
                  {
                    label: "Property",
                    value: form.property?.name || "—",
                    icon: Building2,
                  },
                  {
                    label: "Location",
                    value: form.property?.location || "—",
                    icon: MapPin,
                  },
                  { label: "Date", value: fmtDate(form.date), icon: Calendar },
                  { label: "Time", value: form.time || "—", icon: Clock },
                  {
                    label: "Assign",
                    value: form.assignedTo?.name || "Unassigned",
                    icon: User,
                  },
                ].map(({ label, value, icon: SIcon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                  >
                    <span className="text-xs text-gray-400 font-semibold">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                      <SIcon size={11} className="text-indigo-400" /> {value}
                    </span>
                  </div>
                ))}
                {form.notes && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <span className="text-xs text-gray-400 font-semibold block mb-1">
                      Notes
                    </span>
                    <span className="text-xs text-gray-600 italic">
                      "{form.notes}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            type="button"
            onClick={step > 1 ? () => setStep((s) => s - 1) : onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {step > 1 ? "← Back" : "Cancel"}
          </button>
          {/* ✅ Use MAX_STEP to control when Continue vs Schedule Visit shows */}
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
              ) : (
                <>
                  <Zap size={14} /> Schedule Visit
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

/* ─── VISIT CARD ─────────────────────────────────────────────────────────── */
const VisitCard = ({ visit, onEdit }) => {
  const name = getVisitName(visit);
  const phone = getVisitPhone(visit);
  const prop = getVisitProp(visit);
  const propLocation = getVisitPropLocation(visit);

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4 hover:shadow-md transition group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-gray-900 truncate">{name}</div>

          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            <Building2 size={11} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 truncate min-w-0">
              {prop || (
                <span className="italic text-gray-300">
                  No property assigned
                </span>
              )}
            </span>
          </div>

          {propLocation && (
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} className="shrink-0" /> {propLocation}
            </div>
          )}

          {phone && (
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Phone size={11} className="shrink-0" /> {phone}
            </div>
          )}
        </div>
        <VisitStatusBadge status={visit.status} />
      </div>

      {/* Date / Time */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-indigo-500 shrink-0" />
          {fmtDate(visit.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-indigo-500 shrink-0" />
          {visit.time}
        </span>
      </div>

      {/* Notes */}
      {visit.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
          {visit.notes}
        </p>
      )}

      {/* Salesperson */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Assigned Sales Person
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
          <User
            size={14}
            className={
              visit.assigned_name ? "text-indigo-500" : "text-gray-400"
            }
          />
          <span
            className={`text-sm ${visit.assigned_name ? "font-semibold text-gray-800" : "text-gray-400"}`}
          >
            {visit.assigned_name || "Unassigned"}
          </span>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={() => onEdit(visit)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition shadow-sm"
      >
        <Pencil size={14} /> Edit Visit
      </button>
    </div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const SiteVisits = () => {
  const [visits, setVisits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);

  const handleEditSave = (updated) =>
    setVisits((prev) =>
      prev.map((v) =>
        v.id === updated.id
          ? { ...updated, id: updated.booking_id || updated.id }
          : v,
      ),
    );

  useEffect(() => {
    const authUser = getAuthUser();

    const fetchVisits = async () => {
      try {
        const params = {};
        if (authUser.role === "DEALER") {
          // DEALER sees all visits under their dealer_id
          params.dealer_id = getDealerId();
        } else if (authUser.role === "DEALER_USER") {
          // DEALER_USER only sees visits assigned to them
          params.assigned_to = authUser.id;
        }
        const res = await axios.get(`${BASE_URL}/admin/visits`, { params });
        const data = (res.data.data || []).map((v) => ({
          ...v,
          id: v.booking_id || v.id,
        }));
        setVisits(data);
      } catch (err) {
        console.error("Failed to fetch visits:", err);
      }
    };

    const fetchLeads = async () => {
      try {
        // ✅ getDealerId() returns correct dealer ID for both roles
        const res = await axios.get(`${BASE_URL}/leads/`, {
          params: { dealer_id: getDealerId() },
        });
        setLeads(res.data.data || []);
      } catch {}
    };

    const fetchUsers = async () => {
      try {
        // ✅ getDealerId() returns correct dealer ID for both roles
        const res = await axios.get(`${BASE_URL}/auth/dealer-users`, {
          params: { dealer_id: getDealerId() },
        });
        setUsers(res.data.data || []);
      } catch {}
    };

    Promise.all([fetchVisits(), fetchLeads(), fetchUsers()]).finally(() =>
      setLoading(false),
    );
  }, []);

  const handleSave = (v) => setVisits((p) => [v, ...p]);

  const filtered =
    filter === "All" ? visits : visits.filter((v) => v.status === filter);

  const counts = {};
  VISIT_STATUSES.forEach((s) => {
    counts[s] = visits.filter((v) => v.status === s).length;
  });

  // ✅ Only show unassigned warning for DEALER role
  const authUser = getAuthUser();
  const unassignedCount =
    authUser.role === "DEALER"
      ? visits.filter((v) => !v.assigned_name).length
      : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Site Visits
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage visits, update outcomes and assign your sales team
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
        >
          <Plus size={16} /> New Visit
        </button>
      </div>

      {/* Unassigned warning — only visible to DEALER */}
      {unassignedCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={17} className="text-amber-500 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            {unassignedCount} visit{unassignedCount > 1 ? "s are" : " is"} not
            yet assigned to a sales person
          </span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {[
          ["All", visits.length],
          ...Object.entries(counts).filter(([, c]) => c > 0),
        ].map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
              filter === status
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {status}
            <span
              className={`text-xs ${filter === status ? "text-white/80" : "text-gray-400"}`}
            >
              ({count})
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border p-5 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-40" />
              <div className="h-9 bg-gray-100 rounded-xl" />
              <div className="h-9 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-gray-300" />
          </div>
          <div className="font-bold text-gray-700 text-lg">No visits found</div>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "All"
              ? "Schedule your first site visit to get started"
              : `No ${filter.toLowerCase()} visits`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VisitCard key={v.id} visit={v} onEdit={setEditingVisit} />
          ))}
        </div>
      )}

      {panelOpen && (
        <VisitPanel
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
          leads={leads}
          users={users}
        />
      )}
      {editingVisit && (
        <EditVisitPanel
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={handleEditSave}
          leads={leads}
          users={users}
        />
      )}
    </div>
  );
};

export default SiteVisits;
