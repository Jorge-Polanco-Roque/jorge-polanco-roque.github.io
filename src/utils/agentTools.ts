import type { Product, Transaction, Customer, Category } from '../types';
import { getStockLevel } from './mockData';
import { formatPrice, formatNumber } from './format';

/**
 * Agent Tools - Functions that the AI agent can call to interact with the store
 */

interface ToolContext {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
}

// Tool 1: Get Inventory Status
export function getInventoryStatus(context: ToolContext, filter?: {
  category?: Category;
  stockLevel?: 'critical' | 'low' | 'normal' | 'out';
  search?: string;
}) {
  let filtered = context.products;

  if (filter?.category) {
    filtered = filtered.filter(p => p.category === filter.category);
  }

  if (filter?.stockLevel) {
    filtered = filtered.filter(p => getStockLevel(p) === filter.stockLevel);
  }

  if (filter?.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchLower));
  }

  const summary = {
    total: filtered.length,
    critical: filtered.filter(p => getStockLevel(p) === 'critical').length,
    low: filtered.filter(p => getStockLevel(p) === 'low').length,
    normal: filtered.filter(p => getStockLevel(p) === 'normal').length,
    out: filtered.filter(p => getStockLevel(p) === 'out').length,
    totalValue: filtered.reduce((sum, p) => sum + (p.currentStock * p.price), 0),
  };

  return {
    summary,
    products: filtered.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      currentStock: p.currentStock,
      maxStock: p.maxStock,
      stockLevel: getStockLevel(p),
      price: p.price,
      value: p.currentStock * p.price,
      daysUntilEmpty: p.avgDailyConsumption > 0
        ? Math.floor(p.currentStock / p.avgDailyConsumption)
        : null,
    })),
  };
}

// Tool 2: Get Sales Data
export function getSalesData(context: ToolContext, period?: 'today' | 'week' | 'month' | 'all') {
  const now = new Date();
  let filtered = context.transactions.filter(t => t.status === 'completed');

  if (period === 'today') {
    filtered = filtered.filter(t => {
      const transDate = new Date(t.date);
      return transDate.toDateString() === now.toDateString();
    });
  } else if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
  }

  const totalSales = filtered.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filtered.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const totalItems = filtered.reduce((sum, t) =>
    sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Payment method breakdown
  const paymentMethods = {
    cash: filtered.filter(t => t.paymentMethod === 'cash').length,
    card: filtered.filter(t => t.paymentMethod === 'card').length,
    transfer: filtered.filter(t => t.paymentMethod === 'transfer').length,
    credit: filtered.filter(t => t.paymentMethod === 'credit').length,
  };

  // Top products
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  filtered.forEach(t => {
    t.items.forEach(item => {
      const existing = productSales.get(item.product.id) || {
        name: item.product.name,
        quantity: 0,
        revenue: 0
      };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.product.price;
      productSales.set(item.product.id, existing);
    });
  });

  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    period: period || 'all',
    summary: {
      totalSales: formatPrice(totalSales),
      totalSalesRaw: totalSales,
      totalTransactions,
      averageTicket: formatPrice(averageTicket),
      averageTicketRaw: averageTicket,
      totalItems,
    },
    paymentMethods,
    topProducts: topProducts.map(p => ({
      ...p,
      revenue: formatPrice(p.revenue),
      revenueRaw: p.revenue,
    })),
  };
}

// Tool 3: Get Customer Info
export function getCustomerInfo(context: ToolContext, filter?: {
  customerId?: string;
  hasCredit?: boolean;
  search?: string;
}) {
  let filtered = context.customers;

  if (filter?.customerId) {
    const customer = filtered.find(c => c.id === filter.customerId);
    if (!customer) {
      return { error: 'Customer not found' };
    }

    // Get customer transactions
    const customerTransactions = context.transactions.filter(
      t => t.customerId === customer.id && t.status === 'completed'
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        creditLimit: formatPrice(customer.creditLimit),
        currentCredit: formatPrice(customer.currentCredit),
        availableCredit: formatPrice(customer.creditLimit - customer.currentCredit),
        totalPurchases: formatPrice(customer.totalPurchases),
        lastVisit: customer.lastVisit,
        frequentProducts: customer.frequentProducts,
      },
      transactions: customerTransactions.length,
      recentTransactions: customerTransactions
        .slice(-5)
        .map(t => ({
          id: t.id,
          date: t.date,
          total: formatPrice(t.total),
          paymentMethod: t.paymentMethod,
        })),
    };
  }

  if (filter?.hasCredit !== undefined) {
    filtered = filtered.filter(c =>
      filter.hasCredit ? c.creditLimit > 0 : c.creditLimit === 0
    );
  }

  if (filter?.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower)
    );
  }

  return {
    total: filtered.length,
    customers: filtered.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      creditLimit: formatPrice(c.creditLimit),
      currentCredit: formatPrice(c.currentCredit),
      availableCredit: formatPrice(c.creditLimit - c.currentCredit),
      totalPurchases: formatPrice(c.totalPurchases),
    })),
  };
}

