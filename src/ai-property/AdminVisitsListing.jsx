import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  MapPin,
  Phone,
  Search,
  User,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function AdminVisitsListing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:8081";

  // Fetch visits and stats on component mount
  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, []);

  // Fetch visits when filter changes
  useEffect(() => {
    if (!loading) {
      fetchVisits();
    }
  }, [filterStatus]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/visits`, {
        params,
      });

      const data = response.data;

      if (data.success) {
        setVisits(data.bookings || []);
      } else {
        throw new Error(data.error || "Failed to fetch visits");
      }
    } catch (err) {
      console.error("Error fetching visits:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch visits",
      );
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/visits/stats`);

      const data = response.data;

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleExport = () => {
    // Convert visits to CSV
    const headers = [
      "Booking ID",
      "Property",
      "Date",
      "Time",
      "Name",
      "Phone",
      "Status",
    ];
    const csvData = visits.map((v) => [
      v.booking_id,
      v.property,
      v.date,
      v.time,
      v.name,
      v.phone,
      v.status,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visits-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const statusConfig = {
    confirmed: {
      bg: "from-green-50 to-emerald-50",
      border: "border-green-300",
      badge: "bg-green-500 text-white",
      icon: "✓",
      label: "Confirmed",
    },
    cancelled: {
      bg: "from-red-50 to-rose-50",
      border: "border-red-300",
      badge: "bg-red-500 text-white",
      icon: "✗",
      label: "Cancelled",
    },
    rescheduled: {
      bg: "from-yellow-50 to-amber-50",
      border: "border-yellow-300",
      badge: "bg-yellow-500 text-white",
      icon: "↻",
      label: "Rescheduled",
    },
    completed: {
      bg: "from-gray-50 to-slate-50",
      border: "border-gray-300",
      badge: "bg-gray-500 text-white",
      icon: "✓",
      label: "Completed",
    },
    pending: {
      bg: "from-blue-50 to-indigo-50",
      border: "border-blue-300",
      badge: "bg-blue-500 text-white",
      icon: "⏳",
      label: "Pending",
    },
  };

  // Client-side search filtering
  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.property?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.phone?.includes(searchTerm);

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  All User Visits
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage and track all property visits
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={visits.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all">
              <div className="text-sm text-gray-600 mb-1">Total Visits</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total || 0}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-green-200 hover:shadow-xl transition-all">
              <div className="text-sm text-gray-600 mb-1">Confirmed</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.confirmed || 0}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-yellow-200 hover:shadow-xl transition-all">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pending || 0}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-3xl font-bold text-gray-600">
                {stats.completed || 0}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 shadow-lg border-2 border-gray-200 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by property, name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-8 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none appearance-none bg-white cursor-pointer min-w-[200px] transition-all"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 flex items-center gap-3 text-red-700">
            <AlertCircle size={24} />
            <div>
              <h3 className="font-semibold">Error Loading Visits</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <Loader2
              className="mx-auto mb-4 text-blue-600 animate-spin"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Loading visits...
            </h3>
            <p className="text-gray-500">Please wait while we fetch the data</p>
          </div>
        ) : (
          /* Visits List */
          <div className="space-y-4">
            {filteredVisits.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                <div className="text-gray-400 mb-4">
                  <Calendar size={64} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No visits found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No visits have been scheduled yet"}
                </p>
              </div>
            ) : (
              filteredVisits.map((visit) => {
                const config =
                  statusConfig[visit.status] || statusConfig.confirmed;

                return (
                  <div
                    key={visit.booking_id}
                    className={`bg-gradient-to-br ${config.bg} border-2 ${config.border} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {visit.property}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {visit.booking_id}
                            </p>
                          </div>
                          <span
                            className={`${config.badge} px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-md whitespace-nowrap`}
                          >
                            {config.icon} {config.label}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar
                              size={16}
                              className="text-blue-600 flex-shrink-0"
                            />
                            <span className="font-semibold">Date:</span>
                            <span>
                              {formatDate(visit.date)}{" "}
                              {visit.time && `at ${formatTime(visit.time)}`}
                            </span>
                          </div>

                          {visit.location && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin
                                size={16}
                                className="text-blue-600 flex-shrink-0"
                              />
                              <span className="font-semibold">Location:</span>
                              <span>{visit.location}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-gray-700">
                            <User
                              size={16}
                              className="text-blue-600 flex-shrink-0"
                            />
                            <span className="font-semibold">Guest:</span>
                            <span>{visit.name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone
                              size={16}
                              className="text-blue-600 flex-shrink-0"
                            />
                            <span className="font-semibold">Phone:</span>
                            <span>{visit.phone}</span>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {visit.reschedule_count > 0 && (
                          <div className="pt-2 border-t border-gray-300">
                            <p className="text-xs text-gray-600">
                              ↻ Rescheduled {visit.reschedule_count} time
                              {visit.reschedule_count > 1 ? "s" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
