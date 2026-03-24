import React, { useEffect, useState } from "react";
import { getProspect } from "../ai-property/prospectApi";

const ProspectView = () => {
  const [data, setData] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [leads, setLeads] = useState([]);

  // ✅ fetch ALL leads
  useEffect(() => {
    fetch(`http://localhost:8081/api/leads`)
      .then((res) => res.json())
      .then((res) => {
        console.log("Leads API Response:", res);

        if (Array.isArray(res)) {
          setLeads(res);
        } else if (Array.isArray(res.data)) {
          setLeads(res.data);
        } else {
          setLeads([]);
        }
      })
      .catch((err) => {
        console.error("Leads fetch error:", err);
      });
  }, []);

  // ✅ fetch prospect
  useEffect(() => {
    if (!selectedLeadId) return;

    getProspect(selectedLeadId)
      .then((res) => {
        console.log("Prospect API:", res);
        setData(res);
      })
      .catch(console.error);
  }, [selectedLeadId]);

  console.log("Leads array:", leads); // 🔍 DEBUG

  return (
    <div style={{ padding: "20px" }}>
      <h2>Prospect Details</h2>

      {/* ✅ DROPDOWN */}
      <select
        value={selectedLeadId}
        onChange={(e) => {
          setSelectedLeadId(e.target.value);
          setData(null);
        }}
        style={{
          marginBottom: "20px",
          padding: "8px",
          width: "300px",
        }}
      >
        <option value="">Select Lead</option>

        {leads.length === 0 && (
          <option disabled>No leads found</option>
        )}

        {/* 🔥 FIXED MAPPING */}
        {leads.map((lead, index) => {
          const id =
            lead._id?.$oid ||   // if Mongo raw
            lead._id ||         // normal case
            lead.id ||          // fallback
            lead.lead_id;       // fallback

          return (
            <option key={id || index} value={id}>
              {lead.name || lead.phone || id}
            </option>
          );
        })}
      </select>

      {/* STATES */}
      {!selectedLeadId && <div>Please select a lead</div>}
      {selectedLeadId && !data && <div>Loading Prospect...</div>}

      {/* DATA */}
      {data && (
        <>
          <h3>Current Lead</h3>
          <pre>{JSON.stringify(data.current_lead, null, 2)}</pre>

          <h3>Past Leads</h3>
          <pre>{JSON.stringify(data.past_leads, null, 2)}</pre>

          <h3>Visits</h3>
          <pre>{JSON.stringify(data.visits, null, 2)}</pre>

          <h3>Tasks</h3>
          <pre>{JSON.stringify(data.tasks, null, 2)}</pre>
        </>
      )}
    </div>
  );
};

export default ProspectView;