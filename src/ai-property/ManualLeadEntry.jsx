// src/pages/dealer/ManualLeadEntry.jsx

import {
  Building2,
  Phone,
  UserPlus,
  Users
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "./SharedComponents";
import { LEAD_SOURCES, MOCK_PROPERTIES } from "./mockData";

const INIT = {
  name: "",
  phone: "",
  email: "",
  propertyId: "",
  budget: "",
  location: "",
  source: "Manual",
  assignedTo: "",
  notes: "",
  followUpDate: "",
};

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border shadow-sm p-6">
    <div className="flex items-center gap-2 mb-5 pb-3 border-b">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white";

const ManualLeadEntry = () => {
  const [form, setForm] = useState(INIT);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New lead:", form);
    setSuccess(true);
    setForm(INIT);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <PageHeader
        title="Add Lead Manually"
        description="Enter leads from phone calls, walk-ins, referrals or offline campaigns"
      />

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm font-medium">
          ✅ Lead added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Contact Information" icon={<Users size={16} />}>
          <Field label="Full Name" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Rahul Verma"
              required
            />
          </Field>
          <Field label="Phone Number" required>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="9876543210"
              required
            />
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="rahul@email.com"
            />
          </Field>
          <Field label="Lead Source">
            <select
              className={inputCls}
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Property Interest" icon={<Building2 size={16} />}>
          <Field label="Interested Property">
            <select
              className={inputCls}
              value={form.propertyId}
              onChange={(e) => set("propertyId", e.target.value)}
            >
              <option value="">Select a property...</option>
              {MOCK_PROPERTIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Budget (₹)">
            <input
              type="number"
              className={inputCls}
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              placeholder="4500000"
            />
          </Field>
          <Field label="Preferred Location">
            <input
              className={inputCls}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Noida, Sector 62"
            />
          </Field>
          <Field label="Assigned To">
            <input
              className={inputCls}
              value={form.assignedTo}
              onChange={(e) => set("assignedTo", e.target.value)}
              placeholder="Sales person name"
            />
          </Field>
        </Section>

        <Section title="Follow-up & Notes" icon={<Phone size={16} />}>
          <Field label="Follow-up Date">
            <input
              type="date"
              className={inputCls}
              value={form.followUpDate}
              onChange={(e) => set("followUpDate", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                className={`${inputCls} h-24 resize-none`}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any relevant details about this lead..."
              />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm(INIT)}
            className="px-5 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow hover:opacity-90 transition flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Lead
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualLeadEntry;
