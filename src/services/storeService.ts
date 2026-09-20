/**
 * Centralized Store Service & Data Persistence Layer
 *
 * Implements the complete flow:
 * USER ACTION → EVENT HANDLER → VALIDATION → API REQUEST → BACKEND →
 * DATABASE / PERSISTENT STORE → API RESPONSE → FRONTEND STATE UPDATE → UI UPDATE
 *
 * Features:
 * - Real API sync via /api/* with robust local cache fallback
 * - Full CRUD for Products, Orders, Customers, Coupons, Returns, Media, Users, Settings
 * - Instant reactive updates for subscribers
 */

import {
  StoreSettings,
  Product,
  Order,
  OrderStatus,
  Coupon,
  Customer,
  CustomerAddress,
  ReturnRequest,
  MediaItem,
  UserAccount,
  validateProductSafety,
  AllowedCategory,
} from '../types';
import {
  initialStoreSettings,
  initialProducts,
  initialCoupons,
  initialOrders,
  initialCustomers,
  initialReturnRequests,
  initialMediaItems,
  initialUserAccounts,
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'ridex_store_settings_v3',
  PRODUCTS: 'ridex_products_v3',
  ORDERS: 'ridex_orders_v3',
  COUPONS: 'ridex_coupons_v3',
  CUSTOMERS: 'ridex_customers_v3',
  RETURNS: 'ridex_returns_v3',
  MEDIA: 'ridex_media_v3',
  USERS: 'ridex_users_v3',
};

function cleanupStaleStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Remove deprecated cache versions or temp keys
      if (
        k.startsWith('ridex_') &&
        (k.endsWith('_v1') || k.endsWith('_v2') || k.endsWith('_v0') || k.includes('temp') || k.includes('backup'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // If existing cached products exceed 400KB or contain massive base64 strings, clear it to reclaim quota
    const existingProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (existingProds && (existingProds.length > 400000 || existingProds.includes('data:image/'))) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    }
  } catch {
    // Ignore cleanup errors
  }
}

function sanitizeForStorage(key: string, data: any): any {
  if (!data) return data;
  try {
    if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
      // Strip any huge base64 data URLs from localStorage cache
      return data.map((p: any) => {
        if (!p || typeof p !== 'object') return p;
        const copy = { ...p };
        if (Array.isArray(copy.images)) {
          copy.images = copy.images.map((img: any) =>
            typeof img === 'string' && img.length > 400 && img.startsWith('data:')
              ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
              : img
          );
        }
        if (Array.isArray(copy.masterImages)) {
          copy.masterImages = copy.masterImages.map((img: any) => {
            if (img && typeof img.url === 'string' && img.url.length > 400 && img.url.startsWith('data:')) {
              return { ...img, url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80' };
            }
            return img;
          });
        }
        if (Array.isArray(copy.colorVariants)) {
          copy.colorVariants = copy.colorVariants.map((cv: any) => {
            if (!cv || !Array.isArray(cv.images)) return cv;
            return {
              ...cv,
              images: cv.images.map((img: any) => {
                if (typeof img === 'string' && img.length > 400 && img.startsWith('data:')) {
                  return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';
                }
                if (img && typeof img.url === 'string' && img.url.length > 400 && img.url.startsWith('data:')) {
                  return { ...img, url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80' };
                }
                return img;
              }),
            };
          });
        }
        return copy;
      });
    }

    if (key === STORAGE_KEYS.SETTINGS && data && typeof data === 'object') {
      const copy = { ...data };
      if (typeof copy.brandLogo === 'string' && copy.brandLogo.length > 400 && copy.brandLogo.startsWith('data:')) {
        copy.brandLogo = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80';
      }
      return copy;
    }
  } catch {
    return data;
  }
  return data;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sanitizeForStorage(key, data);
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.warn(`Storage quota notice for ${key}. Reclaiming storage space.`);
      try {
        cleanupStaleStorage();
        // Try saving stripped/compact cache
        if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
          const minimal = (data as any[]).map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            brand: p.brand,
            category: p.category,
            price: p.price,
            originalPrice: p.originalPrice,
            stock: p.stock,
            status: p.status,
            colorVariants: (p.colorVariants || []).map((cv: any) => ({
              id: cv.id,
              colorName: cv.colorName,
              colorHex: cv.colorHex,
              images: (cv.images || []).map((img: any) => ({
                id: typeof img === 'string' ? 'img' : (img.id || 'img'),
                url: typeof img === 'string' ? (img.startsWith('data:') ? '' : img) : (img.url?.startsWith('data:') ? '' : img.url),
                alt: typeof img === 'string' ? '' : (img.alt || ''),
              })),
            })),
          }));
          localStorage.setItem(key, JSON.stringify(minimal));
        }
      } catch {
        // Fallback: In-memory and API sync remain completely functional
      }
    } else {
      console.warn(`Storage write notice for ${key}:`, err);
    }
  }
}

class StoreService {
  private settings: StoreSettings;
  private products: Product[];
  private orders: Order[];
  private coupons: Coupon[];
  private customers: Customer[];
  private returns: ReturnRequest[];
  private mediaItems: MediaItem[];
  private users: UserAccount[];
  private listeners: Set<() => void> = new Set();
  private hasInitializedBackend = false;
  private eventSource: EventSource | null = null;
  private realtimeRetryTimeout: any = null;

