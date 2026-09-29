export type ProductStatus = "IN_STOCK" | "OUT_OF_STOCK" | "SOLD" | "WARRANTY" | "BROKEN" | "DISCONTINUED";
export type StockInStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type StockOutStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type TransactionType = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "RETURN";
export type WarrantyStatus = "ACTIVE" | "EXPIRED" | "VOIDED";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  serialNumber?: string | null;
  model?: string | null;
  brand?: string | null;
  categoryId?: string | null;
  category?: ProductCategory | null;
  categoryAssignments?: {
    id: string;
    categoryId: string;
    category: ProductCategory;
  }[];
  categoryIds?: string[];
  unit: string;
  description?: string | null;
  status: ProductStatus;
  warrantyMonths: number;
  quantity: number;
  minQuantity: number;
  costPrice?: number | null;
  sellingPrice?: number | null;
  notes?: string | null;
  imageUrl?: string | null;
  barcode?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  notes?: string | null;
  isActive: boolean;
  _count?: { stockIns: number };
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  notes?: string | null;
  isActive: boolean;
  _count?: { stockOuts: number };
  createdAt: Date;
}

export interface StockInItem {
  id: string;
  stockInId: string;
  productId: string;
  product?: Product;
  serialNumber?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyMonths: number;
  warrantyExpiry?: Date | null;
  notes?: string | null;
}

export interface StockIn {
  id: string;
  code: string;
  supplierId: string;
  supplier?: Supplier;
  importDate: Date;
  poNumber?: string | null;
  contractNumber?: string | null;
  totalAmount: number;
  status: StockInStatus;
  createdById: string;
  createdBy?: Pick<User, "id" | "fullName">;
  notes?: string | null;
  items?: StockInItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StockOutItem {
  id: string;
  stockOutId: string;
  productId: string;
  product?: Product;
  serialNumber?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyMonths: number;
  warrantyStartDate?: Date | null;
  warrantyEndDate?: Date | null;
  notes?: string | null;
}

export interface StockOut {
  id: string;
  code: string;
  customerId: string;
  customer?: Customer;
  exportDate: Date;
  poNumber?: string | null;
  contractNumber?: string | null;
  totalAmount: number;
  status: StockOutStatus;
  createdById: string;
  createdBy?: Pick<User, "id" | "fullName">;
  notes?: string | null;
  items?: StockOutItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyRecord {
  id: string;
  productId: string;
  product?: Product;
  customerId: string;
  customer?: Customer;
  stockOutItemId?: string | null;
  serialNumber?: string | null;
  warrantyMonths: number;
  startDate: Date;
  endDate: Date;
  status: WarrantyStatus;
  notes?: string | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalStockValue: number;
  totalSold: number;
  lowStockProducts: number;
  expiringWarranties: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
