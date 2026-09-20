/**
 * Core Type Definitions for Premium Riding Gear E-Commerce Platform
 */

// Strict Allowed Product Categories - Riding gear, rain gear, and luggage ONLY
export const ALLOWED_CATEGORIES = [
  'Riding Jackets',
  'Riding Gloves',
  'Riding Pants',
  'Riding Boots',
  'Riding Protection',
  'Riding Accessories',
  'Rain Jackets',
  'Rain Pants',
  'Rain Coats',
  'Full Rain Suits',
  'Rain Covers',
  'Bag Rain Covers',
  'Tail Bags',
  'Tank Bags',
  'Backpacks',
  'Saddlebags',
  'Travel Bags',
  'Duffel Bags',
] as const;

export type AllowedCategory = typeof ALLOWED_CATEGORIES[number];

// Strictly Forbidden items (Mechanical/spare parts, vehicles, engines, etc.)
export const FORBIDDEN_KEYWORDS = [
  'motorcycle',
  'bike',
  'car',
  'engine',
  'tyre',
  'tire',
  'battery',
  'carburetor',
  'spark plug',
  'exhaust',
  'piston',
  'cylinder',
  'gearbox',
  'clutch plate',
  'brake disc',
  'brake caliper',
  'mechanical component',
  'spare part',
  'filter',
  'suspension',
  'chain sprocket',
];

export function isCategoryAllowed(category: string): boolean {
  return ALLOWED_CATEGORIES.includes(category as AllowedCategory);
}

export function validateProductSafety(name: string, category: string): { valid: boolean; reason?: string } {
  const lowerName = name.toLowerCase();
  for (const forbidden of FORBIDDEN_KEYWORDS) {
    if (lowerName.includes(forbidden) && !lowerName.includes('jacket') && !lowerName.includes('bag') && !lowerName.includes('boot') && !lowerName.includes('pant') && !lowerName.includes('glove') && !lowerName.includes('cover')) {
      return {
        valid: false,
        reason: `Product "${name}" violates store policy. Mechanical vehicle parts or vehicles (${forbidden}) are strictly prohibited. Only riding gear, rain gear, and luggage are allowed.`,
      };
    }
  }

  if (!isCategoryAllowed(category)) {
    return {
      valid: false,
      reason: `Category "${category}" is not in the list of allowed riding gear categories.`,
    };
  }

  return { valid: true };
}

export interface StoreSettings {
  // Brand Information
  brandName: string;
  companyLegalName: string;
  shortBrandName: string;
  brandTagline: string;
  brandDescription: string;
  brandLogo: string;
  favicon: string;
  websiteName: string;
  brandEmail: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;

  // Company Information
  companyName: string;
  legalName: string;
  gstin: string;
  pan: string;
  businessAddress: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Social Media & Community Channels
  instagram: string;
  facebook: string;
  youtube: string;
  twitter: string;
  linkedin: string;
  whatsappChannel?: string;
  telegram?: string;
  discord?: string;
  pinterest?: string;
  socialLinksEnabled?: {
    instagram?: boolean;
    facebook?: boolean;
    youtube?: boolean;
    twitter?: boolean;
    linkedin?: boolean;
    whatsapp?: boolean;
    whatsappChannel?: boolean;
    telegram?: boolean;
    discord?: boolean;
    pinterest?: boolean;
    [key: string]: boolean | undefined;
  };
  enableFloatingWhatsApp?: boolean;
  whatsappMessagePreset?: string;
  socialHeaderDisplay?: boolean;

  // Footer
  footerDescription: string;
  copyrightText: string;
  customerSupportText: string;

  // Store & Financial Settings
  currency: string;
  currencySymbol: string;
  defaultGSTRate: number; // e.g. 18 for 18%
  flatDeliveryCharge: number; // e.g. 150
  deliveryCharge?: number;
  freeShippingThreshold: number; // e.g. 2499
  expressShippingCharge?: number;
  shippingEnabled?: boolean;
  estimatedDeliveryDays?: string;
  codAvailable: boolean;

  // Granular Module Settings
  shipping?: ShippingSettings;
  homepage?: HomepageSettings;
  paymentGateway?: PaymentGatewaySettings;

  // Homepage Settings
  homepageAnnouncement?: string;
  homepageHeroTitle?: string;
  homepageHeroSubtitle?: string;
  homepageHeroCtaText?: string;
  homepageHeroImage?: string;
  featuredCategoryTitles?: string[];

  returnPolicy: string;
  refundPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
  updatedAt: string;
}

