import type { Product, Transaction, Customer } from '../types';
import { getStockLevel } from './mockData';
import { formatPrice, formatNumber } from './format';

/**
 * Advanced Agentic Functions
 * These functions provide proactive intelligence and recommendations
 */

interface AdvancedToolContext {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
}

// Advanced Tool 1: Proactive Sales Assistant
export function getSalesAssistantSuggestions(context: AdvancedToolContext, currentCart?: any[]) {
  const { products, transactions } = context;

  // Analyze frequently bought together patterns
  const productPairs = new Map<string, Map<string, number>>();

  transactions
    .filter(t => t.status === 'completed')
    .forEach(t => {
      // For each pair of products in the transaction
      for (let i = 0; i < t.items.length; i++) {
        for (let j = i + 1; j < t.items.length; j++) {
          const id1 = t.items[i].product.id;
          const id2 = t.items[j].product.id;

          // Track both directions
          if (!productPairs.has(id1)) {
            productPairs.set(id1, new Map());
          }
          if (!productPairs.has(id2)) {
            productPairs.set(id2, new Map());
          }

          const map1 = productPairs.get(id1)!;
          const map2 = productPairs.get(id2)!;

          map1.set(id2, (map1.get(id2) || 0) + 1);
          map2.set(id1, (map2.get(id1) || 0) + 1);
        }
      }
    });

  // If there's a current cart, suggest complementary products
  if (currentCart && currentCart.length > 0) {
    const suggestions = new Map<string, number>();

    currentCart.forEach(item => {
      const pairs = productPairs.get(item.product?.id || item.id);
      if (pairs) {
        pairs.forEach((count, productId) => {
          // Don't suggest items already in cart
          if (!currentCart.find(ci => (ci.product?.id || ci.id) === productId)) {
            suggestions.set(productId, (suggestions.get(productId) || 0) + count);
          }
        });
      }
    });

    const recommendedProducts = Array.from(suggestions.entries())
      .map(([id, score]) => {
        const product = products.find(p => p.id === id);
        return product ? { product, score } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ product, score }) => ({
        id: product.id,
        name: product.name,
        price: formatPrice(product.price),
        priceRaw: product.price,
        category: product.category,
        confidence: score,
        reason: `Comprado frecuentemente con productos en tu carrito (${score} veces)`,
      }));

    return {
      type: 'cart_complementary',
      suggestions: recommendedProducts,
    };
  }

  // General best sellers and promotions
  const recentTransactions = transactions
    .filter(t => t.status === 'completed')
    .slice(-50);

  const productSales = new Map<string, number>();
  recentTransactions.forEach(t => {
    t.items.forEach(item => {
      const id = item.product.id;
      productSales.set(id, (productSales.get(id) || 0) + item.quantity);
    });
  });

  const bestSellers = Array.from(productSales.entries())
    .map(([id, quantity]) => {
      const product = products.find(p => p.id === id);
      return product ? { product, quantity } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map(({ product, quantity }) => ({
      id: product.id,
      name: product.name,
      price: formatPrice(product.price),
      category: product.category,
      soldRecently: quantity,
      reason: `Producto popular - ${quantity} vendidos recientemente`,
    }));

  return {
    type: 'general_recommendations',
    bestSellers,
    message: '¡Estos productos están volando de las estanterías!',
  };
}

// Advanced Tool 2: Inventory Optimizer with ML-like predictions
export function getInventoryOptimization(context: AdvancedToolContext) {
  const { products, transactions } = context;

  // Calculate velocity (units per day) for each product
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(
    t => t.status === 'completed' && new Date(t.date) >= thirtyDaysAgo
  );

  const productVelocity = new Map<string, { sold: number; days: number }>();
  recentTransactions.forEach(t => {
    t.items.forEach(item => {
      const id = item.product.id;
      const existing = productVelocity.get(id) || { sold: 0, days: 0 };
      existing.sold += item.quantity;
      productVelocity.set(id, existing);
    });
  });

  const recommendations = products
    .map(product => {
      const velocity = productVelocity.get(product.id);
      const avgDailyVelocity = velocity ? velocity.sold / 30 : product.avgDailyConsumption;

      const daysOfStock = avgDailyVelocity > 0
        ? product.currentStock / avgDailyVelocity
        : Infinity;

      const turnoverRate = avgDailyVelocity * 30; // Monthly turnover
      const optimalStock = turnoverRate * 1.5; // Keep 1.5 months of stock

      const isOverstocked = product.currentStock > optimalStock * 1.2;
      const isUnderstocked = product.currentStock < optimalStock * 0.5;

      let recommendation = '';
      let priority = 0;

      if (daysOfStock < 7) {
        recommendation = `⚠️ URGENTE: Solo quedan ${Math.floor(daysOfStock)} días de stock. Ordenar ${Math.ceil(optimalStock - product.currentStock)} unidades.`;
        priority = 10;
      } else if (isUnderstocked) {
        recommendation = `📦 Sugerencia: Stock bajo para la demanda actual. Considerar ordenar ${Math.ceil(optimalStock - product.currentStock)} unidades.`;
        priority = 5;
      } else if (isOverstocked) {
        recommendation = `💤 Sobrestockeado: ${Math.ceil(product.currentStock - optimalStock)} unidades en exceso. Considerar promoción o descuento.`;
        priority = 3;
      } else {
        recommendation = '✅ Stock óptimo';
        priority = 0;
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.currentStock,
        optimalStock: Math.ceil(optimalStock),
        avgDailyVelocity: formatNumber(avgDailyVelocity, 2),
        daysOfStock: daysOfStock === Infinity ? 'N/A' : Math.floor(daysOfStock).toString(),
        turnoverRate: formatNumber(turnoverRate, 1),
        recommendation,
        priority,
      };
    })
    .filter(r => r.priority > 0)
    .sort((a, b) => b.priority - a.priority);

  return {
    totalAnalyzed: products.length,
    needsAttention: recommendations.filter(r => r.priority >= 5).length,
    recommendations: recommendations.slice(0, 20),
  };
}

// Advanced Tool 3: Anomaly Detection
export function detectAnomalies(context: AdvancedToolContext) {
  const { products, transactions, customers } = context;
  const anomalies: any[] = [];

  // 1. Unusual sales patterns
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todaySales = transactions.filter(
    t => t.status === 'completed' && new Date(t.date) >= yesterday
  );

  const lastWeekSales = transactions.filter(
    t => t.status === 'completed' && new Date(t.date) >= lastWeek
  );

  const todayRevenue = todaySales.reduce((sum, t) => sum + t.total, 0);
  const avgDailyRevenue = lastWeekSales.reduce((sum, t) => sum + t.total, 0) / 7;

  if (todayRevenue < avgDailyRevenue * 0.5) {
    anomalies.push({
      type: 'sales_drop',
      severity: 'high',
      message: `⚠️ Ventas inusualmente bajas hoy: ${formatPrice(todayRevenue)} vs promedio de ${formatPrice(avgDailyRevenue)}`,
      impact: `Pérdida potencial: ${formatPrice(avgDailyRevenue - todayRevenue)}`,
    });
  } else if (todayRevenue > avgDailyRevenue * 1.5) {
    anomalies.push({
      type: 'sales_spike',
      severity: 'info',
      message: `🎉 Ventas inusualmente altas hoy: ${formatPrice(todayRevenue)} vs promedio de ${formatPrice(avgDailyRevenue)}`,
      impact: 'Verificar stock de productos populares',
    });
  }

  // 2. Products with zero sales but taking up space
  const productSales = new Map<string, number>();
  lastWeekSales.forEach(t => {
    t.items.forEach(item => {
      productSales.set(item.product.id, (productSales.get(item.product.id) || 0) + 1);
    });
  });

  const stagnantProducts = products.filter(p => {
    const sales = productSales.get(p.id) || 0;
    const stockPercentage = p.currentStock / p.maxStock;
    return sales === 0 && stockPercentage > 0.5;
  });

  if (stagnantProducts.length > 0) {
    anomalies.push({
      type: 'stagnant_inventory',
      severity: 'medium',
      message: `📦 ${stagnantProducts.length} productos sin ventas esta semana con stock alto`,
      products: stagnantProducts.slice(0, 5).map(p => p.name),
      impact: `Capital inmovilizado: ${formatPrice(stagnantProducts.reduce((sum, p) => sum + p.currentStock * p.price, 0))}`,
    });
  }

  // 3. Customers with high credit usage
  const highCreditCustomers = customers.filter(c => {
    if (c.creditLimit === 0) return false;
    const usage = c.currentCredit / c.creditLimit;
    return usage > 0.8;
  });

  if (highCreditCustomers.length > 0) {
    anomalies.push({
      type: 'high_credit_usage',
      severity: 'high',
      message: `💳 ${highCreditCustomers.length} clientes con más del 80% de crédito usado`,
      customers: highCreditCustomers.slice(0, 5).map(c => ({
        name: c.name,
        used: formatPrice(c.currentCredit),
        limit: formatPrice(c.creditLimit),
      })),
      impact: 'Riesgo de impago - considerar seguimiento',
    });
  }

  // 4. Stock level anomalies
  const criticalStock = products.filter(p => getStockLevel(p) === 'critical' || getStockLevel(p) === 'out');
  if (criticalStock.length > products.length * 0.2) {
    anomalies.push({
      type: 'widespread_stockout',
      severity: 'critical',
      message: `🚨 ${criticalStock.length} productos en stock crítico o agotado (${formatNumber((criticalStock.length / products.length) * 100, 1)}%)`,
      impact: 'Posible pérdida de ventas - revisar proceso de restock',
    });
  }

  return {
    detected: anomalies.length,
    anomalies: anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, info: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] -
             severityOrder[b.severity as keyof typeof severityOrder];
    }),
    summary: anomalies.length > 0
      ? `Se detectaron ${anomalies.length} anomalías que requieren atención`
      : '✅ No se detectaron anomalías - todo operando normalmente',
  };
}

