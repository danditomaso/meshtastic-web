// src/store/storage/IndexedDBAdapter.ts
import { type DBSchema, type IDBPDatabase, openDB } from "idb";

interface MessageStoreDB extends DBSchema {
  stores: {
    key: string;
    value: {
      stores: Array<[number, any]>;
      version: number;
      timestamp: number;
    };
  };
}

export class IndexedDBAdapter {
  private dbName: string;
  private dbVersion: number;
  private db: IDBPDatabase<MessageStoreDB> | null = null;

  constructor(dbName = "meshtastic-message-store", version = 1) {
    this.dbName = dbName;
    this.dbVersion = version;
  }

  async init(): Promise<void> {
    this.db = await openDB<MessageStoreDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("stores")) {
          db.createObjectStore("stores");
        }
      },
    });
  }

  async save(key: string, data: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    await this.db?.put(
      "stores",
      {
        stores: data.stores,
        version: this.dbVersion,
        timestamp: Date.now(),
      },
      key,
    );
  }

  async load(key: string): Promise<any | null> {
    if (!this.db) {
      await this.init();
    }

    const data = await this.db?.get("stores", key);
    return data || null;
  }

  async delete(key: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db?.delete("stores", key);
  }

  async clear(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db?.clear("stores");
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }
    return await this.db?.getAllKeys("stores");
  }
}
