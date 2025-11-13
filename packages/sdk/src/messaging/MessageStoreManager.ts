import { IndexedDBAdapter } from "../storage/IndexDBAdapter.ts";
import { MessageStore } from "./MessageStore.ts";
import type { IMessageStore } from "./types.ts";
import { evictOldestEntries } from "./utils/eviction.ts";

export class MessageStoreManager {
  private stores: Map<number, MessageStore> = new Map();
  private storeRetentionLimit: number;
  private messageRetentionLimit: number;
  private persistenceEnabled: boolean;
  private storageKey: string;
  private storage: IndexedDBAdapter | null = null;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private saveDebounceMs: number = 1000;

  constructor(config?: {
    storeRetentionLimit?: number;
    messageRetentionLimit?: number;
    enablePersistence?: boolean;
    storageKey?: string;
    saveDebounceMs?: number;
  }) {
    this.storeRetentionLimit = config?.storeRetentionLimit ?? 10;
    this.messageRetentionLimit = config?.messageRetentionLimit ?? 1000;
    this.persistenceEnabled = config?.enablePersistence ?? false;
    this.storageKey = config?.storageKey ?? "meshtastic-message-store";
    this.saveDebounceMs = config?.saveDebounceMs ?? 1000;

    if (this.persistenceEnabled) {
      this.initStorage();
    }
  }

  private async initStorage(): Promise<void> {
    try {
      if (typeof indexedDB !== "undefined") {
        this.storage = new IndexedDBAdapter();
        await this.storage.init();
        await this.loadFromStorage();
      } else {
        console.warn("IndexedDB not available, persistence disabled");
        this.persistenceEnabled = false;
      }
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      this.persistenceEnabled = false;
    }
  }

  addStore(id: number): IMessageStore {
    const existing = this.stores.get(id);
    if (existing) {
      return existing;
    }

    const store = new MessageStore(id, undefined, this.messageRetentionLimit);
    this.stores.set(id, store);

    // Subscribe to store changes for auto-save
    store.subscribe(() => {
      this.scheduleSave();
    });

    evictOldestEntries(this.stores, this.storeRetentionLimit);
    this.scheduleSave();

    return store;
  }

  getStore(id: number): IMessageStore | undefined {
    return this.stores.get(id);
  }

  getAllStores(): IMessageStore[] {
    return Array.from(this.stores.values());
  }

  removeStore(id: number): void {
    this.stores.delete(id);
    this.scheduleSave();
  }

  // Debounced save to prevent excessive writes
  private scheduleSave(): void {
    if (!this.persistenceEnabled) {
      return;
    }

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.saveToStorage();
    }, this.saveDebounceMs);
  }

  // Force immediate save (before app closes)
  async forceSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    if (!this.storage || !this.persistenceEnabled) {
      return;
    }

    try {
      const data = {
        stores: Array.from(this.stores.entries()).map(([id, store]) => [
          id,
          store.toJSON(),
        ]),
      };

      await this.storage.save(this.storageKey, data);
      console.debug(`Saved ${this.stores.size} message stores to IndexedDB`);
    } catch (error) {
      console.error("Failed to save message stores:", error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    if (!this.storage) {
      return;
    }

    try {
      const data = await this.storage.load(this.storageKey);

      if (data?.stores) {
        for (const [id, storeData] of data.stores) {
          const store = MessageStore.fromJSON(
            storeData,
            this.messageRetentionLimit,
          );

          // Only restore stores that have a nodeNum set
          if (store.myNodeNum !== undefined) {
            this.stores.set(id, store);

            // Subscribe to changes for auto-save
            store.subscribe(() => {
              this.scheduleSave();
            });
          }
        }

        console.debug(
          `Loaded ${this.stores.size} message stores from IndexedDB`,
        );
      }
    } catch (error) {
      console.error("Failed to load message stores:", error);
    }
  }

  async clearAllData(): Promise<void> {
    this.stores.clear();

    if (this.storage) {
      await this.storage.clear();
    }
  }

  // Call this when app is closing/navigating away
  async shutdown(): Promise<void> {
    await this.forceSave();

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
  }
}
