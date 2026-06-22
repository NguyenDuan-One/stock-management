import { Prisma } from "@prisma/client"

type CostStockInItem = {
  serialNumber?: string | null
  quantity?: number | null
  unitPrice?: number | string | null | Prisma.Decimal
  totalPrice?: number | string | null | Prisma.Decimal
  createdAt?: Date | string | null
  stockIn?: { status?: string | null } | null
}

type CostStockOutItem = {
  serialNumber?: string | null
  quantity?: number | null
  createdAt?: Date | string | null
  stockOut?: { status?: string | null } | null
}

type CostProduct = {
  quantity?: number | null
  costPrice?: number | string | null |Prisma.Decimal
  trackingMethod?: string | null
  stockInItems?: CostStockInItem[]
  stockOutItems?: CostStockOutItem[]
}

const toNumber = (value: unknown) => Number(value || 0)

const itemCost = (item: CostStockInItem) => {
  const quantity = Math.max(0, toNumber(item.quantity))
  const totalPrice = toNumber(item.totalPrice)
  if (totalPrice > 0) return totalPrice
  return quantity * toNumber(item.unitPrice)
}

const sortByCreatedAt = <T extends { createdAt?: Date | string | null }>(items: T[]) => {
  return [...items].sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return left - right
  })
}

export const isAverageCostMethod = (trackingMethod?: string | null) => {
  return !trackingMethod || trackingMethod === "AverageCost"
}

export const calculateInventoryValue = (product: CostProduct) => {
  const quantity = Math.max(0, toNumber(product.quantity))
  if (quantity <= 0) return 0

  if (isAverageCostMethod(product.trackingMethod)) {
    return quantity * toNumber(product.costPrice)
  }

  const stockInItems = (product.stockInItems || []).filter((item) => item.stockIn?.status !== "CANCELLED")
  const stockOutItems = (product.stockOutItems || []).filter((item) => item.stockOut?.status !== "CANCELLED")

  if (product.trackingMethod === "SerialNumber") {
    const exportedSerials = new Set(
      stockOutItems.map((item) => item.serialNumber?.trim().toLowerCase()).filter(Boolean)
    )
    const serialValue = stockInItems.reduce((sum, item) => {
      const serial = item.serialNumber?.trim().toLowerCase()
      if (!serial || exportedSerials.has(serial)) return sum
      return sum + itemCost(item)
    }, 0)
    return serialValue || fallbackRemainingValue(stockInItems, stockOutItems, quantity)
  }

  if (product.trackingMethod === "FIFO") {
    let exportedQuantity = stockOutItems.reduce((sum, item) => sum + Math.max(0, toNumber(item.quantity)), 0)
    return sortByCreatedAt(stockInItems).reduce((sum, item) => {
      const itemQuantity = Math.max(0, toNumber(item.quantity))
      if (itemQuantity <= 0) return sum
      const consumed = Math.min(exportedQuantity, itemQuantity)
      exportedQuantity -= consumed
      const remainingQuantity = itemQuantity - consumed
      return sum + remainingQuantity * (itemCost(item) / itemQuantity)
    }, 0)
  }

  return fallbackRemainingValue(stockInItems, stockOutItems, quantity)
}

const fallbackRemainingValue = (
  stockInItems: CostStockInItem[],
  stockOutItems: CostStockOutItem[],
  currentQuantity: number
) => {
  const totalInQuantity = stockInItems.reduce((sum, item) => sum + Math.max(0, toNumber(item.quantity)), 0)
  const totalInValue = stockInItems.reduce((sum, item) => sum + itemCost(item), 0)
  const totalOutQuantity = stockOutItems.reduce((sum, item) => sum + Math.max(0, toNumber(item.quantity)), 0)
  const remainingQuantity = Math.max(0, currentQuantity || totalInQuantity - totalOutQuantity)
  const averageInputCost = totalInQuantity > 0 ? totalInValue / totalInQuantity : 0

  return remainingQuantity * averageInputCost
}
