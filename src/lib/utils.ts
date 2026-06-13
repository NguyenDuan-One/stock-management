import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0 ₫";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: vi });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}

export function getWarrantyStatus(endDate: Date | string | null | undefined): {
  status: "active" | "expiring" | "expired";
  label: string;
  daysLeft: number;
} {
  if (!endDate) return { status: "expired", label: "Không có BH", daysLeft: -1 };
  const d = typeof endDate === "string" ? new Date(endDate) : endDate;
  const days = differenceInDays(d, new Date());
  if (days < 0) return { status: "expired", label: "Hết bảo hành", daysLeft: days };
  if (days <= 30) return { status: "expiring", label: `Còn ${days} ngày`, daysLeft: days };
  return { status: "active", label: `Còn ${days} ngày`, daysLeft: days };
}

export function generateCode(prefix: string, sequence: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}

export function getProductStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_STOCK: "Còn hàng",
    OUT_OF_STOCK: "Hết hàng",
    SOLD: "Đã bán",
    WARRANTY: "Bảo hành",
    BROKEN: "Hỏng",
    DISCONTINUED: "Ngừng KD",
  };
  return labels[status] || status;
}

export function getProductStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IN_STOCK: "bg-emerald-100 text-emerald-800",
    OUT_OF_STOCK: "bg-red-100 text-red-800",
    SOLD: "bg-blue-100 text-blue-800",
    WARRANTY: "bg-yellow-100 text-yellow-800",
    BROKEN: "bg-gray-100 text-gray-800",
    DISCONTINUED: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function numberWithCommas(x: number | string): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
