import React, { useEffect, useState } from "react";
import { getProspect } from "../ai-property/prospectApi";

const ProspectView = () => {
  const [data, setData] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [leads, setLeads] = useState([]);

  // Fetch leads
  useEffect(() => {
    fetch(`http://localhost:8081/api/leads`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
        else if (Array.isArray(data.data)) setLeads(data.data);
        else setLeads([]);
      })
      .catch(console.error);
  }, []);

  // Fetch prospect
  useEffect(() => {
    if (!selectedLeadId) return;

    getProspect(selectedLeadId)
      .then(setData)
      .catch(console.error);
  }, [selectedLeadId]);

  return (
    <div style={{
      padding: "30px",
      fontFamily: "Inter, sans-serif",
      background: "#f6f7fb",
      minHeight: "100vh"
    }}>

      {/* HEADER */}
      <h1 style={{ fontWeight: "700" }}>Prospect Dashboard</h1>
      <p style={{ color: "#666" }}>Lead insights and activity overview</p>

      {/* STATS BAR */}
      {data && (
        <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
          <div style={badge}>👤 1 Lead</div>
          <div style={badge}>📅 {data.visits?.length || 0} Visits</div>
          <div style={badge}>📝 {data.tasks?.length || 0} Tasks</div>
        </div>
      )}

      {/* SELECT */}
      <div style={card}>
        <select
          value={selectedLeadId}
          onChange={(e) => {
            setSelectedLeadId(e.target.value);
            setData(null);
          }}
          style={select}
        >
          <option value="">Select Lead</option>

          {leads.map((lead, i) => {
            const id = lead._id?.$oid || lead._id || lead.id;

            return (
              <option key={id || i} value={id}>
                {lead.name
                  ? `${lead.name} (${lead.phone || ""})`
                  : lead.phone || `Lead ${i + 1}`}
              </option>
            );
          })}
        </select>
      </div>

      {!selectedLeadId && <p style={{ color: "#888" }}>Select a lead</p>}
      {selectedLeadId && !data && <p>Loading...</p>}

      {/* MAIN LAYOUT */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>

          {/* LEFT BIG CARD */}
          <div style={card}>
            <div style={gradientHeader}>
              Lead Details
            </div>

            <div style={{ padding: "20px" }}>
              <p><b>Name:</b> {data.prospect?.name}</p>
              <p><b>Phone:</b> {data.prospect?.phone}</p>
              <p><b>Budget:</b> ₹{data.current_lead?.budget}</p>
              <p><b>Location:</b> {data.current_lead?.location}</p>
              <p><b>Stage:</b> {data.current_lead?.stage}</p>
              <p><b>BHK:</b> {data.current_lead?.bhk}</p>
              <p><b>Possession:</b> {data.current_lead?.possession}</p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* VISITS */}
            <div style={card}>
              <div style={header}>📅 Visits</div>

              <div style={{ padding: "15px" }}>
                {data.visits?.length === 0 ? (
                  <p style={empty}>No visits</p>
                ) : (
                  data.visits.map((v, i) => (
                    <div key={i} style={item}>
                      📍 {v.type || "Visit"} <br />
                      📅 {v.date || "No date"}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TASKS */}
            <div style={card}>
              <div style={header}>📝 Tasks</div>

              <div style={{ padding: "15px" }}>
                {data.tasks?.length === 0 ? (
                  <p style={empty}>No tasks</p>
                ) : (
                  data.tasks.map((t, i) => (
                    <div key={i} style={item}>
                      ✔ {t.type || "Task"} <br />
                      📅 {t.date}
                      <br />
                      <span style={status(t.status)}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 STYLES

const card = {
  background: "#fff",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  overflow: "hidden"
};

const gradientHeader = {
  background: "linear-gradient(90deg, #4f46e5, #9333ea)",
  color: "#fff",
  padding: "15px 20px",
  fontWeight: "600"
};

const header = {
  padding: "15px 20px",
  borderBottom: "1px solid #eee",
  fontWeight: "600"
};

const select = {
  width: "100%",
  padding: "12px",
  border: "none",
  outline: "none"
};

const item = {
  padding: "10px",
  borderBottom: "1px solid #f1f1f1"
};

const empty = {
  color: "#999"
};

const badge = {
  background: "#e0e7ff",
  padding: "8px 12px",
  borderRadius: "20px",
  fontSize: "14px"
};

const status = (s) => ({
  fontSize: "12px",
  padding: "4px 8px",
  borderRadius: "6px",
  background:
    s === "pending" ? "#ffeaa7" :
    s === "in_progress" ? "#74b9ff" :
    "#55efc4"
});

export default ProspectView;