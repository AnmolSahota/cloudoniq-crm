import { useState, useEffect } from "react";
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
} from "lucide-react";
import { BASE_URL } from "./config";
import { PageHeader } from "./SharedComponents";
import { bhkOptions } from "./mockData";

// ── S3 image URL helper ────────────────────────────────────────────────────────
// Handles 3 cases:
//   1. Already full URL  (http...)       → use as-is
//   2. S3 key            (dealers/...)   → prepend S3_PUBLIC_URL
//   3. Old disk path     (uploads/...)   → prepend BASE_URL (backward compat)
const S3_PUBLIC_URL =
  process.env.REACT_APP_S3_PUBLIC_URL ||
  "https://crm-proppilot.s3.us-east-1.amazonaws.com";

const getImageUrl = (keyOrUrl) => {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  if (keyOrUrl.startsWith("dealers/")) return `${S3_PUBLIC_URL}/${keyOrUrl}`;
  return `${BASE_URL}/${keyOrUrl}`; // old disk path fallback
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const dealerId = JSON.parse(localStorage.getItem("auth_user"))?.id;

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

  const possessionOptions = [
    "Ready to Move",
    "Dec 2024",
    "Mar 2025",
    "June 2025",
    "Sep 2025",
    "Dec 2025",
    "Mar 2026",
    "June 2026",
    "Sep 2026",
    "Dec 2026",
  ];

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

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lac`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="space-y-6">
        {/* ── Delete modal ── */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
            amenitiesList={amenitiesList}
            bhkOptions={bhkOptions}
            possessionOptions={possessionOptions}
            formatPrice={formatPrice}
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
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              {["grid", "list"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition capitalize ${viewMode === mode ? "bg-white shadow" : "text-gray-600 hover:text-gray-900"} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                formatPrice={formatPrice}
                onEdit={(id) =>
                  setEditModal(properties.find((p) => p._id === id))
                }
                onDelete={(id) => setDeleteModal(id)}
              />
            ))}
          </div>
        )}

        {!loading && filteredProperties.length > 0 && (
          <div className="text-center text-gray-600">
            Showing {filteredProperties.length} of {properties.length}{" "}
            properties
          </div>
        )}
      </div>

      <style>{`
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditPropertyModal({
  property,
  dealerId,
  onClose,
  onUpdateSuccess,
  amenitiesList,
  bhkOptions,
  possessionOptions,
  formatPrice,
}) {
  const [formData, setFormData] = useState({
    project_name: property.project_name,
    location: property.location,
    price: property.price.toString(),
    bhk: property.bhk,
    possession: property.possession,
    highlights: property.highlights || "",
  });
  const [selectedAmenities, setSelectedAmenities] = useState(
    property.amenities || [],
  );
  const [existingImages, setExistingImages] = useState(property.images || []);
  const [newImages, setNewImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => newImages.forEach((img) => URL.revokeObjectURL(img.preview));
  }, []);

  const toggleAmenity = (a) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [],
      invalid = [];
    files.forEach((f) => {
      if (!f.type.startsWith("image/"))
        invalid.push(`${f.name} (not an image)`);
      else if (f.size > 10 * 1024 * 1024) invalid.push(`${f.name} (too large)`);
      else valid.push(f);
    });
    if (invalid.length) toast.error(`Skipped: ${invalid.join(", ")}`);
    setNewImages((prev) => [
      ...prev,
      ...valid.map((f) => ({
        name: f.name,
        preview: URL.createObjectURL(f),
        file: f,
      })),
    ]);
    if (valid.length) toast.success(`Added ${valid.length} image(s)`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) {
      toast.error("At least one image is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      const changedFields = {};
      if (formData.project_name !== property.project_name)
        changedFields.project_name = formData.project_name;
      if (formData.location !== property.location)
        changedFields.location = formData.location;
      if (formData.price !== property.price.toString())
        changedFields.price = parseInt(formData.price);
      if (formData.bhk !== property.bhk) changedFields.bhk = formData.bhk;
      if (formData.possession !== property.possession)
        changedFields.possession = formData.possession;
      if (formData.highlights !== (property.highlights || ""))
        changedFields.highlights = formData.highlights;
      changedFields.amenities = selectedAmenities;

      fd.append("property_data", JSON.stringify(changedFields));
      fd.append("deleted_images", JSON.stringify(deletedImages));
      newImages.forEach((img) => fd.append("images", img.file));

      const res = await axios.put(
        `${BASE_URL}/properties/update/${dealerId}/${property._id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.data.success) {
        toast.success(
          `"${res.data.property.project_name}" updated successfully`,
        );
        onUpdateSuccess(res.data.property);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Edit className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Edit Property
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update property details
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Home size={20} className="text-blue-600" /> Project Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.project_name}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, project_name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition"
                  />
                  {formData.price && (
                    <p className="text-blue-600 text-sm mt-1 font-medium">
                      {formatPrice(parseInt(formData.price))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    BHK Type *
                  </label>
                  <select
                    value={formData.bhk}
                    onChange={(e) =>
                      setFormData({ ...formData, bhk: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition appearance-none bg-white cursor-pointer"
                  >
                    {bhkOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Possession *
                  </label>
                  <select
                    value={formData.possession}
                    onChange={(e) =>
                      setFormData({ ...formData, possession: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition appearance-none bg-white cursor-pointer"
                  >
                    {possessionOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-amber-600" /> Highlights
              </h3>
              <textarea
                rows={3}
                value={formData.highlights}
                placeholder="Property highlights..."
                onChange={(e) =>
                  setFormData({ ...formData, highlights: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition resize-none"
              />
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Check size={20} className="text-purple-600" /> Amenities (
                {selectedAmenities.length} selected)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {amenitiesList.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-2 rounded-lg border-2 transition text-sm font-medium flex items-center gap-2 ${
                      selectedAmenities.includes(a)
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    {selectedAmenities.includes(a) && <Check size={14} />}
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ImageIcon size={20} className="text-pink-600" /> Property
                  Images ({totalImages} total)
                </h3>
                {totalImages === 0 && (
                  <span className="text-red-500 text-sm font-medium">
                    ⚠️ At least 1 image required
                  </span>
                )}
              </div>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Current Images ({existingImages.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((img, idx) => (
                      <div key={`existing-${idx}`} className="relative group">
                        <img
                          src={getImageUrl(img)}
                          alt={`Property ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                          onError={(e) => {
                            console.error(`Image failed: ${getImageUrl(img)}`);
                            e.target.style.display = "none";
                            const d = document.createElement("div");
                            d.className =
                              "w-full h-32 rounded-xl border-2 border-red-300 bg-red-50 flex items-center justify-center text-red-400 text-xs text-center p-1";
                            d.textContent = "Failed to load";
                            e.target.parentElement.insertBefore(d, e.target);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setExistingImages((prev) =>
                              prev.filter((x) => x !== img),
                            );
                            setDeletedImages((prev) => [...prev, img]);
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Marked for deletion */}
              {deletedImages.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-700 mb-2">
                    🗑️ Marked for Deletion ({deletedImages.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {deletedImages.map((img, idx) => (
                      <div key={`deleted-${idx}`} className="relative">
                        <img
                          src={getImageUrl(img)}
                          alt={`Deleted ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-red-300 opacity-50"
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
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl text-white text-sm font-medium hover:bg-black/80 transition"
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
                  <p className="text-sm font-medium text-green-600 mb-2">
                    ✨ New Images ({newImages.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImages.map((img, idx) => (
                      <div key={`new-${idx}`} className="relative group">
                        <img
                          src={img.preview}
                          alt={`New ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-green-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(newImages[idx].preview);
                            setNewImages((prev) =>
                              prev.filter((_, i) => i !== idx),
                            );
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          NEW
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload more */}
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-500 transition cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-600 font-semibold mb-1">
                  Add More Images
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG up to 10MB each
                </p>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={totalImages === 0 || saving}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2 ${
                  totalImages === 0 || saving
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                }`}
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTY CARD ────────────────────────────────────────────────────────────
function PropertyCard({ property, viewMode, formatPrice, onEdit, onDelete }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border border-gray-100">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 h-48 md:h-auto relative">
            <img
              src={getImageUrl(property.images?.[0])}
              alt={property.project_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {property.project_name}
            </h3>
            <p className="text-gray-600 flex items-center gap-2 mb-4">
              <MapPin size={16} />
              {property.location}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <IndianRupee size={16} className="text-green-600" />
                <span className="font-bold text-green-700">
                  {formatPrice(property.price)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bed size={16} className="text-blue-600" />
                <span>{property.bhk}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" />
                <span>{property.possession}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(property._id)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Edit
              </button>
              <button
                onClick={() => onDelete(property._id)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100">
      <div className="relative h-56">
        <img
          src={getImageUrl(property.images?.[0])}
          alt={property.project_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            const d = document.createElement("div");
            d.className =
              "w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm";
            d.textContent = "Image unavailable";
            e.target.parentElement.insertBefore(d, e.target);
          }}
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
          {property.project_name}
        </h3>
        <p className="text-gray-600 text-sm flex items-center gap-2 mb-4">
          <MapPin size={14} />
          <span className="truncate">{property.location}</span>
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
            {property.bhk}
          </span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
            {formatPrice(property.price)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar size={12} />
          <span>{property.possession}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-4 h-12 overflow-hidden">
          {property.amenities?.slice(0, 2).map((a) => (
            <span
              key={a}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
            >
              {a}
            </span>
          ))}
          {property.amenities?.length > 2 && (
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
              +{property.amenities.length - 2}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(property._id)}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Edit size={14} /> Edit
          </button>
          <button
            onClick={() => onDelete(property._id)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
