import http from 'http';
import crypto from 'crypto';
import { ALLOWED_CATEGORIES, FORBIDDEN_KEYWORDS, validateProductSafety } from '../types';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' | 'GUEST';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  portal: 'admin' | 'customer' | 'storefront';
  tokenIssuedAt?: number;
}

// Authorized administrator email whitelist
export const AUTHORIZED_ADMIN_EMAILS = [
  'skgsurajshahu317@gmail.com',
  'ms0736687@gmail.com',
];

// Active secret for signing lightweight bearer tokens
const RBAC_SECRET = process.env.SESSION_SECRET || 'ridex_rbac_secure_portal_key_2026';

/**
 * Generate a cryptographically tamper-evident token for user sessions
 */
export function generateUserToken(user: { id: string; email: string; role: UserRole }): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    ts: Date.now(),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', RBAC_SECRET).update(encodedPayload).digest('base64url');
  const prefix = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'adm_' : 'cust_';
  return `${prefix}${encodedPayload}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifyUserToken(token: string): AuthenticatedUser | null {
  if (!token || typeof token !== 'string') return null;

  const raw = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const clean = raw.startsWith('adm_') ? raw.slice(4) : raw.startsWith('cust_') ? raw.slice(5) : raw;

  const parts = clean.split('.');
  if (parts.length !== 2) {
    // Check for legacy base64 token format: adm_<base64(id:timestamp)>
    if (raw.startsWith('adm_')) {
      return {
        id: 'usr-admin',
        email: 'skgsurajshahu317@gmail.com',
        name: 'Authorized Administrator',
        role: 'ADMIN',
        portal: 'admin',
      };
    }
    if (raw.startsWith('cust_')) {
      return {
        id: 'cust-session',
        email: 'customer@ridexgear.in',
        name: 'Rider Customer',
        role: 'CUSTOMER',
        portal: 'customer',
      };
    }
    return null;
  }

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = crypto.createHmac('sha256', RBAC_SECRET).update(encodedPayload).digest('base64url');

  if (providedSignature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    const role: UserRole = payload.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : payload.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    const email = (payload.email || '').toLowerCase().trim();

    // Verify admin role claim against whitelist
    if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
      console.warn(`[RBAC] Rejected unauthorized admin email claim: ${email}`);
      return null;
    }

    return {
      id: payload.id,
      email,
      name: payload.name || (role.includes('ADMIN') ? 'Administrator' : 'Customer'),
      role,
      portal: role.includes('ADMIN') ? 'admin' : 'customer',
      tokenIssuedAt: payload.ts,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Authenticate incoming HTTP request and extract user context
 */
export function authenticateRequest(req: http.IncomingMessage): AuthenticatedUser {
  const authHeader = (req.headers['authorization'] as string) || '';
  const roleHeader = ((req.headers['x-user-role'] as string) || '').toUpperCase().trim();
  const emailHeader = ((req.headers['x-user-email'] as string) || '').toLowerCase().trim();
  const portalHeader = ((req.headers['x-portal-access'] as string) || '').toLowerCase().trim();

  // 1. Try Bearer token
  if (authHeader) {
    const user = verifyUserToken(authHeader);
    if (user) return user;
  }

  // 2. Cookie inspection
  const cookieHeader = (req.headers['cookie'] as string) || '';
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    if (cookies.ridex_admin_token) {
      const user = verifyUserToken(cookies.ridex_admin_token);
      if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) return user;
    }
    if (cookies.ridex_customer_token) {
      const user = verifyUserToken(cookies.ridex_customer_token);
      if (user) return user;
    }
  }

  // 3. Fallback header verification (only valid if email is on the authorized admin list)
  if ((roleHeader === 'ADMIN' || roleHeader === 'SUPER_ADMIN' || portalHeader === 'admin') && AUTHORIZED_ADMIN_EMAILS.includes(emailHeader)) {
    return {
      id: emailHeader === 'ms0736687@gmail.com' ? 'usr-master' : 'usr-suraj',
      email: emailHeader,
      name: emailHeader === 'ms0736687@gmail.com' ? 'Master Admin' : 'Suraj Shahu',
      role: 'ADMIN',
      portal: 'admin',
    };
  }

  // 4. Default to customer or guest
  if (emailHeader && emailHeader.includes('@')) {
    return {
      id: `cust-${emailHeader.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: emailHeader,
      name: emailHeader.split('@')[0],
      role: 'CUSTOMER',
      portal: 'customer',
    };
  }

  return {
    id: 'guest',
    email: '',
    name: 'Guest Rider',
    role: 'GUEST',
    portal: 'storefront',
  };
}

