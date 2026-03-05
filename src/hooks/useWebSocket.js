// src/hooks/useWebSocket.js

import { useEffect, useRef, useState } from "react";

export default function useWebSocket(userId, onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3; // Reduced for faster testing

  useEffect(() => {
    console.log("=".repeat(50));
    console.log("🚀 WEBSOCKET INITIALIZATION");
    console.log(`📌 User ID: ${userId}`);
    console.log(`🌐 Backend URL: ws://localhost:8081/ws/${userId}`);
    console.log("=".repeat(50));

    if (!userId) {
      console.log("⚠️ No userId provided - skipping WebSocket connection");
      return;
    }

    const connect = () => {
      try {
        const wsUrl = `ws://localhost:8081/ws/${userId}`;
        console.log(`\n🔌 Connecting to WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Connection opened
        ws.onopen = () => {
          console.log("=".repeat(50));
          console.log("✅ WEBSOCKET CONNECTED SUCCESSFULLY!");
          console.log(`👤 User: ${userId}`);
          console.log(`🔗 Status: ONLINE`);
          console.log("=".repeat(50));

          setIsConnected(true);
          reconnectAttempts.current = 0;

          // Keep-alive ping
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("ping");
              console.log("📤 Ping sent");
            }
          }, 30000);

          ws.pingInterval = pingInterval;
        };

        // Message received
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "connected") {
              console.log("✅ Server confirmed connection:", data.message);
            } else if (data.type === "pong") {
              console.log("📥 Pong received");
            } else if (data.type === "marketing_broadcast") {
              console.log("=".repeat(50));
              console.log("🎉 MARKETING BROADCAST RECEIVED!");
              console.log("Message:", data.data?.message?.message);
              console.log(
                "Properties count:",
                data.data?.message?.properties?.length || 0,
              );
              console.log("=".repeat(50));

              if (onMessage) {
                onMessage(data);
              }
            } else {
              console.log("📨 Message received:", data.type);
              if (onMessage) {
                onMessage(data);
              }
            }
          } catch (error) {
            console.error("❌ Error parsing message:", error);
          }
        };

        // Error occurred
        ws.onerror = (error) => {
          console.error("=".repeat(50));
          console.error("❌ WEBSOCKET ERROR");
          console.error("Check if backend is running on http://localhost:8081");
          console.error("=".repeat(50));
        };

        // Connection closed
        ws.onclose = (event) => {
          console.log("=".repeat(50));
          console.log("❌ WEBSOCKET DISCONNECTED");
          console.log(`Code: ${event.code}`);
          console.log(`Reason: ${event.reason || "No reason provided"}`);
          setIsConnected(false);

          if (ws.pingInterval) {
            clearInterval(ws.pingInterval);
          }

          // Auto-reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = 1000 * (reconnectAttempts.current + 1);
            console.log(
              `🔄 Reconnecting in ${delay}ms... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
            );
            console.log("=".repeat(50));

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          } else {
            console.error("❌ Maximum reconnection attempts reached");
            console.error("Please check if backend is running");
          }
        };
      } catch (error) {
        console.error("❌ Failed to create WebSocket:", error);
      }
    };

    // Start connection
    connect();

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up WebSocket...");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [userId]);

  return { isConnected };
}
