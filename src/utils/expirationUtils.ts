import type { ProductBatch, BatchStatus, Product } from '../types';

/**
 * Calcula los días restantes hasta la fecha de caducidad
 */
export function getDaysUntilExpiration(expirationDate: Date | string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalizar a medianoche

  const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Determina el estado del lote según días restantes y cantidad
 */
export function getBatchStatus(batch: ProductBatch): BatchStatus {
  if (batch.quantity <= 0) return 'sold';

  const daysLeft = getDaysUntilExpiration(batch.expirationDate);

  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'critical';
  if (daysLeft <= 7) return 'warning';
  return 'active';
}

/**
 * Calcula el descuento sugerido según días hasta caducidad
 */
export function getSuggestedDiscount(daysLeft: number): number {
  if (daysLeft < 0) return 0; // Caducado, no se vende
  if (daysLeft <= 3) return 30; // 30% descuento
  if (daysLeft <= 7) return 20; // 20% descuento
  if (daysLeft <= 15) return 10; // 10% descuento
  return 0;
}

/**
 * Obtiene el color de alerta según el estado del lote
 */
export function getBatchStatusColor(status: BatchStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-black text-white';
    case 'critical':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-orange-500 text-white';
    case 'active':
      return 'bg-green-500 text-white';
    case 'sold':
      return 'bg-gray-400 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * Obtiene el label del estado en español
 */
export function getBatchStatusLabel(status: BatchStatus): string {
  switch (status) {
    case 'expired':
      return 'Caducado';
    case 'critical':
      return 'Crítico';
    case 'warning':
      return 'Próximo a vencer';
    case 'active':
      return 'Activo';
    case 'sold':
      return 'Vendido';
    default:
      return 'Desconocido';
  }
}

/**
 * Formatea días restantes en texto legible
 */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return `Caducado hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`;
  }

  if (daysLeft === 0) return 'Caduca HOY';
  if (daysLeft === 1) return 'Caduca mañana';

  return `${daysLeft} días restantes`;
}

/**
 * Genera número de lote automático
 */
export function generateBatchNumber(productId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();

  return `${productId.slice(-4)}-${year}${month}${day}-${random}`;
}

/**
 * Valida si un producto es perecedero
 */
export function isPerishableProduct(product: Product): boolean {
  // Si el producto tiene la propiedad isPerishable definida, usar esa
  if (product.isPerishable !== undefined) {
    return product.isPerishable;
  }

  // Si no, inferir por categoría
  const perishableCategories = ['lacteos', 'panaderia'];
  return perishableCategories.includes(product.category);
}

/**
 * Calcula la vida útil por defecto según categoría
 */
export function getDefaultShelfLife(product: Product): number {
  // Si el producto ya tiene definida su vida útil, usarla
  if (product.defaultShelfLife) {
    return product.defaultShelfLife;
  }

  // Vida útil por defecto según categoría (en días)
  const shelfLifeByCategory: Record<string, number> = {
    lacteos: 15, // 15 días
    panaderia: 7, // 7 días
    bebidas: 180, // 6 meses
    snacks: 90, // 3 meses
    enlatados: 365, // 1 año
    limpieza: 730, // 2 años
  };

  return shelfLifeByCategory[product.category] || 90;
}

/**
 * Calcula la fecha de caducidad sugerida para un producto
 */
export function calculateExpirationDate(
  product: Product,
  manufactureDate?: Date
): Date {
  const baseDate = manufactureDate || new Date();
  const shelfLife = getDefaultShelfLife(product);

  const expirationDate = new Date(baseDate);
  expirationDate.setDate(expirationDate.getDate() + shelfLife);

  return expirationDate;
}

/**
 * Ordena lotes por FEFO (First Expire, First Out)
 */
export function sortBatchesByFEFO(batches: ProductBatch[]): ProductBatch[] {
  return [...batches].sort((a, b) => {
    // Primero los activos, luego los demás
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;

    // Ordenar por fecha de caducidad (más próximo primero)
    const dateA = typeof a.expirationDate === 'string' ? new Date(a.expirationDate) : a.expirationDate;
    const dateB = typeof b.expirationDate === 'string' ? new Date(b.expirationDate) : b.expirationDate;

    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Obtiene el primer lote disponible según FEFO
 */
export function getNextBatchByFEFO(batches: ProductBatch[]): ProductBatch | null {
  const activeBatches = batches.filter(
    (b) => b.quantity > 0 && (b.status === 'active' || b.status === 'warning' || b.status === 'critical')
  );

  if (activeBatches.length === 0) return null;

  const sorted = sortBatchesByFEFO(activeBatches);
  return sorted[0];
}

/**
 * Calcula el valor total de productos en riesgo de caducar
 */
export function calculateValueAtRisk(batches: ProductBatch[]): number {
  return batches
    .filter((b) => {
      const daysLeft = getDaysUntilExpiration(b.expirationDate);
      return daysLeft <= 15 && daysLeft >= 0 && b.quantity > 0;
    })
    .reduce((total, batch) => {
      const price = batch.purchasePrice || 0;
      return total + price * batch.quantity;
    }, 0);
}

/**
 * Calcula pérdidas por productos caducados
 */
export function calculateExpirationLosses(batches: ProductBatch[]): number {
  return batches
    .filter((b) => b.status === 'expired' && b.quantity > 0)
    .reduce((total, batch) => {
      const price = batch.purchasePrice || 0;
      return total + price * batch.quantity;
    }, 0);
}

/**
 * Obtiene un mensaje de urgencia según días restantes
 */
export function getUrgencyMessage(daysLeft: number): string {
  if (daysLeft < 0) return '❌ CADUCADO - Retirar del inventario';
  if (daysLeft === 0) return '🔴 CADUCA HOY - Vender urgentemente';
  if (daysLeft <= 3) return '🔴 CRÍTICO - Aplicar descuento y vender';
  if (daysLeft <= 7) return '🟠 URGENTE - Priorizar venta';
  if (daysLeft <= 15) return '🟡 PRÓXIMO - Monitorear';
  return '✅ En buen estado';
}

/**
 * Valida si se puede agregar un lote con la fecha de caducidad dada
 */
export function validateExpirationDate(expirationDate: Date): {
  valid: boolean;
  message?: string;
} {
  const daysLeft = getDaysUntilExpiration(expirationDate);

  if (daysLeft < 0) {
    return {
      valid: false,
      message: 'La fecha de caducidad ya pasó. No se puede agregar este lote.',
    };
  }

  if (daysLeft === 0) {
    return {
      valid: false,
      message: 'El producto caduca hoy. No se recomienda agregarlo al inventario.',
    };
  }

  if (daysLeft <= 3) {
    return {
      valid: true,
      message: '⚠️ Advertencia: Este producto está muy próximo a caducar. Vender urgentemente.',
    };
  }

  return { valid: true };
}
