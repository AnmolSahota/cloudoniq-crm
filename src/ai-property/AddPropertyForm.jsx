import axios from "axios";
import {
  Bed,
  Calendar,
  Check,
  Home,
  ImageIcon,
  IndianRupee,
  MapPin,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "./config";
import { PageHeader } from "./SharedComponents";

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

  // User data from localStorage
  const [userData, setUserData] = useState(null);

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

  const bhkOptions = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Penthouse"];

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

  // Load user data from localStorage on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        console.log("User loaded from localStorage:", parsed);
      } else {
        console.warn("No user found in localStorage");
        toast.error("Please login to add properties"); // ✅ Toast
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      toast.error("Failed to load user data. Please login again."); // ✅ Toast
    }
  }, []);

  const validateForm = () => {
    // Check if user is logged in
    if (!userData?.id) {
      toast.error("User not logged in. Please login first."); // ✅ Toast
      return false;
    }

    if (!formData.project_name.trim()) {
      toast.error("Project name is required"); // ✅ Toast
      return false;
    }

    if (!formData.location.trim()) {
      toast.error("Location is required"); // ✅ Toast
      return false;
    }

    if (!formData.price || parseInt(formData.price) <= 0) {
      toast.error("Valid price is required"); // ✅ Toast
      return false;
    }

    if (!formData.bhk) {
      toast.error("BHK type is required"); // ✅ Toast
      return false;
    }

    if (!formData.possession) {
      toast.error("Possession date is required"); // ✅ Toast
      return false;
    }

    if (selectedAmenities.length === 0) {
      toast.error("Select at least one amenity"); // ✅ Toast
      return false;
    }

    if (images.length === 0) {
      toast.error("At least one image is required"); // ✅ Toast
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // ✅ Show loading toast
    const loadingToast = toast.loading("Uploading property...");

    try {
      // Get dealer_id from localStorage
      const dealerId = userData?.id;

      if (!dealerId) {
        throw new Error("User ID not found. Please login again.");
      }

      // Prepare property data
      const propertyData = {
        project_name: formData.project_name.trim(),
        location: formData.location.trim(),
        price: parseInt(formData.price),
        bhk: formData.bhk,
        possession: formData.possession,
        highlights: formData.highlights.trim(),
        amenities: selectedAmenities,
      };

      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();

      // Add dealer_id
      formDataToSend.append("dealer_id", dealerId);

      // Add properties as JSON string (wrapped in array)
      formDataToSend.append("properties", JSON.stringify([propertyData]));

      // Add all image files
      images.forEach((img) => {
        formDataToSend.append("images", img.file);
      });

      console.log("Submitting property data:", {
        dealer_id: dealerId,
        property: propertyData,
        images_count: images.length,
      });

      // Send request to backend using axios
      const response = await axios.post(
        `${BASE_URL}/properties/add`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        },
      );

      console.log("✅ Property Added Successfully:", response.data);

      // ✅ Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success("🎉 Property added successfully!");

      // Reset form after success
      resetForm();
    } catch (error) {
      console.error("❌ Error submitting property:", error);

      // ✅ Dismiss loading toast
      toast.dismiss(loadingToast);

      // Axios error handling
      let errorMessage = "Failed to add property. Please try again.";

      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.detail ||
          error.response.data?.message ||
          `Server Error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Error in request setup
        errorMessage = error.message;
      }

      // ✅ Show error toast
      toast.error(errorMessage);
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
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage) {
        invalidFiles.push(`${file.name} (not an image)`);
      } else if (!isUnder10MB) {
        invalidFiles.push(`${file.name} (too large, max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    // ✅ Show toast for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`Skipped: ${invalidFiles.join(", ")}`);
    }

    const newImages = validFiles.map((file) => ({
      name: file.name,
      preview: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // ✅ Success toast for valid uploads
    if (validFiles.length > 0) {
      toast.success(`Added ${validFiles.length} image(s)`);
    }
  };

  const removeImage = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed"); // ✅ Toast
  };

  const formatPrice = (value) => {
    if (!value) return "";
    const num = parseInt(value);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lac`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="space-y-6">
        <PageHeader
          title="Add New Property"
          description="List your property with all details"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Home className="text-blue-600" size={22} />
              </div>
              Project Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) =>
                    setFormData({ ...formData, project_name: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all text-lg"
                  placeholder="e.g., Lodha Splendora"
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
                  placeholder="e.g., Ghodbunder Road, Thane"
                  disabled={isSubmitting}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <IndianRupee size={16} className="text-blue-600" />
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
                  placeholder="e.g., 7500000"
                  disabled={isSubmitting}
                />
                {formData.price && (
                  <p className="text-blue-600 text-sm mt-1 font-medium">
                    {formatPrice(formData.price)}
                  </p>
                )}
              </div>

              {/* BHK */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Bed size={16} className="text-blue-600" />
                  BHK Type *
                </label>
                <select
                  value={formData.bhk}
                  onChange={(e) =>
                    setFormData({ ...formData, bhk: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all appearance-none bg-white cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="">Select BHK</option>
                  {bhkOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Possession */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  Possession *
                </label>
                <select
                  value={formData.possession}
                  onChange={(e) =>
                    setFormData({ ...formData, possession: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all appearance-none bg-white cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="">Select Possession Date</option>
                  {possessionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Highlights Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Sparkles className="text-amber-600" size={22} />
              </div>
              Property Highlights
            </h2>
            <textarea
              rows={3}
              value={formData.highlights}
              onChange={(e) =>
                setFormData({ ...formData, highlights: e.target.value })
              }
              className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all resize-none"
              placeholder="e.g., Highway touch property near D-Mart, Close to metro station..."
              disabled={isSubmitting}
            />
          </div>

          {/* Amenities Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Check className="text-purple-600" size={22} />
              </div>
              Amenities *
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 ${
                    selectedAmenities.includes(amenity)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg shadow-blue-500/30"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {selectedAmenities.includes(amenity) && <Check size={16} />}
                  {amenity}
                </button>
              ))}
            </div>
            {selectedAmenities.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                Selected:{" "}
                <span className="font-semibold text-blue-600">
                  {selectedAmenities.length}
                </span>{" "}
                amenities
              </p>
            )}
          </div>

          {/* Images Upload Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="text-pink-600" size={22} />
              </div>
              Property Images *
            </h2>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label
              className={`border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-all cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 block ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSubmitting}
              />
              <Upload className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-semibold mb-1">
                Click to upload property images
              </p>
              <p className="text-sm text-gray-500">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG up to 10MB each
              </p>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !userData}
            className={`w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 ${
              isSubmitting || !userData
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Uploading Property...
              </>
            ) : (
              <>
                <Plus size={28} />
                Add Property to Listings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
