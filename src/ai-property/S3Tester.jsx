// src/pages/S3Tester.jsx

import axios from "axios";
import { useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  File,
  FolderOpen,
  List,
  Loader,
  RefreshCw,
  Trash2,
  Upload,
  Wifi,
  X,
  ImageIcon,
  Pencil,
} from "lucide-react";
import { BASE_URL } from "./config";

/* ─── helpers ────────────────────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.readAsDataURL(file);
  });

const formatSize = (kb) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

const isImage = (url) =>
  /\.(jpg|jpeg|png|gif|webp|avif|svg|jfif)(\?.*)?$/i.test(url);

/* ─── CopyButton ─────────────────────────────────────────────────────────── */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
      title="Copy URL"
    >
      {copied ? (
        <Check size={13} className="text-emerald-500" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
};

/* ─── StatusBadge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ success, text }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
    ${success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
  >
    {success ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
    {text}
  </span>
);

/* ─── Section ────────────────────────────────────────────────────────────── */
const Section = ({ title, icon: Icon, iconColor, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}
      >
        <Icon size={16} className="text-white" />
      </div>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─── LogEntry ───────────────────────────────────────────────────────────── */
const LogEntry = ({ entry }) => (
  <div
    className={`rounded-xl border px-4 py-3 text-xs font-mono
    ${
      entry.success
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : "bg-red-50 border-red-200 text-red-800"
    }`}
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="font-bold">{entry.action}</span>
      <span className="text-gray-400">{entry.time}</span>
    </div>
    <pre className="whitespace-pre-wrap break-all text-[11px]">
      {JSON.stringify(entry.data, null, 2)}
    </pre>
  </div>
);

/* ─── UpdateModal ────────────────────────────────────────────────────────── */
const UpdateModal = ({ file, folder, onClose, onUpdated, addLog }) => {
  const [newFile, setNewFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewFile(f);
    setPreview(f.type.startsWith("image/") ? await toBase64(f) : null);
    setError("");
  };

  const handleUpdate = async () => {
    if (!newFile) return;
    setUploading(true);
    setError("");
    try {
      // Determine folder from existing key
      const keyFolder = file.key.includes("/")
        ? file.key.substring(0, file.key.lastIndexOf("/"))
        : folder;

      // Step 1 — delete old file
      await axios.delete(`${BASE_URL}/s3/delete`, {
        data: { key: file.key },
      });

      // Step 2 — upload new file to same folder
      const fd = new FormData();
      fd.append("folder", keyFolder);
      fd.append("files", newFile);
      const res = await axios.post(`${BASE_URL}/s3/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploaded = res.data.uploaded?.[0];
      if (!uploaded) throw new Error("Upload returned no data");

      addLog("UPDATE (delete + upload)", true, {
        old_key: file.key,
        new_key: uploaded.key,
        new_url: uploaded.url,
      });

      onUpdated(uploaded);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Update failed";
      setError(msg);
      addLog("UPDATE", false, { error: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <p className="font-bold">Replace File</p>
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-xs">
              {file.key}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Current File
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              {isImage(file.url) ? (
                <img
                  src={file.url}
                  alt={file.key}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <File size={32} className="text-gray-400" />
                </div>
              )}
              <div className="px-3 py-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 truncate">{file.key}</p>
                <p className="text-[10px] text-gray-400">
                  {formatSize(file.size_kb)}
                </p>
              </div>
            </div>
          </div>

          {/* New file */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              New File
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-5 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-32 object-contain rounded-lg mb-2"
                />
              ) : newFile ? (
                <div className="flex items-center gap-2 mb-2">
                  <File size={24} className="text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {newFile.name}
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-indigo-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-700">
                    Click to select new file
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    Any file type · Max 10MB
                  </span>
                </>
              )}
              <input type="file" className="hidden" onChange={handleSelect} />
            </label>
            {newFile && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {newFile.name} · {formatSize(newFile.size / 1024)}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-amber-700 font-medium">
              ⚠ Old file will be deleted. New file gets a new unique name in the
              same folder.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!newFile || uploading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader size={14} className="animate-spin" /> Replacing...
              </>
            ) : (
              <>
                <Upload size={14} /> Replace File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── ImageGallery ───────────────────────────────────────────────────────── */
const ImageGallery = ({ files, onDelete, onUpdate, deleting }) => {
  const images = files.filter((f) => isImage(f.url));
  const nonImages = files.filter((f) => !isImage(f.url));

  if (!files.length) return null;

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Images ({images.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square"
              >
                <img
                  src={f.url}
                  alt={f.key}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                  <button
                    onClick={() => onUpdate(f)}
                    className="w-9 h-9 bg-white rounded-xl flex items-center justify-center hover:bg-indigo-50 transition shadow-lg"
                    title="Replace"
                  >
                    <Pencil size={15} className="text-indigo-600" />
                  </button>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 transition shadow-lg"
                    title="Open"
                  >
                    <ExternalLink size={15} className="text-gray-600" />
                  </a>
                  <button
                    onClick={() => onDelete(f.url)}
                    disabled={deleting}
                    className="w-9 h-9 bg-white rounded-xl flex items-center justify-center hover:bg-red-50 transition shadow-lg"
                    title="Delete"
                  >
                    {deleting ? (
                      <Loader
                        size={15}
                        className="animate-spin text-gray-400"
                      />
                    ) : (
                      <Trash2 size={15} className="text-red-500" />
                    )}
                  </button>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-white truncate">
                    {f.key.split("/").pop()}
                  </p>
                  <p className="text-[9px] text-white/60">
                    {formatSize(f.size_kb)}
                  </p>
                </div>

                {/* Copy — top right */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition">
                  <div className="bg-black/50 rounded-lg">
                    <CopyButton text={f.url} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-image files list */}
      {nonImages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Other Files ({nonImages.length})
          </p>
          <div className="space-y-2">
            {nonImages.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5"
              >
                <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                  <File size={14} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {f.key}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {formatSize(f.size_kb)} · {f.last_modified?.split("T")[0]}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={f.url} />
                  <button
                    onClick={() => onUpdate(f)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 transition text-gray-400 hover:text-indigo-600"
                    title="Replace"
                  >
                    <Pencil size={13} />
                  </button>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => onDelete(f.url)}
                    disabled={deleting}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                  >
                    {deleting ? (
                      <Loader size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════════ */
export default function S3Tester() {
  const inputCls =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

  const [connStatus, setConnStatus] = useState(null);
  const [connLoading, setConnLoading] = useState(false);
  const [folder, setFolder] = useState("test-uploads");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState([]);
  const [listPrefix, setListPrefix] = useState("");
  const [listing, setListing] = useState(false);
  const [listedFiles, setListedFiles] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [bulkTargets, setBulkTargets] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [updateFile, setUpdateFile] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (action, success, data) =>
    setLogs((prev) =>
      [
        { action, success, data, time: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 30),
    );

  /* ── Health ── */
  const checkHealth = async () => {
    setConnLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/s3/health`);
      setConnStatus({ success: true, ...res.data });
      addLog("GET /s3/health", true, res.data);
    } catch (err) {
      const data = err.response?.data || { error: err.message };
      setConnStatus({ success: false, ...data });
      addLog("GET /s3/health", false, data);
    } finally {
      setConnLoading(false);
    }
  };

  /* ── Upload ── */
  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    const withPreviews = await Promise.all(
      selected.map(async (f) => ({
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
        preview: f.type.startsWith("image/") ? await toBase64(f) : null,
      })),
    );
    setFiles((prev) => [...prev, ...withPreviews]);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("folder", folder.trim() || "test-uploads");
      files.forEach((f) => fd.append("files", f.file));
      const res = await axios.post(`${BASE_URL}/s3/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploaded((prev) => [...res.data.uploaded, ...prev]);
      setFiles([]);
      addLog("POST /s3/upload", true, res.data);
      if (listedFiles.length > 0) handleList();
    } catch (err) {
      addLog(
        "POST /s3/upload",
        false,
        err.response?.data || { error: err.message },
      );
    } finally {
      setUploading(false);
    }
  };

  /* ── List ── */
  const handleList = async () => {
    setListing(true);
    try {
      const res = await axios.get(`${BASE_URL}/s3/list`, {
        params: { prefix: listPrefix },
      });
      setListedFiles(res.data.files || []);
      addLog("GET /s3/list", true, {
        count: res.data.count,
        prefix: listPrefix,
      });
    } catch (err) {
      addLog(
        "GET /s3/list",
        false,
        err.response?.data || { error: err.message },
      );
    } finally {
      setListing(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (target) => {
    const t = target || deleteTarget.trim();
    if (!t) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${BASE_URL}/s3/delete`, {
        data: t.startsWith("http") ? { url: t } : { key: t },
      });
      addLog("DELETE /s3/delete", res.data.success, res.data);
      setListedFiles((prev) => prev.filter((f) => f.url !== t && f.key !== t));
      setUploaded((prev) => prev.filter((f) => f.url !== t && f.key !== t));
      if (!target) setDeleteTarget("");
    } catch (err) {
      addLog(
        "DELETE /s3/delete",
        false,
        err.response?.data || { error: err.message },
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    const targets = bulkTargets
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!targets.length) return;
    setBulkDeleting(true);
    try {
      const isUrls = targets[0].startsWith("http");
      const res = await axios.delete(`${BASE_URL}/s3/delete-many`, {
        data: isUrls ? { urls: targets } : { keys: targets },
      });
      addLog("DELETE /s3/delete-many", true, res.data);
      setBulkTargets("");
      handleList();
    } catch (err) {
      addLog(
        "DELETE /s3/delete-many",
        false,
        err.response?.data || { error: err.message },
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  /* ── After update ── */
  const handleUpdated = (newFile) => {
    setUploaded((prev) => [newFile, ...prev]);
    handleList(); // refresh gallery
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">S3 CRUD Tester</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Test S3 connection · upload · list · update · delete
        </p>
      </div>

      {/* 1. Connection */}
      <Section title="1. Test Connection" icon={Wifi} iconColor="bg-indigo-600">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={checkHealth}
            disabled={connLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {connLoading ? (
              <>
                <Loader size={15} className="animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Wifi size={15} /> Check S3 Connection
              </>
            )}
          </button>
          {connStatus && (
            <StatusBadge
              success={connStatus.success}
              text={
                connStatus.success
                  ? `Connected · ${connStatus.bucket}`
                  : "Connection failed"
              }
            />
          )}
        </div>
        {connStatus && (
          <div
            className={`mt-3 rounded-xl p-3 text-xs font-mono ${connStatus.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
          >
            <pre>{JSON.stringify(connStatus, null, 2)}</pre>
          </div>
        )}
      </Section>

      {/* 2. Upload */}
      <Section title="2. Upload Files" icon={Upload} iconColor="bg-violet-600">
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            S3 Folder / Prefix
          </label>
          <input
            className={inputCls}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="test-uploads"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Saved as:{" "}
            <code className="bg-gray-100 px-1 rounded">
              {folder.trim() || "test-uploads"}/filename_uuid.ext
            </code>
          </p>
        </div>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition mb-3">
          <Upload size={28} className="text-gray-400 mb-2" />
          <span className="text-sm font-semibold text-gray-700">
            Click to select files
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            Any file type · Max 10MB each
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>

        {files.length > 0 && (
          <div className="space-y-2 mb-3">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200"
              >
                {f.preview ? (
                  <img
                    src={f.preview}
                    alt={f.name}
                    className="w-10 h-10 object-cover rounded-lg border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <File size={16} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {f.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatSize(f.size / 1024)} · {f.type}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFiles((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!files.length || uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader size={15} className="animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload size={15} /> Upload{" "}
              {files.length > 0 ? `${files.length} file(s)` : ""} to S3
            </>
          )}
        </button>

        {uploaded.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Uploaded this session ({uploaded.length})
            </p>
            {uploaded.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5"
              >
                {isImage(f.url) ? (
                  <img
                    src={f.url}
                    alt={f.filename}
                    className="w-10 h-10 object-cover rounded-lg border shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <File size={16} className="text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    {f.filename}
                  </p>
                  <p className="text-[11px] text-emerald-600 truncate">
                    {f.url}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {formatSize(f.size_kb)} · {f.key}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={f.url} />
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-emerald-100 transition text-emerald-600"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() =>
                      setUpdateFile({
                        key: f.key,
                        url: f.url,
                        size_kb: f.size_kb,
                      })
                    }
                    className="p-1.5 rounded-lg hover:bg-indigo-50 transition text-gray-400 hover:text-indigo-600"
                    title="Replace"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(f.url)}
                    disabled={deleting}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 3. List + Gallery */}
      <Section
        title="3. List & Manage Files (Gallery)"
        icon={FolderOpen}
        iconColor="bg-cyan-600"
      >
        <div className="flex gap-3 mb-4">
          <input
            className={`${inputCls} flex-1`}
            value={listPrefix}
            onChange={(e) => setListPrefix(e.target.value)}
            placeholder="Prefix filter e.g. test-uploads/ (blank = all)"
          />
          <button
            onClick={handleList}
            disabled={listing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition disabled:opacity-60 shrink-0"
          >
            {listing ? (
              <>
                <Loader size={15} className="animate-spin" /> Listing...
              </>
            ) : (
              <>
                <RefreshCw size={15} /> List Files
              </>
            )}
          </button>
        </div>

        {listedFiles.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {listedFiles.length} file(s) · hover image for actions
              </p>
              <button
                onClick={handleList}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
            <ImageGallery
              files={listedFiles}
              onDelete={handleDelete}
              onUpdate={(f) => setUpdateFile(f)}
              deleting={deleting}
            />
          </>
        )}

        {listedFiles.length === 0 && !listing && (
          <div className="text-center py-8 text-gray-400">
            <ImageIcon size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">
              Click "List Files" to browse your S3 bucket
            </p>
            <p className="text-xs mt-1">
              Images show in grid · other files show in list
            </p>
          </div>
        )}
      </Section>

      {/* 4. Delete one */}
      <Section
        title="4. Delete Single File"
        icon={Trash2}
        iconColor="bg-red-500"
      >
        <div className="flex gap-3">
          <input
            className={`${inputCls} flex-1`}
            value={deleteTarget}
            onChange={(e) => setDeleteTarget(e.target.value)}
            placeholder="Paste S3 URL or key"
          />
          <button
            onClick={() => handleDelete()}
            disabled={!deleteTarget.trim() || deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 shrink-0"
          >
            {deleting ? (
              <>
                <Loader size={15} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} /> Delete
              </>
            )}
          </button>
        </div>
      </Section>

      {/* 5. Bulk delete */}
      <Section title="5. Bulk Delete" icon={Trash2} iconColor="bg-rose-600">
        <textarea
          className={`${inputCls} resize-none mb-3`}
          rows={4}
          value={bulkTargets}
          onChange={(e) => setBulkTargets(e.target.value)}
          placeholder={
            "One URL or key per line:\nhttps://bucket.s3.amazonaws.com/test-uploads/img1.jpg"
          }
        />
        <button
          onClick={handleBulkDelete}
          disabled={!bulkTargets.trim() || bulkDeleting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50"
        >
          {bulkDeleting ? (
            <>
              <Loader size={15} className="animate-spin" /> Deleting...
            </>
          ) : (
            <>
              <Trash2 size={15} /> Bulk Delete
            </>
          )}
        </button>
      </Section>

      {/* Log */}
      {logs.length > 0 && (
        <Section title="Activity Log" icon={List} iconColor="bg-gray-600">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear log
          </button>
        </Section>
      )}

      {/* Update modal */}
      {updateFile && (
        <UpdateModal
          file={updateFile}
          folder={folder}
          onClose={() => setUpdateFile(null)}
          onUpdated={handleUpdated}
          addLog={addLog}
        />
      )}
    </div>
  );
}
