import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// Offline-first hook for low-bandwidth environments
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Monitor connection status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Offline mode - messages will sync when connection returns");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load pending queue from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("orbit_pending_queue");
    if (saved) {
      setPendingQueue(JSON.parse(saved));
    }
  }, []);

  // Save pending queue to localStorage
  useEffect(() => {
    localStorage.setItem("orbit_pending_queue", JSON.stringify(pendingQueue));
  }, [pendingQueue]);

  const queueMessage = useCallback((message) => {
    const queuedMsg = {
      ...message,
      id: `pending_${Date.now()}`,
      queued_at: new Date().toISOString(),
      status: "pending"
    };
    setPendingQueue(prev => [...prev, queuedMsg]);
    return queuedMsg;
  }, []);

  const processPendingQueue = useCallback(async (sendFn) => {
    if (!isOnline || pendingQueue.length === 0) return;

    const toProcess = [...pendingQueue];
    setPendingQueue([]);

    for (const msg of toProcess) {
      try {
        await sendFn(msg);
      } catch (error) {
        console.error("Failed to sync message:", error);
        setPendingQueue(prev => [...prev, msg]);
      }
    }

    setLastSync(new Date().toISOString());
  }, [isOnline, pendingQueue]);

  return {
    isOnline,
    pendingQueue,
    lastSync,
    queueMessage,
    processPendingQueue
  };
}