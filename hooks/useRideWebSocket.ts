import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface RideLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export function useRideWebSocket(rideId: string | null) {
  const [driverLocation, setDriverLocation] = useState<RideLocation | null>(null);
  const [rideStatus, setRideStatus] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    
    // Connect to WebSocket
    const socket = io(WS_URL, {
      path: `/ws/rides/${rideId}/`,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    // Listen for driver location updates
    socket.on("driver_location_update", (data: RideLocation) => {
      setDriverLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
      });
    });

    // Listen for ride status updates
    socket.on("ride_status_update", (data: { status: string }) => {
      setRideStatus(data.status);
      
      // Stop tracking when ride is completed or cancelled
      if (data.status === 'completed' || data.status === 'cancelled') {
        socket.disconnect();
      }
    });

    // Initial ride data
    socket.on("ride_init", (data: any) => {
      if (data.data) {
        setRideStatus(data.data.status);
        if (data.data.driver_latitude && data.data.driver_longitude) {
          setDriverLocation({
            latitude: data.data.driver_latitude,
            longitude: data.data.driver_longitude,
          });
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [rideId]);

  return {
    driverLocation,
    rideStatus,
    isConnected,
  };
}