// Advanced Tool 4: Dynamic Pricing Suggestions
export function getPricingSuggestions(context: AdvancedToolContext) {
  const { products, transactions } = context;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(
    t => t.status === 'completed' && new Date(t.date) >= thirtyDaysAgo
  );

  const productMetrics = new Map<string, { sold: number; revenue: number }>();
  recentTransactions.forEach(t => {
    t.items.forEach(item => {
      const id = item.product.id;
      const existing = productMetrics.get(id) || { sold: 0, revenue: 0 };
      existing.sold += item.quantity;
      existing.revenue += item.quantity * item.product.price;
      productMetrics.set(id, existing);
    });
  });

  const suggestions = products
    .map(product => {
      const metrics = productMetrics.get(product.id);
      const monthlySales = metrics?.sold || 0;
      const monthlyRevenue = metrics?.revenue || 0;

      const stockLevel = getStockLevel(product);
      const stockPercentage = product.currentStock / product.maxStock;

      let suggestion = '';
      let newPrice = product.price;
      let reason = '';

      // High demand + low stock = increase price
      if (monthlySales > 20 && stockPercentage < 0.3) {
        newPrice = product.price * 1.1; // 10% increase
        suggestion = 'increase';
        reason = 'Alta demanda con stock bajo - oportunidad para optimizar margen';
      }
      // Low demand + high stock = decrease price (clearance)
      else if (monthlySales < 5 && stockPercentage > 0.7) {
        newPrice = product.price * 0.85; // 15% discount
        suggestion = 'decrease';
        reason = 'Bajo movimiento con stock alto - promover para liberar capital';
      }
      // Critical stock but high demand = keep price, focus on restock
      else if (stockLevel === 'critical' && monthlySales > 10) {
        suggestion = 'maintain';
        reason = 'Stock crítico pero demanda fuerte - priorizar restock';
      }
      // Normal scenario
      else {
        suggestion = 'maintain';
        reason = 'Precio actual es apropiado para el nivel de demanda';
      }

      return {
        id: product.id,
        name: product.name,
        currentPrice: formatPrice(product.price),
        currentPriceRaw: product.price,
        suggestedPrice: formatPrice(newPrice),
        suggestedPriceRaw: newPrice,
        change: formatNumber(((newPrice - product.price) / product.price) * 100, 1) + '%',
        monthlySales,
        monthlyRevenue: formatPrice(monthlyRevenue),
        stockLevel,
        suggestion,
        reason,
      };
    })
    .filter(s => s.suggestion !== 'maintain' || s.stockLevel === 'critical')
    .sort((a, b) => {
      if (a.suggestion === 'increase' && b.suggestion !== 'increase') return -1;
      if (a.suggestion !== 'increase' && b.suggestion === 'increase') return 1;
      return 0;
    });

  return {
    analyzed: products.length,
    needsPriceAdjustment: suggestions.filter(s => s.suggestion !== 'maintain').length,
    suggestions: suggestions.slice(0, 15),
  };
}

