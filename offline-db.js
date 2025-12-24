// IndexedDB helper voor offline sermon opslag
const DB_NAME = 'PreeknotitiesOffline';
const DB_VERSION = 2; // Verhoogd voor nieuwe versie
const STORE_NAME = 'pending-sermons';

class OfflineDB {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Upgrading IndexedDB schema...');
                
                // Delete old store if it exists (for clean upgrade)
                if (db.objectStoreNames.contains(STORE_NAME)) {
                    db.deleteObjectStore(STORE_NAME);
                    console.log('🗑️ Removed old object store');
                }
                
                // Create fresh object store
                const store = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
                console.log('✅ Created new object store with indexes');
            };
            
            request.onblocked = () => {
                console.warn('⚠️ IndexedDB upgrade blocked - close other tabs');
            };
        });
    }

    async savePendingSermon(sermonData) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    
                    const sermon = {
                        ...sermonData,
                        timestamp: Date.now(),
                        synced: false
                    };

                    const request = store.add(sermon);
                    
                    request.onsuccess = () => {
                        console.log('✅ Sermon saved offline:', request.result);
                        resolve(request.result);
                    };
                    request.onerror = () => {
                        console.error('❌ Error saving sermon:', request.error);
                        reject(request.error);
                    };
                } catch (error) {
                    console.error('❌ Transaction error:', error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('❌ Failed to save pending sermon:', error);
            throw error;
        }
    }

    async getPendingSermons() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('synced');
            
            const request = index.getAll(IDBKeyRange.only(false)); // Alleen niet-gesynchroniseerde
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async markAsSynced(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const sermon = getRequest.result;
                if (sermon) {
                    sermon.synced = true;
                    sermon.syncedAt = Date.now();
                    const updateRequest = store.put(sermon);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    resolve(); // Al verwijderd
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteSynced(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingCount() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('synced');
            
            const request = index.count(IDBKeyRange.only(false));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Reset database (for debugging/recovery)
    async resetDatabase() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
            }
            
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            
            deleteRequest.onsuccess = () => {
                console.log('✅ Database reset successful');
                this.db = null;
                resolve();
            };
            
            deleteRequest.onerror = () => {
                console.error('❌ Failed to reset database:', deleteRequest.error);
                reject(deleteRequest.error);
            };
            
            deleteRequest.onblocked = () => {
                console.warn('⚠️ Database reset blocked - close other tabs');
            };
        });
    }
}

// Global instance
const offlineDB = new OfflineDB();
