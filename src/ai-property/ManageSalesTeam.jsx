import axios from "axios";
import {
  Building2,
  Calendar,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState, PageHeader, StatusDot } from "./SharedComponents";
import { BASE_URL } from "./config";

const getDealerId = () =>
  JSON.parse(localStorage.getItem("auth_user"))?.id || "";

const ROLE_OPTIONS = [
  { value: "SALES_USER", label: "Sales User" },
  { value: "MANAGER", label: "Manager" },
  { value: "CALLER", label: "Caller" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "RM", label: "RM" },
];

const getRoleLabel = (value) =>
  ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value ?? "—";

const INIT_FORM = {
  name: "",
  email: "",
  phone: "",
  joined_at: "",
  password: "",
  confirmPassword: "",
  user_type: "INTERNAL",
  role: "",
  reporting_person_id: "", // single user id
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

const shapeMember = (u, leadsMap = {}, visitsMap = {}) => ({
  id: u.id,
  name: u.name ?? "—",
  email: u.email ?? "—",
  phone: u.phone ?? "—",
  role: u.role ?? "",
  user_type: u.user_type ?? "INTERNAL",
  is_active: u.is_active ?? true,
  status: (u.is_active ?? true) ? "ACTIVE" : "INACTIVE",
  joined_at: u.joined_at ?? null,
  reporting_person_id: u.reporting_person_id ?? null,
  assigned_leads: leadsMap[u.id] ?? 0,
  completed_visits: visitsMap[u.id] ?? 0,
  closed_deals: 0,
});

/* ─── USER TYPE BADGE ─────────────────────────────────────────────────────── */
const UserTypeBadge = ({ type }) => {
  if (!type) return null;
  const isInternal = type === "INTERNAL";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        isInternal
          ? "bg-blue-50 text-blue-600 border border-blue-100"
          : "bg-amber-50 text-amber-600 border border-amber-100"
      }`}
    >
      {isInternal ? <Building2 size={9} /> : <ExternalLink size={9} />}
      {isInternal ? "Internal" : "External"}
    </span>
  );
};

/* ─── ROLE BADGE ──────────────────────────────────────────────────────────── */
const RoleBadge = ({ role }) => {
  if (!role) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
      {getRoleLabel(role)}
    </span>
  );
};

/* ─── ROLE DROPDOWN ───────────────────────────────────────────────────────── */
const RoleDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = ROLE_OPTIONS.find((r) => r.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${inputCls} flex items-center justify-between`}
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? selected.label : "Select a role"}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between ${
                value === opt.value
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
              {value === opt.value && (
                <Check size={14} className="text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── REPORTING TO SINGLE-SELECT ──────────────────────────────────────────── */
const ReportingToDropdown = ({
  value,
  onChange,
  allUsers = [],
  currentUserId,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = allUsers.filter((u) => u.id !== currentUserId);
  const selected = options.find((u) => u.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${inputCls} flex items-center justify-between min-h-[42px]`}
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {selected.name?.[0] ?? "?"}
            </div>
            <span className="text-gray-800 font-medium">{selected.name}</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {getRoleLabel(selected.role)}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">Select reporting person</span>
        )}
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 flex flex-col">
          {/* None option */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm border-b transition flex items-center gap-2 ${
              !value
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <span className="italic">None</span>
            {!value && <Check size={13} className="ml-auto text-indigo-600" />}
          </button>

          <div className="overflow-y-auto flex-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No other users available
              </div>
            ) : (
              options.map((user) => {
                const isSelected = value === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {user.name?.[0] ?? "?"}
                      </div>
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── SLIDE-IN PANEL ──────────────────────────────────────────────────────── */
const UserPanel = ({ onClose, onSave, editMember, allUsers }) => {
  const isEdit = Boolean(editMember);

  const [form, setForm] = useState(
    isEdit
      ? {
          name: editMember.name,
          email: editMember.email,
          phone: editMember.phone,
          joined_at: editMember.joined_at
            ? editMember.joined_at.split("T")[0]
            : "",
          password: "",
          confirmPassword: "",
          user_type: editMember.user_type || "INTERNAL",
          role: editMember.role || "",
          reporting_person_id: editMember.reporting_person_id ?? "",
        }
      : INIT_FORM,
  );
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone) {
      setError("Name, email and phone are required.");
      return;
    }
    if (!form.role) {
      setError("Please select a role.");
      return;
    }
    if (!isEdit && !form.password) {
      setError("Password is required.");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const changes = {
          name: form.name,
          phone: form.phone,
          user_type: form.user_type,
          role: form.role,
          reporting_person_id: form.reporting_person_id || null,
        };
        if (form.password) changes.password = form.password;
        if (form.joined_at) changes.joined_at = form.joined_at;

        const res = await axios.patch(
          `${BASE_URL}/auth/users/${editMember.id}`,
          changes,
        );
        onSave({
          ...shapeMember(res.data.data),
          assigned_leads: editMember.assigned_leads,
          completed_visits: editMember.completed_visits,
          reporting_person_id: form.reporting_person_id || null,
        });
      } else {
        const formData = new FormData();
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("role", form.role);
        formData.append("name", form.name);
        formData.append("phone", form.phone);
        formData.append("dealer_id", getDealerId());
        formData.append("user_type", form.user_type);
        if (form.joined_at) formData.append("joined_at", form.joined_at);
        if (form.reporting_person_id)
          formData.append("reporting_person_id", form.reporting_person_id);

        const res = await axios.post(`${BASE_URL}/auth/create-user`, formData);
        onSave({
          ...shapeMember(res.data.data),
          reporting_person_id: form.reporting_person_id || null,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between text-white">
          <div>
            <div className="font-black text-lg">
              {isEdit ? "Edit User" : "Add User"}
            </div>
            <div className="text-white/70 text-sm mt-0.5">
              {isEdit
                ? `Updating details for ${editMember.name}`
                : "Create a new team member account"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {!isEdit && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
              <strong>Note:</strong> This person will receive a login to your
              CRM and can be assigned to site visits and leads.
            </div>
          )}

          {/* User Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              User Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("user_type", "INTERNAL")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium text-sm ${
                  form.user_type === "INTERNAL"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Building2 size={18} />
                <div className="text-left">
                  <div className="font-semibold">Internal</div>
                  <div className="text-[10px] opacity-70">
                    In-house employee
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => set("user_type", "EXTERNAL")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition font-medium text-sm ${
                  form.user_type === "EXTERNAL"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <ExternalLink size={18} />
                <div className="text-left">
                  <div className="font-semibold">External</div>
                  <div className="text-[10px] opacity-70">Agent / Partner</div>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {form.user_type === "INTERNAL"
                ? "Internal users are your direct employees working in-house."
                : "External users are third-party agents, brokers, or partners."}
            </p>
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <RoleDropdown value={form.role} onChange={(v) => set("role", v)} />
            {form.role && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {form.role === "MANAGER" &&
                  "Managers oversee team operations and performance."}
                {form.role === "SALES_USER" &&
                  "Sales Users handle leads and client interactions."}
                {form.role === "CALLER" &&
                  "Callers are responsible for outbound lead calling."}
                {form.role === "TEAM_LEAD" &&
                  "Team Leads guide and support their team members."}
                {form.role === "RM" &&
                  "Relationship Managers manage key client relationships."}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Vikram Singh"
            />
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Work Email <span className="text-red-500">*</span>
              {isEdit && (
                <span className="text-gray-400 font-normal ml-1">
                  (cannot be changed)
                </span>
              )}
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                className={`${inputCls} pl-9 ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                value={form.email}
                onChange={(e) => !isEdit && set("email", e.target.value)}
                readOnly={isEdit}
                placeholder="vikram@yourcompany.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className={`${inputCls} pl-9`}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="9876001122"
              />
            </div>
          </div>

          {/* Date of Joining */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Date of Joining{" "}
              {!isEdit && (
                <span className="text-gray-400 font-normal">
                  (optional — defaults to today if left blank)
                </span>
              )}
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.joined_at}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("joined_at", e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="border-t pt-4 space-y-4">
            <p className="text-xs text-gray-400 font-medium">
              {isEdit
                ? "Leave password blank to keep it unchanged"
                : "Set a temporary login password"}
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {isEdit ? "New Password" : "Temporary Password"}{" "}
                {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={`${inputCls} pr-10`}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Confirm Password{" "}
                {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type={showPass ? "text" : "password"}
                className={inputCls}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {/* Reporting To */}
          <div className="border-t pt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Reporting To{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <ReportingToDropdown
              value={form.reporting_person_id}
              onChange={(v) => set("reporting_person_id", v)}
              allUsers={allUsers}
              currentUserId={editMember?.id}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Select the manager, team lead, or supervisor this user reports to.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </form>

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
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              <>
                <Pencil size={15} /> Save Changes
              </>
            ) : (
              <>
                <UserPlus size={16} /> Create User
              </>
            )}
          </button>
        </div>
      </div>
      <div
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
    </div>
  );
};

/* ─── MEMBER CARD ─────────────────────────────────────────────────────────── */
const MemberCard = ({ member, onToggleStatus, onEdit }) => {
  const isActive = member.is_active;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition ${!isActive ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shrink-0">
            {member.name[0]}
          </div>
          <div>
            <div className="font-bold text-gray-900">{member.name}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <RoleBadge role={member.role} />
              <UserTypeBadge type={member.user_type} />
            </div>
          </div>
        </div>
        <StatusDot status={member.status} />
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={13} className="text-indigo-400 shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={13} className="text-indigo-400 shrink-0" />
          <span>{member.phone}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          {
            label: "Leads",
            value: member.assigned_leads,
            color: "text-blue-600",
          },
          {
            label: "Visits",
            value: member.completed_visits,
            color: "text-purple-600",
          },
          {
            label: "Closed",
            value: member.closed_deals,
            color: "text-emerald-600",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className={`font-black text-lg ${color}`}>{value}</div>
            <div className="text-[11px] text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 mb-4">
        Joined:{" "}
        {member.joined_at
          ? new Date(member.joined_at).toLocaleDateString()
          : "—"}
      </div>

      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={() => onEdit(member)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100"
        >
          <Pencil size={13} /> Edit
        </button>
        <button
          onClick={() => onToggleStatus(member)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition ${
            isActive
              ? "text-red-600 bg-red-50 hover:bg-red-100 border-red-100"
              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100"
          }`}
        >
          {isActive ? (
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
    </div>
  );
};

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
const ManageSalesTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUserType, setFilterUserType] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  useEffect(() => {
    const fetchAll = async () => {
      const dealerId = getDealerId();
      try {
        const [usersRes, leadsRes, visitsRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/auth/users`, {
            params: { dealer_id: dealerId },
          }),
          axios.get(`${BASE_URL}/leads/`, { params: { dealer_id: dealerId } }),
          axios.get(`${BASE_URL}/admin/visits`, {
            params: { dealer_id: dealerId, limit: 500 },
          }),
        ]);

        const leadsMap = {};
        const visitsMap = {};

        if (leadsRes.status === "fulfilled") {
          for (const lead of leadsRes.value.data?.data ?? []) {
            if (lead.assigned_to)
              leadsMap[lead.assigned_to] =
                (leadsMap[lead.assigned_to] ?? 0) + 1;
          }
        }
        if (visitsRes.status === "fulfilled") {
          for (const visit of visitsRes.value.data?.data ?? []) {
            if (visit.assigned_to)
              visitsMap[visit.assigned_to] =
                (visitsMap[visit.assigned_to] ?? 0) + 1;
          }
        }

        const rawUsers =
          usersRes.status === "fulfilled"
            ? (usersRes.value.data?.data ?? [])
            : [];
        setTeam(rawUsers.map((u) => shapeMember(u, leadsMap, visitsMap)));
      } catch {
        setError("Failed to load team members. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openAdd = () => {
    setEditMember(null);
    setPanelOpen(true);
  };
  const openEdit = (member) => {
    setEditMember(member);
    setPanelOpen(true);
  };

  const handleSave = (data) => {
    setTeam((prev) => {
      const exists = prev.find((m) => m.id === data.id);
      return exists
        ? prev.map((m) => (m.id === data.id ? data : m))
        : [...prev, data];
    });
  };

  const toggleStatus = async (member) => {
    try {
      await axios.patch(`${BASE_URL}/auth/users/${member.id}`, {
        is_active: !member.is_active,
      });
      setTeam((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                is_active: !member.is_active,
                status: !member.is_active ? "ACTIVE" : "INACTIVE",
              }
            : m,
        ),
      );
    } catch {
      alert("Failed to update status. Please try again.");
    }
  };

  const displayed = team.filter((m) => {
    const statusMatch = filterStatus === "ALL" || m.status === filterStatus;
    const typeMatch =
      filterUserType === "ALL" || m.user_type === filterUserType;
    const roleMatch = filterRole === "ALL" || m.role === filterRole;
    return statusMatch && typeMatch && roleMatch;
  });

  const activeCount = team.filter((m) => m.is_active).length;
  const inactiveCount = team.filter((m) => !m.is_active).length;
  const internalCount = team.filter((m) => m.user_type === "INTERNAL").length;
  const externalCount = team.filter((m) => m.user_type === "EXTERNAL").length;
  const totalLeads = team.reduce((s, m) => s + (m.assigned_leads ?? 0), 0);
  const totalClosed = team.reduce((s, m) => s + (m.closed_deals ?? 0), 0);

  // Unique roles present in team for filter
  const presentRoles = [...new Set(team.map((m) => m.role).filter(Boolean))];

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Manage Users"
        description="Manage your team members who handle leads and site visits"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
          >
            <UserPlus size={16} /> Add User
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Total Members",
            value: team.length,
            color: "from-indigo-500 to-violet-600",
          },
          {
            label: "Active",
            value: activeCount,
            color: "from-emerald-500 to-green-600",
          },
          {
            label: "Internal",
            value: internalCount,
            color: "from-blue-500 to-blue-600",
          },
          {
            label: "External",
            value: externalCount,
            color: "from-amber-400 to-amber-500",
          },
          {
            label: "Leads Assigned",
            value: totalLeads,
            color: "from-cyan-500 to-cyan-600",
          },
          {
            label: "Deals Closed",
            value: totalClosed,
            color: "from-pink-400 to-rose-500",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow`}
          >
            <div className="text-3xl font-black">{value}</div>
            <div className="text-white/75 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-gray-500 mr-1">
            Status:
          </span>
          {[
            { label: "All", value: "ALL", count: team.length },
            { label: "Active", value: "ACTIVE", count: activeCount },
            { label: "Inactive", value: "INACTIVE", count: inactiveCount },
          ].map(({ label, value, count }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterStatus === value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={
                  filterStatus === value ? "text-white/75" : "text-gray-400"
                }
              >
                ({count})
              </span>
            </button>
          ))}
        </div>

        {/* User Type Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-gray-500 mr-1">
            Type:
          </span>
          {[
            { label: "All", value: "ALL", count: team.length },
            {
              label: "Internal",
              value: "INTERNAL",
              count: internalCount,
              icon: Building2,
            },
            {
              label: "External",
              value: "EXTERNAL",
              count: externalCount,
              icon: ExternalLink,
            },
          ].map(({ label, value, count, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilterUserType(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterUserType === value
                  ? value === "INTERNAL"
                    ? "bg-blue-600 text-white border-blue-600"
                    : value === "EXTERNAL"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {Icon && <Icon size={12} />}
              {label}
              <span
                className={
                  filterUserType === value ? "text-white/75" : "text-gray-400"
                }
              >
                ({count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Team grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border shadow-sm p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded" />
              <div className="h-2 bg-gray-100 rounded w-2/3" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description='Click "Add User" to create your first team member'
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}

      {panelOpen && (
        <UserPanel
          editMember={editMember}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
          allUsers={team}
        />
      )}
    </div>
  );
};

export default ManageSalesTeam;
