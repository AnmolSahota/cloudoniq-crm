import React, { useEffect, useState } from "react";
import { getProspect } from "../ai-property/prospectApi";

const ProspectView = () => {
  const [data, setData] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [leads, setLeads] = useState([]);

  // ✅ Fetch ALL leads
  useEffect(() => {
    fetch(`http://localhost:8081/api/leads`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Leads API Response:", data);

        if (Array.isArray(data)) {
          setLeads(data);
        } else if (Array.isArray(data.data)) {
          setLeads(data.data);
        } else {
          setLeads([]);
        }
      })
      .catch((err) => {
        console.error("Leads fetch error:", err);
      });
  }, []);

  // ✅ Fetch prospect
  useEffect(() => {
    if (!selectedLeadId) return;

    getProspect(selectedLeadId)
      .then((res) => {
        console.log("Prospect API:", res);
        setData(res);
      })
      .catch(console.error);
  }, [selectedLeadId]);

 return (
  <div style={{ padding: "30px", fontFamily: "Arial", background: "#f5f6fa", minHeight: "100vh" }}>
    
    <h2 style={{ marginBottom: "20px" }}>📊 Prospect Dashboard</h2>

    {/* DROPDOWN CARD */}
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "20px",
      maxWidth: "400px"
    }}>
      <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
        Select Lead
      </label>

      <select
        value={selectedLeadId}
        onChange={(e) => {
          setSelectedLeadId(e.target.value);
          setData(null);
        }}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      >
        <option value="">Select Lead</option>

        {leads.map((lead, index) => {
          const id = lead._id?.$oid || lead._id || lead.id;

          return (
            <option key={id || index} value={id}>
              {lead.name
                ? `${lead.name} (${lead.phone || ""})`
                : lead.phone || `Lead ${index + 1}`}
            </option>
          );
        })}
      </select>
    </div>

    {/* STATES */}
    {!selectedLeadId && <p style={{ color: "#777" }}>Please select a lead</p>}
    {selectedLeadId && !data && <p>Loading Prospect...</p>}

    {/* MAIN GRID */}
    {data && (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px"
      }}>

        {/* CURRENT LEAD */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>👤 Current Lead</h3>

          <p><b>Name:</b> {data.prospect?.name}</p>
          <p><b>Phone:</b> {data.prospect?.phone}</p>
          <p><b>Budget:</b> ₹{data.current_lead?.budget}</p>
          <p><b>Location:</b> {data.current_lead?.location}</p>
          <p><b>Stage:</b> {data.current_lead?.stage}</p>
          <p><b>BHK:</b> {data.current_lead?.bhk}</p>
          <p><b>Possession:</b> {data.current_lead?.possession}</p>
        </div>

        {/* PAST LEADS */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>📜 Past Leads</h3>

          {data.past_leads?.length === 0 ? (
            <p>No past leads</p>
          ) : (
            data.past_leads.map((lead, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                ₹{lead.budget} — {lead.location}
              </div>
            ))
          )}
        </div>

        {/* VISITS */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>📅 Visits</h3>

          {data.visits?.length === 0 ? (
            <p>No visits</p>
          ) : (
            data.visits.map((v, i) => (
              <div key={i}>
                {v.visit_date || "No date"}
              </div>
            ))
          )}
        </div>

        {/* TASKS */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h3>📝 Tasks</h3>

          {data.tasks?.length === 0 ? (
            <p>No tasks</p>
          ) : (
            data.tasks.map((t, i) => (
              <div key={i}>{t.title || "Task"}</div>
            ))
          )}
        </div>

      </div>
    )}
  </div>
);
};

export default ProspectView;