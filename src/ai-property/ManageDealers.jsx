// src/pages/superadmin/ManageDealers.jsx

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Download,
  Search,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Check,
  Save,
  ChevronRight,
  Loader2,
  User,
} from "lucide-react";
import {
  DealerAvatar,
  PageHeader,
  PlanBadge,
  StatusDot,
} from "./SharedComponents";
import { BASE_URL } from "./config";

/* ─── CONSTANTS ──────────────────────────────────────────────────────────────── */
const PLANS = ["BASIC", "PRO", "ENTERPRISE"];

const PLAN_STYLES = {
  BASIC: {
    active: "bg-slate-700 text-white border-slate-700",
    idle: "border-gray-200 text-gray-600 hover:border-slate-300",
  },
  PRO: {
    active: "bg-indigo-600 text-white border-indigo-600",
    idle: "border-gray-200 text-gray-600 hover:border-indigo-300",
  },
  ENTERPRISE: {
    active: "bg-amber-500 text-white border-amber-500",
    idle: "border-gray-200 text-gray-600 hover:border-amber-300",
  },
};

/* ─── FIELD ──────────────────────────────────────────────────────────────────── */
const Field = ({
  icon,
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}) => (
  <div
    className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 transition
    ${
      readOnly
        ? "border-gray-100 bg-gray-50 cursor-not-allowed"
        : "border-gray-200 bg-gray-50/50 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300"
    }`}
  >
    <span className="text-gray-400 shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none mb-0.5">
        {label}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`w-full text-sm font-medium bg-transparent outline-none
          ${readOnly ? "text-gray-400 cursor-not-allowed" : "text-gray-800"}`}
      />
    </div>
    {readOnly && (
      <span className="text-[10px] text-gray-300 font-medium shrink-0">
        read-only
      </span>
    )}
  </div>
);

/* ─── EDIT DRAWER ────────────────────────────────────────────────────────────── */
const EditDrawer = ({ dealer, onClose, onSave }) => {
  const [form, setForm] = useState({
    business_name: dealer.business_name ?? "",
    business_email: dealer.business_email ?? "",
    business_phone: dealer.business_phone ?? "",
    city: dealer.city ?? "",
    state: dealer.state ?? "",
    country: dealer.country ?? "",
    admin_name: dealer.admin_name ?? "",
    plan: dealer.plan ?? "BASIC",
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
    setSaveError("");
  };

  const isDirty =
    form.business_name !== (dealer.business_name ?? "") ||
    form.business_email !== (dealer.business_email ?? "") ||
    form.business_phone !== (dealer.business_phone ?? "") ||
    form.city !== (dealer.city ?? "") ||
    form.state !== (dealer.state ?? "") ||
    form.country !== (dealer.country ?? "") ||
    form.admin_name !== (dealer.admin_name ?? "") ||
    form.plan !== (dealer.plan ?? "BASIC");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await axios.patch(`${BASE_URL}/auth/users/${dealer.id}`, {
        "dealer.business_name": form.business_name,
        "dealer.business_email": form.business_email,
        "dealer.business_phone": form.business_phone,
        "dealer.city": form.city,
        "dealer.state": form.state,
        "dealer.country": form.country,
        name: form.admin_name,
        plan: form.plan,
      });
      onSave(dealer.id, form);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-start justify-between text-white">
          <div>
            <div className="font-black text-lg">{dealer.business_name}</div>
            <div className="text-white/70 text-sm mt-0.5">
              {dealer.slug} · {dealer.city}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Business Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Business Info
            </p>
            <div className="space-y-3">
              <Field
                icon={<Building2 size={14} />}
                label="Business Name"
                value={form.business_name}
                onChange={(v) => set("business_name", v)}
              />
              <Field
                icon={<Mail size={14} />}
                label="Business Email"
                value={form.business_email}
                onChange={(v) => set("business_email", v)}
                type="email"
              />
              <Field
                icon={<Phone size={14} />}
                label="Business Phone"
                value={form.business_phone}
                onChange={(v) => set("business_phone", v)}
                type="tel"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Location
            </p>
            <div className="space-y-3">
              <Field
                icon={<MapPin size={14} />}
                label="City"
                value={form.city}
                onChange={(v) => set("city", v)}
              />
              <Field
                icon={<MapPin size={14} />}
                label="State"
                value={form.state}
                onChange={(v) => set("state", v)}
              />
              <Field
                icon={<Globe size={14} />}
                label="Country"
                value={form.country}
                onChange={(v) => set("country", v)}
              />
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Admin Account
            </p>
            <div className="space-y-3">
              <Field
                icon={<User size={14} />}
                label="Admin Name"
                value={form.admin_name}
                onChange={(v) => set("admin_name", v)}
              />
              <Field
                icon={<Mail size={14} />}
                label="Admin Email (Login)"
                value={dealer.admin_email}
                readOnly
              />
            </div>
          </div>

          {/* Plan */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Subscription Plan
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => {
                const isSelected = form.plan === p;
                return (
                  <button
                    key={p}
                    onClick={() => set("plan", p)}
                    className={`relative py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      isSelected ? PLAN_STYLES[p].active : PLAN_STYLES[p].idle
                    }`}
                  >
                    {p}
                    {isSelected && (
                      <span className="absolute top-1 right-1">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Read-only meta */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Joined", dealer.joinedAt ?? "—"],
                ["Leads", dealer.leads ?? "—"],
                ["Visits", dealer.visits ?? "—"],
                ["Status", dealer.status ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">{k}</div>
                  <div className="font-semibold text-gray-800 text-sm mt-0.5 truncate">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {saveError && (
          <div className="px-6 py-2.5 bg-red-50 border-t border-red-100 text-red-600 text-xs font-medium">
            {saveError}
          </div>
        )}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={(!isDirty && !saved) || saving}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm
              ${
                saved
                  ? "bg-green-500 text-white cursor-default"
                  : isDirty
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const shapeDealer = (u, leadsMap, visitsMap) => ({
  id: u.id,

  // Business fields
  business_name: u.dealer?.business_name ?? "—",
  slug: u.dealer?.slug ?? "—",
  business_email: u.dealer?.business_email ?? "",
  business_phone: u.dealer?.business_phone ?? "",
  city: u.dealer?.city ?? "—",
  state: u.dealer?.state ?? "",
  country: u.dealer?.country ?? "",

  // Admin fields
  admin_name: u.name ?? "—",
  admin_email: u.email ?? "—",

  // Plan / status
  plan: u.plan ?? "BASIC",
  is_active: u.is_active ?? true,
  status: (u.is_active ?? true) ? "ACTIVE" : "INACTIVE",

  joinedAt: u.joined_at
    ? new Date(u.joined_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—",

  // ✅ Real counts from leads/visits APIs
  leads: leadsMap[u.id] ?? 0,
  visits: visitsMap[u.id] ?? 0,
});

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────────── */
const ManageDealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editDealer, setEditDealer] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // ── Fetch dealers + leads + visits in parallel ──────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dealersRes, leadsRes, visitsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/auth/users`, { params: { role: "DEALER" } }),
          axios.get(`${BASE_URL}/leads/`), // all leads, no dealer_id
          axios.get(`${BASE_URL}/admin/visits`, { params: { limit: 500 } }), // all visits
        ]);

        const rawDealers =
          dealersRes.status === "fulfilled"
            ? (dealersRes.value.data?.data ?? [])
            : [];

        // Build dealer_id → count maps from leads and visits data
        const leadsMap = {};
        const visitsMap = {};

        if (leadsRes.status === "fulfilled") {
          for (const lead of leadsRes.value.data?.data ?? []) {
            if (lead.dealer_id) {
              leadsMap[lead.dealer_id] = (leadsMap[lead.dealer_id] ?? 0) + 1;
            }
          }
        }

        if (visitsRes.status === "fulfilled") {
          for (const visit of visitsRes.value.data?.data ?? []) {
            if (visit.dealer_id) {
              visitsMap[visit.dealer_id] =
                (visitsMap[visit.dealer_id] ?? 0) + 1;
            }
          }
        }

        setDealers(rawDealers.map((u) => shapeDealer(u, leadsMap, visitsMap)));
      } catch (err) {
        console.error("Failed to fetch dealers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      dealers.filter((d) => {
        const q = search.toLowerCase();
        const matchSearch =
          d.business_name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.admin_name.toLowerCase().includes(q) ||
          d.admin_email.toLowerCase().includes(q);
        const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
        return matchSearch && matchStatus;
      }),
    [dealers, search, filterStatus],
  );

  // ── Toggle active / inactive ────────────────────────────────────
  const toggleStatus = async (id, currentIsActive) => {
    setTogglingId(id);
    try {
      await axios.patch(`${BASE_URL}/auth/users/${id}`, {
        is_active: !currentIsActive,
      });
      setDealers((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                is_active: !currentIsActive,
                status: !currentIsActive ? "ACTIVE" : "INACTIVE",
              }
            : d,
        ),
      );
    } catch (err) {
      console.error("Toggle status failed:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Optimistic update after drawer save ─────────────────────────
  const saveDealer = (id, form) =>
    setDealers((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              business_name: form.business_name,
              business_email: form.business_email,
              business_phone: form.business_phone,
              city: form.city,
              state: form.state,
              country: form.country,
              admin_name: form.admin_name,
              plan: form.plan,
            }
          : d,
      ),
    );

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Manage Dealers"
        description="Activate, deactivate and monitor all property dealers"
        action={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-90 transition">
            <Download size={15} /> Export
          </button>
        }
      />

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1 min-w-48 shadow-sm">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            className="outline-none text-sm w-full"
            placeholder="Search by business, city or admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              filterStatus === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 animate-pulse"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="h-5 bg-gray-100 rounded-lg w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-14" />
                <div className="h-7 bg-gray-100 rounded-lg w-24" />
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
                    "Admin",
                    "City",
                    "Plan",
                    "Status",
                    "Leads",
                    "Visits",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-indigo-50/40 transition cursor-pointer group"
                    onClick={() => setEditDealer(d)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DealerAvatar name={d.business_name} size="sm" />
                        <div>
                          <div className="font-semibold text-gray-800">
                            {d.business_name}
                          </div>
                          <div className="text-xs text-gray-400">{d.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-700 whitespace-nowrap">
                        {d.admin_name}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {d.admin_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.city}</td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={d.plan} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={d.status} />
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {d.leads}
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600">
                      {d.visits}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {d.joinedAt}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditDealer(d)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition whitespace-nowrap"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(d.id, d.is_active)}
                          disabled={togglingId === d.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap disabled:opacity-60 ${
                            d.is_active
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {togglingId === d.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : d.is_active ? (
                            <>
                              <ToggleRight size={14} /> Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-indigo-400 transition"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                No dealers found
              </div>
            )}
          </div>
        )}
      </div>

      {editDealer && (
        <EditDrawer
          dealer={editDealer}
          onClose={() => setEditDealer(null)}
          onSave={saveDealer}
        />
      )}
    </div>
  );
};

export default ManageDealers;