// Advanced Tool 5: Customer Insights and Segmentation
export function getCustomerInsights(context: AdvancedToolContext) {
  const { customers, transactions } = context;

  // Segment customers by value
  const customerValue = customers.map(customer => {
    const customerTransactions = transactions.filter(
      t => t.customerId === customer.id && t.status === 'completed'
    );

    const totalSpent = customerTransactions.reduce((sum, t) => sum + t.total, 0);
    const avgTransaction = customerTransactions.length > 0
      ? totalSpent / customerTransactions.length
      : 0;

    const lastVisit = customerTransactions.length > 0
      ? Math.max(...customerTransactions.map(t => new Date(t.date).getTime()))
      : new Date(customer.lastVisit).getTime();

    const daysSinceLastVisit = Math.floor((Date.now() - lastVisit) / (24 * 60 * 60 * 1000));

    let segment = '';
    if (totalSpent > 10000 && daysSinceLastVisit < 30) {
      segment = 'VIP';
    } else if (totalSpent > 5000 && daysSinceLastVisit < 60) {
      segment = 'Leal';
    } else if (daysSinceLastVisit > 90) {
      segment = 'En Riesgo';
    } else if (totalSpent < 1000) {
      segment = 'Nuevo';
    } else {
      segment = 'Regular';
    }

    return {
      id: customer.id,
      name: customer.name,
      segment,
      totalSpent: formatPrice(totalSpent),
      totalSpentRaw: totalSpent,
      transactions: customerTransactions.length,
      avgTransaction: formatPrice(avgTransaction),
      daysSinceLastVisit,
      creditUsage: customer.creditLimit > 0
        ? formatNumber((customer.currentCredit / customer.creditLimit) * 100, 1) + '%'
        : 'N/A',
    };
  });

  // Sort by value
  customerValue.sort((a, b) => b.totalSpentRaw - a.totalSpentRaw);

  const segmentCounts = {
    VIP: customerValue.filter(c => c.segment === 'VIP').length,
    Leal: customerValue.filter(c => c.segment === 'Leal').length,
    Regular: customerValue.filter(c => c.segment === 'Regular').length,
    Nuevo: customerValue.filter(c => c.segment === 'Nuevo').length,
    'En Riesgo': customerValue.filter(c => c.segment === 'En Riesgo').length,
  };

  const atRisk = customerValue.filter(c => c.segment === 'En Riesgo');

  return {
    totalCustomers: customers.length,
    segments: segmentCounts,
    topCustomers: customerValue.slice(0, 10),
    atRiskCustomers: atRisk.slice(0, 10),
    recommendations: [
      atRisk.length > 0 ? `💡 Contactar a ${atRisk.length} clientes en riesgo con promociones especiales` : null,
      segmentCounts.VIP > 0 ? `⭐ Programa de lealtad para ${segmentCounts.VIP} clientes VIP` : null,
      segmentCounts.Nuevo > 0 ? `🎯 Onboarding especial para ${segmentCounts.Nuevo} clientes nuevos` : null,
    ].filter(Boolean),
  };
}

// Export all advanced tools
export const ADVANCED_AGENT_TOOLS = {
  get_sales_assistant_suggestions: {
    func: getSalesAssistantSuggestions,
    description: 'Get proactive product recommendations based on purchase patterns and current cart',
  },
  get_inventory_optimization: {
    func: getInventoryOptimization,
    description: 'Analyze inventory levels and provide optimization recommendations with ML-like predictions',
  },
  detect_anomalies: {
    func: detectAnomalies,
    description: 'Detect unusual patterns in sales, inventory, and customer behavior',
  },
  get_pricing_suggestions: {
    func: getPricingSuggestions,
    description: 'Generate dynamic pricing suggestions based on demand and stock levels',
  },
  get_customer_insights: {
    func: getCustomerInsights,
    description: 'Segment customers and provide insights on customer value and retention',
  },
};
