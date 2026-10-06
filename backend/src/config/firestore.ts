import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'project-b2ff78e3-650d-4af6-9bb';
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

let firestoreInstance: Firestore | null = null;
let isConnectedToGCP = false;

// Persistent file storage path for local/offline fallback mode
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

try {
  if (process.env.USE_LOCAL_DB !== 'true') {
    firestoreInstance = new Firestore({
      projectId,
      databaseId
    });
    isConnectedToGCP = true;
    console.log(`[Firestore] Initialized Firestore client for project: ${projectId}, database: ${databaseId}`);
  } else {
    console.log('[Firestore] Local database mode explicitly enabled.');
  }
} catch (error: any) {
  console.warn(`[Firestore] Could not connect directly to GCP Firestore (${error.message}). Falling back to local storage.`);
  firestoreInstance = null;
  isConnectedToGCP = false;
}

export { firestoreInstance, isConnectedToGCP, DATA_DIR, projectId };
