// Categorías de productos
export type Category =
  | 'bebidas'
  | 'snacks'
  | 'lacteos'
  | 'panaderia'
  | 'enlatados'
  | 'limpieza';

// Niveles de stock
export type StockLevel = 'critical' | 'low' | 'normal' | 'out';

// Unidades de medida
export type Unit = 'pza' | 'kg' | 'lt' | 'caja' | 'paquete';

// Interfaz principal de producto
export interface Product {
  id: string;
  name: string;
  category: Category;
  currentStock: number;
  minStock: number;
  maxStock: number;
  price: number;
  unit: Unit;
  lastRestocked: Date;
  avgDailyConsumption: number;
  position: [number, number, number]; // Posición 3D [x, y, z]
  isPerishable?: boolean; // Si el producto es perecedero
  defaultShelfLife?: number; // Días de vida útil por defecto
}

// Alerta de inventario
export interface Alert {
  id: string;
  product: Product;
  level: StockLevel;
  message: string;
  priority: number;
}

// Estado de categoría
export interface CategoryStatus {
  category: Category;
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  criticalProducts: number;
  avgStockPercentage: number;
}

// Pronóstico de producto
export interface ForecastItem {
  product: Product;
  daysUntilEmpty: number;
  estimatedEmptyDate: Date;
  recommendedRestock: number;
}

// Labels para categorías
export const CATEGORY_LABELS: Record<Category, string> = {
  bebidas: 'Bebidas',
  snacks: 'Snacks',
  lacteos: 'Lácteos',
  panaderia: 'Panadería',
  enlatados: 'Enlatados',
  limpieza: 'Limpieza',
};

// ========== SISTEMA POS ==========

// Cliente
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditLimit: number;
  currentCredit: number;
  totalPurchases: number;
  lastVisit: Date;
  frequentProducts: string[]; // IDs de productos
}

// Item en carrito de compra
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  discount: number;
}

// Transacción de venta
export interface Transaction {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  customerId?: string;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
}

// Reporte de ventas
export interface SalesReport {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  topProducts: { productId: string; quantity: number; revenue: number }[];
  salesByCategory: Record<Category, number>;
  salesByPaymentMethod: Record<string, number>;
}

// Proveedor
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  products: string[]; // IDs de productos que suministra
  paymentTerms: string;
  nextPaymentDate?: Date;
  totalDebt: number;
}

// Gasto
export interface Expense {
  id: string;
  date: Date;
  category: 'rent' | 'utilities' | 'supplies' | 'salaries' | 'other';
  amount: number;
  description: string;
  supplierId?: string;
}

// ========== SISTEMA DE LOTES Y CADUCIDAD ==========

// Estado de lote según proximidad de caducidad
export type BatchStatus = 'active' | 'warning' | 'critical' | 'expired' | 'sold';

// Lote de producto
export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;          // Número de lote
  expirationDate: Date;          // Fecha de caducidad
  manufactureDate?: Date;        // Fecha de fabricación
  quantity: number;              // Cantidad en el lote
  originalQuantity: number;      // Cantidad original del lote
  supplier?: string;             // Proveedor
  purchasePrice?: number;        // Precio de compra
  status: BatchStatus;
  receivedDate: Date;            // Fecha de recepción
  notes?: string;
}

// Alerta de caducidad
export interface ExpirationAlert {
  id: string;
  batch: ProductBatch;
  product: Product;
  daysUntilExpiration: number;
  status: BatchStatus;
  message: string;
  priority: number;              // 1=crítico, 2=urgente, 3=próximo
  suggestedDiscount?: number;    // Descuento sugerido (%)
}

// Estadísticas de caducidad
export interface ExpirationStats {
  totalBatches: number;
  activeBatches: number;
  expiredBatches: number;
  expiringIn3Days: number;
  expiringIn7Days: number;
  expiringIn15Days: number;
  totalValueAtRisk: number;      // Valor total de productos por vencer
  totalLosses: number;           // Pérdidas por productos caducados
}

// Reporte de pérdidas por caducidad
export interface ExpirationLossReport {
  period: string;
  totalLosses: number;
  lossesCount: number;
  lossesByCategory: Record<Category, number>;
  lossesBySupplier: Record<string, number>;
  topExpiredProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }>;
}
