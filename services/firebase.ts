import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, remove, onValue, runTransaction, DatabaseReference, push, update } from 'firebase/database';
import { SchoolApp } from '../types';

// Using the configuration provided in the original request.
// In a production production environment, these should be environment variables.
const firebaseConfig = {
    apiKey: "AIzaSyBhSOQXV-OZ23WX5Rj1KQ2o0DjLypHAN-Y",
    authDomain: "onestopapp-e8be4.firebaseapp.com",
    databaseURL: "https://onestopapp-e8be4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "onestopapp-e8be4",
    storageBucket: "onestopapp-e8be4.firebasestorage.app",
    messagingSenderId: "608185314108",
    appId: "1:608185314108:web:498d14ac91c175bdbbcc39",
    measurementId: "G-VK07J4LT9V"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const subscribeToApps = (callback: (apps: SchoolApp[]) => void) => {
  const appsRef = ref(database, 'apps');
  return onValue(appsRef, (snapshot) => {
    const data = snapshot.val();
    const loadedApps: SchoolApp[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        loadedApps.push({
          id: key,
          ...data[key],
          accessCount: data[key].accessCount || 0,
        });
      });
    }
    callback(loadedApps);
  });
};

export const addNewApp = async (newApp: Omit<SchoolApp, 'id'>) => {
  const newAppRef = push(ref(database, 'apps'));
  await set(newAppRef, newApp);
};

export const updateApp = async (appId: string, updates: Partial<SchoolApp>) => {
  const appRef = ref(database, `apps/${appId}`);
  await update(appRef, updates);
};

export const removeApp = async (appId: string) => {
  await remove(ref(database, `apps/${appId}`));
};

export const incrementAppAccess = async (appId: string) => {
  const countRef = ref(database, `apps/${appId}/accessCount`);
  await runTransaction(countRef, (currentCount) => {
    return (currentCount || 0) + 1;
  });
};