import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Search,
  Edit,
  Trash2,
  MapPin,
  Bed,
  Calendar,
  IndianRupee,
  Home,
  X,
  Loader,
  Check,
  Sparkles,
  ImageIcon,
  Upload,
  Building2,
  Ruler,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
} from "lucide-react";
import { BASE_URL } from "./config";
import { PageHeader } from "./SharedComponents";
import { AMENITIES_BY_TYPE, bhkOptions, PROPERTY_TYPES } from "./mockData";
import imageCompression from "browser-image-compression";

/* ─── S3 IMAGE URL ──────────────────────────────────────────────────────── */
const S3_PUBLIC_URL =
  process.env.REACT_APP_S3_PUBLIC_URL ||
  "https://s3.ap-south-1.amazonaws.com/realty.cloudoniqtechnologies.com";

const getImageUrl = (keyOrUrl) => {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  if (keyOrUrl.startsWith("dealers/")) return `${S3_PUBLIC_URL}/${keyOrUrl}`;
  return `${BASE_URL}/${keyOrUrl}`;
};

/* ─── AUTH HELPERS ──────────────────────────────────────────────────────── */
const getAuthUser = () => JSON.parse(localStorage.getItem("auth_user")) || {};
const getDealerId = () => {
  const u = getAuthUser();
  return u.role === "DEALER_USER" ? u.dealer_id || "" : u.id || "";
};

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
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


/* ─── FORMAT PRICE ───────────────────────────────────────────────────────── */
const formatPrice = (value) => {
  if (!value) return "";
  const num = parseInt(value);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
  return `₹${num.toLocaleString("en-IN")}`;
};

/* ─── BHK DISPLAY ────────────────────────────────────────────────────────── */
const getBhkDisplay = (property) => {
  if (Array.isArray(property.bhk_configs) && property.bhk_configs.length > 0) {
    return property.bhk_configs.map((c) => c.bhk).join(", ");
  }
  return property.bhk || "—";
};

/* ─── SHARED UI COMPONENTS ───────────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
      <AlertCircle size={12} /> {msg}
    </p>
  ) : null;

const InputField = ({
  label,
  icon: Icon,
  error,
  required = true,
  children,
}) => (
  <div>
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
      {Icon && <Icon size={14} className="text-indigo-500" />}
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    <FieldError msg={error} />
  </div>
);

const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
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

/* ─── MONTH/YEAR PICKER ─────────────────────────────────────────────────── */
function MonthYearPicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMonthSelect = (monthIdx) => {
    onChange(`${MONTH_NAMES[monthIdx]} ${pickerYear}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 rounded-xl border-2 text-left transition-all
                    flex items-center justify-between bg-white
          ${
            error
              ? "border-red-400 bg-red-50"
              : open
                ? "border-indigo-500"
                : "border-gray-200 hover:border-indigo-300"
          }`}
      >
        <span
          className={
            value
              ? "text-gray-900 font-medium text-sm"
              : "text-gray-400 text-sm"
          }
        >
          {value || "Select possession date"}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-72 bg-white rounded-2xl border
                        border-gray-200 shadow-2xl shadow-indigo-100/50 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => {
              onChange("Ready to Move");
              setOpen(false);
            }}
            className={`w-full px-4 py-3 text-left text-sm font-semibold
                        transition-colors border-b border-gray-100
              ${
                value === "Ready to Move"
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-600 hover:bg-indigo-50"
              }`}
          >
            ✓ Ready to Move
          </button>
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

