import { getFirestore } from '@firebase/firestore';
import { firebaseApp } from './firebaseApp.js';

export const firestore = getFirestore(firebaseApp);
