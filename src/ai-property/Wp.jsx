import { useState } from "react";

const API_BASE = "https://realty.cloudoniqtechnologies.com/api";

const LogEntry = ({ entry }) => (
  <div
    className={`font-mono text-xs border-l-2 pl-3 py-1 ${
      entry.type === "success"
        ? "border-emerald-500 text-emerald-300"
        : entry.type === "error"
          ? "border-red-500 text-red-300"
          : entry.type === "info"
            ? "border-blue-500 text-blue-300"
            : "border-zinc-600 text-zinc-400"
    }`}
  >
    <span className="text-zinc-500 mr-2">{entry.time}</span>
    {entry.message}
  </div>
);

export default function WhatsAppTester() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("hello_world");
  const [lang, setLang] = useState("en_US");
  const [logs, setLogs] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

  const addLog = (message, type = "info") => {
    const time = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLogs((prev) => [{ message, type, time }, ...prev]);
  };

  const formatPhone = (val) => val.replace(/\D/g, "");

  const sendTemplate = async () => {
    if (!phone) return addLog("⚠ Phone number is required", "error");
    setLoadingAction("template");
    addLog(`Sending template "${template}" to ${phone}...`, "info");
    try {
      const res = await fetch(
        `${API_BASE}/whatsapp/send-template?to=${phone}&template_name=${template}&lang=${lang}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) {
        addLog(`✓ Template sent! Message ID: ${data.message_id}`, "success");
      } else {
        addLog(`✗ Failed: ${JSON.stringify(data.detail || data)}`, "error");
      }
    } catch (err) {
      addLog(`✗ Network error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const sendMessage = async () => {
    if (!phone) return addLog("⚠ Phone number is required", "error");
    if (!message.trim()) return addLog("⚠ Message cannot be empty", "error");
    setLoadingAction("message");
    addLog(`Sending message to ${phone}...`, "info");
    try {
      const res = await fetch(`${API_BASE}/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message }),
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`✓ Message sent! Message ID: ${data.message_id}`, "success");
        setMessage("");
      } else {
        addLog(`✗ Failed: ${JSON.stringify(data.detail || data)}`, "error");
      }
    } catch (err) {
      addLog(`✗ Network error: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const pingServer = async () => {
    setLoadingAction("ping");
    addLog("Pinging server...", "info");
    try {
      const res = await fetch(`${API_BASE}`);
      const data = await res.json();
      addLog(`✓ Server is alive: ${JSON.stringify(data)}`, "success");
    } catch (err) {
      addLog(`✗ Server unreachable: ${err.message}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              WhatsApp API Tester
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">{API_BASE}</p>
          </div>
          <button
            onClick={pingServer}
            disabled={!!loadingAction}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-40"
          >
            {loadingAction === "ping" ? "Pinging..." : "⚡ Ping Server"}
          </button>
        </div>

        {/* Shared Phone Input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Recipient Phone Number
          </label>
          <input
            type="text"
            placeholder="919XXXXXXXXX (with country code, no +)"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <p className="text-xs text-zinc-600 mt-1.5">
            Example: 919876543210 → 91 (India) + 10-digit number
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Template Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span>📋</span>
              <h2 className="text-sm font-semibold text-white">
                Send Template Message
              </h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                First message only
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">
                  Language
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
            </div>
            <button
              onClick={sendTemplate}
              disabled={!!loadingAction}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingAction === "template" ? "Sending..." : "Send Template →"}
            </button>
          </div>

          {/* Free Text Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span>✉️</span>
              <h2 className="text-sm font-semibold text-white">
                Send Free Text Message
              </h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                After user replies
              </span>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5">
                Message
              </label>
              <textarea
                rows={3}
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!!loadingAction}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingAction === "message" ? "Sending..." : "Send Message →"}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-400/80">
          <span className="font-semibold text-amber-400">💡 Reminder: </span>
          Always send a <strong>template first</strong>. After the user replies,
          you have a <strong>24hr window</strong> to send free-form messages.
          Incoming messages appear in your{" "}
          <span className="font-mono bg-amber-500/10 px-1 rounded">
            server logs
          </span>{" "}
          only — not here.
        </div>

        {/* Activity Log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Activity Log
              </span>
              {logs.length > 0 && (
                <span className="text-xs text-zinc-600">({logs.length})</span>
              )}
            </div>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="p-4 space-y-2 min-h-32 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-zinc-700 text-center py-8">
                No activity yet — ping the server or send a message to get
                started.
              </p>
            ) : (
              logs.map((entry, i) => <LogEntry key={i} entry={entry} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
