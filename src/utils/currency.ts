/**
 * Centralized Indian Rupee (INR) Formatter and Financial Utilities
 * Standard: en-IN locale with '₹' symbol and standard Indian numbering system (e.g. ₹1,499, ₹12,999, ₹1,00,000)
 */

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const rounded = Math.round(amount);

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rounded);

    // Normalize spacing if needed
    return formatted.replace(/\s+/g, '');
  } catch {
    return `₹${rounded.toLocaleString('en-IN')}`;
  }
}

/**
 * Format raw number with Indian comma separation without currency symbol
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Calculate GST (tax included or added)
 */
export function calculateGST(amount: number, gstRatePercentage: number = 18): number {
  return Math.round((amount * gstRatePercentage) / 100);
}

/**
 * Calculate shipping charge based on store settings
 */
export function calculateShippingCharge(
  subtotal: number,
  freeShippingThreshold: number = 2499,
  flatDeliveryCharge: number = 150
): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= freeShippingThreshold) return 0;
  return flatDeliveryCharge;
}
