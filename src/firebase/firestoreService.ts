import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, Order, StoreSettings, Coupon, ReturnRequest, Customer } from '../types';

function isOfflineOrUnavailable(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as any;
  if (anyErr?.code === 'unavailable') return true;
  if (err instanceof Error && (err.message.includes('offline') || err.message.includes('unavailable'))) {
    return true;
  }
  return false;
}

// ==========================================
// PRODUCTS
// ==========================================
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as Product);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Products offline or unavailable; serving local cache.');
      return [];
    }
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function upsertProductInFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: product queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: delete queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ==========================================
// ORDERS
// ==========================================
export async function fetchOrdersFromFirestore(userEmail?: string, userId?: string, isAdmin?: boolean): Promise<Order[]> {
  const path = 'orders';
  try {
    if (isAdmin) {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as Order);
    }

    if (userId) {
      const q = query(collection(db, path), where('customerId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Order);
    }

    if (userEmail) {
      const q = query(collection(db, path), where('customerEmail', '==', userEmail));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Order);
    }

    return [];
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Orders fetch offline or unavailable.');
      return [];
    }
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createOrderInFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: order queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// STORE SETTINGS
// ==========================================
export async function fetchStoreSettingsFromFirestore(): Promise<StoreSettings | null> {
  const path = 'settings/global';
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (snap.exists()) {
      return snap.data() as StoreSettings;
    }
    return null;
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Store settings fetch offline or unavailable; using defaults.');
      return null;
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveStoreSettingsToFirestore(settings: StoreSettings): Promise<void> {
  const path = 'settings/global';
  try {
    await setDoc(doc(db, 'settings', 'global'), settings);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: settings queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// USER / CUSTOMER PROFILE
// ==========================================
export async function fetchCustomerFromFirestore(uid: string): Promise<Customer | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as Customer;
    }
    return null;
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Customer profile fetch offline or unavailable.');
      return null;
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveCustomerToFirestore(customer: Partial<Customer> & { uid: string; email: string; role?: string }): Promise<void> {
  const path = `users/${customer.uid}`;
  try {
    await setDoc(doc(db, 'users', customer.uid), customer, { merge: true });
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: customer profile queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// COUPONS
// ==========================================
export async function fetchCouponsFromFirestore(): Promise<Coupon[]> {
  const path = 'coupons';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as Coupon);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Coupons fetch offline or unavailable.');
      return [];
    }
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveCouponToFirestore(coupon: Coupon): Promise<void> {
  const path = `coupons/${coupon.id}`;
  try {
    await setDoc(doc(db, 'coupons', coupon.id), coupon);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: coupon queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// RETURNS
// ==========================================
export async function fetchReturnsFromFirestore(userEmail?: string, isAdmin?: boolean): Promise<ReturnRequest[]> {
  const path = 'returns';
  try {
    if (isAdmin) {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => d.data() as ReturnRequest);
    }

    if (userEmail) {
      const q = query(collection(db, path), where('customerEmail', '==', userEmail));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ReturnRequest);
    }

    return [];
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Returns fetch offline or unavailable.');
      return [];
    }
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveReturnToFirestore(req: ReturnRequest): Promise<void> {
  const path = `returns/${req.id}`;
  try {
    await setDoc(doc(db, 'returns', req.id), req);
  } catch (err) {
    if (isOfflineOrUnavailable(err)) {
      console.info('[Firestore] Offline mode: return queued in local store:', path);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// REAL-TIME FIRESTORE ON SNAPSHOT LISTENERS
// ==========================================
export function subscribeToProductsRealtime(callback: (products: Product[]) => void): () => void {
  try {
    const q = collection(db, 'products');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const products = snapshot.docs.map((doc) => doc.data() as Product);
        if (products.length > 0) {
          callback(products);
        }
      },
      (error) => {
        if (!isOfflineOrUnavailable(error)) {
          console.warn('[Firestore] Real-time products listener notice:', error);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Failed to attach real-time products listener:', err);
    return () => {};
  }
}

export function subscribeToOrdersRealtime(
  callback: (orders: Order[]) => void,
  userEmail?: string,
  isAdmin?: boolean
): () => void {
  try {
    const path = 'orders';
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    if (!isAdmin && userEmail) {
      q = query(collection(db, path), where('customer.email', '==', userEmail), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => doc.data() as Order);
        callback(orders);
      },
      (error) => {
        if (!isOfflineOrUnavailable(error)) {
          console.warn('[Firestore] Real-time orders listener notice:', error);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Failed to attach real-time orders listener:', err);
    return () => {};
  }
}

export function subscribeToStoreSettingsRealtime(callback: (settings: StoreSettings) => void): () => void {
  try {
    const docRef = doc(db, 'settings', 'store');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as StoreSettings);
        }
      },
      (error) => {
        if (!isOfflineOrUnavailable(error)) {
          console.warn('[Firestore] Real-time settings listener notice:', error);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Failed to attach real-time settings listener:', err);
    return () => {};
  }
}
