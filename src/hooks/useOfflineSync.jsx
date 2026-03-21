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

  // Load pending queue from IndexedDB
  useEffect(() => {
    if ('indexedDB' in window) {
      const request = indexedDB.open('OrbitOfflineDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pendingMessages')) {
          db.createObjectStore('pendingMessages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedMessages')) {
          db.createObjectStore('cachedMessages', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('pendingMessages', 'readonly');
        const store = tx.objectStore('pendingMessages');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          setPendingQueue(getAllRequest.result || []);
        };
      };
    }
  }, []);

  // Persist to IndexedDB is handled in queueMessage

  const queueMessage = useCallback((message) => {
    const queuedMsg = {
      ...message,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queued_at: new Date().toISOString(),
      status: "pending",
      created_date: new Date().toISOString()
    };
    setPendingQueue(prev => [...prev, queuedMsg]);
    
    // Store in IndexedDB for persistence
    if ('indexedDB' in window) {
      const request = indexedDB.open('OrbitOfflineDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pendingMessages')) {
          db.createObjectStore('pendingMessages', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('pendingMessages', 'readwrite');
        tx.objectStore('pendingMessages').add(queuedMsg);
      };
    }
    
    return queuedMsg;
  }, []);

  const processPendingQueue = useCallback(async (sendFn) => {
    if (!isOnline || pendingQueue.length === 0) return;

    const toProcess = [...pendingQueue];
    const failed = [];

    for (const msg of toProcess) {
      try {
        await sendFn(msg);
        
        // Remove from IndexedDB on success
        if ('indexedDB' in window) {
          const request = indexedDB.open('OrbitOfflineDB', 1);
          request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('pendingMessages', 'readwrite');
            tx.objectStore('pendingMessages').delete(msg.id);
          };
        }
      } catch (error) {
        console.error("Failed to sync message:", error);
        failed.push(msg);
      }
    }

    setPendingQueue(failed);
    setLastSync(new Date().toISOString());
    
    if (failed.length === 0) {
      toast.success("All messages synced!");
    }
  }, [isOnline, pendingQueue]);

  const cacheMessages = useCallback((messages) => {
    if ('indexedDB' in window) {
      const request = indexedDB.open('OrbitOfflineDB', 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('cachedMessages', 'readwrite');
        const store = tx.objectStore('cachedMessages');
        
        // Clear old cache
        store.clear();
        
        // Add new messages
        messages.forEach(msg => {
          store.add({ ...msg, cached_at: new Date().toISOString() });
        });
      };
    }
  }, []);

  const getCachedMessages = useCallback((callback) => {
    if ('indexedDB' in window) {
      const request = indexedDB.open('OrbitOfflineDB', 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('cachedMessages', 'readonly');
        const store = tx.objectStore('cachedMessages');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          callback(getAllRequest.result || []);
        };
      };
    }
  }, []);

  return {
    isOnline,
    pendingQueue,
    lastSync,
    queueMessage,
    processPendingQueue,
    cacheMessages,
    getCachedMessages
  };
}