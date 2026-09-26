import { getStorage } from '@firebase/storage';
import { firebaseApp } from './firebaseApp.js';

export const firebaseStorage = getStorage(firebaseApp);
