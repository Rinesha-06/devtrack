import { firestoreInstance, DATA_DIR, isConnectedToGCP } from '../config/firestore';
import fs from 'fs';
import path from 'path';

export class FirestoreRepository {
  private localStore: Map<string, Map<string, any>> = new Map();
  private loadedCollections: Set<string> = new Set();

  constructor() {
    this.ensureLocalDir();
  }

  private ensureLocalDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        // ignore
      }
    }
  }

  private getCollectionFilePath(collection: string): string {
    return path.join(DATA_DIR, `${collection}.json`);
  }

  private loadCollection(collection: string): Map<string, any> {
    if (this.localStore.has(collection)) {
      return this.localStore.get(collection)!;
    }

    const map = new Map<string, any>();
    const filePath = this.getCollectionFilePath(collection);

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              map.set(item.id, item);
            }
          }
        }
      } catch (err) {
        console.error(`Error loading collection ${collection} from file:`, err);
      }
    }

    this.localStore.set(collection, map);
    this.loadedCollections.add(collection);
    return map;
  }

  private persistCollection(collection: string) {
    try {
      const map = this.localStore.get(collection);
      if (!map) return;
      const list = Array.from(map.values());
      fs.writeFileSync(this.getCollectionFilePath(collection), JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error persisting collection ${collection}:`, err);
    }
  }

  async get<T = any>(collection: string, id: string): Promise<T | null> {
    if (isConnectedToGCP && firestoreInstance) {
      try {
        const doc = await firestoreInstance.collection(collection).doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() } as T;
        }
        return null;
      } catch (error) {
        console.warn(`[Firestore] GCP read failed for ${collection}/${id}, falling back to local:`, (error as any).message);
      }
    }

    const map = this.loadCollection(collection);
    return (map.get(id) as T) || null;
  }

  async list<T = any>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    if (isConnectedToGCP && firestoreInstance) {
      try {
        let query: FirebaseFirestore.Query = firestoreInstance.collection(collection);
        if (filter) {
          for (const [key, value] of Object.entries(filter)) {
            if (value !== undefined && value !== null && value !== '') {
              query = query.where(key, '==', value);
            }
          }
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (error) {
        console.warn(`[Firestore] GCP query failed for ${collection}, falling back to local:`, (error as any).message);
      }
    }

    const map = this.loadCollection(collection);
    let results = Array.from(map.values()) as T[];

    if (filter) {
      results = results.filter((item: any) => {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined && value !== null && value !== '') {
            if (item[key] !== value) return false;
          }
        }
        return true;
      });
    }

    return results;
  }

  async create<T extends { id: string }>(collection: string, data: T): Promise<T> {
    const itemWithTimestamps = {
      ...data,
      createdAt: (data as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isConnectedToGCP && firestoreInstance) {
      try {
        await firestoreInstance.collection(collection).doc(data.id).set(itemWithTimestamps);
      } catch (error) {
        console.warn(`[Firestore] GCP write failed for ${collection}/${data.id}:`, (error as any).message);
      }
    }

    const map = this.loadCollection(collection);
    map.set(data.id, itemWithTimestamps);
    this.persistCollection(collection);
    return itemWithTimestamps as T;
  }

  async update<T = any>(collection: string, id: string, partial: Partial<T>): Promise<T | null> {
    const existing = await this.get(collection, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString()
    };

    if (isConnectedToGCP && firestoreInstance) {
      try {
        await firestoreInstance.collection(collection).doc(id).set(updated, { merge: true });
      } catch (error) {
        console.warn(`[Firestore] GCP update failed for ${collection}/${id}:`, (error as any).message);
      }
    }

    const map = this.loadCollection(collection);
    map.set(id, updated);
    this.persistCollection(collection);
    return updated as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    if (isConnectedToGCP && firestoreInstance) {
      try {
        await firestoreInstance.collection(collection).doc(id).delete();
      } catch (error) {
        console.warn(`[Firestore] GCP delete failed for ${collection}/${id}:`, (error as any).message);
      }
    }

    const map = this.loadCollection(collection);
    const existed = map.delete(id);
    if (existed) {
      this.persistCollection(collection);
    }
    return existed;
  }
}

export const db = new FirestoreRepository();
