// src/pages/dealer/LeadManagement.jsx
// Dynamic lead CRM — unassigned warning + Excel bulk import

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Search,
  Plus,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  X,
  Save,
  StickyNote,
  Trash2,
  UserCircle,
  Upload,
  AlertTriangle,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
} from "lucide-react";
import {
  PageHeader,
  StageBadge,
  SourceBadge,
  EmptyState,
} from "./SharedComponents";
import { BASE_URL } from "./config";
import { LEAD_STAGES, STAGE_COLORS, LEAD_SOURCES } from "./mockData";

const getDealerId = () =>
  JSON.parse(localStorage.getItem("auth_user"))?.id || "";

const ROWS_PER_PAGE = 10;

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

// ── Shared hook: active DEALER_USERs ─────────────────────────────────────────
const useDealerUsers = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    axios
      .get(`${BASE_URL}/auth/dealer-users`, {
        params: { dealer_id: getDealerId() },
      })
      .then((res) =>
        setUsers((res.data.data || []).filter((u) => u.status === "ACTIVE")),
      )
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
    ["name", "phone", "email", "property", "budget", "location", "source"],
    [
      "Rahul Verma",
      "9876543210",
      "rahul@email.com",
      "Skyline Apartments",
      "5000000",
      "Noida",
      "Import",
    ],
    [
      "Sneha Gupta",
      "9811223344",
      "",
      "Green Valley Villas",
      "",
      "Delhi",
      "Import",
    ],
    [
      "Arjun Patel",
      "9900112233",
      "arjun@email.com",
      "",
      "3500000",
      "Mumbai",
      "Import",
    ],
  ]);
  // Column widths
  ws["!cols"] = [18, 14, 24, 28, 12, 12, 10].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, "lead_import_sample.xlsx");
};