// Tool 4: Search Products
export function searchProducts(context: ToolContext, query: string, limit?: number) {
  const searchLower = query.toLowerCase();
  const results = context.products
    .filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    )
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: formatPrice(p.price),
      priceRaw: p.price,
      currentStock: p.currentStock,
      stockLevel: getStockLevel(p),
    }));

  return {
    query,
    found: results.length,
    results: limit ? results.slice(0, limit) : results,
  };
}

// Tool 5: Get Recommendations
export function getRecommendations(context: ToolContext) {
  const { products, transactions } = context;

  // Products that need restocking (critical or low stock)
  const needsRestock = products
    .filter(p => ['critical', 'low', 'out'].includes(getStockLevel(p)))
    .sort((a, b) => {
      const levelPriority = { out: 0, critical: 1, low: 2 };
      const levelA = getStockLevel(a) as keyof typeof levelPriority;
      const levelB = getStockLevel(b) as keyof typeof levelPriority;
      return levelPriority[levelA] - levelPriority[levelB];
    })
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.currentStock,
      maxStock: p.maxStock,
      stockLevel: getStockLevel(p),
      recommendedOrder: Math.max(p.maxStock - p.currentStock, 0),
      estimatedCost: formatPrice(Math.max(p.maxStock - p.currentStock, 0) * p.price),
      daysUntilEmpty: p.avgDailyConsumption > 0
        ? Math.floor(p.currentStock / p.avgDailyConsumption)
        : null,
    }));

  // Best selling products (from recent transactions)
  const recentTransactions = transactions
    .filter(t => t.status === 'completed')
    .slice(-100);

  const productSales = new Map<string, number>();
  recentTransactions.forEach(t => {
    t.items.forEach(item => {
      productSales.set(
        item.product.id,
        (productSales.get(item.product.id) || 0) + item.quantity
      );
    });
  });

  const topSellers = Array.from(productSales.entries())
    .map(([id, quantity]) => {
      const product = products.find(p => p.id === id);
      return product ? {
        id,
        name: product.name,
        quantity,
        stockLevel: getStockLevel(product),
        currentStock: product.currentStock,
      } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Slow movers (products with high stock and low sales)
  const slowMovers = products
    .filter(p => {
      const sales = productSales.get(p.id) || 0;
      const stockPercentage = p.currentStock / p.maxStock;
      return stockPercentage > 0.7 && sales < 5;
    })
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.currentStock,
      maxStock: p.maxStock,
      stockPercentage: formatNumber((p.currentStock / p.maxStock) * 100, 1) + '%',
      recentSales: productSales.get(p.id) || 0,
    }));

  return {
    needsRestock,
    topSellers,
    slowMovers,
  };
}

// Tool 6: Analyze Trends
export function analyzeTrends(context: ToolContext, days: number = 7) {
  const { transactions } = context;
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(
    t => t.status === 'completed' && new Date(t.date) >= startDate
  );

  // Daily sales trend
  const dailySales = new Map<string, { sales: number; transactions: number }>();
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    dailySales.set(dateKey, { sales: 0, transactions: 0 });
  }

  recentTransactions.forEach(t => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    const existing = dailySales.get(dateKey);
    if (existing) {
      existing.sales += t.total;
      existing.transactions += 1;
    }
  });

  const trend = Array.from(dailySales.entries()).map(([date, data]) => ({
    date,
    sales: formatPrice(data.sales),
    salesRaw: data.sales,
    transactions: data.transactions,
    averageTicket: data.transactions > 0
      ? formatPrice(data.sales / data.transactions)
      : formatPrice(0),
  }));

  // Calculate growth
  const firstHalf = trend.slice(0, Math.floor(days / 2));
  const secondHalf = trend.slice(Math.floor(days / 2));

  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.salesRaw, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.salesRaw, 0) / secondHalf.length;

  const growth = firstHalfAvg > 0
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    : 0;

  return {
    period: `${days} días`,
    trend,
    analysis: {
      averageDailySales: formatPrice(
        recentTransactions.reduce((sum, t) => sum + t.total, 0) / days
      ),
      totalTransactions: recentTransactions.length,
      averageTransactionsPerDay: formatNumber(recentTransactions.length / days, 1),
      growth: formatNumber(growth, 1) + '%',
      growthDirection: growth > 0 ? 'creciente' : growth < 0 ? 'decreciente' : 'estable',
    },
  };
}

