import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Blueprint } from '../types';

export interface ProjectDoc {
  id: string;
  userId: string;
  appName: string;
  projectId: string;
  source: 'github' | 'zip' | 'template';
  githubRepo?: string;
  domain?: string;
  hosting?: string;
  style: string;
  color: string;
  appType: string;
  authEnabled: boolean;
  plan: string;
  status: 'draft' | 'deploying' | 'live' | 'failed';
  deploymentUrl?: string;
  generatedCode?: string;
  blueprint?: Blueprint;
  createdAt: any;
  updatedAt?: any;
}

/** Create a new project in Firestore */
export async function saveProject(userId: string, project: Omit<ProjectDoc, 'id' | 'userId' | 'createdAt'>) {
  const ref = doc(collection(db, 'projects'));
  const data: ProjectDoc = {
    ...project,
    id: ref.id,
    userId,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return data;
}

/** Fetch all projects for a user, newest first */
export async function getUserProjects(userId: string): Promise<ProjectDoc[]> {
  const q = query(collection(db, 'projects'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ProjectDoc);
}

/** Update a project's fields */
export async function updateProject(projectDocId: string, fields: Partial<ProjectDoc>) {
  const ref = doc(db, 'projects', projectDocId);
  await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
}

/** Delete a project */
export async function removeProject(projectDocId: string) {
  await deleteDoc(doc(db, 'projects', projectDocId));
}

// ── API Keys (stored in user doc, AES-GCM encrypted) ──

const SALT = 'shipsaas-key-enc-v1';

async function deriveKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', enc.encode(userId + SALT), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptValue(userId: string, plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  // Pack iv + ciphertext as hex
  const buf = new Uint8Array(iv.byteLength + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.byteLength);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function decryptValue(userId: string, hex: string): Promise<string> {
  if (!hex) return '';
  // Handle legacy base64-encoded values
  if (!/^[0-9a-f]+$/i.test(hex)) {
    try { return atob(hex); } catch { return ''; }
  }
  const key = await deriveKey(userId);
  const buf = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

/** Save API keys to user doc (AES-256-GCM encrypted) */
export async function saveApiKeys(userId: string, keys: Record<string, string>) {
  const encrypted: Record<string, string> = {};
  for (const [k, v] of Object.entries(keys)) {
    encrypted[k] = await encryptValue(userId, v);
  }
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { apiKeys: encrypted });
}

/** Load API keys from user doc */
export async function loadApiKeys(userId: string): Promise<Record<string, string>> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const encrypted = snap.data()?.apiKeys || {};
  const decrypted: Record<string, string> = {};
  for (const [k, v] of Object.entries(encrypted)) {
    try { decrypted[k] = await decryptValue(userId, v as string); } catch { decrypted[k] = ''; }
  }
  return decrypted;
}

/** Load user profile data */
export async function loadUserProfile(userId: string) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

/** Save profile name */
export async function saveProfileName(userId: string, name: string) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { profileName: name });
}

/** Save lockout state to Firestore */
export async function saveLockoutState(userId: string, failedAttempts: number, lockoutUntil: number | null) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { lockout: { failedAttempts, lockoutUntil } });
}

/** Load lockout state from Firestore */
export async function loadLockoutState(userId: string): Promise<{ failedAttempts: number; lockoutUntil: number | null } | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data()?.lockout || null;
}