/* ── Import Panel ────────────────────────────────────────────────────────────── */
const ImportPanel = ({ onClose, onImported }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]); // parsed rows
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // { imported_count, skipped_count, skipped }
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
        // Normalize keys to lowercase + trim
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
        {/* Header */}
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
          {/* Step 1 — Download sample */}
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
            {/* Column reference */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { col: "name", req: true },
                { col: "phone", req: true },
                { col: "email", req: false },
                { col: "property", req: false },
                { col: "budget", req: false },
                { col: "location", req: false },
                { col: "source", req: false },
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

          {/* Step 2 — Upload file */}
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

          {/* Preview table */}
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
                          "Source",
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
                          <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                            {row.phone || (
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
                            {row.source || "—"}
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

          {/* Result summary */}
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
                              {s.phone}
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

        {/* Footer */}
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

/* ── Add Lead Panel ──────────────────────────────────────────────────────────── */
const INIT_FORM = {
  name: "",
  phone: "",
  email: "",
  property_id: "",
  budget: "",
  location: "",
  source: "Manual",
  assigned_to: "",
};

const AddLeadPanel = ({ onClose, onSave }) => {
  const [form, setForm] = useState(INIT_FORM);
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
    const assignedUser = dealerUsers.find((u) => u.id === form.assigned_to);
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
        source: form.source,
        assigned_to: form.assigned_to || null,
        assigned_name: assignedUser?.name || null,
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

  // Auto-fill location when property is selected
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

          {/* Property Dropdown */}
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
                Budget (₹)
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
                Location
              </label>
              <input
                className={inputCls}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Noida"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Source
            </label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className={inputCls}
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
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

/* ── Lead Detail Panel ───────────────────────────────────────────────────────── */
const LeadDetailPanel = ({ lead, onClose, onUpdated, onDeleted }) => {
  const [selectedStage, setSelectedStage] = useState(lead.stage);
  const [selectedUserId, setSelectedUserId] = useState(lead.assigned_to || "");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    lead.property_id || "",
  );
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const dealerUsers = useDealerUsers();
  const { properties, loading: propertiesLoading } = useProperties();

  // ── NEW: editable contact/detail fields ──────────────────────────────────
  const [editName, setEditName] = useState(lead.contact_name || "");
  const [editPhone, setEditPhone] = useState(lead.contact_phone || "");
  const [editBudget, setEditBudget] = useState(
    lead.budget ? String(lead.budget) : "",
  );
  const [editLocation, setEditLocation] = useState(lead.location || "");

  const isDirty =
    selectedStage !== lead.stage ||
    selectedUserId !== (lead.assigned_to || "") ||
    selectedPropertyId !== (lead.property_id || "") ||
    newNote.trim() !== "" ||
    editName.trim() !== (lead.contact_name || "") ||
    editPhone.trim() !== (lead.contact_phone || "") ||
    editBudget !== (lead.budget ? String(lead.budget) : "") ||
    editLocation.trim() !== (lead.location || "");

  const handleUpdate = async () => {
    // Validate editable required fields
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
      const assignedUser = dealerUsers.find((u) => u.id === selectedUserId);
      const selectedProperty = properties.find(
        (p) => p._id === selectedPropertyId,
      );

      const payload = {
        dealer_id: getDealerId(),
        name: editName.trim(),
        phone: editPhone.trim(),
        budget: editBudget ? Number(editBudget) : null,
        location: editLocation.trim() || null,
        stage: selectedStage,
        assigned_to: selectedUserId || null,
        assigned_name: assignedUser?.name || null,
        property_id: selectedPropertyId || null,
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
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-white/60 hover:text-red-300 transition"
              title="Delete lead"
            >
              <Trash2 size={17} />
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

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

          {/* ── Editable Contact Info ── */}
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
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className={`${inputCls} pl-9`}
                    value={editPhone}
                    onChange={(e) => {
                      setEditPhone(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="9876543210"
                  />
                </div>
              </div>
              {lead.contact_email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Mail size={14} className="text-indigo-500 shrink-0" />
                  <span>{lead.contact_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Stage ── */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lead Stage
            </div>
            <div className="flex flex-wrap gap-2">
              {LEAD_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedStage(s);
                    setSaved(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    selectedStage === s
                      ? `${STAGE_COLORS[s].bg} ${STAGE_COLORS[s].text} border-transparent`
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Property Dropdown ── */}
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
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSaved(false);
                }}
                className={`${inputCls} pl-9`}
                disabled={propertiesLoading}
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

          {/* ── Assign To ── */}
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

          {/* ── Editable Budget & Location ── */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={editBudget}
                  onChange={(e) => {
                    setEditBudget(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Location
                </label>
                <input
                  className={inputCls}
                  value={editLocation}
                  onChange={(e) => {
                    setEditLocation(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Noida"
                />
              </div>
            </div>
          </div>

          {/* ── Read-only info grid ── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Source", lead.source || "—"],
              ["Created", lead.created_at],
              ["Last Updated", lead.updated_at],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400">{k}</div>
                <div className="font-semibold text-gray-800 text-sm mt-0.5 truncate">
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* ── Notes ── */}
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
        </div>
      </div>
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
};

/* ── Pagination ──────────────────────────────────────────────────────────────── */
const Pagination = ({ total, page, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
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
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/60">
      <span className="text-xs text-gray-500">
        Showing {Math.min((page - 1) * perPage + 1, total)}–
        {Math.min(page * perPage, total)} of {total} leads
      </span>
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
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────────── */
const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [filterSource, setFilterSource] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/leads/`, {
          params: { dealer_id: getDealerId() },
        });
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

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (
          search &&
          !(l.contact_name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          !(l.contact_phone || "").includes(search) &&
          !(l.property_name || "").toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterStage !== "All" && l.stage !== filterStage) return false;
        if (filterSource !== "All" && l.source !== filterSource) return false;
        return true;
      }),
    [leads, search, filterStage, filterSource],
  );

  const paginated = useMemo(
    () => filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [filtered, page],
  );

  const resetPage = () => setPage(1);

  const handleSave = (newLead) => setLeads((prev) => [newLead, ...prev]);
  const handleUpdated = (updatedLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)),
    );
    setSelectedLead(updatedLead);
    // Recount unassigned after update
    setUnassignedCount((c) =>
      !updatedLead.assigned_to &&
      updatedLead.stage !== "Closed" &&
      updatedLead.stage !== "Lost"
        ? c
        : Math.max(0, c - 1),
    );
  };
  const handleDeleted = (id) =>
    setLeads((prev) => prev.filter((l) => l.id !== id));
  const handleImported = (newLeads) => {
    setLeads((prev) => [...newLeads, ...prev]);
    // Imported leads are unassigned — bump count
    setUnassignedCount((c) => c + newLeads.length);
  };

  const hasFilters = search || filterStage !== "All" || filterSource !== "All";

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Lead Management"
        description="Track, filter and convert all your leads"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
            >
              <Upload size={15} /> Import
            </button>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        }
      />

      {/* API error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Unassigned leads warning ── */}
      {unassignedCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-amber-800">
              {unassignedCount} active lead
              {unassignedCount > 1 ? "s are" : " is"} not assigned to anyone
            </span>
            <p className="text-xs text-amber-600 mt-0.5">
              Unassigned leads may not be followed up. Open each lead and assign
              a team member.
            </p>
          </div>
          <button
            onClick={() => {
              setFilterStage("All");
              setFilterSource("All");
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
            placeholder="Search name, phone, property..."
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
        <select
          value={filterSource}
          onChange={(e) => {
            setFilterSource(e.target.value);
            resetPage();
          }}
          className="px-3 py-2 rounded-xl border bg-white text-sm text-gray-700 shadow-sm outline-none"
        >
          <option value="All">All Sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setFilterStage("All");
              setFilterSource("All");
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
                    {[
                      "Lead",
                      "Phone",
                      "Property",
                      "Budget",
                      "Stage",
                      "Source",
                      "Assigned To",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-indigo-50/40 transition cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(lead.contact_name || "?")[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 whitespace-nowrap">
                              {lead.contact_name || "—"}
                            </span>
                            {lead.notes?.length > 0 && (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                                <StickyNote size={10} />
                                {lead.notes.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.contact_phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                        {lead.property_name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {lead.budget
                          ? `₹${(lead.budget / 100000).toFixed(0)}L`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={lead.source} />
                      </td>
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
                      <td className="px-4 py-3">
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
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
              perPage={ROWS_PER_PAGE}
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
