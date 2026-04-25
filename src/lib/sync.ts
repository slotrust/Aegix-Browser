import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { useBrowserStore, Bookmark } from '../store/useBrowserStore';

export async function toggleFirebaseBookmark(url: string, title?: string) {
  const user = auth.currentUser;
  if (!user) {
    // Local only
    useBrowserStore.getState().toggleBookmark(url, title);
    return;
  }

  try {
    const bookmarkId = encodeURIComponent(url).replace(/\./g, '%2E');
    const docRef = doc(db, `users/${user.uid}/bookmarks`, bookmarkId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, {
        title: title || url,
        url,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookmarks`);
  }
}

export function subscribeToBookmarks(uid: string) {
  return onSnapshot(collection(db, `users/${uid}/bookmarks`), (snapshot) => {
    const bookmarks: Bookmark[] = snapshot.docs.map(d => ({
      id: d.id,
      title: d.data().title,
      url: d.data().url,
      icon: d.data().icon,
    }));
    useBrowserStore.getState().setBookmarks(bookmarks);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/bookmarks`);
  });
}

export async function syncHistory(url: string, title: string, isPrivate: boolean) {
  if (isPrivate) return;

  const user = auth.currentUser;
  if (!user) return; // Only sync if logged in

  if (url === 'aegix://newtab' || url.startsWith('aegix://search')) return;

  try {
    const historyId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const docRef = doc(db, `users/${user.uid}/history`, historyId);
    await setDoc(docRef, {
      title,
      url,
      visitedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/history`);
  }
}

export async function syncProxyStorage(storageData: Record<string, string>) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const docRef = doc(db, `users/${user.uid}/proxyStorage`, 'tokens');
    await setDoc(docRef, {
      data: storageData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/proxyStorage`);
  }
}

export async function initializeUserDoc(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        userId: uid,
        settings: {
          vpnEnabled: false,
          vpnLocation: 'auto',
          theme: 'dark'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
  }
}
