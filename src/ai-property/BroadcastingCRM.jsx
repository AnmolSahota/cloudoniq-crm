// src/pages/dealer/BroadcastingCRM.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Megaphone,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Home,
} from "lucide-react";
import { PageHeader } from "./SharedComponents";
import { BASE_URL } from "./config";

const getDealerId = () =>
  JSON.parse(localStorage.getItem("auth_user"))?.id || "";

const fmtPrice = (p) =>
  p >= 10000000
    ? `₹${(p / 10000000).toFixed(2)} Cr`
    : p >= 100000
      ? `₹${(p / 100000).toFixed(2)} Lac`
      : `₹${p?.toLocaleString("en-IN") ?? "—"}`;

const BroadcastingCRM = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProps, setSelectedProps] = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(
    "🏠 Exclusive Properties Alert! Your dream home awaits. Check out these handpicked options just for you! 🌟",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const dealerId = getDealerId();

    const loadPropertiesAndLeads = async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          axios.get(`${BASE_URL}/properties/list`, {
            params: { dealer_id: dealerId },
          }),
          axios.get(`${BASE_URL}/leads/`, {
            params: { dealer_id: dealerId },
          }),
        ]);
        if (pRes.data.success) setProperties(pRes.data.properties || []);
        // only count active leads (not Lost/Closed) as broadcast recipients
        const active = (lRes.data.data || []).filter(
          (l) => l.stage !== "Lost" && l.stage !== "Closed",
        );
        setTotalLeads(active.length);
      } catch {
        setResult({ type: "error", message: "Failed to load data." });
      } finally {
        setPropsLoading(false);
      }
    };

    // ✅ NEW: Fetch broadcast history
    const loadBroadcastHistory = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/broadcast/history`, {
          params: { dealer_id: dealerId, limit: 50 },
        });
        if (res.data.success) {
          setHistory(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load broadcast history:", err);
        // Don't show error banner for history - it's not critical
      } finally {
        setHistoryLoading(false);
      }
    };

    loadPropertiesAndLeads();
    loadBroadcastHistory();
  }, []);

  const toggleProp = (prop) =>
    setSelectedProps((prev) =>
      prev.some((p) => p._id === prop._id)
        ? prev.filter((p) => p._id !== prop._id)
        : [...prev, prop],
    );

  const toggleAll = () =>
    setSelectedProps(
      selectedProps.length === properties.length ? [] : [...properties],
    );

  const handleSend = async () => {
    if (selectedProps.length === 0) {
      setResult({
        type: "error",
        message: "Please select at least one property.",
      });
      return;
    }
    if (!message.trim()) {
      setResult({ type: "error", message: "Please enter a message." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formattedProps = selectedProps.map((p) => ({
        name: p.project_name,
        location: p.location,
        price: fmtPrice(p.price),
        bhk: p.bhk,
        possession: p.possession,
        amenities: p.amenities,
        highlights: p.highlights || "",
        images: p.images,
      }));

      const res = await axios.post(`${BASE_URL}/api/admin/broadcast`, {
        dealer_id: getDealerId(),
        message: message.trim(),
        properties: formattedProps,
      });

      if (res.data.success) {
        setResult({
          type: "success",
          message: `Broadcast sent to ${res.data.websocket_sent} online users, saved for ${res.data.mongodb_saved} users.`,
        });
        // prepend to local history so UI updates instantly
        setHistory((prev) => [
          {
            id: Date.now(),
            message: message.trim(),
            total_leads: res.data.total_users,
            ws_sent: res.data.websocket_sent,
            db_saved: res.data.mongodb_saved,
            sent_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => {
          setSelectedProps([]);
          setMessage(
            "🏠 Exclusive Properties Alert! Your dream home awaits. Check out these handpicked options just for you! 🌟",
          );
          setResult(null);
        }, 5000);
      } else {
        throw new Error("Broadcast failed");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      // detail can be a string or a Pydantic validation array — handle both
      const msg = Array.isArray(detail)
        ? detail.map((e) => `${e.loc?.join(".")}: ${e.msg}`).join(", ")
        : detail || err.response?.data?.message || "Failed to send broadcast.";
      setResult({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Broadcasting"
        description="Send property updates to all your leads"
      />

      {/* result banner */}
      {result && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            result.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle size={16} className="shrink-0" />
          ) : (
            <XCircle size={16} className="shrink-0" />
          )}
          {result.message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── LEFT: Property selection + Compose ── */}
        <div className="space-y-4">
          {/* Property selection */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-800">Select Properties</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {selectedProps.length}/{properties.length} selected
                </span>
                {properties.length > 0 && (
                  <button
                    onClick={toggleAll}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    {selectedProps.length === properties.length
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              {propsLoading ? (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span className="text-sm">Loading properties…</span>
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                  <Home size={32} className="text-gray-300" />
                  <span className="text-sm font-medium">
                    No properties found
                  </span>
                  <span className="text-xs">
                    Add properties first to start broadcasting
                  </span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {properties.map((prop) => {
                    const sel = selectedProps.some((p) => p._id === prop._id);
                    return (
                      <div
                        key={prop._id}
                        onClick={() => toggleProp(prop)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                          sel
                            ? "bg-indigo-50 border-indigo-300"
                            : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                            sel
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {sel && (
                            <CheckCircle size={13} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-800 truncate">
                            {prop.project_name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {prop.location}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {prop.bhk}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            {fmtPrice(prop.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Compose */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4">Compose Broadcast</h2>

            {/* Recipients pill — all active leads */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl mb-4">
              <Users size={16} className="text-indigo-500" />
              <span className="text-sm text-indigo-800 font-semibold">
                {totalLeads} recipients
              </span>
              <span className="text-xs text-indigo-400">
                · all active leads
              </span>
            </div>

            {/* Message */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Message
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none disabled:opacity-60"
                placeholder="Type your broadcast message… e.g., 🏡 New property launched at Sector 62! Starting ₹45L."
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {message.length} chars
              </div>
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={
                loading ||
                !message.trim() ||
                selectedProps.length === 0 ||
                propsLoading
              }
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition ${
                !loading && message.trim() && selectedProps.length > 0
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow hover:opacity-90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Broadcasting…
                </>
              ) : (
                <>
                  <Send size={16} /> Broadcast ({selectedProps.length}{" "}
                  {selectedProps.length === 1 ? "property" : "properties"})
                </>
              )}
            </button>
            {selectedProps.length === 0 && !propsLoading && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Select at least one property to broadcast
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: History ── */}
        <div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b font-bold text-gray-800 flex items-center gap-2">
              <Megaphone size={15} className="text-indigo-500" /> Broadcast
              History
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {history.length} broadcasts
              </span>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {historyLoading ? (
                <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span className="text-sm">Loading history…</span>
                </div>
              ) : history.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No broadcasts sent yet
                </div>
              ) : (
                history.map((h, index) => (
                  <div
                    key={h._id || h.id || index}
                    className="px-4 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="text-sm text-gray-800 font-medium line-clamp-2">
                      {h.message}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-600">
                        ✓ {h.ws_sent ?? h.sent ?? 0} online · {h.db_saved ?? 0}{" "}
                        saved
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {h.sent_at
                          ? new Date(h.sent_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : h.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastingCRM;
