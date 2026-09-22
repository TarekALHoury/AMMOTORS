import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@firebase/auth';
import { firebaseAuth } from './firebase.js';

async function requireAdmin(user) {
  const token = await getIdTokenResult(user, true);
  if (token.claims.admin !== true) {
    await signOut(firebaseAuth);
    const error = new Error('This account does not have administrator access.');
    error.code = 'auth/not-admin';
    throw error;
  }
  return user;
}

export async function signInAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return requireAdmin(credential.user);
}

export function observeAdminAuth(onUser, onError) {
  return onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) {
      onUser(null);
      return;
    }

    try {
      onUser(await requireAdmin(user));
    } catch (error) {
      onError(error);
    }
  }, onError);
}

export function signOutAdmin() {
  return signOut(firebaseAuth);
}