/* ─── BHK + CARPET AREA ROWS ────────────────────────────────────────────── */
function BhkCarpetRows({ selectedBhks, carpetAreas, onCarpetChange, errors }) {
  if (selectedBhks.length === 0) return null;
  return (
    <div className="mt-5 space-y-3">
      <p
        className="text-xs font-semibold text-gray-500 uppercase tracking-wider
                    flex items-center gap-1.5"
      >
        <Ruler size={12} className="text-indigo-400" />
        Carpet Area per BHK Type
      </p>
      {selectedBhks.map((bhk) => (
        <div
          key={bhk}
          className="flex items-center gap-3 bg-indigo-50/40 border border-indigo-100
                     rounded-xl px-4 py-3"
        >
          <span
            className="shrink-0 bg-indigo-600 text-white text-xs font-bold
                           px-3 py-1.5 rounded-lg min-w-[80px] text-center"
          >
            {bhk}
          </span>
          <div className="flex-1 relative">
            <input
              type="number"
              value={carpetAreas[bhk] || ""}
              onChange={(e) => onCarpetChange(bhk, e.target.value)}
              placeholder="e.g., 650"
              min={1}
              className={`w-full px-3 py-2 rounded-lg border-2 text-sm font-medium
                          outline-none transition-all
                ${
                  errors?.[`carpet_${bhk}`]
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300 bg-white"
                }`}
            />
          </div>
          <span
            className="shrink-0 text-xs font-semibold text-gray-500
                           bg-gray-100 px-3 py-2 rounded-lg"
          >
            sq. ft
          </span>
        </div>
      ))}
      {selectedBhks.map((bhk) =>
        errors?.[`carpet_${bhk}`] ? (
          <FieldError key={`err-${bhk}`} msg={errors[`carpet_${bhk}`]} />
        ) : null,
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN — ManageProperties
══════════════════════════════════════════════════════════════════════════ */
export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const dealerId = getDealerId();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/properties/list`, {
        params: { dealer_id: dealerId },
      });
      if (res.data.success) setProperties(res.data.properties);
    } catch (err) {
      console.error("❌ Error fetching properties:", err);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) =>
    p.project_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const confirmDelete = async () => {
    const prop = properties.find((p) => p._id === deleteModal);
    if (!prop) {
      setDeleteModal(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await axios.delete(
        `${BASE_URL}/properties/delete/${dealerId}/${deleteModal}`,
      );
      if (res.data.success) {
        setProperties((prev) => prev.filter((p) => p._id !== deleteModal));
        toast.success(`"${prop.project_name}" deleted successfully`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Property not found or already deleted");
        fetchProperties();
      } else {
        toast.error("Failed to delete property");
      }
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const handleUpdateSuccess = (updated) => {
    setProperties((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p)),
    );
    setEditModal(null);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50
                    to-indigo-50 p-4 md:p-8"
    >
      <div className="space-y-6">
        {/* ── Delete modal ── */}
        {deleteModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50
                          flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full
                            p-8 animate-scale-in"
            >
              <div
                className="w-16 h-16 bg-red-100 rounded-full flex items-center
                              justify-center mx-auto mb-4"
              >
                {deleting ? (
                  <Loader className="text-red-600 animate-spin" size={32} />
                ) : (
                  <Trash2 className="text-red-600" size={32} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                {deleting ? "Deleting..." : "Delete Property?"}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {deleting ? (
                  "Please wait..."
                ) : (
                  <>
                    Are you sure you want to delete "
                    {
                      properties.find((p) => p._id === deleteModal)
                        ?.project_name
                    }
                    "? This action cannot be undone.
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200
                             text-gray-800 rounded-xl font-semibold transition
                             disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600
                             to-pink-600 text-white rounded-xl font-semibold
                             transition shadow-lg flex items-center justify-center
                             gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit modal ── */}
        {editModal && (
          <EditPropertyModal
            property={editModal}
            dealerId={dealerId}
            onClose={() => setEditModal(null)}
            onUpdateSuccess={handleUpdateSuccess}
          />
        )}

        <PageHeader
          title="Manage Properties"
          description={
            loading
              ? "Loading..."
              : `${properties.length} ${properties.length === 1 ? "property" : "properties"} listed`
          }
        />

        {/* ── Search & toggle ── */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search properties by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-blue-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              {["grid", "list"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition capitalize
                    ${viewMode === mode ? "bg-white shadow" : "text-gray-600 hover:text-gray-900"}
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader
              className="mx-auto text-blue-600 mb-4 animate-spin"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Loading Properties...
            </h3>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Home className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No properties found
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try adjusting your search"
                : properties.length === 0
                  ? "Start by adding your first property"
                  : "No matching properties"}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                viewMode={viewMode}
                onEdit={(id) =>
                  setEditModal(properties.find((p) => p._id === id))
                }
                onDelete={(id) => setDeleteModal(id)}
              />
            ))}
          </div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <div className="text-center text-gray-500 text-sm">
            Showing {filteredProperties.length} of {properties.length}{" "}
            properties
          </div>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EDIT PROPERTY MODAL
══════════════════════════════════════════════════════════════════════════ */
function EditPropertyModal({ property, dealerId, onClose, onUpdateSuccess }) {
  const [formData, setFormData] = useState({
    project_name: property.project_name || "",
    location: property.location || "",
    price: property.price?.toString() || "",
    possession: property.possession || "",
    highlights: property.highlights || "",
    property_type: property.property_type || "",
    area_sqft: property.area_sqft?.toString() || "",
  });

  /* ─── Pre-fill BHK from bhk_configs ── */
  const initBhks = () =>
    Array.isArray(property.bhk_configs)
      ? property.bhk_configs.map((c) => c.bhk)
      : [];

  const initCarpetAreas = () => {
    const map = {};
    if (Array.isArray(property.bhk_configs)) {
      property.bhk_configs.forEach((c) => {
        if (c.carpet_area_sqft) map[c.bhk] = c.carpet_area_sqft.toString();
      });
    }
    return map;
  };

  const [selectedBhks, setSelectedBhks] = useState(initBhks);
  const [carpetAreas, setCarpetAreas] = useState(initCarpetAreas);
  const [selectedAmenities, setSelectedAmenities] = useState(
    property.amenities || [],
  );
  const [existingImages, setExistingImages] = useState(property.images || []);
  const [newImages, setNewImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* ─── Derived flags ── */
  const isResidential = formData.property_type === "Residential";
  const hasAreaField = ["Shop", "Office"].includes(formData.property_type);
  const isPlotOrAgri = ["Plot", "Agri"].includes(formData.property_type);
  const totalImages = existingImages.length + newImages.length;

  /* ─── Dynamic amenities list based on property type ──
     Since type is read-only in edit, this list is fixed
     but we still filter to show only relevant amenities  ── */
  const amenitiesList = AMENITIES_BY_TYPE[formData.property_type] || [];

  /* ─── Filter out any saved amenities that don't belong
     to current type (handles old data inconsistency)    ── */
  const validSavedAmenities = (property.amenities || []).filter((a) =>
    amenitiesList.includes(a),
  );

  // Use validSavedAmenities as initial state instead of raw property.amenities
  const [amenitiesReady, setAmenitiesReady] = useState(false);
  useEffect(() => {
    if (!amenitiesReady) {
      setSelectedAmenities(validSavedAmenities);
      setAmenitiesReady(true);
    }
  }, []);

  const areaLabel = isPlotOrAgri
    ? formData.property_type === "Agri"
      ? "Area (Guntha / Acre)"
      : "Plot Area"
    : "Carpet / Built-up Area";
  const areaPlaceholder = isPlotOrAgri
    ? formData.property_type === "Agri"
      ? "e.g., 40 (guntha)"
      : "e.g., 1200 (sq. ft)"
    : "e.g., 850";
  const areaUnit = isPlotOrAgri
    ? formData.property_type === "Agri"
      ? "Guntha"
      : "sq. ft"
    : "sq. ft";

  /* ─── Validation ── */
  const validate = (
    data = formData,
    bhks = selectedBhks,
    areas = carpetAreas,
    totalImgs = totalImages,
  ) => {
    const errs = {};
    if (!data.project_name.trim())
      errs.project_name = "Project name is required";
    if (!data.location.trim()) errs.location = "Location is required";
    if (!data.price || parseInt(data.price) <= 0)
      errs.price = "Enter a valid price";
    if (!data.possession) errs.possession = "Please select possession date";

    if (data.property_type === "Residential") {
      if (bhks.length === 0) errs.bhk = "Select at least one BHK type";
      bhks.forEach((bhk) => {
        if (!areas[bhk] || parseInt(areas[bhk]) <= 0)
          errs[`carpet_${bhk}`] = `Enter carpet area for ${bhk}`;
      });
    }

    if (["Shop", "Office", "Plot", "Agri"].includes(data.property_type)) {
      if (!data.area_sqft || parseInt(data.area_sqft) <= 0)
        errs.area_sqft = "Enter a valid area";
    }

    // ✅ Amenities optional — no validation
    // Images still required
    if (totalImgs === 0) errs.images = "At least one image is required";

    return errs;
  };

  const validateField = (name, value) => {
    const single = validate({ ...formData, [name]: value });
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

  /* ─── BHK toggle ── */
  const toggleBhk = (bhk) => {
    setSelectedBhks((prev) => {
      const next = prev.includes(bhk)
        ? prev.filter((b) => b !== bhk)
        : [...prev, bhk];
      if (!next.includes(bhk)) {
        setCarpetAreas((a) => {
          const c = { ...a };
          delete c[bhk];
          return c;
        });
      }
      setErrors((e) => ({
        ...e,
        bhk: next.length === 0 ? "Select at least one BHK type" : undefined,
      }));
      return next;
    });
  };

  const handleCarpetChange = (bhk, value) => {
    setCarpetAreas((prev) => ({ ...prev, [bhk]: value }));
    setErrors((prev) => ({
      ...prev,
      [`carpet_${bhk}`]:
        !value || parseInt(value) <= 0
          ? `Enter carpet area for ${bhk}`
          : undefined,
    }));
  };

  /* ─── Amenity toggle — no error tracking (optional) ── */
  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  /* ─── Image upload ── */
  const handleImageUpload = async (e) => {
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
    if (!valid.length) return;

    setCompressing(true);
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };
    try {
      const compressed = await Promise.all(
        valid.map(async (f) => {
          const compressedFile = await imageCompression(f, options);
          const preview =
            await imageCompression.getDataUrlFromFile(compressedFile);
          return { name: f.name, preview, file: compressedFile };
        }),
      );
      setNewImages((prev) => {
        const next = [...prev, ...compressed];
        setErrors((e) => ({
          ...e,
          images:
            next.length + existingImages.length === 0
              ? "At least one image is required"
              : undefined,
        }));
        return next;
      });
      toast.success(`Added ${valid.length} image(s)`);
    } catch {
      toast.error("Failed to compress images. Please try again.");
    } finally {
      setCompressing(false);
    }
  };

  /* ─── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      project_name: true,
      location: true,
      price: true,
      possession: true,
      area_sqft: true,
    });

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted errors before saving");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Saving changes...");

    try {
      const fd = new FormData();

      const updatedData = {
        project_name: formData.project_name.trim(),
        location: formData.location.trim(),
        price: parseInt(formData.price),
        property_type: formData.property_type,
        possession: formData.possession,
        highlights: formData.highlights.trim(),
        amenities: selectedAmenities, // [] is valid — optional
        ...(isResidential && {
          bhk_configs: selectedBhks.map((bhk) => ({
            bhk,
            carpet_area_sqft: parseInt(carpetAreas[bhk]),
          })),
        }),
        ...((hasAreaField || isPlotOrAgri) && {
          area_sqft: parseInt(formData.area_sqft),
        }),
      };

      fd.append("property_data", JSON.stringify(updatedData));
      fd.append("deleted_images", JSON.stringify(deletedImages));
      newImages.forEach((img) => fd.append("images", img.file));

      const res = await axios.put(
        `${BASE_URL}/properties/update/${dealerId}/${property._id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      toast.dismiss(loadingToast);

      if (res.data.success) {
        toast.success(
          `"${res.data.property.project_name}" updated successfully!`,
        );
        onUpdateSuccess(res.data.property);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.detail || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ── */
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full
                        max-h-[90vh] overflow-y-auto animate-scale-in"
        >
          {/* Sticky header */}
          <div
            className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4
                          rounded-t-3xl z-10 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Edit size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Property
                </h2>
                <p className="text-xs text-gray-400">
                  {property.property_type} · {property.project_name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                         bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
            {/* ══ PROJECT DETAILS ══ */}
            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
              data-field-error={
                errors.project_name ||
                errors.location ||
                errors.price ||
                errors.possession
                  ? true
                  : undefined
              }
            >
              <SectionHeader
                icon={Home}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
                title="Project Details"
                subtitle="Core information about the property"
              />

              <div className="grid md:grid-cols-2 gap-5">
                {/* Property Type — read-only */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-sm font-semibold
                                    text-gray-700 mb-1.5"
                  >
                    <Building2 size={14} className="text-indigo-500" />
                    Property Type
                  </label>
                  <div
                    className="px-4 py-3 rounded-xl border-2 border-gray-100
                                  bg-gray-50 text-sm font-semibold text-gray-600
                                  flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    {formData.property_type || "—"}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Property type cannot be changed after creation
                  </p>
                </div>

                {/* Project Name */}
                <div data-field-error={errors.project_name ? true : undefined}>
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
                      disabled={saving}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all
                                  text-sm font-medium outline-none
                        ${
                          errors.project_name
                            ? "border-red-400 bg-red-50"
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
                      disabled={saving}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all
                                  text-sm font-medium outline-none
                        ${
                          errors.location
                            ? "border-red-400 bg-red-50"
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
                      disabled={saving}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all
                                  text-sm font-medium outline-none
                        ${
                          errors.price
                            ? "border-red-400 bg-red-50"
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

                {/* BHK — Residential only */}
                {isResidential && (
                  <div
                    className="md:col-span-2"
                    data-field-error={errors.bhk ? true : undefined}
                  >
                    <label
                      className="flex items-center gap-1.5 text-sm font-semibold
                                      text-gray-700 mb-2"
                    >
                      <Bed size={14} className="text-indigo-500" />
                      BHK Configuration
                      <span className="text-red-400 ml-0.5">*</span>
                      <span className="ml-auto text-xs font-medium text-gray-400">
                        Select all applicable
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {bhkOptions.map((bhk) => {
                        const active = selectedBhks.includes(bhk);
                        return (
                          <button
                            key={bhk}
                            type="button"
                            onClick={() => toggleBhk(bhk)}
                            disabled={saving}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold
                                        transition-all flex items-center gap-1.5
                              ${
                                active
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                  : errors.bhk
                                    ? "border-red-200 bg-red-50 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                                    : "border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                              }`}
                          >
                            {active && (
                              <Check
                                size={12}
                                className="text-white stroke-[3]"
                              />
                            )}
                            {bhk}
                          </button>
                        );
                      })}
                    </div>
                    {errors.bhk && <FieldError msg={errors.bhk} />}
                    <BhkCarpetRows
                      selectedBhks={selectedBhks}
                      carpetAreas={carpetAreas}
                      onCarpetChange={handleCarpetChange}
                      errors={errors}
                    />
                  </div>
                )}

                {/* Area — Shop / Office / Plot / Agri */}
                {(hasAreaField || isPlotOrAgri) && (
                  <div data-field-error={errors.area_sqft ? true : undefined}>
                    <InputField
                      label={areaLabel}
                      icon={Ruler}
                      error={errors.area_sqft}
                    >
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.area_sqft}
                          onChange={(e) =>
                            handleChange("area_sqft", e.target.value)
                          }
                          onBlur={() => handleBlur("area_sqft")}
                          placeholder={areaPlaceholder}
                          disabled={saving}
                          className={`flex-1 px-4 py-3.5 rounded-xl border-2 transition-all
                                      text-sm font-medium outline-none
                            ${
                              errors.area_sqft
                                ? "border-red-400 bg-red-50"
                                : "border-gray-200 focus:border-indigo-500 hover:border-indigo-300"
                            }`}
                        />
                        <span
                          className="shrink-0 flex items-center text-xs font-semibold
                                         text-gray-500 bg-gray-100 px-3 rounded-xl
                                         border-2 border-gray-200"
                        >
                          {areaUnit}
                        </span>
                      </div>
                    </InputField>
                  </div>
                )}

                {/* Possession */}
                <div data-field-error={errors.possession ? true : undefined}>
                  <label
                    className="flex items-center gap-1.5 text-sm font-semibold
                                    text-gray-700 mb-1.5"
                  >
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

            {/* ══ HIGHLIGHTS ══ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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
                disabled={saving}
                placeholder="e.g., Highway touch property near D-Mart, Close to metro station..."
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200
                           focus:border-indigo-500 hover:border-indigo-300 outline-none
                           transition-all resize-none text-sm"
              />
            </div>

            {/* ══ AMENITIES ══
                Filtered by property type — all optional
                Only shown if amenities exist for this type        */}
            {amenitiesList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionHeader
                  icon={Check}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  title="Amenities"
                  subtitle={`Available for ${formData.property_type} · optional`}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {amenitiesList.map((amenity) => {
                    const active = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        disabled={saving}
                        className={`px-3.5 py-2.5 rounded-xl border-2 transition-all
                                    font-medium text-xs flex items-center gap-2 text-left
                          ${
                            active
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                              : "border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                          }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border-2 flex items-center
                                          justify-center shrink-0 transition-all
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

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                  {selectedAmenities.length > 0 ? (
                    <p
                      className="text-xs text-emerald-600 font-semibold
                                  flex items-center gap-1"
                    >
                      <Check size={12} />
                      {selectedAmenities.length} amenit
                      {selectedAmenities.length === 1 ? "y" : "ies"} selected
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No amenities selected — that's okay!
                    </p>
                  )}
                  {selectedAmenities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAmenities([])}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ══ IMAGES ══ */}
            <div
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
              data-field-error={errors.images ? true : undefined}
            >
              <SectionHeader
                icon={ImageIcon}
                iconBg="bg-pink-50"
                iconColor="text-pink-500"
                title="Property Images"
                subtitle="Upload high quality photos — PNG, JPG up to 10MB each"
              />

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p
                    className="text-xs font-semibold text-gray-500 uppercase
                                tracking-wider mb-2"
                  >
                    Current Images ({existingImages.length})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((img, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative group aspect-square"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Property ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setExistingImages((prev) =>
                              prev.filter((x) => x !== img),
                            );
                            setDeletedImages((prev) => [...prev, img]);
                            setErrors((e) => ({
                              ...e,
                              images:
                                existingImages.length - 1 + newImages.length ===
                                0
                                  ? "At least one image is required"
                                  : undefined,
                            }));
                          }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500
                                     text-white rounded-full flex items-center
                                     justify-center shadow-lg opacity-0
                                     group-hover:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                        <div
                          className="absolute bottom-1.5 left-1.5 bg-black/60
                                        text-white text-[10px] px-1.5 py-0.5
                                        rounded font-bold"
                        >
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marked for deletion */}
              {deletedImages.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p
                    className="text-xs font-semibold text-red-600 uppercase
                                tracking-wider mb-2"
                  >
                    🗑️ Marked for Deletion ({deletedImages.length})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {deletedImages.map((img, idx) => (
                      <div
                        key={`deleted-${idx}`}
                        className="relative aspect-square"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Deleted ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl
                                     border-2 border-red-300 opacity-50"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setDeletedImages((prev) =>
                              prev.filter((x) => x !== img),
                            );
                            setExistingImages((prev) => [...prev, img]);
                            setErrors((e) => ({ ...e, images: undefined }));
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center
                                     justify-center rounded-xl text-white text-xs
                                     font-semibold hover:bg-black/80 transition"
                        >
                          ↻ Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images */}
              {newImages.length > 0 && (
                <div className="mb-4">
                  <p
                    className="text-xs font-semibold text-emerald-600 uppercase
                                tracking-wider mb-2"
                  >
                    ✨ New Images ({newImages.length})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {newImages.map((img, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative group aspect-square"
                      >
                        <img
                          src={img.preview}
                          alt={`New ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl
                                     border-2 border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewImages((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500
                                     text-white rounded-full flex items-center
                                     justify-center shadow-lg opacity-0
                                     group-hover:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                        <div
                          className="absolute bottom-1.5 left-1.5 bg-emerald-500
                                        text-white text-[10px] px-1.5 py-0.5
                                        rounded font-bold"
                        >
                          NEW
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload zone */}
              <label
                className={`flex flex-col items-center justify-center border-2
                            border-dashed rounded-2xl p-8 cursor-pointer transition-all
                  ${
                    compressing
                      ? "border-indigo-300 bg-indigo-50/50 cursor-not-allowed"
                      : errors.images
                        ? "border-red-300 bg-red-50/50 hover:border-red-400"
                        : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30"
                  }
                  ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={saving || compressing}
                />
                {compressing ? (
                  <>
                    <div
                      className="w-8 h-8 border-2 border-indigo-500 border-t-transparent
                                    rounded-full animate-spin mb-3"
                    />
                    <p className="text-sm font-semibold text-indigo-600 mb-1">
                      Processing images...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload
                      size={36}
                      className={
                        errors.images
                          ? "text-red-300 mb-3"
                          : "text-gray-400 mb-3"
                      }
                    />
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {totalImages > 0
                        ? "Add More Images"
                        : "Click to upload images"}
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG up to 10MB each
                    </p>
                    {totalImages > 0 && (
                      <p className="text-xs text-indigo-600 font-semibold mt-2">
                        {totalImages} image{totalImages > 1 ? "s" : ""} total
                      </p>
                    )}
                  </>
                )}
              </label>
              {errors.images && <FieldError msg={errors.images} />}
            </div>

            {/* ══ FOOTER ══ */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800
                           rounded-2xl font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all
                            flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200
                  ${
                    saving
                      ? "bg-indigo-400 cursor-not-allowed text-white opacity-70"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99]"
                  }`}
              >
                {saving ? (
                  <>
                    <div
                      className="w-5 h-5 border-2 border-white border-t-transparent
                                    rounded-full animate-spin"
                    />
                    Saving Changes…
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PROPERTY CARD
══════════════════════════════════════════════════════════════════════════ */
function PropertyCard({ property, viewMode, onEdit, onDelete }) {
  const bhkDisplay = getBhkDisplay(property);

  const typeBadgeColor =
    {
      Residential: "bg-blue-100 text-blue-700",
      Shop: "bg-orange-100 text-orange-700",
      Office: "bg-purple-100 text-purple-700",
      Plot: "bg-green-100 text-green-700",
      Agri: "bg-lime-100 text-lime-700",
    }[property.property_type] || "bg-gray-100 text-gray-600";

  if (viewMode === "list") {
    return (
      <div
        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl
                      transition border border-gray-100"
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 h-48 md:h-auto relative shrink-0 bg-gray-100">
            {property.images?.[0] ? (
              <img
                src={getImageUrl(property.images[0])}
                alt={property.project_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon size={40} />
              </div>
            )}
          </div>
          <div className="flex-1 p-6">
            {property.property_type && (
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1
                                rounded-lg mb-2 ${typeBadgeColor}`}
              >
                {property.property_type}
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {property.project_name}
            </h3>
            <p className="text-gray-500 flex items-center gap-2 mb-4 text-sm">
              <MapPin size={14} /> {property.location}
            </p>
            <div className="flex flex-wrap gap-3 mb-5 text-sm">
              <div className="flex items-center gap-1.5">
                <IndianRupee size={14} className="text-green-600" />
                <span className="font-bold text-green-700">
                  {formatPrice(property.price)}
                </span>
              </div>
              {property.property_type === "Residential" && bhkDisplay && (
                <div className="flex items-center gap-1.5">
                  <Bed size={14} className="text-blue-600" />
                  <span className="font-medium text-gray-700">
                    {bhkDisplay}
                  </span>
                </div>
              )}
              {property.area_sqft && (
                <div className="flex items-center gap-1.5">
                  <Ruler size={14} className="text-indigo-500" />
                  <span className="font-medium text-gray-700">
                    {property.area_sqft} sq.ft
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-600" />
                <span className="text-gray-600">{property.possession}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(property._id)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl
                           hover:bg-blue-600 transition flex items-center
                           justify-center gap-2 text-sm font-semibold"
              >
                <Edit size={15} /> Edit
              </button>
              <button
                onClick={() => onDelete(property._id)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl
                           hover:bg-red-600 transition flex items-center
                           justify-center gap-2 text-sm font-semibold"
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl
                    transition-all transform hover:-translate-y-1 border border-gray-100"
    >
      <div className="relative h-52 bg-gray-100">
        {property.images?.[0] ? (
          <img
            src={getImageUrl(property.images[0])}
            alt={property.project_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon size={40} />
          </div>
        )}
        {property.property_type && (
          <span
            className={`absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1
                            rounded-lg shadow ${typeBadgeColor}`}
          >
            {property.property_type}
          </span>
        )}
        {property.images?.length > 1 && (
          <span
            className="absolute top-2.5 right-2.5 bg-black/60 text-white
                           text-xs font-semibold px-2 py-1 rounded-lg"
          >
            +{property.images.length - 1} photos
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">
          {property.project_name}
        </h3>
        <p className="text-gray-500 text-xs flex items-center gap-1.5 mb-3">
          <MapPin size={12} />
          <span className="truncate">{property.location}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="bg-green-100 text-green-700 px-3 py-1 rounded-lg
                           text-sm font-bold"
          >
            {formatPrice(property.price)}
          </span>
          {property.property_type === "Residential" &&
            Array.isArray(property.bhk_configs) &&
            property.bhk_configs.slice(0, 2).map((c) => (
              <span
                key={c.bhk}
                className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg
                               text-xs font-semibold"
              >
                {c.bhk}
                {c.carpet_area_sqft && (
                  <span className="text-blue-500 ml-1">
                    · {c.carpet_area_sqft} ft²
                  </span>
                )}
              </span>
            ))}
          {Array.isArray(property.bhk_configs) &&
            property.bhk_configs.length > 2 && (
              <span
                className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg
                             text-xs font-semibold"
              >
                +{property.bhk_configs.length - 2} more
              </span>
            )}
          {property.area_sqft && (
            <span
              className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg
                             text-xs font-semibold"
            >
              {property.area_sqft} sq.ft
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Calendar size={12} />
          <span>{property.possession}</span>
        </div>

        {/* Amenities preview — only if exists */}
        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 min-h-[24px]">
            {property.amenities.slice(0, 2).map((a) => (
              <span
                key={a}
                className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
              >
                {a}
              </span>
            ))}
            {property.amenities.length > 2 && (
              <span
                className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded
                               text-xs font-semibold"
              >
                +{property.amenities.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(property._id)}
            className="flex-1 bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600
                       transition flex items-center justify-center gap-1.5
                       text-sm font-semibold"
          >
            <Edit size={14} /> Edit
          </button>
          <button
            onClick={() => onDelete(property._id)}
            className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
