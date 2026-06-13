import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes("ADMIN");
}

export const PERMISSIONS = {
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",
  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_CREATE: "suppliers.create",
  SUPPLIERS_UPDATE: "suppliers.update",
  SUPPLIERS_DELETE: "suppliers.delete",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",
  STOCK_IN_VIEW: "stock_in.view",
  STOCK_IN_CREATE: "stock_in.create",
  STOCK_IN_UPDATE: "stock_in.update",
  STOCK_IN_DELETE: "stock_in.delete",
  STOCK_OUT_VIEW: "stock_out.view",
  STOCK_OUT_CREATE: "stock_out.create",
  STOCK_OUT_UPDATE: "stock_out.update",
  STOCK_OUT_DELETE: "stock_out.delete",
  WARRANTY_VIEW: "warranty.view",
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
} as const;
