// src/pages/dealer/LeadManagement.jsx
// Dynamic lead CRM — role-aware (DEALER vs DEALER_USER)

import axios from "axios";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  StickyNote,
  Trash2,
  Upload,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { EmptyState, PageHeader, StageBadge } from "./SharedComponents";
import { BASE_URL } from "./config";
import {
  bhkOptions,
  CALL_FEEDBACK_COLORS,
  CALL_FEEDBACK_OPTIONS,
  LEAD_STAGES,
  STAGE_COLORS,
} from "./mockData";

/* ─── AUTH HELPERS ─────────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};

const getDealerId = () => {
  const authUser = getAuthUser();
  return authUser.role === "DEALER_USER"
    ? authUser.dealer_id || ""
    : authUser.id || "";
};

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

/* ─── PHONE MASKING HELPERS ─────────────────────────────────────────────────── */
// Industry standard: show first 2 + last 2 digits, mask middle
// e.g. 9876543210 → 98 •••••• 10
const maskPhone = (phone) => {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone; // too short to mask
  const first = digits.slice(0, 2);
  const last = digits.slice(-2);
  const masked = "•".repeat(digits.length - 4);
  return `${first} ${masked} ${last}`;
};

/* ─── PHONE CELL COMPONENT ──────────────────────────────────────────────────── */
// DEALER       → masked number + call icon, click = unmask + dial
// DEALER_USER  → assigned: masked + call icon | unassigned: masked only, no call icon
const PhoneCell = ({ phone, canCall, className = "" }) => {
  const [revealed, setRevealed] = useState(false);

  if (!phone) return <span className="text-gray-300">—</span>;

  return (
    <div
      className={"flex items-center gap-1.5 " + className}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ✅ Masked by default, full number shown after call click */}
      <span className="text-gray-600 text-sm font-mono whitespace-nowrap">
        {revealed ? phone : maskPhone(phone)}
      </span>

      {/* ✅ Call icon — only shown when canCall, click unmasks + dials */}
      {canCall && (
        <a
          href={"tel:" + phone.replace(/\D/g, "")}
          onClick={() => setRevealed(true)}
          className="flex items-center gap-1 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition shrink-0"
          title={"Call " + phone}
        >
          <Phone size={13} />
        </a>
      )}
    </div>
  );
};

/* ─── PHONE INPUT WITH CALL BUTTON ──────────────────────────────────────────── */
// disabled (view mode) → masked number as text + call icon (same as table)
// enabled  (edit mode) → editable input + call button on right
const PhoneInput = ({ value, disabled, onChange, placeholder, canCall }) => {
  const [revealed, setRevealed] = useState(false);

  // ✅ VIEW MODE — show masked number + call icon, same pattern as PhoneCell
  if (disabled) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
        <Phone size={14} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-sm font-mono text-gray-600">
          {value ? (
            revealed ? (
              value
            ) : (
              maskPhone(value)
            )
          ) : (
            <span className="text-gray-300">No number</span>
          )}
        </span>
        {/* ✅ Call icon — only if canCall, click unmasks + dials */}
        {value && canCall && (
          <a
            href={"tel:" + value.replace(/\D/g, "")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold hover:bg-emerald-100 transition shrink-0"
            title={"Call " + value}
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(true);
            }}
          >
            <Phone size={10} /> Call
          </a>
        )}
        {/* ✅ Masked only — no call icon for unassigned DEALER_USER */}
        {value && !canCall && (
          <span className="text-[10px] text-gray-300 font-mono">
            {maskPhone(value)}
          </span>
        )}
      </div>
    );
  }

  // ✅ EDIT MODE — standard editable input with call button
  return (
    <div className="relative">
      <Phone
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        className={`${inputCls} pl-9 ${value && canCall ? "pr-16" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "9876543210"}
      />
      {value && canCall && (
        <a
          href={"tel:" + value.replace(/\D/g, "")}
          title={"Call " + value}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold hover:bg-emerald-100 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone size={10} /> Call
        </a>
      )}
    </div>
  );
};

// ── Shared hook: active DEALER_USERs ─────────────────────────────────────────
const useDealerUsers = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    axios
      .get(`${BASE_URL}/auth/dealer-users`, {
        params: { dealer_id: getDealerId() },
      })
      .then((res) => setUsers((res.data.data || []).filter((u) => u.is_active)))
      .catch(() => setUsers([]));
  }, []);
  return users;
};

// ── Shared hook: fetch dealer properties ─────────────────────────────────────
const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/properties/list`, {
          params: { dealer_id: getDealerId() },
        });
        if (response.data.success) {
          setProperties(response.data.properties || []);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return { properties, loading };
};

/* ── Sample Excel download ───────────────────────────────────────────────────── */
const downloadSampleExcel = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["name", "phone", "email", "property", "budget", "location"],
    [
      "Rahul Verma",
      "9876543210",
      "rahul@email.com",
      "Skyline Apartments",
      "5000000",
      "Noida",
    ],
    ["Sneha Gupta", "9811223344", "", "Green Valley Villas", "", "Delhi"],
    ["Arjun Patel", "9900112233", "arjun@email.com", "", "3500000", "Mumbai"],
  ]);
  ws["!cols"] = [18, 14, 24, 28, 12, 12].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, "lead_import_sample.xlsx");
};

