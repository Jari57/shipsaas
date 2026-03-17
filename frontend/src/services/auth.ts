import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  sendEmailVerification as firebaseSendEmailVerification,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../lib/firebase';

export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDoc(cred.user);
  // Send email verification after signup
  await firebaseSendEmailVerification(cred.user);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function sendPasswordReset(email: string) {
  await firebaseSendPasswordReset(auth, email);
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user) {
    await firebaseSendEmailVerification(user);
  }
}

export async function signInWithApple() {
  const cred = await signInWithPopup(auth, appleProvider);
  await createUserDoc(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await createUserDoc(cred.user);
  return cred.user;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
}

async function createUserDoc(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      plan: 'free',
    });
  }
}
