# Security Specification: RIDEX Moto Gear Firestore Rules

## 1. Data Invariants
1. **Catalog Integrity**: Public users can read active products (`/products`), but only verified Administrators can create, update, or delete products.
2. **Order Integrity**: Authenticated customers can create orders for themselves or guests can place orders with strict schema validation. Customers can only read and list their own orders (`customerId == request.auth.uid` or `customerEmail == request.auth.token.email`). Admins have full access to view and update order status.
3. **User Profile Privacy**: A user can only read and write their own document in `/users/{userId}` where `userId == request.auth.uid`. No user can grant themselves administrative privileges (`role: 'ADMIN'`).
4. **Admin Protection**: Documents in `/admins/{adminId}` can only be read or written by authorized admins (`ms0736687@gmail.com` or existing admin documents).
5. **Store Settings Protection**: Public read-only access for `/settings/{settingId}`, with write privileges reserved exclusively for verified Admins.
6. **Coupon Security**: Coupons in `/coupons/{couponId}` are readable by active shoppers, but writeable only by verified Admins.
7. **Returns Access Control**: Return requests in `/returns/{returnId}` can only be created by the customer associated with the order, or managed by Admins.
8. **Catch-All Safety Net**: All unspecified collections default to `allow read, write: if false;`.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Product Injection**: An unauthenticated user attempts to write a fake product into `/products/malicious-gear`. (Expect: PERMISSION_DENIED)
2. **Self-Escalation to Admin**: A regular customer writes `{ role: "ADMIN" }` to `/users/{uid}`. (Expect: PERMISSION_DENIED)
3. **Admin Directory Tampering**: An unauthenticated user or regular customer tries to add their UID into `/admins/{uid}`. (Expect: PERMISSION_DENIED)
4. **Order Interception (IDOR)**: Customer A attempts to read or list orders placed by Customer B (`/orders/order-from-customer-b`). (Expect: PERMISSION_DENIED)
5. **Ghost Field Poisoning**: Writing a product with unauthorized extra fields or giant strings exceeding `maxLength`. (Expect: PERMISSION_DENIED)
6. **Negative Price Exploit**: An attacker attempts to create a product or order with a negative price `totalAmount: -500`. (Expect: PERMISSION_DENIED)
7. **Coupon Discount Injection**: A customer attempts to create a 100% off coupon code directly into `/coupons`. (Expect: PERMISSION_DENIED)
8. **Store Settings Overwrite**: A regular customer tries to overwrite company bank or UPI credentials in `/settings/global`. (Expect: PERMISSION_DENIED)
9. **Cross-Customer Return Forgery**: A user tries to create a return request with another person's email without matching authorization. (Expect: PERMISSION_DENIED)
10. **Unverified Email Privilege Escalation**: User claims admin email with `email_verified: false`. (Expect: PERMISSION_DENIED)
11. **Giant Payload Denial of Wallet**: Writing a 2MB oversized payload into any collection. (Expect: PERMISSION_DENIED)
12. **Catch-All Path Access**: Reading or writing to undefined system path `/system_secrets/keys`. (Expect: PERMISSION_DENIED)

## 3. Test Runner Specifications
- Tested against Firebase Rules unit tests verifying that all 12 dirty payloads are rejected with PERMISSION_DENIED and legitimate operations succeed.
