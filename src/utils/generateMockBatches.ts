import type { Product } from '../types';
import { generateBatchNumber, calculateExpirationDate, isPerishableProduct } from './expirationUtils';

/**
 * Genera lotes de prueba para productos perecederos
 */
export function generateMockBatches(products: Product[]): Array<Omit<any, 'id' | 'status' | 'receivedDate'>> {
  const perishableProducts = products.filter(isPerishableProduct);
  const batches: Array<any> = [];

  perishableProducts.forEach((product) => {
    // Generar 2-4 lotes por producto
    const numBatches = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numBatches; i++) {
      const now = new Date();

      // Variar las fechas de manufactura y caducidad
      const daysOld = Math.floor(Math.random() * 15); // 0-15 días de antigüedad
      const manufactureDate = new Date(now);
      manufactureDate.setDate(manufactureDate.getDate() - daysOld);

      // Calcular fecha de caducidad base
      const baseExpiration = calculateExpirationDate(product, manufactureDate);

      // Variar la fecha de caducidad para crear diferentes escenarios
      let expirationDate = new Date(baseExpiration);

      if (i === 0 && Math.random() > 0.5) {
        // Primer lote: 30% chance de estar próximo a vencer (3-7 días)
        const daysToExpire = Math.floor(Math.random() * 5) + 3; // 3-7 días
        expirationDate = new Date(now);
        expirationDate.setDate(expirationDate.getDate() + daysToExpire);
      } else if (i === numBatches - 1 && Math.random() > 0.7) {
        // Último lote: 30% chance de estar crítico (1-3 días)
        const daysToExpire = Math.floor(Math.random() * 3) + 1; // 1-3 días
        expirationDate = new Date(now);
        expirationDate.setDate(expirationDate.getDate() + daysToExpire);
      }

      // Cantidad inicial del lote (entre 20% y 80% de la capacidad)
      const originalQuantity = Math.floor(
        product.maxStock * (0.2 + Math.random() * 0.6)
      );

      // Cantidad actual (el lote puede estar parcialmente consumido)
      const consumptionRate = Math.random();
      const quantity = Math.floor(originalQuantity * (0.4 + consumptionRate * 0.6));

      // Proveedores de ejemplo
      const suppliers = [
        'Distribuidora Nacional',
        'Lácteos del Valle',
        'Panadería Artesanal',
        'Grupo Comercial',
        'Alimentos Frescos',
      ];

      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

      // Precio de compra (60-80% del precio de venta)
      const purchasePrice = product.price * (0.6 + Math.random() * 0.2);

      batches.push({
        productId: product.id,
        batchNumber: generateBatchNumber(product.id),
        expirationDate,
        manufactureDate,
        quantity,
        originalQuantity,
        supplier,
        purchasePrice: Math.round(purchasePrice * 100) / 100,
        notes: Math.random() > 0.7 ? 'Lote de prueba generado automáticamente' : undefined,
      });
    }
  });

  return batches;
}

/**
 * Genera lotes específicos para demostración
 */
export function generateDemoBatches(products: Product[]): Array<any> {
  const now = new Date();
  const batches: Array<any> = [];

  // Buscar productos específicos para crear escenarios de demostración
  const leche = products.find(p => p.name.toLowerCase().includes('leche'));
  const yogurt = products.find(p => p.name.toLowerCase().includes('yogurt'));
  const pan = products.find(p => p.name.toLowerCase().includes('pan'));
  const queso = products.find(p => p.name.toLowerCase().includes('queso'));

  // Lote CRÍTICO - Vence en 2 días
  if (leche) {
    const criticalExpiration = new Date(now);
    criticalExpiration.setDate(criticalExpiration.getDate() + 2);

    batches.push({
      productId: leche.id,
      batchNumber: generateBatchNumber(leche.id),
      expirationDate: criticalExpiration,
      manufactureDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
      quantity: 15,
      originalQuantity: 30,
      supplier: 'Lácteos del Valle',
      purchasePrice: leche.price * 0.65,
      notes: '⚠️ Lote crítico - Vender urgentemente',
    });
  }

  // Lote WARNING - Vence en 5 días
  if (yogurt) {
    const warningExpiration = new Date(now);
    warningExpiration.setDate(warningExpiration.getDate() + 5);

    batches.push({
      productId: yogurt.id,
      batchNumber: generateBatchNumber(yogurt.id),
      expirationDate: warningExpiration,
      manufactureDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      quantity: 25,
      originalQuantity: 40,
      supplier: 'Lácteos del Valle',
      purchasePrice: yogurt.price * 0.70,
    });
  }

  // Lote NORMAL - Vence en 12 días
  if (pan) {
    const normalExpiration = new Date(now);
    normalExpiration.setDate(normalExpiration.getDate() + 12);

    batches.push({
      productId: pan.id,
      batchNumber: generateBatchNumber(pan.id),
      expirationDate: normalExpiration,
      manufactureDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      quantity: 40,
      originalQuantity: 50,
      supplier: 'Panadería Artesanal',
      purchasePrice: pan.price * 0.60,
    });
  }

  // Lote CADUCADO - Venció hace 1 día
  if (queso && Math.random() > 0.5) {
    const expiredDate = new Date(now);
    expiredDate.setDate(expiredDate.getDate() - 1);

    batches.push({
      productId: queso.id,
      batchNumber: generateBatchNumber(queso.id),
      expirationDate: expiredDate,
      manufactureDate: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
      quantity: 5,
      originalQuantity: 20,
      supplier: 'Lácteos del Valle',
      purchasePrice: queso.price * 0.65,
      notes: '❌ CADUCADO - Retirar del inventario',
    });
  }

  return batches;
}