// Tool 7: Predict Demand
export function predictDemand(context: ToolContext, productId?: string) {
  const { products } = context;

  if (productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { error: 'Product not found' };
    }

    const daysUntilEmpty = product.avgDailyConsumption > 0
      ? Math.floor(product.currentStock / product.avgDailyConsumption)
      : null;

    const estimatedEmptyDate = daysUntilEmpty !== null
      ? new Date(Date.now() + daysUntilEmpty * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    const recommendedRestock = product.maxStock - product.currentStock;

    return {
      product: {
        id: product.id,
        name: product.name,
        currentStock: product.currentStock,
        maxStock: product.maxStock,
        avgDailyConsumption: product.avgDailyConsumption,
        daysUntilEmpty,
        estimatedEmptyDate,
        stockLevel: getStockLevel(product),
      },
      recommendation: {
        shouldRestock: daysUntilEmpty !== null && daysUntilEmpty <= 7,
        recommendedQuantity: recommendedRestock,
        estimatedCost: formatPrice(recommendedRestock * product.price),
        urgency: daysUntilEmpty !== null && daysUntilEmpty <= 3 ? 'high' :
                 daysUntilEmpty !== null && daysUntilEmpty <= 7 ? 'medium' : 'low',
      },
    };
  }

  // Predict for all products
  const predictions = products
    .map(p => {
      const daysUntilEmpty = p.avgDailyConsumption > 0
        ? Math.floor(p.currentStock / p.avgDailyConsumption)
        : null;

      return {
        id: p.id,
        name: p.name,
        daysUntilEmpty,
        stockLevel: getStockLevel(p),
        urgency: daysUntilEmpty !== null && daysUntilEmpty <= 3 ? 'high' :
                 daysUntilEmpty !== null && daysUntilEmpty <= 7 ? 'medium' : 'low',
      };
    })
    .filter(p => p.urgency === 'high' || p.urgency === 'medium')
    .sort((a, b) => {
      const urgencyPriority = { high: 0, medium: 1, low: 2 };
      return urgencyPriority[a.urgency as keyof typeof urgencyPriority] -
             urgencyPriority[b.urgency as keyof typeof urgencyPriority];
    });

  return {
    criticalProducts: predictions.filter(p => p.urgency === 'high').length,
    warningProducts: predictions.filter(p => p.urgency === 'medium').length,
    predictions: predictions.slice(0, 20),
  };
}

// Tool 8: Generate Report
export function generateReport(context: ToolContext, type: 'inventory' | 'sales' | 'customers' | 'full') {
  const report: any = {
    generatedAt: new Date().toISOString(),
    reportType: type,
  };

  if (type === 'inventory' || type === 'full') {
    const inventoryStatus = getInventoryStatus(context);
    report.inventory = inventoryStatus;
  }

  if (type === 'sales' || type === 'full') {
    const salesData = getSalesData(context, 'month');
    report.sales = salesData;
  }

  if (type === 'customers' || type === 'full') {
    const customerInfo = getCustomerInfo(context);
    report.customers = customerInfo;
  }

  if (type === 'full') {
    report.recommendations = getRecommendations(context);
    report.trends = analyzeTrends(context, 30);
  }

  return report;
}

// Export all tools with their descriptions for the agent
export const AGENT_TOOLS = {
  get_inventory_status: {
    func: getInventoryStatus,
    description: 'Get current inventory status with optional filters for category, stock level, or search term',
  },
  get_sales_data: {
    func: getSalesData,
    description: 'Get sales data and metrics for a specified period (today, week, month, or all)',
  },
  get_customer_info: {
    func: getCustomerInfo,
    description: 'Get customer information with optional filters for specific customer, credit status, or search',
  },
  search_products: {
    func: searchProducts,
    description: 'Search for products by name or category',
  },
  get_recommendations: {
    func: getRecommendations,
    description: 'Get business recommendations including products that need restocking, top sellers, and slow movers',
  },
  analyze_trends: {
    func: analyzeTrends,
    description: 'Analyze sales trends over a specified number of days',
  },
  predict_demand: {
    func: predictDemand,
    description: 'Predict demand and stock depletion for products',
  },
  generate_report: {
    func: generateReport,
    description: 'Generate comprehensive business reports (inventory, sales, customers, or full)',
  },
};
