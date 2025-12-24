// IndexedDB helper voor offline sermon opslag
// Version: 2.1.0 - Enhanced with quota management and cleanup
const DB_NAME = 'PreeknotitiesOffline';
const DB_VERSION = 4; // Verhoogd om schema te resetten
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

    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota) * 100;
                console.log(`📊 Storage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB / ${(estimate.quota / 1024 / 1024).toFixed(2)}MB (${percentUsed.toFixed(1)}%)`);
                
                if (percentUsed > 90) {
                    console.warn('⚠️ Storage bijna vol!');
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Storage quota check failed:', error);
                return true; // Continue anyway
            }
        }
        return true; // Storage API not available
    }

    async savePendingSermon(sermonData) {
        try {
            if (!this.db) await this.init();
            
            // Check storage quota before saving
            const hasSpace = await this.checkStorageQuota();
            if (!hasSpace) {
                throw new Error('Onvoldoende opslagruimte - verwijder oude data of sync bestaande preken');
            }

            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    
                    const sermon = {
                        ...sermonData,
                        timestamp: Date.now(),
                        synced: 0  // Use 0 instead of false for IDBKeyRange compatibility
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
            
            const request = index.getAll(IDBKeyRange.only(0)); // Alleen niet-gesynchroniseerde
            
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
            
            const request = index.count(IDBKeyRange.only(0));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Get storage usage info
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentUsed: (estimate.usage / estimate.quota) * 100,
                    usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
                    quotaMB: (estimate.quota / 1024 / 1024).toFixed(2)
                };
            } catch (error) {
                console.error('Storage info error:', error);
                return null;
            }
        }
        return null;
    }
    
    // Clean old synced items (for maintenance)
    async cleanOldSyncedItems(daysOld = 30) {
        if (!this.db) await this.init();
        
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('synced');
            
            const request = index.openCursor(IDBKeyRange.only(1)); // Synced items
            let deleteCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.timestamp < cutoffTime) {
                        cursor.delete();
                        deleteCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`🗑️ Cleaned ${deleteCount} old synced items`);
                    resolve(deleteCount);
                }
            };
            
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
