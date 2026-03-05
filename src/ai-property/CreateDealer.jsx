import { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  User,
  MapPin,
  Image,
  Calendar,
  ToggleRight,
  Link,
  Pencil,
} from "lucide-react";
import { BASE_URL } from "./config";
import Input from "../ui/Input";

/* ----------------------------------------
   Helper: business name → slug
---------------------------------------- */
const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-"); // collapse double hyphens

/* ----------------------------------------
   Initial form state
---------------------------------------- */
const INITIAL_FORM_STATE = {
  businessName: "",
  websiteSlug: "",
  businessEmail: "",
  businessPhone: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  logoFile: null,
  city: "",
  state: "",
  country: "India",
  joined_at: "",
  is_active: true,
};

const CreateDealer = () => {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [slugEdited, setSlugEdited] = useState(false); // true once user manually edits slug
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());

  /* ----------------------------------------
     Auto-generate slug from business name.
     Stops auto-generating once user manually
     edits the slug field.
  ---------------------------------------- */
  useEffect(() => {
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, websiteSlug: toSlug(prev.businessName) }));
    }
  }, [form.businessName, slugEdited]);

  /* ----------------------------------------
     Handlers
  ---------------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlugChange = (e) => {
    // sanitize on every keystroke — only valid slug chars allowed
    const sanitized = toSlug(e.target.value);
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, websiteSlug: sanitized }));
  };

  // If user clears the slug, hand control back to auto-generate
  const handleSlugBlur = () => {
    if (!form.websiteSlug) {
      setSlugEdited(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, logoFile: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("email", form.adminEmail);
      formData.append("password", form.adminPassword);
      formData.append("role", "DEALER");
      formData.append("name", form.adminName);
      formData.append("business_name", form.businessName);
      formData.append("slug", form.websiteSlug);
      formData.append("business_email", form.businessEmail);
      formData.append("business_phone", form.businessPhone || "");
      formData.append("city", form.city);
      formData.append("state", form.state || "");
      formData.append("country", form.country);
      formData.append("is_active", form.is_active ? "true" : "false");

      if (form.joined_at) formData.append("joined_at", form.joined_at);
      if (form.logoFile) formData.append("logo", form.logoFile);

      await axios.post(`${BASE_URL}/auth/create-user`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Dealer created successfully 🎉");
      setForm(INITIAL_FORM_STATE);
      setSlugEdited(false);
      setFileKey(Date.now());
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Property Dealer
          </h1>
          <p className="text-gray-500 mt-1">
            Onboard a new dealer and instantly generate their website
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Business Info ───────────────────────────────────────── */}
          <Section
            title="Business Information"
            icon={<Building2 size={20} />}
            description="Core details used to identify the dealer and generate their website"
          >
            <Input
              label="Business Name"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="ABC Properties"
              required
            />

            {/* Slug field — auto-generated, manually editable */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Website Slug <span className="text-red-500">*</span>
                </label>
                {slugEdited ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Pencil size={11} /> Custom slug
                  </span>
                ) : (
                  <span className="text-xs text-indigo-500 font-medium">
                    Auto-generated
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                {/* URL prefix */}
                <span className="absolute left-3 text-xs text-gray-400 select-none pointer-events-none whitespace-nowrap">
                  yourapp.com/
                </span>
                <input
                  name="websiteSlug"
                  value={form.websiteSlug}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  placeholder="abc-properties"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-[102px] pr-9 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white text-gray-800"
                />
                <Link
                  size={14}
                  className="absolute right-3 text-gray-400 pointer-events-none"
                />
              </div>

              <p className="text-xs text-gray-400">
                {slugEdited
                  ? "Custom — only lowercase letters, numbers and hyphens. Clear to revert to auto."
                  : "Automatically set from business name. Edit it anytime."}
              </p>
            </div>

            <Input
              label="Business Email"
              name="businessEmail"
              type="email"
              value={form.businessEmail}
              onChange={handleChange}
              placeholder="contact@abcproperties.com"
              required
            />
            <Input
              label="Business Phone"
              name="businessPhone"
              value={form.businessPhone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </Section>

          {/* ── Admin Account ────────────────────────────────────────── */}
          <Section
            title="Dealer Admin Account"
            icon={<User size={20} />}
            description="Login credentials for the property dealer"
          >
            <Input
              label="Admin Name"
              name="adminName"
              value={form.adminName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            <Input
              label="Admin Email"
              name="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={handleChange}
              placeholder="admin@abcproperties.com"
              required
            />
            <Input
              label="Temporary Password"
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              onChange={handleChange}
              placeholder="Set a temporary password"
              required
            />
          </Section>

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Section
            title="Dealer Logo"
            icon={<Image size={20} />}
            description="Logo will be shown on the dealer website"
          >
            <div className="md:col-span-2">
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {form.logoFile && (
                <p className="text-sm text-green-600 mt-2">
                  Selected: {form.logoFile.name}
                </p>
              )}
            </div>
          </Section>

          {/* ── Location ─────────────────────────────────────────────── */}
          <Section
            title="Location"
            icon={<MapPin size={20} />}
            description="Used for listings, website content and SEO"
          >
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Noida"
              required
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Uttar Pradesh"
            />
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="India"
            />
          </Section>

          {/* ── Onboarding ───────────────────────────────────────────── */}
          <Section
            title="Onboarding"
            icon={<Calendar size={20} />}
            description="Set the dealer's join date and initial account status"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Joined Date{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                name="joined_at"
                value={form.joined_at}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-gray-50 focus:bg-white text-gray-700"
              />
              <p className="text-xs text-gray-400">
                When the dealer officially joined. Defaults to today if left
                blank.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Account Status
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
                }
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all w-fit ${
                  form.is_active
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                <ToggleRight
                  size={20}
                  className={`transition-transform ${
                    form.is_active
                      ? "text-emerald-500"
                      : "text-gray-300 rotate-180"
                  }`}
                />
                <span className="text-sm font-semibold">
                  {form.is_active ? "Active" : "Inactive"}
                </span>
              </button>
              <p className="text-xs text-gray-400">
                Inactive dealers cannot log in until activated.
              </p>
            </div>
          </Section>

          {/* Error */}
          {error && (
            <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {loading ? "Creating..." : "Create Dealer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------
   Reusable Section wrapper
---------------------------------------- */
const Section = ({ title, icon, description, children }) => (
  <div className="bg-white rounded-2xl border shadow-sm p-6">
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

export default CreateDealer;
