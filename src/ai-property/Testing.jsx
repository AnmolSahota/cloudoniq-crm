// src/pages/Testing.jsx

import {
  Calendar,
  Home,
  MessageSquare,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
  Loader2,
  User,
  Bot,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const scrollRef = useRef(null);
  const userId = JSON.parse(localStorage.getItem("auth_user"))?.id || "";
  // WebSocket connection
  const { isConnected } = useWebSocket(userId, (data) => {
    handleWebSocketMessage(data);
  });

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [userId]);

  // Format history from database to frontend message structure
  const formatHistoryToMessages = (history) => {
    const formatted = [];

    history.forEach((msg) => {
      const role = msg.role;

      // USER MESSAGES
      if (role === "user") {
        formatted.push({
          sender: "user",
          type: "text",
          text: msg.message,
          timestamp: msg.timestamp,
        });
      }

      // ASSISTANT MESSAGES
      else if (role === "assistant") {
        const messageData = msg.message;

        // Check if it's a marketing broadcast (action === "marketing")
        if (messageData.action === "marketing") {
          // Add main message
          if (messageData.message) {
            formatted.push({
              sender: "bot",
              type: "text",
              text: messageData.message,
              timestamp: msg.timestamp,
            });
          }

          // Add properties
          if (messageData.properties && messageData.properties.length > 0) {
            formatted.push({
              sender: "bot",
              type: "properties",
              list: messageData.properties,
              timestamp: msg.timestamp,
            });
          }

          // Add next question
          if (messageData.next_question) {
            formatted.push({
              sender: "bot",
              type: "suggestion",
              text: messageData.next_question,
              timestamp: msg.timestamp,
            });
          }
        }
        // Regular AI responses
        else {
          // Add main message
          if (messageData.message) {
            formatted.push({
              sender: "bot",
              type: "text",
              text: messageData.message,
              timestamp: msg.timestamp,
            });
          }

          // Add properties if present
          if (messageData.properties && messageData.properties.length > 0) {
            formatted.push({
              sender: "bot",
              type: "properties",
              list: messageData.properties,
              timestamp: msg.timestamp,
            });
          }

          // Add filtered bookings
          if (
            messageData.visit_details?.filtered_bookings &&
            messageData.visit_details.filtered_bookings.length > 0
          ) {
            formatted.push({
              sender: "bot",
              type: "filtered_bookings",
              list: messageData.visit_details.filtered_bookings,
              timestamp: msg.timestamp,
            });
          }

          // Add active bookings for selection
          if (
            messageData.action === "select_booking" &&
            messageData.visit_details?.active_bookings
          ) {
            formatted.push({
              sender: "bot",
              type: "active_bookings",
              list: messageData.visit_details.active_bookings,
              timestamp: msg.timestamp,
            });
          }

          // Add next question/suggestion
          if (messageData.next_question) {
            formatted.push({
              sender: "bot",
              type: "suggestion",
              text: messageData.next_question,
              timestamp: msg.timestamp,
            });
          }
        }
      }
    });

    return formatted;
  };

  // Load chat history function
  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `http://localhost:8081/api/chat/history/${userId}?dealer_id=${userId}`,
      );
      const data = await response.json();

      if (data.success && data.history.length > 0) {
        console.log(`📜 Loaded ${data.history.length} historical items`);
        const formattedMessages = formatHistoryToMessages(data.history);
        console.log(`✅ Formatted to ${formattedMessages.length} messages`);
        setMessages(formattedMessages);
      } else {
        console.log("📭 No chat history found");
      }
    } catch (error) {
      console.error("❌ Failed to load chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log("📩 Handling WebSocket message:", data);

    // If the message is a direct history entry (like reminders)
    if (data.role === "assistant") {
      // Process this as a regular message from history
      const formattedMessages = formatHistoryToMessages([data]);
      console.log("save to state");

      // Add these formatted messages to the state
      setMessages((prev) => [...prev, ...formattedMessages]);

      return;
    }

    // Marketing broadcast
    if (data.type === "marketing_broadcast") {
      const assistantData = data.data;
      const msg = assistantData.message;

      // Add marketing message text
      if (msg.message) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "text", text: msg.message },
        ]);
      }

      // Add properties
      if (Array.isArray(msg.properties) && msg.properties.length > 0) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "properties", list: msg.properties },
        ]);
      }

      // Add next question
      if (msg.next_question) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "suggestion", text: msg.next_question },
        ]);
      }
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", type: "text", text: input },
    ]);

    const query = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8081/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, query, dealer_id: userId }),
      });

      const data = await res.json();
      const answer = data?.answer || {};

      if (answer.message) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "text", text: answer.message },
        ]);
      }

      if (Array.isArray(answer.properties) && answer.properties.length > 0) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "properties", list: answer.properties },
        ]);
      }

      if (
        ["show_bookings", "show_booking_details"].includes(answer.action) &&
        Array.isArray(answer.visit_details?.filtered_bookings) &&
        answer.visit_details.filtered_bookings.length > 0
      ) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            type: "filtered_bookings",
            list: answer.visit_details.filtered_bookings,
          },
        ]);
      }

      if (
        answer.action === "select_booking" &&
        Array.isArray(answer.visit_details?.active_bookings)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            type: "active_bookings",
            list: answer.visit_details.active_bookings,
          },
        ]);
      }

      if (answer.next_question) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", type: "suggestion", text: answer.next_question },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          type: "text",
          text: "⚠️ Unable to connect to server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Property Card Component
  const PropertyCard = ({ p }) => (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
      {Array.isArray(p.images) && p.images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={p.images[0]}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-gray-800">
            {p.price}
          </div>
        </div>
      )}

      <div className="p-5 space-y-3 text-left">
        <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Home size={16} className="text-blue-600" />
          {p.location}
        </p>
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
            {p.bhk}
          </span>
          {!Array.isArray(p.images) && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              {p.price}
            </span>
          )}
        </div>

        {Array.isArray(p.images) && p.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pt-2">
            {p.images.slice(1).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`View ${i + 2}`}
                className="h-20 w-28 rounded-lg object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Filtered Booking Card
  const FilteredBookingCard = ({ booking }) => {
    const statusConfig = {
      confirmed: {
        bg: "bg-gradient-to-br from-green-50 to-emerald-50",
        border: "border-green-300",
        text: "text-green-700",
        badge: "bg-green-100 text-green-800",
        icon: "✓",
      },
      cancelled: {
        bg: "bg-gradient-to-br from-red-50 to-rose-50",
        border: "border-red-300",
        text: "text-red-700",
        badge: "bg-red-100 text-red-800",
        icon: "✗",
      },
      rescheduled: {
        bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
        badge: "bg-yellow-100 text-yellow-800",
        icon: "↻",
      },
      completed: {
        bg: "bg-gradient-to-br from-gray-50 to-slate-50",
        border: "border-gray-300",
        text: "text-gray-700",
        badge: "bg-gray-100 text-gray-800",
        icon: "✓",
      },
      pending: {
        bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
        border: "border-blue-300",
        text: "text-blue-700",
        badge: "bg-blue-100 text-blue-800",
        icon: "⏳",
      },
    };

    const config =
      statusConfig[booking.status?.toLowerCase()] || statusConfig.confirmed;

    return (
      <div
        className={`border-2 rounded-xl p-4 ${config.bg} ${config.border} shadow-md hover:shadow-lg transition-all`}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-2 flex-1">
            <h4 className="font-bold text-lg text-gray-900">
              {booking.property}
            </h4>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Calendar size={16} className={config.text} />
              {booking.date} {booking.time && `• ${booking.time}`}
            </p>
            {booking.name && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Guest:</span> {booking.name}
              </p>
            )}
            {booking.phone && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Phone:</span> {booking.phone}
              </p>
            )}
          </div>
          {booking.status && (
            <span
              className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full ${config.badge} whitespace-nowrap`}
            >
              {config.icon} {booking.status}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Active Bookings List
  const ActiveBookingsList = ({ list }) => (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg">
      <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
        <Calendar className="text-blue-600" size={20} />
        Select a Visit
      </h4>
      <ul className="space-y-2">
        {list.map((b, i) => (
          <li
            key={b.booking_id || i}
            className="px-4 py-3 rounded-lg bg-white border-2 border-blue-200 text-blue-700 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all transform hover:scale-[1.02] shadow-sm hover:shadow-md"
          >
            <span className="font-semibold">
              {i + 1}. {b.display}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (isYesterday) {
      return (
        "Yesterday " +
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const Avatar = ({ sender }) => (
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
        sender === "user"
          ? "bg-gradient-to-br from-slate-600 to-slate-700"
          : "bg-gradient-to-br from-blue-600 to-indigo-600"
      }`}
    >
      {sender === "user" ? (
        <User size={16} className="text-white" />
      ) : (
        <Bot size={16} className="text-white" />
      )}
    </div>
  );
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Home className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Property AI Assistant
            </h1>
            <p className="text-xs text-gray-500">
              Your intelligent property companion
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="text-green-600" size={18} />
                  <span className="text-xs text-green-600 font-medium">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-600" size={18} />
                  <span className="text-xs text-red-600 font-medium">
                    Offline
                  </span>
                </>
              )}
            </div>
            <Sparkles className="text-blue-600 animate-pulse" size={24} />
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Loading History Indicator */}
          {loadingHistory && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-200">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="text-gray-600 font-medium">
                  Loading chat history...
                </span>
              </div>
            </div>
          )}

          {/* Welcome Screen - only show if not loading and no messages */}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-6 p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <MessageSquare className="text-white" size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">
                    Welcome! 👋
                  </h3>
                  <p className="text-gray-600 text-lg">
                    How can I help you today?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                  <button className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm">
                    Show available properties
                  </button>
                  <button className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm">
                    Schedule a visit
                  </button>
                  <button className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm">
                    My bookings
                  </button>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="animate-fadeIn">
              {msg.type === "text" && (
                <div
                  className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar sender={msg.sender} />
                  <div
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-lg`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-left ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.timestamp && (
                      <span className="text-xs text-gray-500 mt-1 px-1">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {msg.type === "properties" && (
                <div className="grid md:grid-cols-2 gap-4 animate-fadeIn">
                  {msg.list.map((p, i) => (
                    <PropertyCard key={i} p={p} />
                  ))}
                </div>
              )}

              {msg.type === "filtered_bookings" && (
                <div className="space-y-3 animate-fadeIn">
                  {msg.list.map((booking, i) => (
                    <FilteredBookingCard
                      key={booking.booking_id || i}
                      booking={booking}
                    />
                  ))}
                </div>
              )}

              {msg.type === "active_bookings" && (
                <div className="animate-fadeIn">
                  <ActiveBookingsList list={msg.list} />
                </div>
              )}

              {msg.type === "suggestion" && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 px-5 py-3 rounded-xl shadow-md animate-fadeIn">
                  <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                    <Sparkles size={16} />
                    {msg.text}
                  </p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white px-5 py-4 rounded-2xl shadow-md border border-gray-200">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything about properties..."
                rows={1}
                className="w-full px-5 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none shadow-sm transition-all"
                style={{ minHeight: "52px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
