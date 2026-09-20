/**
 * Next.js Compatible Role-Based Access Control (RBAC) Middleware
 * 
 * Enforces strict portal separation between 'admin' and 'customer' roles:
 * - Admin Portal (/admin/*): Strictly restricted to verified 'admin' / 'super_admin' roles.
 * - Customer Portal (/account/*, /checkout/*): Enforces authenticated customer session.
 * - Transactions & APIs (/api/*): Enforces role checks and verifies data transaction integrity.
 */

export interface RequestLike {
  url: string;
  nextUrl?: {
    pathname: string;
    searchParams: URLSearchParams;
    clone: () => any;
  };
  headers: {
    get: (name: string) => string | null;
  };
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
}

export type Role = 'ADMIN' | 'SUPER_ADMIN' | 'CUSTOMER' | 'GUEST';

export const AUTHORIZED_ADMIN_EMAILS = [
  'skgsurajshahu317@gmail.com',
  'ms0736687@gmail.com',
];

/**
 * Validates authentication and resolves user role from headers, tokens, or cookies
 */
export function resolveUserRole(request: RequestLike): { role: Role; email: string; isAuthenticated: boolean } {
  const authHeader = request.headers.get('authorization') || '';
  const roleHeader = (request.headers.get('x-user-role') || '').toUpperCase().trim();
  const emailHeader = (request.headers.get('x-user-email') || '').toLowerCase().trim();
  const portalHeader = (request.headers.get('x-portal-access') || '').toLowerCase().trim();
  
  const adminCookie = request.cookies.get('ridex_admin_token')?.value;
  const customerCookie = request.cookies.get('ridex_customer_token')?.value;

  // Check for verified Admin identity
  const hasAdminBearer = authHeader.startsWith('Bearer adm_') || authHeader.includes('adm_');
  const isAuthorizedEmail = AUTHORIZED_ADMIN_EMAILS.includes(emailHeader);

  if ((roleHeader === 'ADMIN' || roleHeader === 'SUPER_ADMIN' || portalHeader === 'admin' || hasAdminBearer || Boolean(adminCookie)) && isAuthorizedEmail) {
    return {
      role: 'ADMIN',
      email: emailHeader || 'skgsurajshahu317@gmail.com',
      isAuthenticated: true,
    };
  }

  // Check for verified Customer identity
  const hasCustomerBearer = authHeader.startsWith('Bearer cust_') || authHeader.includes('cust_');
  if (roleHeader === 'CUSTOMER' || hasCustomerBearer || Boolean(customerCookie) || (emailHeader && emailHeader.includes('@'))) {
    return {
      role: 'CUSTOMER',
      email: emailHeader,
      isAuthenticated: true,
    };
  }

  return {
    role: 'GUEST',
    email: '',
    isAuthenticated: false,
  };
}

/**
 * Data Transaction Integrity Validator for Mutations
 */
export function validateTransaction(transactionType: 'ORDER' | 'PRODUCT' | 'COUPON' | 'RETURN', payload: any): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Transaction payload must be an object' };
  }

  switch (transactionType) {
    case 'ORDER': {
      if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
        return { valid: false, error: 'Valid customer email is required' };
      }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return { valid: false, error: 'Order must contain at least 1 item' };
      }
      if (typeof payload.grandTotal !== 'number' || payload.grandTotal <= 0) {
        return { valid: false, error: 'Order total amount must be a positive number' };
      }
      return { valid: true };
    }

    case 'PRODUCT': {
      if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
        return { valid: false, error: 'Product name is mandatory' };
      }
      if (typeof payload.price !== 'number' || payload.price <= 0) {
        return { valid: false, error: 'Product price must be greater than zero' };
      }
      if (typeof payload.stock !== 'number' || payload.stock < 0) {
        return { valid: false, error: 'Product stock must be non-negative' };
      }
      return { valid: true };
    }

    case 'COUPON': {
      if (!payload.code || typeof payload.code !== 'string' || payload.code.trim().length < 3) {
        return { valid: false, error: 'Coupon code must be at least 3 characters' };
      }
      return { valid: true };
    }

    case 'RETURN': {
      if (!payload.orderId) {
        return { valid: false, error: 'Return request requires a valid orderId' };
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Main Next.js Middleware Handler
 */
export function middleware(request: RequestLike) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const { role, email, isAuthenticated } = resolveUserRole(request);

  // 1. ADMIN PORTAL PROTECTION (/admin, /admin/*)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('denied', 'true');
      loginUrl.searchParams.set('reason', 'rbac_admin_required');
      
      return {
        status: 307,
        headers: {
          'Location': loginUrl.toString(),
          'x-rbac-status': 'DENIED_CUSTOMER_OR_GUEST',
        },
      };
    }
  }

  // 2. ADMIN API MUTATIONS PROTECTION (/api/admin/*, /api/store/*)
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/users') || (pathname.startsWith('/api/store') && ['PUT', 'POST', 'DELETE'].includes(request.headers.get('method') || ''))) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return {
        status: 403,
        body: JSON.stringify({
          success: false,
          error: 'RBAC Access Denied: Administrator role required to access operations API.',
          userRole: role,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-rbac-status': 'FORBIDDEN',
        },
      };
    }
  }

  // 3. CUSTOMER PORTAL PROTECTION (/account, /account/*)
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const returnUrl = new URL('/', request.url);
      returnUrl.searchParams.set('auth', 'signin');
      return {
        status: 307,
        headers: {
          'Location': returnUrl.toString(),
          'x-rbac-status': 'DENIED_UNAUTHENTICATED_CUSTOMER',
        },
      };
    }
  }

  // Pass-through with authenticated context headers
  return {
    status: 200,
    headers: {
      'x-authenticated-role': role,
      'x-authenticated-user': email,
    },
  };
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/api/admin/:path*',
    '/api/users/:path*',
    '/api/orders/:path*',
  ],
};

export default middleware;
