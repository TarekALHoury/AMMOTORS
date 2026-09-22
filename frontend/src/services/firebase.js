import { getApps, initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBytGHi1A3cFM3n71jMd0qh9SBMWikLzGI',
  authDomain: 'ammotors-lb.firebaseapp.com',
  projectId: 'ammotors-lb',
  storageBucket: 'ammotors-lb.firebasestorage.app',
  messagingSenderId: '1035729229694',
  appId: '1:1035729229694:web:fde5efd2467b7825dc452f',
};

const firebaseApp = getApps()[0] || initializeApp(firebaseConfig);

export const firestore = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);
