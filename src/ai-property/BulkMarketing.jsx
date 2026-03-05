// src/pages/BulkMarketing.jsx

import {
  Send,
  CheckCircle,
  XCircle,
  Radio,
  Megaphone,
  Loader,
  Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify" ; 
import { BASE_URL } from "./config";

export default function BulkMarketing() {
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [message, setMessage] = useState(
    "🏠 Exclusive Properties Alert! Your dream home awaits. Check out these handpicked options just for you! 🌟",
  );
  const [loading, setLoading] = useState(false);
  const [fetchingProperties, setFetchingProperties] = useState(true);
  const [result, setResult] = useState(null);

  // Get dealer ID from localStorage
  const dealerId = JSON.parse(localStorage.getItem("auth_user"))?.id;

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setFetchingProperties(true);
    try {
      const response = await axios.get(`${BASE_URL}/properties/list`, {
        params: { dealer_id: dealerId },
      });

      if (response.data.success) {
        setProperties(response.data.properties);
        console.log(
          "✅ Properties loaded for bulk marketing:",
          response.data.properties,
        );
      }
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setFetchingProperties(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lac`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const toggleProperty = (property) => {
    setSelectedProperties((prev) => {
      const isSelected = prev.some((p) => p._id === property._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== property._id);
      } else {
        return [...prev, property];
      }
    });
  };

  const selectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties([...properties]);
    }
  };

  const handleBroadcast = async () => {
    if (selectedProperties.length === 0) {
      toast.error("Please select at least one property");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a marketing message");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Format properties to match backend expected format
      const formattedProperties = selectedProperties.map((prop) => ({
        name: prop.project_name,
        location: prop.location,
        price: formatPrice(prop.price),
        bhk: prop.bhk,
        possession: prop.possession,
        amenities: prop.amenities,
        highlights: prop.highlights || "",
        images: prop.images,
      }));

      const response = await axios.post(`${BASE_URL}/api/admin/broadcast`, {
        message: message.trim(),
        properties: formattedProperties,
      });

      if (response.data.success) {
        setResult({
          type: "success",
          message: `✅ Broadcast sent to ${response.data.websocket_sent} online users, saved to ${response.data.mongodb_saved} users`,
        });

        toast.success(
          `Broadcast sent successfully to ${response.data.websocket_sent} users!`,
        );

        // Reset form after success
        setTimeout(() => {
          setSelectedProperties([]);
          setMessage(
            "🏠 Exclusive Properties Alert! Your dream home awaits. Check out these handpicked options just for you! 🌟",
          );
          setResult(null);
        }, 5000);
      } else {
        throw new Error("Broadcast failed");
      }
    } catch (error) {
      console.error("Broadcast error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to send broadcast. Please try again.";

      setResult({
        type: "error",
        message: `❌ ${errorMessage}`,
      });

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Megaphone className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Bulk Marketing
              </h1>
              <p className="text-gray-600 mt-1">
                {fetchingProperties
                  ? "Loading properties..."
                  : `Select properties and broadcast to all users (${properties.length} available)`}
              </p>
            </div>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`rounded-2xl p-4 border-2 shadow-lg animate-fadeIn ${
              result.type === "success"
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {result.type === "success" ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <XCircle className="text-red-600" size={24} />
              )}
              <p
                className={`font-semibold ${
                  result.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* Property Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Select Properties ({selectedProperties.length}/{properties.length}
              )
            </h2>
            {properties.length > 0 && (
              <button
                onClick={selectAll}
                disabled={fetchingProperties}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedProperties.length === properties.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

          {/* Loading State */}
          {fetchingProperties ? (
            <div className="text-center py-12">
              <Loader
                className="mx-auto text-blue-600 mb-4 animate-spin"
                size={48}
              />
              <p className="text-gray-600 font-medium">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Home className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Properties Available
              </h3>
              <p className="text-gray-600">
                Add properties first to start marketing campaigns
              </p>
            </div>
          ) : (
            /* Property Grid */
            <div className="grid md:grid-cols-2 gap-4">
              {properties.map((property) => {
                const isSelected = selectedProperties.some(
                  (p) => p._id === property._id,
                );

                return (
                  <div
                    key={property._id}
                    onClick={() => toggleProperty(property)}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all transform hover:scale-[1.02] ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg"
                        : "bg-white border-gray-200 hover:border-blue-300 shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle className="text-white" size={16} />
                        ) : (
                          <Radio className="text-gray-400" size={16} />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          {property.project_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {property.location}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {property.bhk}
                          </span>
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {formatPrice(property.price)}
                          </span>
                          <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {property.possession}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Marketing Message */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Marketing Message
          </h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your marketing message here... (e.g., 'Check out these exclusive properties! 🏠')"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-all"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">
            This message will be sent along with the selected properties to all
            users.
          </p>
        </div>

        {/* Broadcast Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <button
            onClick={handleBroadcast}
            disabled={
              loading ||
              fetchingProperties ||
              selectedProperties.length === 0 ||
              !message.trim()
            }
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={24} />
                Broadcasting...
              </>
            ) : (
              <>
                <Send size={24} />
                Broadcast to All Users ({selectedProperties.length} properties)
              </>
            )}
          </button>
          {selectedProperties.length === 0 && !fetchingProperties && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Select at least one property to broadcast
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
