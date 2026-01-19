import type { Product, ForecastItem, Category } from '../types';

/**
 * Calcula cuántos días faltan para que un producto se agote
 */
export function forecastDaysUntilEmpty(product: Product): number {
  if (product.avgDailyConsumption === 0) return Infinity;
  return Math.floor(product.currentStock / product.avgDailyConsumption);
}

/**
 * Genera pronósticos de inventario para productos que se agotarán pronto
 */
export function generateForecasts(
  products: Product[],
  daysThreshold: number = 30
): ForecastItem[] {
  const forecasts: ForecastItem[] = [];

  products.forEach((product) => {
    const daysUntilEmpty = forecastDaysUntilEmpty(product);

    if (daysUntilEmpty <= daysThreshold && daysUntilEmpty > 0) {
      const estimatedEmptyDate = new Date();
      estimatedEmptyDate.setDate(estimatedEmptyDate.getDate() + daysUntilEmpty);

      // Calcular cantidad recomendada de restock
      // Asumiendo que queremos stock para al menos 30 días
      const recommendedRestock = Math.max(
        product.maxStock - product.currentStock,
        product.avgDailyConsumption * 30
      );

      forecasts.push({
        product,
        daysUntilEmpty,
        estimatedEmptyDate,
        recommendedRestock,
      });
    }
  });

  // Ordenar por urgencia (menos días primero)
  return forecasts.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
}

/**
 * Obtiene pronósticos agrupados por categoría
 */
export function getCategoryForecasts(products: Product[]): Record<Category, number> {
  const categories: Category[] = ['bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];
  const result: Record<string, number> = {};

  categories.forEach((category) => {
    const categoryProducts = products.filter((p) => p.category === category);
    const forecasts = generateForecasts(categoryProducts, 30);
    result[category] = forecasts.length;
  });

  return result as Record<Category, number>;
}