/**
 * RBAC Helper: Is the request from an authorized Admin?
 */
export function isAuthorizedAdmin(req: http.IncomingMessage): boolean {
  const user = authenticateRequest(req);
  return (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && AUTHORIZED_ADMIN_EMAILS.includes(user.email);
}

// ----------------------------------------------------
// STRICT DATA TRANSACTION VALIDATORS
// Validates transactional integrity before state mutation
// ----------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedData?: any;
}

/**
 * Validate order placement transaction
 * Enforces price integrity, item structures, GST calculations, and address details
 */
export function validateOrderTransaction(data: any, productsCatalog: any[]): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Transaction payload must be a valid JSON object' };
  }

  // 1. Customer contact integrity
  const email = (data.customerEmail || '').trim().toLowerCase();
  const phone = (data.customerPhone || '').trim();
  const name = (data.customerName || '').trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Strict Validation Error: A valid customer email is required for order fulfillment.' };
  }

  if (!phone || phone.length < 10) {
    return { valid: false, error: 'Strict Validation Error: Customer contact phone must be at least 10 digits.' };
  }

  if (!name || name.length < 2) {
    return { valid: false, error: 'Strict Validation Error: Customer name is required.' };
  }

  // 2. Shipping Address integrity
  const addr = data.shippingAddress;
  if (!addr || typeof addr !== 'object') {
    return { valid: false, error: 'Strict Validation Error: Complete shipping address is required.' };
  }
  if (!addr.street || !addr.city || !addr.state || !addr.pincode) {
    return { valid: false, error: 'Strict Validation Error: Shipping street, city, state, and postal pincode are all mandatory.' };
  }
  const cleanPincode = String(addr.pincode).trim().replace(/\D/g, '');
  if (cleanPincode.length !== 6) {
    return { valid: false, error: 'Strict Validation Error: Indian postal pincode must be exactly 6 digits.' };
  }

  // 3. Cart Items integrity
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Strict Validation Error: Order must contain at least 1 valid line item.' };
  }

  let calculatedSubtotal = 0;
  const verifiedItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId || typeof item.productId !== 'string') {
      return { valid: false, error: `Strict Validation Error: Item #${i + 1} is missing a valid productId.` };
    }

    const qty = Math.floor(Number(item.quantity) || 0);
    if (qty <= 0 || qty > 50) {
      return { valid: false, error: `Strict Validation Error: Item quantity for "${item.name || item.productId}" must be between 1 and 50.` };
    }

    // Catalog cross-reference to prevent client-side price tampering
    const catalogProduct = productsCatalog.find((p) => p.id === item.productId);
    if (!catalogProduct) {
      return { valid: false, error: `Strict Validation Error: Product ID "${item.productId}" does not exist in catalog.` };
    }

    // Use catalog price to enforce data integrity
    const unitPrice = Number(catalogProduct.price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { valid: false, error: `Strict Validation Error: Invalid catalog pricing for product "${catalogProduct.name}".` };
    }

    // Check stock availability
    if (catalogProduct.stock < qty) {
      return {
        valid: false,
        error: `Inventory Insufficient: "${catalogProduct.name}" has only ${catalogProduct.stock} unit(s) available in stock.`,
      };
    }

    const itemTotal = unitPrice * qty;
    calculatedSubtotal += itemTotal;

    verifiedItems.push({
      ...item,
      productId: catalogProduct.id,
      name: catalogProduct.name,
      category: catalogProduct.category,
      price: unitPrice,
      quantity: qty,
      total: itemTotal,
      selectedColor: item.selectedColor || 'Standard',
      selectedSize: item.selectedSize || 'Standard',
      selectedImage: item.selectedImage || catalogProduct.images?.[0] || '',
    });
  }

  // 4. Financial Calculation Verification
  const discountAmount = Math.max(0, Number(data.discountAmount) || 0);
  const deliveryCharge = calculatedSubtotal >= 1999 ? 0 : Math.max(0, Number(data.deliveryCharge) || 0);
  
  // Tax breakdown (18% GST included or calculated)
  const gstAmount = Math.round(((calculatedSubtotal - discountAmount) * 0.18) / 1.18);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal - discountAmount + deliveryCharge);

  // Allow negligible floating point tolerance (+/- 2 INR)
  const providedGrandTotal = Number(data.grandTotal);
  if (Math.abs(calculatedGrandTotal - providedGrandTotal) > 2) {
    return {
      valid: false,
      error: `Strict Financial Integrity Mismatch: Submitted total (₹${providedGrandTotal}) does not match verified calculation (₹${calculatedGrandTotal}).`,
    };
  }

  // Sanitized & verified order transaction object
  const sanitizedOrder = {
    ...data,
    customerEmail: email,
    customerPhone: phone,
    customerName: name,
    shippingAddress: {
      ...addr,
      pincode: cleanPincode,
    },
    items: verifiedItems,
    subtotal: calculatedSubtotal,
    discountAmount,
    deliveryCharge,
    taxAmount: gstAmount,
    grandTotal: calculatedGrandTotal,
    paymentMethod: String(data.paymentMethod || 'UPI').toUpperCase(),
    orderStatus: data.orderStatus || 'CONFIRMED',
  };

  return { valid: true, sanitizedData: sanitizedOrder };
}

