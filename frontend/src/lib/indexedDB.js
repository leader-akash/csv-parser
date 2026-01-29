// IndexedDB utility for storing large CSV results
// This handles data that exceeds sessionStorage/localStorage limits

const DB_NAME = "csvValidatorDB";
const DB_VERSION = 1;
const STORE_NAME = "csvResults";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveResults(data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear any existing data first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Store the new data with a fixed ID
        const putRequest = store.put({ id: "results", ...data });

        putRequest.onsuccess = () => {
          resolve(true);
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to save results to IndexedDB"));
        };
      };

      clearRequest.onerror = () => {
        reject(new Error("Failed to clear IndexedDB"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("IndexedDB save error:", error);
    throw error;
  }
}

export async function getResults() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("results");

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove the id field we added for storage
          const { id, ...data } = result;
          resolve(data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error("Failed to get results from IndexedDB"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("IndexedDB get error:", error);
    throw error;
  }
}

export async function clearResults() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to clear IndexedDB"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("IndexedDB clear error:", error);
    throw error;
  }
}
