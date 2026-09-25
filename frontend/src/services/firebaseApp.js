import { getApps, initializeApp } from '@firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBytGHi1A3cFM3n71jMd0qh9SBMWikLzGI',
  authDomain: 'ammotors-lb.firebaseapp.com',
  projectId: 'ammotors-lb',
  storageBucket: 'ammotors-lb.firebasestorage.app',
  messagingSenderId: '1035729229694',
  appId: '1:1035729229694:web:fde5efd2467b7825dc452f',
};

export const firebaseApp = getApps()[0] || initializeApp(firebaseConfig);
