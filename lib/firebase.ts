'use client';

import { initializeApp, getApps } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-pordus2wanajayak-b759c112-c8d7-467f-9c2e-a5d34c1bb106';

let cachedDb: Firestore | null = null;

export function getLegacyFirestoreDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(app, firestoreDatabaseId);
  }
  return cachedDb;
}