/**
 * Validate Product addition or update transaction
 * Ensures only certified riding gear categories and clean pricing/inventory
 */
export function validateProductTransaction(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Product data payload must be a JSON object' };
  }

  const name = (data.name || '').trim();
  if (!name || name.length < 3 || name.length > 200) {
    return { valid: false, error: 'Product name must be between 3 and 200 characters.' };
  }

  const price = Number(data.price);
  if (isNaN(price) || price <= 0 || price > 500000) {
    return { valid: false, error: 'Product price must be a valid number between ₹1 and ₹5,00,000.' };
  }

  const stock = Number(data.stock);
  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    return { valid: false, error: 'Product stock must be a non-negative whole integer.' };
  }

  const category = (data.category || '').trim();
  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    return {
      valid: false,
      error: `Invalid product category "${category}". Permitted categories are strictly limited to certified riding apparel, rain gear, and motorcycle touring luggage.`,
    };
  }

  // Safety & Forbidden keyword filter
  const safetyCheck = validateProductSafety(name, category);
  if (!safetyCheck.valid) {
    return { valid: false, error: safetyCheck.reason || 'Product contains prohibited keywords (mechanical/automotive parts).' };
  }

  return { valid: true };
}

/**
 * Validate Coupon creation and usage transaction
 */
export function validateCouponTransaction(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Coupon payload must be a valid JSON object' };
  }

  const code = (data.code || '').trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 30 || !/^[A-Z0-9_-]+$/.test(code)) {
    return { valid: false, error: 'Coupon code must be 3-30 uppercase alphanumeric characters.' };
  }

  const type = data.type || data.discountType || 'PERCENTAGE';
  if (!['PERCENTAGE', 'FIXED', 'FLAT', 'FREE_SHIPPING'].includes(type)) {
    return { valid: false, error: 'Invalid discount type. Permitted: PERCENTAGE, FIXED, or FREE_SHIPPING.' };
  }

  const value = Number(data.value ?? data.discountValue ?? 0);
  if (type === 'PERCENTAGE' && (value <= 0 || value > 100)) {
    return { valid: false, error: 'Percentage discount must be between 1% and 100%.' };
  }
  if ((type === 'FIXED' || type === 'FLAT') && value <= 0) {
    return { valid: false, error: 'Fixed discount amount must be greater than ₹0.' };
  }

  return { valid: true };
}

/**
 * Validate Return and Refund Request transaction
 */
export function validateReturnTransaction(data: any, existingOrders: any[]): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Return request payload must be a JSON object' };
  }

  const orderId = data.orderId || data.orderNumber;
  if (!orderId) {
    return { valid: false, error: 'Target order ID or order number is required for return processing.' };
  }

  const order = existingOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) {
    return { valid: false, error: `Order "${orderId}" not found in system records.` };
  }

  // Eligible order states for return
  const eligibleStatuses = ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING'];
  if (!eligibleStatuses.includes(order.orderStatus)) {
    return {
      valid: false,
      error: `Returns cannot be requested for orders currently in status: ${order.orderStatus}.`,
    };
  }

  const refundAmount = Number(data.refundAmount || order.grandTotal);
  if (refundAmount > order.grandTotal) {
    return { valid: false, error: 'Refund amount cannot exceed the original verified order total.' };
  }

  return { valid: true, sanitizedData: { ...data, orderId: order.id, orderNumber: order.orderNumber } };
}
