import axios from "axios";
import {
  Bed,
  Check,
  Home,
  ImageIcon,
  IndianRupee,
  MapPin,
  Plus,
  Sparkles,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "./config";
import { PageHeader } from "./SharedComponents";
import { bhkOptions } from "./mockData";

/* ─── AUTH HELPERS ─────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};
const getDealerId = () => {
  const u = getAuthUser();
  return u.role === "DEALER_USER" ? u.dealer_id || "" : u.id || "";
};

/* ─── MONTHS ────────────────────────────────────────────────────────────── */
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ─── MONTH/YEAR PICKER ─────────────────────────────────────────────────── */
function MonthYearPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const ref = useRef(null);

  // Parse display value
  const displayValue = value && value !== "Ready to Move" ? value : null;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMonthSelect = (monthIdx) => {
    const label = `${MONTH_NAMES[monthIdx]} ${pickerYear}`;
    onChange(label);
    setOpen(false);
  };

  const handleReadyToMove = () => {
    onChange("Ready to Move");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between
          ${
            error
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : open
                ? "border-indigo-500 bg-indigo-50/30"
                : "border-gray-200 bg-white hover:border-indigo-300"
          }`}
      >
        <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
          {value || "Select possession date"}
        </span>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-indigo-100/50 overflow-hidden">
          {/* Ready to Move */}
          <button
            type="button"
            onClick={handleReadyToMove}
            className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors border-b border-gray-100
              ${
                value === "Ready to Move"
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
          >
            ✓ Ready to Move
          </button>

          {/* Year nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              disabled={pickerYear <= today.getFullYear()}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="font-bold text-gray-800 text-sm">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              disabled={pickerYear >= today.getFullYear() + 5}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Months grid */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTH_NAMES.map((m, i) => {
              const isSelected = value === `${m} ${pickerYear}`;
              const isPast =
                pickerYear === today.getFullYear() && i < today.getMonth();
              return (
                <button
                  key={m}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleMonthSelect(i)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all
                    ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md"
                        : isPast
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FIELD ERROR ───────────────────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
      <AlertCircle size={12} /> {msg}
    </p>
  ) : null;

/* ─── INPUT WRAPPER ─────────────────────────────────────────────────────── */
const InputField = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
      {Icon && <Icon size={14} className="text-indigo-500" />}
      {label}
      <span className="text-red-400 ml-0.5">*</span>
    </label>
    {children}
    <FieldError msg={error} />
  </div>
);

/* ─── MAIN COMPONENT ────────────────────────────────────────────────────── */
export default function AddPropertyForm() {
  const [formData, setFormData] = useState({
    project_name: "",
    location: "",
    price: "",
    bhk: "",
    possession: "",
    highlights: "",
  });

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState(null);
  const [touched, setTouched] = useState({});

  const amenitiesList = [
    "Swimming Pool",
    "Gym",
    "Garden",
    "Clubhouse",
    "Park",
    "Sports Court",
    "Cricket Turf",
    "Kids Play Area",
    "Temple Garden",
    "Indoor Games",
    "Yoga Deck",
    "Spa",
    "Yoga Center",
    "Meditation Area",
    "Security",
    "Power Backup",
    "Parking",
    "Elevator",
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        setUserData(JSON.parse(stored));
      } else {
        toast.error("Please login to add properties");
      }
    } catch {
      toast.error("Failed to load user data. Please login again.");
    }
  }, []);

  /* ─── Validation ── */
  const validate = (
    data = formData,
    amenities = selectedAmenities,
    imgs = images,
  ) => {
    const errs = {};
    if (!data.project_name.trim())
      errs.project_name = "Project name is required";
    if (!data.location.trim()) errs.location = "Location is required";
    if (!data.price || parseInt(data.price) <= 0)
      errs.price = "Enter a valid price";
    if (!data.bhk) errs.bhk = "Please select BHK type";
    if (!data.possession) errs.possession = "Please select possession date";
    if (amenities.length === 0) errs.amenities = "Select at least one amenity";
    if (imgs.length === 0) errs.images = "At least one image is required";
    return errs;
  };

  // Live-validate a single field on blur/change
  const validateField = (name, value) => {
    const single = validate(
      { ...formData, [name]: value },
      selectedAmenities,
      images,
    );
    setErrors((prev) => ({ ...prev, [name]: single[name] }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  /* ─── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all fields touched
    setTouched({
      project_name: true,
      location: true,
      price: true,
      bhk: true,
      possession: true,
    });

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErrEl = document.querySelector("[data-field-error]");
      firstErrEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Uploading property...");

    try {
      const dealerId = getDealerId();
      if (!dealerId)
        throw new Error("Dealer ID not found. Please login again.");

      const propertyData = {
        project_name: formData.project_name.trim(),
        location: formData.location.trim(),
        price: parseInt(formData.price),
        bhk: formData.bhk,
        possession: formData.possession, // ✅ format preserved as-is
        highlights: formData.highlights.trim(),
        amenities: selectedAmenities,
      };

      const fd = new FormData();
      fd.append("dealer_id", dealerId);
      fd.append("properties", JSON.stringify([propertyData]));
      images.forEach((img) => fd.append("images", img.file));

      await axios.post(`${BASE_URL}/properties/add`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.dismiss(loadingToast);
      toast.success("Property added successfully!");
      resetForm();
    } catch (error) {
      toast.dismiss(loadingToast);
      let msg = "Failed to add property. Please try again.";
      if (error.response) {
        msg =
          error.response.data?.detail ||
          error.response.data?.message ||
          `Server Error: ${error.response.status}`;
      } else if (error.request) {
        msg = "No response from server. Please check your connection.";
      } else {
        msg = error.message;
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: "",
      location: "",
      price: "",
      bhk: "",
      possession: "",
      highlights: "",
    });
    setSelectedAmenities([]);
    setImages([]);
    setErrors({});
    setTouched({});
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) => {
      const next = prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity];
      setErrors((e) => ({
        ...e,
        amenities:
          next.length === 0 ? "Select at least one amenity" : undefined,
      }));
      return next;
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [],
      invalid = [];
    files.forEach((f) => {
      if (!f.type.startsWith("image/"))
        invalid.push(`${f.name} (not an image)`);
      else if (f.size > 10 * 1024 * 1024) invalid.push(`${f.name} (max 10MB)`);
      else valid.push(f);
    });
    if (invalid.length) toast.error(`Skipped: ${invalid.join(", ")}`);
    const newImgs = valid.map((f) => ({
      name: f.name,
      preview: URL.createObjectURL(f),
      file: f,
    }));
    setImages((prev) => {
      const next = [...prev, ...newImgs];
      setErrors((e) => ({
        ...e,
        images:
          next.length === 0 ? "At least one image is required" : undefined,
      }));
      return next;
    });
    if (valid.length) toast.success(`Added ${valid.length} image(s)`);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setErrors((e) => ({
        ...e,
        images:
          next.length === 0 ? "At least one image is required" : undefined,
      }));
      return next;
    });
  };

  useEffect(
    () => () => images.forEach((img) => URL.revokeObjectURL(img.preview)),
    [],
  );

  const formatPrice = (value) => {
    if (!value) return "";
    const num = parseInt(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  /* ── Section header helper ── */
  const SectionHeader = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    subtitle,
  }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
      <div
        className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Add New Property"
          description="List your property with complete details"
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* ── Project Details ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
            <SectionHeader
              icon={Home}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              title="Project Details"
              subtitle="Core information about the property"
            />

            <div className="grid md:grid-cols-2 gap-5">
              {/* Project Name */}
              <div
                className="md:col-span-2"
                data-field-error={errors.project_name ? true : undefined}
              >
                <InputField
                  label="Project Name"
                  icon={Home}
                  error={errors.project_name}
                >
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) =>
                      handleChange("project_name", e.target.value)
                    }
                    onBlur={() => handleBlur("project_name")}
                    placeholder="e.g., Lodha Splendora"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium outline-none
                      ${
                        errors.project_name
                          ? "border-red-400 bg-red-50 focus:border-red-500"
                          : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300"
                      }`}
                  />
                </InputField>
              </div>

              {/* Location */}
              <div data-field-error={errors.location ? true : undefined}>
                <InputField
                  label="Location"
                  icon={MapPin}
                  error={errors.location}
                >
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    onBlur={() => handleBlur("location")}
                    placeholder="e.g., Ghodbunder Road, Thane"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium outline-none
                      ${
                        errors.location
                          ? "border-red-400 bg-red-50 focus:border-red-500"
                          : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300"
                      }`}
                  />
                </InputField>
              </div>

              {/* Price */}
              <div data-field-error={errors.price ? true : undefined}>
                <InputField
                  label="Price (₹)"
                  icon={IndianRupee}
                  error={errors.price}
                >
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    onBlur={() => handleBlur("price")}
                    placeholder="e.g., 7500000"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium outline-none
                      ${
                        errors.price
                          ? "border-red-400 bg-red-50 focus:border-red-500"
                          : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300"
                      }`}
                  />
                  {formData.price && !errors.price && (
                    <p className="text-indigo-600 text-xs mt-1.5 font-semibold">
                      {formatPrice(formData.price)}
                    </p>
                  )}
                </InputField>
              </div>

              {/* BHK */}
              <div data-field-error={errors.bhk ? true : undefined}>
                <InputField label="BHK Type" icon={Bed} error={errors.bhk}>
                  <select
                    value={formData.bhk}
                    onChange={(e) => handleChange("bhk", e.target.value)}
                    onBlur={() => handleBlur("bhk")}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium outline-none appearance-none bg-white cursor-pointer
                      ${
                        errors.bhk
                          ? "border-red-400 bg-red-50 focus:border-red-500"
                          : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300"
                      }`}
                  >
                    <option value="">Select BHK type</option>
                    {bhkOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </InputField>
              </div>

              {/* Possession — Month/Year Picker */}
              <div data-field-error={errors.possession ? true : undefined}>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="text-indigo-500">📅</span>
                  Possession Date
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <MonthYearPicker
                  value={formData.possession}
                  onChange={(val) => {
                    handleChange("possession", val);
                    setTouched((p) => ({ ...p, possession: true }));
                  }}
                  error={errors.possession}
                />
                <FieldError msg={errors.possession} />
              </div>
            </div>
          </div>

          {/* ── Highlights ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
            <SectionHeader
              icon={Sparkles}
              iconBg="bg-amber-50"
              iconColor="text-amber-500"
              title="Property Highlights"
              subtitle="What makes this property stand out? (optional)"
            />
            <textarea
              rows={3}
              value={formData.highlights}
              onChange={(e) =>
                setFormData({ ...formData, highlights: e.target.value })
              }
              disabled={isSubmitting}
              placeholder="e.g., Highway touch property near D-Mart, Close to metro station..."
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 hover:border-indigo-300 outline-none transition-all resize-none text-sm"
            />
          </div>

          {/* ── Amenities ── */}
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6"
            data-field-error={errors.amenities ? true : undefined}
          >
            <SectionHeader
              icon={Check}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              title="Amenities"
              subtitle="Select all available amenities"
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {amenitiesList.map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    disabled={isSubmitting}
                    className={`px-3.5 py-2.5 rounded-xl border-2 transition-all font-medium text-xs flex items-center gap-2 text-left
                      ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                          : errors.amenities
                            ? "border-red-200 bg-red-50 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                            : "border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                      }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
                      ${active ? "bg-white border-white" : "border-gray-300"}`}
                    >
                      {active && (
                        <Check
                          size={10}
                          className="text-indigo-600 stroke-[3]"
                        />
                      )}
                    </span>
                    {amenity}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {errors.amenities ? (
                <FieldError msg={errors.amenities} />
              ) : selectedAmenities.length > 0 ? (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={12} /> {selectedAmenities.length} amenities
                  selected
                </p>
              ) : (
                <span />
              )}
              {selectedAmenities.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAmenities([]);
                    setErrors((e) => ({
                      ...e,
                      amenities: "Select at least one amenity",
                    }));
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* ── Images ── */}
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6"
            data-field-error={errors.images ? true : undefined}
          >
            <SectionHeader
              icon={ImageIcon}
              iconBg="bg-pink-50"
              iconColor="text-pink-500"
              title="Property Images"
              subtitle="Upload high quality photos — PNG, JPG up to 10MB each"
            />

            {/* Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={img.preview}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={13} />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all
              ${
                errors.images
                  ? "border-red-300 bg-red-50/50 hover:border-red-400"
                  : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSubmitting}
              />
              <Upload
                size={36}
                className={
                  errors.images ? "text-red-300 mb-3" : "text-gray-400 mb-3"
                }
              />
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Click to upload property images
              </p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
              {images.length > 0 && (
                <p className="text-xs text-indigo-600 font-semibold mt-2">
                  {images.length} image{images.length > 1 ? "s" : ""} selected
                </p>
              )}
            </label>

            {errors.images && <FieldError msg={errors.images} />}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isSubmitting || !userData}
            className={`w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200
              ${
                isSubmitting || !userData
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-indigo-700 active:scale-[0.99]"
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading Property…
              </>
            ) : (
              <>
                <Plus size={20} />
                Add Property to Listings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