/* ── Import Panel ────────────────────────────────────────────────────────────── */
const ImportPanel = ({ onClose, onImported }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (rows.length === 0) {
          setError("File is empty or has no data rows.");
          return;
        }
        if (rows.length > 5000) {
          setError("Maximum 5000 rows allowed per import.");
          return;
        }
        const normalized = rows.map((r) => {
          const out = {};
          Object.entries(r).forEach(([k, v]) => {
            out[k.toLowerCase().trim().replace(/\s+/g, "_")] = String(v).trim();
          });
          return out;
        });
        setPreview(normalized);
      } catch {
        setError("Could not read file. Please use .xlsx or .csv format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    try {
      const { data } = await axios.post(`${BASE_URL}/leads/bulk`, {
        dealer_id: getDealerId(),
        leads: preview,
      });
      setResult(data);
      onImported(data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Import failed. Please try again.",
      );
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setPreview([]);
    setFileName("");
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between text-white">
          <div>
            <div className="font-black text-lg">Import Leads</div>
            <div className="text-white/70 text-sm mt-0.5">
              Upload an Excel or CSV file
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-indigo-800">
                  Step 1 — Download Sample File
                </div>
                <div className="text-xs text-indigo-500 mt-0.5">
                  Use this format for your data. Only name &amp; phone are
                  required.
                </div>
              </div>
              <button
                onClick={downloadSampleExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shrink-0"
              >
                <Download size={13} /> Sample
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { col: "name", req: true },
                { col: "phone", req: true },
                { col: "email", req: false },
                { col: "property", req: false },
                { col: "budget", req: false },
                { col: "location", req: false },
              ].map(({ col, req }) => (
                <span
                  key={col}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${
                    req
                      ? "bg-indigo-200 text-indigo-800"
                      : "bg-white border border-indigo-100 text-indigo-400"
                  }`}
                >
                  {col}
                  {req ? " *" : ""}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Step 2 — Upload Your File
            </div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition">
              <FileSpreadsheet size={28} className="text-gray-300" />
              <span className="text-sm text-gray-500 font-medium">
                {fileName || "Click to choose .xlsx or .csv"}
              </span>
              <span className="text-xs text-gray-400">Max 5,000 rows</span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {preview.length > 0 && !result && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-700">
                  Preview — {preview.length} rows found
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear
                </button>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        {[
                          "#",
                          "Name",
                          "Phone",
                          "Property",
                          "Budget",
                          "Location",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 font-semibold text-gray-500 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.slice(0, 50).map((row, i) => (
                        <tr
                          key={i}
                          className={!row.name || !row.phone ? "bg-red-50" : ""}
                        >
                          <td className="px-3 py-1.5 text-gray-400">{i + 2}</td>
                          <td className="px-3 py-1.5 font-medium text-gray-800 whitespace-nowrap">
                            {row.name || (
                              <span className="text-red-400">Missing</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap font-mono">
                            {row.phone ? (
                              maskPhone(row.phone)
                            ) : (
                              <span className="text-red-400">Missing</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500 max-w-[120px] truncate">
                            {row.property || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500">
                            {row.budget || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500">
                            {row.location || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 50 && (
                  <div className="px-3 py-2 text-xs text-gray-400 border-t bg-gray-50">
                    Showing first 50 of {preview.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  {result.imported_count} leads imported successfully
                </span>
              </div>
              {result.skipped_count > 0 && (
                <div>
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-2">
                    <AlertTriangle
                      size={16}
                      className="text-amber-500 shrink-0"
                    />
                    <span className="text-sm font-medium text-amber-800">
                      {result.skipped_count} rows skipped
                    </span>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["Row", "Phone", "Reason"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-3 py-2 font-semibold text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {result.skipped.map((s, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-gray-500">
                              {s.row}
                            </td>
                            <td className="px-3 py-1.5 text-gray-600 font-mono">
                              {maskPhone(s.phone)}
                            </td>
                            <td className="px-3 py-1.5 text-red-500">
                              {s.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              {importing ? "Importing..." : `Import ${preview.length} Leads`}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

const INIT_FORM = {
  name: "",
  phone: "",
  email: "",
  property_id: "",
  budget: "",
  location: "",
  assigned_to: "",
  bhk: "",
};

const AddLeadPanel = ({ onClose, onSave }) => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";

  const [form, setForm] = useState({
    ...INIT_FORM,
    assigned_to: isDealer_User ? authUser.id : "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dealerUsers = useDealerUsers();
  const { properties, loading: propertiesLoading } = useProperties();
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    const assignedUser = isDealer_User
      ? { id: authUser.id, name: authUser.name }
      : dealerUsers.find((u) => u.id === form.assigned_to);

    const selectedProperty = properties.find((p) => p._id === form.property_id);

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/leads/`, {
        dealer_id: getDealerId(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        property_id: form.property_id || null,
        budget: form.budget ? Number(form.budget) : null,
        location: form.location.trim() || selectedProperty?.location || null,
        bhk: form.bhk || null, // ✅ NEW
        source: "Manual",
        assigned_to: isDealer_User ? authUser.id : form.assigned_to || null,
        assigned_name: isDealer_User
          ? authUser.name
          : assignedUser?.name || null,
      });
      onSave(res.data.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to create lead. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (propertyId) => {
    set("property_id", propertyId);
    if (propertyId) {
      const selectedProperty = properties.find((p) => p._id === propertyId);
      if (selectedProperty?.location && !form.location) {
        set("location", selectedProperty.location);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-center justify-between text-white">
          <div>
            <div className="font-black text-lg">Add New Lead</div>
            <div className="text-white/70 text-sm mt-0.5">
              Only name &amp; phone are required
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Rahul Verma"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            {/* ✅ Plain input in Add form — no masking since user is typing */}
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className={`${inputCls} pl-9`}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                className={`${inputCls} pl-9`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="rahul@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Property{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Building2
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={form.property_id}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className={`${inputCls} pl-9`}
                disabled={propertiesLoading}
              >
                <option value="">— Select Property —</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.project_name} — {property.location}
                  </option>
                ))}
              </select>
            </div>
            {propertiesLoading && (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                Loading properties...
              </p>
            )}
            {!propertiesLoading && properties.length === 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                No properties found. Add properties in Manage Properties.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Budget (₹){" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                className={inputCls}
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="5000000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Location{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className={inputCls}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Noida"
              />
            </div>
          </div>

          {/* BHK — optional lead-specific fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                BHK Type{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.bhk}
                onChange={(e) => set("bhk", e.target.value)}
                className={inputCls}
              >
                <option value="">— Select BHK —</option>
                {bhkOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isDealer_User && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Assign To
              </label>
              <select
                value={form.assigned_to}
                onChange={(e) => set("assigned_to", e.target.value)}
                className={inputCls}
              >
                <option value="">— Unassigned —</option>
                {dealerUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {dealerUsers.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">
                  No active team members. Add users in Manage Users.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
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
            ) : (
              <>
                <Plus size={15} /> Create Lead
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ── Notes History ───────────────────────────────────────────────────────────── */
const NotesHistory = ({ notes }) => {
  if (!notes?.length) return null;
  return (
    <div className="space-y-2">
      {notes.map((n, i) => (
        <div
          key={i}
          className="relative bg-amber-50 border border-amber-100 rounded-xl p-3"
        >
          {i === 0 && (
            <span className="absolute top-2.5 right-3 text-[10px] font-bold text-amber-500 uppercase tracking-wide">
              Latest
            </span>
          )}
          <p className="text-sm text-amber-900 pr-12 leading-relaxed">
            {n.text}
          </p>
          <p className="text-[11px] text-amber-400 mt-1.5">{n.date}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Lead Tasks Section ──────────────────────────────────────────────────────── */
const LeadTasks = ({ leadId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const PREVIEW_COUNT = 3;

  useEffect(() => {
    if (!leadId) return;
    axios
      .get(`${BASE_URL}/tasks/`, {
        params: { dealer_id: getDealerId(), lead_id: leadId },
      })
      .then((res) => setTasks(res.data.data || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [leadId]);

  const getStatus = (t) => t.status || "pending";

  const STATUS_STYLE = {
    pending: { bg: "bg-gray-100", text: "text-gray-500", label: "Pending" },
    in_progress: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      label: "In Progress",
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Completed",
    },
  };

  const TYPE_ICON = {
    Call: "📞",
    Meeting: "🤝",
    Visit: "🏠",
    Other: "📝",
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const daysDiff = (dateStr) =>
    Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-14" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-xs text-gray-400 font-medium">
          No tasks linked to this lead
        </p>
        <p className="text-[11px] text-gray-300 mt-0.5">
          Create tasks from the Tasks & Follow-ups section
        </p>
      </div>
    );
  }

  // ✅ Sort: non-completed first, then by date ascending (soonest first)
  const sorted = [...tasks].sort((a, b) => {
    const aCompleted = getStatus(a) === "completed";
    const bCompleted = getStatus(b) === "completed";
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return new Date(a.date) - new Date(b.date);
  });

  const displayed = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  // ✅ Summary counts
  const pendingCount = tasks.filter((t) => getStatus(t) === "pending").length;
  const inProgressCount = tasks.filter(
    (t) => getStatus(t) === "in_progress",
  ).length;
  const overdueCount = tasks.filter((t) => {
    const s = getStatus(t);
    return s !== "completed" && daysDiff(t.date) < 0;
  }).length;

  return (
    <div className="space-y-2">
      {/* ✅ Summary bar — quick glance counts */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-[11px] font-semibold text-gray-400">
          {tasks.length} task{tasks.length > 1 ? "s" : ""}
        </span>
        {inProgressCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
            {inProgressCount} in progress
          </span>
        )}
        {pendingCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {pendingCount} pending
          </span>
        )}
        {overdueCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
            ⚠ {overdueCount} overdue
          </span>
        )}
      </div>

      {/* Task list */}
      {displayed.map((task) => {
        const status = getStatus(task);
        const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
        const daysLeft = daysDiff(task.date);
        const isOverdue = daysLeft < 0 && status !== "completed";

        return (
          <div
            key={task.id}
            className={
              "rounded-xl border px-3 py-2.5 flex items-start gap-3 " +
              (isOverdue
                ? "bg-red-50 border-red-200"
                : status === "in_progress"
                  ? "bg-blue-50/50 border-blue-200"
                  : status === "completed"
                    ? "bg-gray-50 border-gray-100 opacity-60"
                    : "bg-white border-gray-100")
            }
          >
            <span className="text-base shrink-0 mt-0.5">
              {TYPE_ICON[task.type] || "📝"}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-700">
                  {task.type}
                </span>
                <span
                  className={
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full " +
                    s.bg +
                    " " +
                    s.text
                  }
                >
                  {s.label}
                </span>
                {isOverdue && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                    {Math.abs(daysLeft)}d overdue
                  </span>
                )}
              </div>

              {task.note && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {task.note}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  📅 {fmtDate(task.date)}
                  {status !== "completed" && daysLeft >= 0 && daysLeft <= 3 && (
                    <span
                      className={
                        daysLeft === 0
                          ? "text-orange-500 font-semibold"
                          : "text-indigo-500 font-semibold"
                      }
                    >
                      {daysLeft === 0 ? "· Today" : "· in " + daysLeft + "d"}
                    </span>
                  )}
                </span>
                {task.assigned_name && (
                  <span className="text-[11px] text-gray-400">
                    👤 {task.assigned_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ✅ Show more / Show less toggle */}
      {hasMore && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full py-2 rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition"
        >
          {showAll
            ? "Show less"
            : "Show " +
              (sorted.length - PREVIEW_COUNT) +
              " more task" +
              (sorted.length - PREVIEW_COUNT > 1 ? "s" : "")}
        </button>
      )}
    </div>
  );
};

/* ── Lead Detail Panel ───────────────────────────────────────────────────────── */
const LeadDetailPanel = ({ lead, onClose, onUpdated, onDeleted }) => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";
  const [editBhk, setEditBhk] = useState(lead.bhk || "");
  const [selectedStage, setSelectedStage] = useState(lead.stage);
  const [selectedCallFeedback, setSelectedCallFeedback] = useState(
    lead.call_feedback || "",
  ); // ✅ NEW
  const [selectedUserId, setSelectedUserId] = useState(lead.assigned_to || "");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    lead.property_id || "",
  );
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const dealerUsers = useDealerUsers();
  const { properties, loading: propertiesLoading } = useProperties();

  const [editName, setEditName] = useState(lead.contact_name || "");
  const [editPhone, setEditPhone] = useState(lead.contact_phone || "");
  const [editBudget, setEditBudget] = useState(
    lead.budget ? String(lead.budget) : "",
  );
  const [editLocation, setEditLocation] = useState(lead.location || "");

  const isAssignedToMe = isDealer_User && lead.assigned_to === authUser.id;
  const isUnassigned = !lead.assigned_to;
  const canEdit = !isDealer_User || isAssignedToMe;

  const isDirty =
    selectedStage !== lead.stage ||
    selectedCallFeedback !== (lead.call_feedback || "") || // ✅ NEW
    selectedUserId !== (lead.assigned_to || "") ||
    selectedPropertyId !== (lead.property_id || "") ||
    newNote.trim() !== "" ||
    editName.trim() !== (lead.contact_name || "") ||
    editPhone.trim() !== (lead.contact_phone || "") ||
    editBudget !== (lead.budget ? String(lead.budget) : "") ||
    editBhk !== (lead.bhk || "") ||
    editLocation.trim() !== (lead.location || "");

  const handleSelfAssign = async () => {
    setAssigning(true);
    setError("");
    try {
      const res = await axios.patch(`${BASE_URL}/leads/${lead.id}`, {
        dealer_id: getDealerId(),
        assigned_to: authUser.id,
        assigned_name: authUser.name,
      });
      onUpdated(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to assign lead. Please try again.",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!editPhone.trim()) {
      setError("Phone number cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const assignedUser = isDealer_User
        ? null
        : dealerUsers.find((u) => u.id === selectedUserId);

      const payload = {
        dealer_id: getDealerId(),
        name: editName.trim(),
        phone: editPhone.trim(),
        budget: editBudget ? Number(editBudget) : null,
        location: editLocation.trim() || null,
        stage: selectedStage,
        call_feedback: selectedCallFeedback || null,
        assigned_to: isDealer_User ? lead.assigned_to : selectedUserId || null,
        assigned_name: isDealer_User
          ? lead.assigned_name
          : assignedUser?.name || null,
        property_id: selectedPropertyId || null,
        bhk: editBhk || null,
      };
      if (newNote.trim()) {
        payload.new_note = {
          text: newNote.trim(),
          date: new Date().toISOString().split("T")[0],
        };
      }
      const res = await axios.patch(`${BASE_URL}/leads/${lead.id}`, payload);
      onUpdated(res.data.data);
      setNewNote("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Update failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await axios.delete(`${BASE_URL}/leads/${lead.id}`, {
        data: { dealer_id: getDealerId() },
      });
      onDeleted(lead.id);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Delete failed. Please try again.",
      );
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex items-start justify-between text-white">
          <div>
            <div className="font-black text-lg">
              {editName || lead.contact_name}
            </div>
            <div className="text-white/70 text-sm mt-0.5">
              {lead.property_name || "No property assigned"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isDealer_User && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-white/60 hover:text-red-300 transition"
                title="Delete lead"
              >
                <Trash2 size={17} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {isDealer_User && isUnassigned && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-800">
                This lead is unassigned
              </p>
              <p className="text-xs text-indigo-500 mt-0.5">
                Assign it to yourself to start working on it
              </p>
            </div>
            <button
              onClick={handleSelfAssign}
              disabled={assigning}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {assigning ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCircle size={13} />
              )}
              {assigning ? "Assigning..." : "Assign to Me"}
            </button>
          </div>
        )}

        {isDealer_User && !isUnassigned && !isAssignedToMe && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3">
            <p className="text-sm font-semibold text-amber-800">
              Assigned to {lead.assigned_name}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">
              This lead is read-only. Only the assigned team member can edit it.
            </p>
          </div>
        )}

        {confirmDelete && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-red-700 font-medium">
              Delete this lead permanently?
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 flex items-center gap-1"
              >
                {deleting && (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Contact Info */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Contact Info
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  value={editName}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Lead name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                {/* ✅ PhoneInput — editable with tap-to-call button */}
                <PhoneInput
                  value={editPhone}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="9876543210"
                  canCall={!isDealer_User || isAssignedToMe} // ✅ same rule as PhoneCell
                />
              </div>
              {lead.contact_email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Mail size={14} className="text-indigo-500 shrink-0" />
                  <span>{lead.contact_email}</span>
                </div>
              )}
            </div>
          </div>
          {/* ✅ Call Feedback — independent field, saved with Update Lead */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Call Feedback
            </div>
            <div className="flex flex-wrap gap-2">
              {CALL_FEEDBACK_OPTIONS.map((option) => {
                const colors = CALL_FEEDBACK_COLORS[option];
                // ✅ "Assign" appears selected when nothing is chosen yet
                const isSelected =
                  selectedCallFeedback === option ||
                  (option === "Assign" && !selectedCallFeedback);
                return (
                  <button
                    key={option}
                    disabled={!canEdit}
                    onClick={() => {
                      // ✅ clicking "Assign" again clears back to default (null)
                      setSelectedCallFeedback(
                        option === "Assign" ||
                          (isSelected && option === selectedCallFeedback)
                          ? ""
                          : option,
                      );
                      setSaved(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? `${colors.bg} ${colors.text} border-transparent`
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Stage */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lead Stage
            </div>
            <div className="flex flex-wrap gap-2">
              {LEAD_STAGES.map((s) => (
                <button
                  key={s}
                  disabled={!canEdit}
                  onClick={() => {
                    setSelectedStage(s);
                    setSaved(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    selectedStage === s
                      ? `${STAGE_COLORS[s].bg} ${STAGE_COLORS[s].text} border-transparent`
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Property */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Property
            </div>
            <div className="relative">
              <Building2
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={selectedPropertyId}
                disabled={!canEdit || propertiesLoading}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSaved(false);
                }}
                className={`${inputCls} pl-9`}
              >
                <option value="">— No Property —</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.project_name} — {property.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned To — DEALER only */}
          {!isDealer_User && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Assigned To
              </div>
              <div className="relative">
                <UserCircle
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSaved(false);
                  }}
                  className={`${inputCls} pl-9`}
                >
                  <option value="">— Unassigned —</option>
                  {dealerUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Budget (₹){" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={editBudget}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEditBudget(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Location{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className={inputCls}
                  value={editLocation}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEditLocation(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Noida"
                />
              </div>

              {/* ✅ BHK + Last Updated in same row */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  BHK Type{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={editBhk}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEditBhk(e.target.value);
                    setSaved(false);
                  }}
                  className={inputCls}
                >
                  <option value="">— Select BHK —</option>
                  {bhkOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex flex-col justify-center">
                <div className="text-xs text-gray-400">Last Updated</div>
                <div className="font-semibold text-gray-800 text-sm mt-0.5 truncate">
                  {lead.updated_at}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks & Follow-ups — only visible when user can edit this lead */}
          {canEdit && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StickyNote size={14} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Tasks & Follow-ups
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  Manage in Tasks section
                </span>
              </div>
              <LeadTasks leadId={lead.id} />
            </div>
          )}
          {/* Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <StickyNote size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Notes
              </span>
              {lead.notes?.length > 0 && (
                <span className="ml-auto text-[11px] text-gray-400">
                  {lead.notes.length} note{lead.notes.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {canEdit && (
              <textarea
                value={newNote}
                onChange={(e) => {
                  setNewNote(e.target.value);
                  setSaved(false);
                }}
                rows={3}
                placeholder="Add a new note..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition mb-3"
              />
            )}
            {lead.notes?.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Previous Notes
                </div>
                <NotesHistory notes={lead.notes} />
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Close
          </button>
          {canEdit && (
            <button
              onClick={handleUpdate}
              disabled={(!isDirty && !saved) || saving}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm ${
                saved
                  ? "bg-green-500 text-white cursor-default"
                  : isDirty
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              } disabled:opacity-60`}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Saving..." : saved ? "Saved!" : "Update Lead"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ── Pagination ──────────────────────────────────────────────────────────────── */
const Pagination = ({ total, page, perPage, onPerPageChange, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = allPages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const withEllipsis = [];
  let prev = null;
  for (const p of visible) {
    if (prev !== null && p - prev > 1) withEllipsis.push("...");
    withEllipsis.push(p);
    prev = p;
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/60 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Rows per page:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none focus:border-indigo-400 transition"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {Math.min((page - 1) * perPage + 1, total)}–
          {Math.min(page * perPage, total)} of {total} leads
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            {withEllipsis.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${p === page ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SortIcon = ({ colKey, sortConfig }) => {
  const active = sortConfig.key === colKey;
  if (active && sortConfig.dir === "asc")
    return <ArrowUp size={13} className="inline ml-1 text-indigo-600" />;
  if (active && sortConfig.dir === "desc")
    return <ArrowDown size={13} className="inline ml-1 text-indigo-600" />;
  return (
    <ArrowUpDown
      size={13}
      className="inline ml-1 text-gray-300 group-hover:text-gray-400 transition"
    />
  );
};

/* ── Main Component ──────────────────────────────────────────────────────────── */
const LeadManagement = () => {
  const authUser = getAuthUser();
  const isDealer_User = authUser.role === "DEALER_USER";
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const handleInlineAssign = async (e, lead) => {
    e.stopPropagation();
    setAssigningLeadId(lead.id);
    try {
      const res = await axios.patch(`${BASE_URL}/leads/${lead.id}`, {
        dealer_id: getDealerId(),
        assigned_to: authUser.id,
        assigned_name: authUser.name,
      });
      handleUpdated(res.data.data);
    } catch {
      // silently fail — user can try via detail panel
    } finally {
      setAssigningLeadId(null);
    }
  };

  const handlePerPageChange = (n) => {
    setRowsPerPage(n);
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const params = { dealer_id: getDealerId() };
        if (authUser.role === "DEALER_USER") {
          params.assigned_to = authUser.id;
          params.include_unassigned = true;
        }
        const res = await axios.get(`${BASE_URL}/leads/`, { params });
        setLeads(res.data.data || []);
        setUnassignedCount(res.data.unassigned_count || 0);
      } catch {
        setError("Failed to load leads. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filtered = useMemo(() => {
    const result = leads.filter((l) => {
      if (
        search &&
        !(l.contact_name || "").toLowerCase().includes(search.toLowerCase()) &&
        !(l.contact_phone || "").includes(search) &&
        !(l.property_name || "").toLowerCase().includes(search.toLowerCase()) &&
        !(l.location || "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterStage !== "All" && l.stage !== filterStage) return false;
      if (filterAssigned === "unassigned" && l.assigned_to) return false;
      if (filterAssigned === "assigned" && !l.assigned_to) return false;
      return true;
    });

    if (!sortConfig.key) return result;

    return [...result].sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === "lead") {
        aVal = (a.contact_name || "").toLowerCase();
        bVal = (b.contact_name || "").toLowerCase();
      } else if (sortConfig.key === "budget") {
        aVal = a.budget ?? -1;
        bVal = b.budget ?? -1;
      } else if (sortConfig.key === "assigned") {
        aVal = (a.assigned_name || "").toLowerCase();
        bVal = (b.assigned_name || "").toLowerCase();
      }
      if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [leads, search, filterStage, filterAssigned, sortConfig]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const resetPage = () => setPage(1);

  const handleSave = (newLead) => setLeads((prev) => [newLead, ...prev]);
  const handleUpdated = (updatedLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)),
    );
    setSelectedLead(updatedLead);
    setUnassignedCount((c) =>
      updatedLead.assigned_to ? Math.max(0, c - 1) : c,
    );
  };
  const handleDeleted = (id) =>
    setLeads((prev) => prev.filter((l) => l.id !== id));
  const handleImported = (newLeads) => {
    setLeads((prev) => [...newLeads, ...prev]);
    setUnassignedCount((c) => c + newLeads.length);
  };

  const hasFilters =
    search || filterStage !== "All" || filterAssigned !== "All";

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Lead Management"
        description="Track, filter and convert all your leads"
        action={
          <div className="flex gap-2">
            {!isDealer_User && (
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
              >
                <Upload size={15} /> Import
              </button>
            )}
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {unassignedCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-amber-800">
              {unassignedCount} active lead
              {unassignedCount > 1 ? "s are" : " is"} not assigned to anyone
            </span>
            <p className="text-xs text-amber-600 mt-0.5">
              {isDealer_User
                ? 'You can claim unassigned leads by clicking "Assign to Me" in the table.'
                : "Unassigned leads may not be followed up. Open each lead and assign a team member."}
            </p>
          </div>
          <button
            onClick={() => {
              setFilterStage("All");
              setSearch("");
              resetPage();
            }}
            className="ml-auto text-xs text-amber-700 underline font-semibold shrink-0"
          >
            View All
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1 min-w-52 shadow-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            className="outline-none text-sm w-full bg-transparent"
            placeholder="Search name, phone, property, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => {
            setFilterStage(e.target.value);
            resetPage();
          }}
          className="px-3 py-2 rounded-xl border bg-white text-sm text-gray-700 shadow-sm outline-none"
        >
          <option value="All">All Stages</option>
          {LEAD_STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {!isDealer_User && (
          <select
            value={filterAssigned}
            onChange={(e) => {
              setFilterAssigned(e.target.value);
              resetPage();
            }}
            className="px-3 py-2 rounded-xl border bg-white text-sm text-gray-700 shadow-sm outline-none"
          >
            <option value="All">All Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
          </select>
        )}
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setFilterStage("All");
              setFilterAssigned("All");
              resetPage();
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 border transition"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 animate-pulse"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/6" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-6 bg-gray-100 rounded-lg w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      onClick={() => handleSort("lead")}
                      className="group text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition"
                    >
                      Lead <SortIcon colKey="lead" sortConfig={sortConfig} />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Phone
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Property
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Location
                    </th>
                    <th
                      onClick={() => handleSort("budget")}
                      className="group text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition"
                    >
                      Budget{" "}
                      <SortIcon colKey="budget" sortConfig={sortConfig} />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Stage
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Call Feedback
                    </th>
                    {!isDealer_User && (
                      <th
                        onClick={() => handleSort("assigned")}
                        className="group text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition"
                      >
                        Assigned To{" "}
                        <SortIcon colKey="assigned" sortConfig={sortConfig} />
                      </th>
                    )}
                    {isDealer_User ? (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        Status
                      </th>
                    ) : (
                      <th className="px-4 py-3" />
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-indigo-50/40 transition cursor-pointer"
                    >
                      {/* Lead */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(lead.contact_name || "?")[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800 whitespace-nowrap">
                                {lead.contact_name || "—"}
                              </span>
                              {lead.notes?.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                                  <StickyNote size={10} />
                                  {lead.notes.length}
                                </span>
                              )}
                            </div>
                            {/* ✅ Assigned date shown below name */}
                            {lead.assigned_at ? (
                              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                Assigned {lead.assigned_at}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-300 whitespace-nowrap">
                                Not assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ✅ Phone — masked with hover reveal + tap-to-call */}
                      <td className="px-4 py-3">
                        <PhoneCell
                          phone={lead.contact_phone}
                          canCall={
                            !isDealer_User || // DEALER always can
                            lead.assigned_to === authUser.id // DEALER_USER only if assigned
                          }
                        />
                      </td>

                      {/* Property */}
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                        {lead.property_name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {lead.location || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {lead.budget
                          ? `₹${(lead.budget / 100000).toFixed(0)}L`
                          : "—"}
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-4 py-3">
                        {lead.call_feedback ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap
                              ${CALL_FEEDBACK_COLORS[lead.call_feedback]?.bg || "bg-gray-100"}
                              ${CALL_FEEDBACK_COLORS[lead.call_feedback]?.text || "text-gray-500"}
                            `}
                          >
                            {lead.call_feedback}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      {/* Assigned To — DEALER only */}
                      {!isDealer_User && (
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {lead.assigned_name ? (
                            <span className="text-gray-600">
                              {lead.assigned_name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 font-semibold">
                              <AlertTriangle size={11} /> Unassigned
                            </span>
                          )}
                        </td>
                      )}

                      {/* Status / Assign — DEALER_USER */}
                      {isDealer_User ? (
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!lead.assigned_to ? (
                            <button
                              onClick={(e) => handleInlineAssign(e, lead)}
                              disabled={assigningLeadId === lead.id}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition disabled:opacity-60 whitespace-nowrap"
                            >
                              {assigningLeadId === lead.id ? (
                                <span className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                              ) : (
                                <UserCircle size={13} />
                              )}
                              {assigningLeadId === lead.id
                                ? "Assigning..."
                                : "Assign to Me"}
                            </button>
                          ) : lead.assigned_to === authUser.id ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold whitespace-nowrap">
                              <CheckCircle2 size={12} /> Mine
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-xs font-semibold whitespace-nowrap">
                              <UserCircle size={12} />{" "}
                              {lead.assigned_name || "Assigned"}
                            </span>
                          )}
                        </td>
                      ) : (
                        <td className="px-4 py-3">
                          <ChevronRight size={16} className="text-gray-300" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No leads found"
                  description='Try adjusting your filters or click "Add Lead"'
                />
              )}
            </div>
            <Pagination
              total={filtered.length}
              page={page}
              perPage={rowsPerPage}
              onPerPageChange={handlePerPageChange}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {panelOpen && (
        <AddLeadPanel onClose={() => setPanelOpen(false)} onSave={handleSave} />
      )}
      {importOpen && (
        <ImportPanel
          onClose={() => setImportOpen(false)}
          onImported={handleImported}
        />
      )}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default LeadManagement;