  constructor() {
    cleanupStaleStorage();
    this.settings = safeGet<StoreSettings>(STORAGE_KEYS.SETTINGS, initialStoreSettings);
    this.products = safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
    this.orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
    this.coupons = safeGet<Coupon[]>(STORAGE_KEYS.COUPONS, initialCoupons);
    this.customers = safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    this.returns = safeGet<ReturnRequest[]>(STORAGE_KEYS.RETURNS, initialReturnRequests);
    this.mediaItems = safeGet<MediaItem[]>(STORAGE_KEYS.MEDIA, initialMediaItems);
    this.users = this.deduplicateUsers(safeGet<UserAccount[]>(STORAGE_KEYS.USERS, initialUserAccounts));

    if (typeof window !== 'undefined') {
      this.syncFromBackend();
      this.initRealtimeStream();
    }
  }

  // Initialize Real-time Server-Sent Events (SSE) Stream
  public initRealtimeStream() {
    if (typeof window === 'undefined' || !window.EventSource) return;
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) return;

    try {
      const es = new EventSource('/api/realtime/stream');
      this.eventSource = es;

      es.onopen = () => {
        // Connected to real-time event pipeline
      };

      es.onmessage = (event) => {
        try {
          if (!event.data) return;
          const payload = JSON.parse(event.data);
          const type = payload?.type;
          const data = payload?.data;

          if (type === 'products_updated' && Array.isArray(data)) {
            this.products = data;
            safeSet(STORAGE_KEYS.PRODUCTS, this.products);
            this.notify();
          } else if (type === 'orders_updated' && Array.isArray(data)) {
            this.orders = data;
            safeSet(STORAGE_KEYS.ORDERS, this.orders);
            this.notify();
          } else if (type === 'settings_updated' && data) {
            this.settings = { ...this.settings, ...data };
            safeSet(STORAGE_KEYS.SETTINGS, this.settings);
            this.notify();
          } else if (type === 'coupons_updated' && Array.isArray(data)) {
            this.coupons = data;
            safeSet(STORAGE_KEYS.COUPONS, this.coupons);
            this.notify();
          } else if (type === 'customers_updated' && Array.isArray(data)) {
            this.customers = data;
            safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
            this.notify();
          } else if (type === 'customer_registered' && data) {
            const idx = this.customers.findIndex(c => c.id === data.id || c.email?.toLowerCase() === data.email?.toLowerCase());
            if (idx >= 0) {
              this.customers[idx] = { ...this.customers[idx], ...data };
            } else {
              this.customers.unshift(data);
            }
            safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
            this.notify();
          } else if (type === 'customer_password_reset' && data?.email) {
            // Password reset event
            this.notify();
          } else if (type === 'returns_updated' && Array.isArray(data)) {
            this.returns = data;
            safeSet(STORAGE_KEYS.RETURNS, this.returns);
            this.notify();
          } else {
            // Catch-all remote refresh
            this.hasInitializedBackend = false;
            this.syncFromBackend();
          }
        } catch (err) {
          console.warn('Realtime event parse notice:', err);
        }
      };

      es.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        if (!this.realtimeRetryTimeout) {
          this.realtimeRetryTimeout = setTimeout(() => {
            this.realtimeRetryTimeout = null;
            this.initRealtimeStream();
          }, 3500);
        }
      };
    } catch (err) {
      console.warn('Realtime event subscription notice:', err);
    }
  }

  // Fetch initial data from backend if available
  public async syncFromBackend() {
    if (this.hasInitializedBackend) return;
    this.hasInitializedBackend = true;

    try {
      // Load store settings
      const settingsRes = await fetch('/api/store', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (settingsRes?.success && settingsRes.settings) {
        this.settings = { ...this.settings, ...settingsRes.settings };
        safeSet(STORAGE_KEYS.SETTINGS, this.settings);
      }

      // Load products
      const prodsRes = await fetch('/api/products', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (prodsRes?.success && Array.isArray(prodsRes.products) && prodsRes.products.length > 0) {
        this.products = prodsRes.products;
        safeSet(STORAGE_KEYS.PRODUCTS, this.products);
      }

      // Load orders
      const ordersRes = await fetch('/api/orders', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (ordersRes?.success && Array.isArray(ordersRes.orders) && ordersRes.orders.length > 0) {
        this.orders = ordersRes.orders;
        safeSet(STORAGE_KEYS.ORDERS, this.orders);
      }

      // Load coupons
      const couponsRes = await fetch('/api/coupons', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (couponsRes?.success && Array.isArray(couponsRes.coupons)) {
        this.coupons = couponsRes.coupons;
        safeSet(STORAGE_KEYS.COUPONS, this.coupons);
      }

      // Load customers
      const custRes = await fetch('/api/customers', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (custRes?.success && Array.isArray(custRes.customers)) {
        this.customers = custRes.customers;
        safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
      }

      // Load returns
      const retRes = await fetch('/api/returns', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (retRes?.success && Array.isArray(retRes.returns)) {
        this.returns = retRes.returns;
        safeSet(STORAGE_KEYS.RETURNS, this.returns);
      }

      // Load media
      const mediaRes = await fetch('/api/media', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (mediaRes?.success && Array.isArray(mediaRes.media)) {
        this.mediaItems = mediaRes.media;
        safeSet(STORAGE_KEYS.MEDIA, this.mediaItems);
      }

      // Load users
      const usersRes = await fetch('/api/users', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (usersRes?.success && Array.isArray(usersRes.users)) {
        this.users = this.deduplicateUsers(usersRes.users);
        safeSet(STORAGE_KEYS.USERS, this.users);
      }

      this.notify();
    } catch (err) {
      console.warn('Backend initial sync notice (using local storage cache):', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Listener notification error', err);
      }
    });
  }

  // ==========================================
  // STORE & COMPANY SETTINGS
  // ==========================================
  public getSettings(): StoreSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<StoreSettings>): { success: boolean; settings: StoreSettings; error?: string } {
    this.settings = {
      ...this.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    safeSet(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();

    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.settings),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          this.settings = data.settings;
          safeSet(STORAGE_KEYS.SETTINGS, this.settings);
          this.notify();
        }
      })
      .catch((err) => console.warn('API sync warning for settings:', err.message));

    return { success: true, settings: this.settings };
  }

  public resetSettingsToDefault(): StoreSettings {
    this.settings = { ...initialStoreSettings, updatedAt: new Date().toISOString() };
    safeSet(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();

    fetch('/api/store/reset', { method: 'POST' }).catch((err) =>
      console.warn('Backend reset call notice:', err)
    );

    return this.settings;
  }

  // ==========================================
  // PRODUCTS & COLOR GALLERIES
  // ==========================================
  public getProducts(filterActiveOnly = false): Product[] {
    if (filterActiveOnly) {
      return this.products.filter((p) => p.status === 'ACTIVE');
    }
    return [...this.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public saveProduct(productData: Partial<Product>): { success: boolean; product?: Product; error?: string } {
    // 1. Strict Business Validation
    const safetyCheck = validateProductSafety(
      productData.name || '',
      productData.category || 'Riding Jackets'
    );
    if (!safetyCheck.valid) {
      return { success: false, error: safetyCheck.reason };
    }

    const defaultBrand = this.settings.brandName || 'RIDEX MOTO';
    let savedProduct: Product;

    if (productData.id && this.products.some((p) => p.id === productData.id)) {
      // Update existing
      const index = this.products.findIndex((p) => p.id === productData.id);
      const existing = this.products[index];

      savedProduct = {
        ...existing,
        ...productData,
        brand: productData.brand || existing.brand || defaultBrand,
        updatedAt: new Date().toISOString(),
      } as Product;

      this.products[index] = savedProduct;
    } else {
      // Create new
      const id = productData.id || `prod-${Date.now()}`;
      savedProduct = {
        id,
        name: productData.name || 'New Riding Gear',
        sku: productData.sku || `RDX-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: productData.brand || defaultBrand,
        category: (productData.category as AllowedCategory) || 'Riding Jackets',
        subcategory: productData.subcategory || 'Touring',
        description: productData.description || '',
        price: Number(productData.price) || 2999,
        originalPrice: Number(productData.originalPrice) || Number(productData.price) || 2999,
        discountPercentage: Number(productData.discountPercentage) || 0,
        gstPercentage: Number(productData.gstPercentage) || this.settings.defaultGSTRate || 18,
        stock: Number(productData.stock) || 10,
        lowStockThreshold: Number(productData.lowStockThreshold) || 5,
        sizes: productData.sizes || ['M', 'L', 'XL'],
        colors: productData.colors || ['Stealth Black'],
        colorVariants: productData.colorVariants || [
          {
            id: `cv-${Date.now()}-1`,
            colorName: 'Stealth Black',
            colorHex: '#18181b',
            images: [],
          },
        ],
        masterImages: productData.masterImages || [],
        material: productData.material || 'Reinforced Cordura & Ballistic Nylon',
        specifications: productData.specifications || {},
        features: productData.features || [],
        armorLevel: productData.armorLevel || 'CE Level 2',
        waterproofRating: productData.waterproofRating || '10,000 mm H2O',
        tags: productData.tags || ['Riding Gear'],
        seoTitle: productData.seoTitle || `${productData.name || 'Riding Gear'} | ${this.settings.brandName}`,
        seoDescription: productData.seoDescription || productData.description?.slice(0, 150) || '',
        status: productData.status || 'ACTIVE',
        videoUrl: productData.videoUrl || '',
        rating: 5.0,
        reviewCount: 1,
        isFeatured: Boolean(productData.isFeatured),
        isNewArrival: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.products.unshift(savedProduct);
    }

    safeSet(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    // Sync to backend API in background
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedProduct),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.product) {
          const idx = this.products.findIndex((p) => p.id === data.product.id);
          if (idx >= 0) {
            this.products[idx] = data.product;
            safeSet(STORAGE_KEYS.PRODUCTS, this.products);
            this.notify();
          }
        }
      })
      .catch((err) => console.warn('API sync notice for product save:', err));

    return { success: true, product: savedProduct };
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    this.products = this.products.filter((p) => p.id !== id);
    safeSet(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('API sync notice for product delete:', err));

    return { success: true };
  }

  public duplicateProduct(id: string): { success: boolean; product?: Product } {
    const existing = this.products.find((p) => p.id === id);
    if (!existing) return { success: false };

    const duplicated: Product = {
      ...existing,
      id: `prod-${Date.now()}`,
      name: `${existing.name} (Copy)`,
      sku: `${existing.sku}-CPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(duplicated);
    safeSet(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    fetch('/api/products/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch((err) => console.warn('API sync notice for product duplication:', err));

    return { success: true, product: duplicated };
  }

  // ==========================================
  // ORDERS & SHIPMENT TRACKING
  // ==========================================
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const orderNumber = `RDX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `ord-${Date.now()}`;

    // Deduct stock locally
    orderData.items.forEach((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    });
    safeSet(STORAGE_KEYS.PRODUCTS, this.products);

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      orderStatus: 'CONFIRMED',
      paymentStatus: orderData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      shipment: {
        shipmentId: `SHIP-${Math.floor(100000 + Math.random() * 900000)}`,
        courierPartner: 'Shiprocket Express',
        trackingNumber: `SR${Math.floor(100000000 + Math.random() * 900000000)}IN`,
        currentStatus: 'Order Confirmed — Allocation to nearest fulfillment warehouse',
        events: [
          {
            timestamp: new Date().toISOString(),
            status: 'Order Confirmed',
            location: this.settings.city || 'Bengaluru',
            description: `Order successfully booked and verified. Fulfillment initiated under ${this.settings.brandName}.`,
          },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    safeSet(STORAGE_KEYS.ORDERS, this.orders);

    // Update customer spending
    const customer = this.customers.find((c) => c.email === orderData.customerEmail);
    if (customer) {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + newOrder.grandTotal;
      customer.lastOrderDate = newOrder.createdAt;
      safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    }

    this.notify();

    // Sync to backend API in background
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) {
          const idx = this.orders.findIndex((o) => o.id === id);
          if (idx >= 0) {
            this.orders[idx] = data.order;
            safeSet(STORAGE_KEYS.ORDERS, this.orders);
            this.notify();
          }
        }
      })
      .catch((err) => console.warn('API sync notice for order creation:', err));

    return newOrder;
  }

  public updateOrderStatus(
    orderId: string,
    status: Order['orderStatus'],
    shipmentUpdate?: Partial<Order['shipment']>
  ): { success: boolean; order?: Order } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false };

    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();

    if (shipmentUpdate) {
      order.shipment = {
        ...order.shipment,
        ...shipmentUpdate,
        shipmentId: shipmentUpdate.shipmentId || order.shipment?.shipmentId || `SHIP-${Date.now().toString().slice(-6)}`,
        courierPartner: shipmentUpdate.courierPartner || order.shipment?.courierPartner || 'Shiprocket (Air)',
        trackingNumber: shipmentUpdate.trackingNumber || order.shipment?.trackingNumber || `SR${Date.now().toString().slice(-8)}IN`,
        currentStatus: shipmentUpdate.currentStatus || `Status updated to ${status}`,
        events: [
          ...(order.shipment?.events || []),
          {
            timestamp: new Date().toISOString(),
            status: status.replace(/_/g, ' '),
            location: this.settings.city || 'Central Hub',
            description: shipmentUpdate.currentStatus || `Shipment status updated to ${status}`,
          },
        ],
      };
    }

    safeSet(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    // Call API in background
    fetch('/api/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status, shipmentUpdate }),
    }).catch((err) => console.warn('API sync notice for order status update:', err));

    return { success: true, order };
  }

  public importOrders(ordersToImport: any[]): {
    success: boolean;
    count: number;
    orders: Order[];
    message: string;
  } {
    if (!Array.isArray(ordersToImport) || ordersToImport.length === 0) {
      return { success: false, count: 0, orders: [], message: 'No valid order records found to import' };
    }

    const importedOrders: Order[] = [];
    const validStatuses: Set<string> = new Set([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURN_REQUESTED',
      'RETURNED',
      'REFUND_INITIATED',
      'REFUND_COMPLETED',
      'REFUNDED',
    ]);

    for (const raw of ordersToImport) {
      const orderNumber = String(
        raw.orderNumber || raw.orderId || `RDX-2026-${Math.floor(1000 + Math.random() * 9000)}`
      ).trim();
      const id = raw.id || `ord-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const grandTotal = Number(raw.grandTotal || raw.total || raw.amount || 0) || 4999;

      let rawStatus = String(raw.status || raw.orderStatus || 'CONFIRMED')
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '_');
      if (rawStatus === 'IN_TRANSIT') rawStatus = 'SHIPPED';
      const orderStatus: OrderStatus = validStatuses.has(rawStatus)
        ? (rawStatus as OrderStatus)
        : 'CONFIRMED';

      let paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' = 'PAID';
      const rawPayment = String(raw.paymentStatus || raw.payment || '').toUpperCase();
      if (rawPayment.includes('PENDING') || rawPayment.includes('COD') || rawPayment.includes('UNPAID')) {
        paymentStatus = 'PENDING';
      } else if (rawPayment.includes('REFUND')) {
        paymentStatus = 'REFUNDED';
      } else if (rawPayment.includes('FAIL')) {
        paymentStatus = 'FAILED';
      }

      // Parse items
      let itemsList: any[] = [];
      if (Array.isArray(raw.items) && raw.items.length > 0) {
        itemsList = raw.items;
      } else if (typeof raw.items === 'string' && raw.items.trim()) {
        const itemNames = raw.items.split(';');
        itemsList = itemNames.map((nameStr, idx) => {
          const trimmedName = nameStr.trim();
          const matchedProd = this.products.find((p) =>
            p.name.toLowerCase().includes(trimmedName.toLowerCase())
          );
          return {
            id: `item-${Date.now()}-${idx}`,
            productId: matchedProd?.id || 'gear-imported',
            name: matchedProd?.name || trimmedName || 'AeroTour Riding Gear',
            price: matchedProd?.price || Math.round(grandTotal / itemNames.length),
            quantity: 1,
            selectedColor: matchedProd?.colors?.[0] || 'Black',
            selectedSize: matchedProd?.sizes?.[0] || 'L',
            selectedImage:
              matchedProd?.masterImages?.[0]?.url ||
              matchedProd?.colorVariants?.[0]?.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
          };
        });
      } else {
        const defaultProd = this.products[0];
        itemsList = [
          {
            id: `item-${Date.now()}-0`,
            productId: defaultProd?.id || 'prod-1',
            name: defaultProd?.name || 'AeroTour Riding Jacket',
            price: grandTotal,
            quantity: 1,
            selectedColor: 'Stealth Black',
            selectedSize: 'L',
            selectedImage:
              defaultProd?.masterImages?.[0]?.url ||
              defaultProd?.colorVariants?.[0]?.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
          },
        ];
      }

      const orderDate = raw.date ? new Date(raw.date).toISOString() : new Date().toISOString();

      const newOrder: Order = {
        id,
        orderNumber,
        customerId: raw.customerId || 'cust-1',
        customerName: raw.customerName || raw.name || 'Rider Customer',
        customerEmail: raw.customerEmail || raw.email || 'customer@ridexgear.in',
        customerPhone: raw.phone || raw.customerPhone || '+91 98765 43210',
        shippingAddress: raw.shippingAddress || {
          fullName: raw.customerName || 'Rider Customer',
          phone: raw.phone || '+91 98765 43210',
          street: raw.street || 'Plot 42, Outer Ring Road',
          city: raw.city || 'Bengaluru',
          state: raw.state || 'Karnataka',
          pincode: raw.pincode || '560103',
        },
        billingAddress: raw.billingAddress ||
          raw.shippingAddress || {
            fullName: raw.customerName || 'Rider Customer',
            phone: raw.phone || '+91 98765 43210',
            street: raw.street || 'Plot 42, Outer Ring Road',
            city: raw.city || 'Bengaluru',
            state: raw.state || 'Karnataka',
            pincode: raw.pincode || '560103',
          },
        items: itemsList,
        subtotal: Number(raw.subtotal) || grandTotal,
        discountAmount: Number(raw.discount || raw.discountAmount) || 0,
        deliveryCharge: Number(raw.shippingFee || raw.deliveryCharge) || 0,
        taxAmount: Number(raw.tax || raw.taxAmount) || Math.round((grandTotal * 0.18) / 1.18),
        grandTotal,
        paymentMethod: raw.paymentMethod || (paymentStatus === 'PENDING' ? 'COD' : 'UPI'),
        paymentStatus,
        orderStatus,
        shipment: raw.shipment || {
          shipmentId: `SHIP-${Math.floor(100000 + Math.random() * 900000)}`,
          courierPartner: 'Shiprocket Express',
          trackingNumber: `SR${Math.floor(100000000 + Math.random() * 900000000)}IN`,
          currentStatus: `Order ${orderStatus.replace(/_/g, ' ')}`,
          events: [
            {
              timestamp: orderDate,
              status: orderStatus.replace(/_/g, ' '),
              location: 'Bengaluru Central Logistics Hub',
              description: 'Order imported and verified in operations database.',
            },
          ],
        },
        createdAt: orderDate,
        updatedAt: new Date().toISOString(),
      };

      const existingIndex = this.orders.findIndex(
        (o) => o.orderNumber === orderNumber || (raw.id && o.id === raw.id)
      );

      if (existingIndex >= 0) {
        this.orders[existingIndex] = {
          ...this.orders[existingIndex],
          ...newOrder,
          id: this.orders[existingIndex].id,
        };
        importedOrders.push(this.orders[existingIndex]);
      } else {
        this.orders.unshift(newOrder);
        importedOrders.push(newOrder);
      }
    }

    safeSet(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    // Async sync with backend
    fetch('/api/orders/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: importedOrders }),
    }).catch((err) => console.warn('Background sync for imported orders:', err));

    return {
      success: true,
      count: importedOrders.length,
      orders: importedOrders,
      message: `Successfully imported ${importedOrders.length} orders`,
    };
  }

  // ==========================================
  // COUPONS
  // ==========================================
  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  public validateCoupon(
    code: string,
    subtotal: number
  ): { valid: boolean; coupon?: Coupon; discount: number; reason?: string } {
    const trimmed = code.trim().toUpperCase();

    // Local evaluation
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === trimmed);
    if (!coupon) return { valid: false, discount: 0, reason: 'Invalid coupon code.' };
    if (coupon.status !== 'ACTIVE') return { valid: false, discount: 0, reason: 'This coupon is no longer active.' };

    const now = new Date();
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return { valid: false, discount: 0, reason: 'This coupon has expired.' };
    }

    const min = coupon.minimumOrder || coupon.minOrderValue || 0;
    if (subtotal < min) {
      return { valid: false, discount: 0, reason: `Minimum cart order of ₹${min.toLocaleString('en-IN')} required.` };
    }

    let discount = 0;
    const val = coupon.value || coupon.discountValue || 0;
    const isPercent = coupon.type === 'PERCENTAGE' || coupon.discountType === 'PERCENTAGE';

    if (isPercent) {
      discount = Math.round((subtotal * val) / 100);
      const maxD = coupon.maximumDiscount || coupon.maxDiscount;
      if (maxD && discount > maxD) discount = maxD;
    } else {
      discount = Math.min(val, subtotal);
    }

    return { valid: true, coupon, discount };
  }

  public saveCoupon(couponData: Partial<Coupon>): { success: boolean; coupon?: Coupon } {
    let saved: Coupon;
    const isFlat = couponData.type === 'FIXED' || couponData.discountType === 'FLAT';
    const computedType = isFlat ? 'FIXED' : 'PERCENTAGE';
    const computedDiscountType = isFlat ? 'FLAT' : 'PERCENTAGE';
    const numVal = Number(couponData.value ?? couponData.discountValue ?? 10);
    const minVal = Number(couponData.minimumOrder ?? couponData.minOrderValue ?? 999);
    const maxVal = couponData.maximumDiscount ? Number(couponData.maximumDiscount) : couponData.maxDiscount ? Number(couponData.maxDiscount) : undefined;
    const endDt = couponData.endDate || couponData.validUntil || '2026-12-31';
    const activeState = couponData.status === 'ACTIVE' || couponData.isActive !== false;

    if (couponData.id && this.coupons.some((c) => c.id === couponData.id)) {
      const idx = this.coupons.findIndex((c) => c.id === couponData.id);
      saved = {
        ...this.coupons[idx],
        ...couponData,
        type: computedType,
        discountType: computedDiscountType,
        value: numVal,
        discountValue: numVal,
        minimumOrder: minVal,
        minOrderValue: minVal,
        maximumDiscount: maxVal,
        maxDiscount: maxVal,
        endDate: endDt,
        validUntil: endDt,
        status: activeState ? 'ACTIVE' : 'DISABLED',
        isActive: activeState,
      } as Coupon;
      this.coupons[idx] = saved;
    } else {
      saved = {
        id: `coup-${Date.now()}`,
        code: (couponData.code || 'SAVE10').toUpperCase().trim(),
        type: computedType,
        discountType: computedDiscountType,
        value: numVal,
        discountValue: numVal,
        minimumOrder: minVal,
        minOrderValue: minVal,
        maximumDiscount: maxVal,
        maxDiscount: maxVal,
        startDate: couponData.startDate || new Date().toISOString().split('T')[0],
        endDate: endDt,
        validUntil: endDt,
        usageLimit: Number(couponData.usageLimit) || 500,
        usageCount: 0,
        perCustomerLimit: Number(couponData.perCustomerLimit) || 1,
        status: activeState ? 'ACTIVE' : 'DISABLED',
        isActive: activeState,
        description: couponData.description || 'Special promotional discount',
      };
      this.coupons.push(saved);
    }

    safeSet(STORAGE_KEYS.COUPONS, this.coupons);
    this.notify();

    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch((err) => console.warn('API sync notice for coupon save:', err));

    return { success: true, coupon: saved };
  }

  public deleteCoupon(id: string): { success: boolean } {
    this.coupons = this.coupons.filter((c) => c.id !== id);
    safeSet(STORAGE_KEYS.COUPONS, this.coupons);
    this.notify();

    fetch(`/api/coupons?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) =>
      console.warn('API sync notice for coupon delete:', err)
    );

    return { success: true };
  }

  // ==========================================
  // RETURNS & REFUNDS
  // ==========================================
  public getReturns(): ReturnRequest[] {
    return [...this.returns];
  }

  public createReturnRequest(
    orderId: string,
    reason: string,
    items: { productId: string; name: string; quantity: number }[]
  ): { success: boolean; request?: ReturnRequest; error?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const req: ReturnRequest = {
      id: `ret-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      items: items.map((i) => ({ ...i, reason })),
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      refundAmount: order.grandTotal,
      adminNotes: '',
    };

    order.orderStatus = 'RETURN_REQUESTED';
    this.returns.unshift(req);

    safeSet(STORAGE_KEYS.RETURNS, this.returns);
    safeSet(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).catch((err) => console.warn('API sync notice for return create:', err));

    return { success: true, request: req };
  }

  public updateReturnStatus(
    returnId: string,
    status: ReturnRequest['status'],
    adminNotes?: string,
    refundTxId?: string
  ): { success: boolean } {
    const req = this.returns.find((r) => r.id === returnId);
    if (!req) return { success: false };

    req.status = status;
    if (adminNotes !== undefined) req.adminNotes = adminNotes;
    if (refundTxId) req.refundTransactionId = refundTxId;

    if (status === 'REFUND_COMPLETED') {
      const order = this.orders.find((o) => o.id === req.orderId);
      if (order) {
        order.orderStatus = 'REFUNDED';
        order.paymentStatus = 'REFUNDED';
        safeSet(STORAGE_KEYS.ORDERS, this.orders);
      }
    }

    safeSet(STORAGE_KEYS.RETURNS, this.returns);
    this.notify();

    fetch('/api/returns/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnId, status, adminNotes, refundTransactionId: refundTxId }),
    }).catch((err) => console.warn('API sync notice for return status:', err));

    return { success: true };
  }

  // ==========================================
  // CUSTOMERS & ADDRESS MANAGEMENT
  // ==========================================
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public getCustomerByEmail(email: string): Customer | undefined {
    return this.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  }

  public async updateCustomer(customerData: Partial<Customer>): Promise<{ success: boolean; customer?: Customer }> {
    let customer: Customer;
    const existingIdx = this.customers.findIndex((c) => c.id === customerData.id || c.email === customerData.email);

    if (existingIdx >= 0) {
      customer = { ...this.customers[existingIdx], ...customerData };
      this.customers[existingIdx] = customer;
    } else {
      customer = {
        id: customerData.id || `cust-${Date.now()}`,
        name: customerData.name || 'Rider',
        email: customerData.email || 'customer@example.com',
        phone: customerData.phone || '',
        addresses: customerData.addresses || [],
        totalOrders: 0,
        totalSpent: 0,
        status: 'ACTIVE',
        registrationDate: new Date().toISOString(),
      };
      this.customers.push(customer);
    }

    safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
    } catch (err) {
      console.warn('API sync notice for customer update:', err);
    }

    return { success: true, customer };
  }

  public async addCustomerAddress(
    customerId: string,
    address: CustomerAddress
  ): Promise<{ success: boolean; address?: CustomerAddress }> {
    let cust = this.customers.find(
      (c) =>
        c.id === customerId ||
        (c.email && c.email.toLowerCase() === customerId.toLowerCase())
    );

    if (!cust) {
      cust = {
        id: customerId,
        name: address.fullName || address.name || 'Rider',
        email: customerId.includes('@') ? customerId : 'customer@ridexgear.in',
        phone: address.phone || '',
        addresses: [],
        totalOrders: 0,
        totalSpent: 0,
        status: 'ACTIVE',
        registrationDate: new Date().toISOString(),
      };
      this.customers.push(cust);
    }

    if (!Array.isArray(cust.addresses)) {
      cust.addresses = [];
    }

    const isFirstAddress = cust.addresses.length === 0;
    const shouldBeDefault = Boolean(address.isDefault || isFirstAddress);

    // If an address with same id already exists, update it instead of duplicating!
    const existingIndex = address.id
      ? cust.addresses.findIndex((a) => a.id === address.id)
      : -1;

    const normalizedAddress: CustomerAddress = {
      ...address,
      id: address.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: address.fullName || address.name || cust.name || 'Rider',
      name: address.fullName || address.name || cust.name || 'Rider',
      phone: address.phone || cust.phone || '',
      street: (address.street || '').trim(),
      landmark: (address.landmark || '').trim(),
      city: (address.city || '').trim(),
      state: (address.state || '').trim(),
      pincode: (address.pincode || '').trim(),
      country: (address.country || 'India').trim(),
      isDefault: shouldBeDefault,
    };

    if (shouldBeDefault) {
      cust.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    if (existingIndex >= 0) {
      cust.addresses[existingIndex] = normalizedAddress;
    } else {
      cust.addresses.push(normalizedAddress);
    }

    safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();

    await this.updateCustomer(cust);
    return { success: true, address: normalizedAddress };
  }

  public async updateCustomerAddress(
    customerId: string,
    address: CustomerAddress
  ): Promise<{ success: boolean; address?: CustomerAddress }> {
    let cust = this.customers.find(
      (c) =>
        c.id === customerId ||
        (c.email && c.email.toLowerCase() === customerId.toLowerCase())
    );

    if (!cust) {
      return this.addCustomerAddress(customerId, address);
    }

    if (!Array.isArray(cust.addresses)) {
      cust.addresses = [];
    }

    const existingIdx = address.id
      ? cust.addresses.findIndex((a) => a.id === address.id)
      : -1;

    if (existingIdx === -1) {
      return this.addCustomerAddress(customerId, address);
    }

    const currentAddr = cust.addresses[existingIdx];
    const shouldBeDefault =
      address.isDefault !== undefined ? address.isDefault : currentAddr.isDefault;

    if (shouldBeDefault) {
      cust.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const updatedAddr: CustomerAddress = {
      ...currentAddr,
      ...address,
      id: currentAddr.id,
      fullName: address.fullName || address.name || currentAddr.fullName || currentAddr.name || cust.name,
      name: address.fullName || address.name || currentAddr.fullName || currentAddr.name || cust.name,
      phone: address.phone !== undefined ? address.phone : currentAddr.phone,
      street: address.street !== undefined ? address.street.trim() : currentAddr.street,
      landmark: address.landmark !== undefined ? address.landmark.trim() : (currentAddr.landmark || ''),
      city: address.city !== undefined ? address.city.trim() : currentAddr.city,
      state: address.state !== undefined ? address.state.trim() : currentAddr.state,
      pincode: address.pincode !== undefined ? address.pincode.trim() : currentAddr.pincode,
      country: address.country !== undefined ? address.country.trim() : (currentAddr.country || 'India'),
      isDefault: shouldBeDefault,
    };

    cust.addresses[existingIdx] = updatedAddr;

    // Ensure at least one default if addresses exist
    if (!cust.addresses.some((a) => a.isDefault) && cust.addresses.length > 0) {
      cust.addresses[0].isDefault = true;
    }

    safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();

    await this.updateCustomer(cust);
    return { success: true, address: updatedAddr };
  }

  public async deleteCustomerAddress(customerId: string, addressId: string): Promise<{ success: boolean }> {
    const cust = this.customers.find(
      (c) =>
        c.id === customerId ||
        (c.email && c.email.toLowerCase() === customerId.toLowerCase())
    );
    if (!cust || !Array.isArray(cust.addresses)) return { success: false };

    const wasDefault = cust.addresses.find((a) => a.id === addressId)?.isDefault;
    cust.addresses = cust.addresses.filter((a) => a.id !== addressId);

    if (wasDefault && cust.addresses.length > 0) {
      cust.addresses[0].isDefault = true;
    }

    safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();

    await this.updateCustomer(cust);
    return { success: true };
  }

  public async setDefaultCustomerAddress(customerId: string, addressId: string): Promise<{ success: boolean }> {
    const cust = this.customers.find(
      (c) =>
        c.id === customerId ||
        (c.email && c.email.toLowerCase() === customerId.toLowerCase())
    );
    if (!cust || !Array.isArray(cust.addresses)) return { success: false };

    cust.addresses.forEach((a) => {
      a.isDefault = a.id === addressId;
    });

    safeSet(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();

    await this.updateCustomer(cust);
    return { success: true };
  }

  // ==========================================
  // MEDIA LIBRARY
  // ==========================================
  public getMedia(): MediaItem[] {
    return [...this.mediaItems];
  }

  public async addMedia(media: Partial<MediaItem>): Promise<{ success: boolean; media?: MediaItem }> {
    const displayName = media.name || media.title || 'Equipment Photo';
    const cleanUrl = (media.url || '').trim();
    const newMedia: MediaItem = {
      id: media.id || `med-${Date.now()}`,
      name: displayName,
      title: displayName,
      url: cleanUrl,
      type: media.type || 'image/jpeg',
      category: media.category || 'PRODUCT',
      size: media.size || '350 KB',
      createdAt: new Date().toISOString(),
      associatedProduct: media.associatedProduct || '',
    };

    this.mediaItems.unshift(newMedia);
    safeSet(STORAGE_KEYS.MEDIA, this.mediaItems);
    this.notify();

    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia),
      });
    } catch (err) {
      console.warn('API sync notice for media upload:', err);
    }

    return { success: true, media: newMedia };
  }

  public async deleteMedia(id: string): Promise<{ success: boolean }> {
    this.mediaItems = this.mediaItems.filter((m) => m.id !== id);
    safeSet(STORAGE_KEYS.MEDIA, this.mediaItems);
    this.notify();

    try {
      await fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync notice for media delete:', err);
    }

    return { success: true };
  }

  // ==========================================
  // USERS & ROLES
  // ==========================================
  private deduplicateUsers(users: UserAccount[]): UserAccount[] {
    if (!Array.isArray(users)) return [];
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const unique: UserAccount[] = [];

    for (const u of users) {
      if (!u) continue;
      // Filter out lingering demo customer seed accounts if present in legacy storage
      if (u.id === 'usr-3' || u.email === 'vikram.rider@example.com' || (u.role as string) === 'CUSTOMER') {
        continue;
      }

      const id = String(u.id || '').trim();
      const email = String(u.email || '').trim().toLowerCase();

      if (id && seenIds.has(id)) continue;
      if (email && seenEmails.has(email)) continue;

      if (id) seenIds.add(id);
      if (email) seenEmails.add(email);
      unique.push(u);
    }
    return unique;
  }

  public getUsers(): UserAccount[] {
    return this.deduplicateUsers(this.users);
  }

  public async saveUser(userData: Partial<UserAccount>): Promise<{ success: boolean; user?: UserAccount }> {
    let user: UserAccount;
    const cleanUsers = this.deduplicateUsers(this.users);
    const idx = cleanUsers.findIndex((u) => (userData.id && u.id === userData.id) || (userData.email && u.email.toLowerCase() === userData.email.toLowerCase()));

    if (idx >= 0) {
      user = { ...cleanUsers[idx], ...userData };
      cleanUsers[idx] = user;
    } else {
      user = {
        id: userData.id || `usr-${Date.now()}`,
        name: userData.name || 'Store Staff',
        email: userData.email || '',
        role: userData.role || 'ADMIN',
        phone: userData.phone || '',
        lastLogin: new Date().toISOString(),
        status: 'ACTIVE',
      };
      cleanUsers.push(user);
    }

    this.users = this.deduplicateUsers(cleanUsers);
    safeSet(STORAGE_KEYS.USERS, this.users);
    this.notify();

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (err) {
      console.warn('API sync notice for user save:', err);
    }

    return { success: true, user };
  }

  // ==========================================
  // ANALYTICS & RESILIENT REPORTING
  // ==========================================
  public getAnalytics() {
    const totalRevenue = this.orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const totalOrders = this.orders.length;
    const deliveredOrders = this.orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const pendingOrders = this.orders.filter(
      (o) => o.orderStatus === 'PENDING' || o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED'
    ).length;
    const lowStockCount = this.products.filter((p) => p.stock <= p.lowStockThreshold).length;
    const outOfStockCount = this.products.filter((p) => p.stock <= 0).length;
    const activeCustomers = this.customers.length;

    // Sales by Category
    const categoryMap: Record<string, number> = {};
    this.orders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.category || 'Riding Jackets';
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.total || item.price * item.quantity);
      });
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      totalRevenue,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      lowStockCount,
      outOfStockCount,
      activeCustomers,
      categoryBreakdown,
      returnRequestsCount: this.returns.length,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }
}

// Global Singleton Instance
export const storeService = new StoreService();