export interface ShippingSettings {
  flatRate: number;
  freeShippingThreshold: number;
  courierPartners: string[];
  estimatedDays: string;
  codAvailable: boolean;
  codExtraFee: number;
  enabled: boolean;
}

export interface HomepageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  ctaText: string;
  ctaLink: string;
  announcementBarText: string;
  showAnnouncementBar: boolean;
  featuredCategories: string[];
}

export interface PaymentGatewaySettings {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  razorpayMode: 'TEST' | 'LIVE';
  razorpayWebhookSecret?: string;
  preferredGateway: 'RAZORPAY' | 'CASHFREE' | 'PHONEPE';
  codEnabled: boolean;
  upiDirectEnabled: boolean;
  companyName?: string;
  themeColor?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  title?: string;
  url: string;
  type: string;
  category?: 'PRODUCT' | 'BANNER' | 'LOGO' | 'OTHER' | string;
  size: string;
  createdAt: string;
  associatedProduct?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ColorVariant {
  id: string;
  colorName: string;
  colorHex: string;
  images: ProductImage[];
}

export type ProductColorVariant = ColorVariant;

export interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: AllowedCategory;
  subcategory?: string;
  description: string;
  price: number; // INR
  originalPrice: number; // INR
  discountPercentage: number;
  gstPercentage?: number; // e.g. 18
  stock: number;
  lowStockThreshold: number;
  sizes: string[]; // e.g. ['S', 'M', 'L', 'XL', '2XL']
  colors: string[]; // Color names matching colorVariants
  colorVariants: ColorVariant[];
  masterImages: ProductImage[]; // Fallback or global images
  material: string;
  specifications?: Record<string, string>;
  features: string[];
  armorLevel?: 'CE Level 1' | 'CE Level 2' | 'Knox Micro-Lock' | 'D3O Level 2' | 'None';
  waterproofRating?: string; // e.g. "10,000 mm H2O" or "100% Waterproof seam sealed"
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  videoUrl?: string;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // Unique cart item key (productId + color + size)
  productId: string;
  name: string;
  brand: string;
  category: AllowedCategory;
  price: number;
  originalPrice: number;
  selectedColor: string;
  selectedSize: string;
  selectedImage: string;
  quantity: number;
  maxStock: number;
  gstPercentage?: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'REFUNDED';

export interface TrackingEvent {
  id?: string;
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface ShipmentDetails {
  shipmentId?: string;
  courierPartner?: string; // e.g. 'Shiprocket', 'BlueDart', 'Delhivery', 'DTDC'
  courierName?: string;
  trackingNumber?: string; // AWB Number
  awbNumber?: string;
  shippingDate?: string;
  expectedDeliveryDate?: string;
  trackingUrl?: string;
  currentStatus?: string;
  events: TrackingEvent[];
}

export interface CustomerAddress {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export type Address = CustomerAddress;

export interface OrderItem {
  id?: string;
  productId: string;
  name: string;
  brand?: string;
  category: string;
  selectedColor: string;
  selectedSize: string;
  selectedImage: string; // Captured at order time
  price: number;
  originalPrice?: number;
  quantity: number;
  total?: number;
  gstAmount?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. RDX-2026-8491
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: CustomerAddress;
  billingAddress?: CustomerAddress;
  items: OrderItem[];
  subtotal: number; // INR
  shippingCharge?: number;
  deliveryCharge?: number;
  taxAmount?: number; // GST in INR
  gstAmount?: number;
  discountAmount: number; // Coupon discount in INR
  grandTotal: number; // Final INR paid
  appliedCouponCode?: string;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'COD' | 'WALLET' | string;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  shipment?: ShipmentDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type?: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  discountType?: 'PERCENTAGE' | 'FLAT' | 'FIXED';
  value?: number; // % or INR amount
  discountValue?: number;
  minimumOrder?: number;
  minOrderValue?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount?: number;
  perCustomerLimit?: number;
  status?: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  isActive?: boolean;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  avatarUrl?: string;
  addresses: CustomerAddress[];
  registrationDate?: string;
  createdAt?: string;
  totalOrders: number;
  totalSpent?: number;
  totalSpending?: number;
  lastOrderDate?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  reason?: string;
  items: { productId: string; name: string; quantity: number; reason?: string }[];
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REFUND_INITIATED' | 'REFUND_COMPLETED';
  requestedAt?: string;
  refundAmount?: number;
  adminNotes?: string;
  refundTransactionId?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserSession {
  role: UserRole;
  customerId?: string;
  name: string;
  email: string;
}
