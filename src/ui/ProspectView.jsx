import React, { useEffect, useState } from "react";
import { getProspect } from "../ai-property/prospectApi";

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const stageStyle = (s) => {
  if (s === "New enquiry")    return { background: "#dbeafe", color: "#1e40af" };
  if (s === "Site visit done") return { background: "#ede9fe", color: "#5b21b6" };
  if (s === "Negotiation")    return { background: "#fef3c7", color: "#92400e" };
  return                               { background: "#d1fae5", color: "#065f46" };
};

const taskStyle = (s) => {
  if (s === "pending")    return { background: "#fef3c7", color: "#92400e" };
  if (s === "in_progress") return { background: "#dbeafe", color: "#1e40af" };
  return                           { background: "#d1fae5", color: "#065f46" };
};

const FILTERS = ["All", "New enquiry", "Site visit done", "Negotiation"];

const styles = {
  page:      { padding: "24px", fontFamily: "'Inter', sans-serif", background: "#f5f6fa", minHeight: "100vh" },
  title:     { fontSize: "20px", fontWeight: "600", color: "#111", marginBottom: "2px" },
  sub:       { fontSize: "13px", color: "#888", marginBottom: "18px" },
  statsRow:  { display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" },
  stat:      { background: "#fff", border: "1px solid #ececec", borderRadius: "10px", padding: "12px 18px", flex: 1, minWidth: "90px" },
  statN:     { fontSize: "20px", fontWeight: "600", color: "#111" },
  statL:     { fontSize: "11px", color: "#888", marginTop: "2px" },
  searchRow: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" },
  searchBox: { flex: 1, minWidth: "180px", padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none" },
  tblWrap:   { background: "#fff", border: "1px solid #ececec", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" },
  th:        { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#999", background: "#f9f9f9", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  td:        { padding: "11px 14px", fontSize: "13px", color: "#111", borderBottom: "1px solid #f7f7f7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" },
  av:        { width: "28px", height: "28px", borderRadius: "50%", background: "#ede9fe", color: "#6d28d9", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600", marginRight: "8px", flexShrink: 0 },
  badge:     (style) => ({ display: "inline-block", padding: "2px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: "500", ...style }),
  detail:    { background: "#fff", border: "1px solid #ececec", borderRadius: "12px", overflow: "hidden" },
  dHead:     { padding: "16px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "12px" },
  dAv:       { width: "44px", height: "44px", borderRadius: "50%", background: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "600", flexShrink: 0 },
  dName:     { fontSize: "15px", fontWeight: "600", color: "#111" },
  dPhone:    { fontSize: "12px", color: "#888", marginTop: "2px" },
  dBody:     { display: "grid", gridTemplateColumns: "1fr 1fr" },
  dSection:  (right) => ({ padding: "14px 18px", borderLeft: right ? "1px solid #f0f0f0" : "none" }),
  secTitle:  { fontSize: "11px", fontWeight: "600", color: "#aaa", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "10px" },
  field:     { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f7f7f7", gap: "8px" },
  fk:        { fontSize: "12px", color: "#888" },
  fv:        { fontSize: "12px", fontWeight: "500", color: "#111", textAlign: "right" },
  actItem:   { padding: "8px 10px", border: "1px solid #f0f0f0", borderRadius: "8px", marginBottom: "6px" },
  actTop:    { display: "flex", justifyContent: "space-between", alignItems: "center" },
  actT:      { fontSize: "12px", fontWeight: "500", color: "#111" },
  actD:      { fontSize: "11px", color: "#aaa", marginTop: "3px" },
  placeholder: { textAlign: "center", padding: "2rem", color: "#bbb", fontSize: "13px", border: "1px dashed #e0e0e0", borderRadius: "12px" },
  filterBtn: (active) => ({
    padding: "6px 13px", fontSize: "12px", border: "1px solid #e0e0e0",
    borderRadius: "8px", cursor: "pointer",
    background: active ? "#dbeafe" : "#fff",
    color: active ? "#1e40af" : "#888",
    borderColor: active ? "#93c5fd" : "#e0e0e0",
  }),
};

const ProspectView = () => {
  const [leads, setLeads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("http://localhost:8081/api/leads")
      .then((r) => r.json())
      .then((r) => setLeads(Array.isArray(r) ? r : r.data || []))
      .catch(console.error);
  }, []);

  const handleSelect = (lead) => {
    const id = lead._id?.$oid || lead._id || lead.id;
    setSelectedId(id);
    setDetail(null);
    setLoading(true);
    getProspect(id)
      .then((d) => { setDetail(d); setLoading(false); })
      .catch((e) => { console.error(e); setLoading(false); });
  };

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.current_lead?.location?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || l.current_lead?.stage === filter;
    return matchSearch && matchFilter;
  });

  const totalVisits = leads.reduce((a, l) => a + (l.visits?.length || 0), 0);
  const openTasks = detail?.tasks?.filter((t) => t.status !== "done").length || 0;

  return (
    <div style={styles.page}>
      <div style={styles.title}>Prospects</div>
      <div style={styles.sub}>Click any row to view full details</div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          ["Total leads", leads.length],
          ["New enquiry", leads.filter((l) => l.current_lead?.stage === "New enquiry").length],
          ["Total visits", totalVisits],
        ].map(([label, n]) => (
          <div key={label} style={styles.stat}>
            <div style={styles.statN}>{n}</div>
            <div style={styles.statL}>{label.toLowerCase()}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={styles.searchRow}>
        <input
          style={styles.searchBox}
          placeholder="Search by name, phone or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {FILTERS.map((f) => (
          <button key={f} style={styles.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tblWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {[["Name","25%"],["Phone","17%"],["BHK","12%"],["Location","18%"],["Budget","14%"],["Stage","14%"]].map(([h,w]) => (
                <th key={h} style={{ ...styles.th, width: w }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#bbb", padding: "2rem" }}>No results</td></tr>
            ) : filtered.map((lead, i) => {
              const id = lead._id?.$oid || lead._id || lead.id;
              const isSelected = selectedId === id;
              return (
                <tr
                  key={id || i}
                  onClick={() => handleSelect(lead)}
                  style={{ cursor: "pointer", background: isSelected ? "#eff6ff" : "transparent" }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f9f9f9"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={styles.av}>{getInitials(lead.name || "")}</div>
                      {lead.name || "—"}
                    </div>
                  </td>
                  <td style={styles.td}>{lead.phone || "—"}</td>
                  <td style={styles.td}>{lead.current_lead?.bhk || "—"}</td>
                  <td style={styles.td}>{lead.current_lead?.location || "—"}</td>
                  <td style={styles.td}>{lead.current_lead?.budget ? `₹${lead.current_lead.budget}` : "—"}</td>
                  <td style={styles.td}>
                    {lead.current_lead?.stage
                      ? <span style={styles.badge(stageStyle(lead.current_lead.stage))}>{lead.current_lead.stage}</span>
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {!selectedId && <div style={styles.placeholder}>Select a prospect from the table above to view details</div>}
      {selectedId && loading && <div style={styles.placeholder}>Loading...</div>}
      {detail && !loading && (() => {
        const p = detail.prospect;
        const l = detail.current_lead;
        const visits = detail.visits || [];
        const tasks = detail.tasks || [];
        return (
          <div style={styles.detail}>
            <div style={styles.dHead}>
              <div style={styles.dAv}>{getInitials(p?.name || "")}</div>
              <div>
                <div style={styles.dName}>{p?.name || "—"}</div>
                <div style={styles.dPhone}>{p?.phone || "—"}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={styles.badge(stageStyle(l?.stage))}>{l?.stage}</span>
              </div>
            </div>
            <div style={styles.dBody}>
              {/* Left — info + visits */}
              <div style={styles.dSection(false)}>
                <div style={styles.secTitle}>Lead info</div>
                {[["Budget", l?.budget ? `₹${l.budget}` : "—"], ["Location", l?.location || "—"], ["BHK", l?.bhk || "—"], ["Possession", l?.possession || "—"]].map(([k, v]) => (
                  <div key={k} style={styles.field}>
                    <span style={styles.fk}>{k}</span>
                    <span style={styles.fv}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: "14px" }}>
                  <div style={styles.secTitle}>Visits ({visits.length})</div>
                  {visits.length === 0
                    ? <div style={{ fontSize: "12px", color: "#bbb", padding: "6px 0" }}>No visits yet</div>
                    : visits.map((v, i) => (
                      <div key={i} style={styles.actItem}>
                        <div style={styles.actTop}>
                          <span style={styles.actT}>{v.type}</span>
                          <span style={{ fontSize: "11px", color: "#aaa" }}>{v.date}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {/* Right — tasks */}
              <div style={styles.dSection(true)}>
                <div style={styles.secTitle}>Tasks ({openTasks} open)</div>
                {tasks.length === 0
                  ? <div style={{ fontSize: "12px", color: "#bbb", padding: "6px 0" }}>No tasks</div>
                  : tasks.map((t, i) => (
                    <div key={i} style={styles.actItem}>
                      <div style={styles.actTop}>
                        <span style={styles.actT}>{t.type}</span>
                        <span style={styles.badge(taskStyle(t.status))}>
                          {t.status === "in_progress" ? "in progress" : t.status}
                        </span>
                      </div>
                      <div style={styles.actD}>{t.date}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ProspectView;