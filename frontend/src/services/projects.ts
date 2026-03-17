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

// ── API Keys (stored in user doc, base64-encoded) ─────

/** Save API keys to user doc (base64-encoded for basic obfuscation in transit/storage) */
export async function saveApiKeys(userId: string, keys: Record<string, string>) {
  const encoded: Record<string, string> = {};
  for (const [k, v] of Object.entries(keys)) {
    encoded[k] = v ? btoa(v) : '';
  }
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { apiKeys: encoded });
}

/** Load API keys from user doc */
export async function loadApiKeys(userId: string): Promise<Record<string, string>> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const encoded = snap.data()?.apiKeys || {};
  const decoded: Record<string, string> = {};
  for (const [k, v] of Object.entries(encoded)) {
    try { decoded[k] = v ? atob(v as string) : ''; } catch { decoded[k] = ''; }
  }
  return decoded;
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
