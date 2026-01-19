import type { Product, Transaction, Customer } from '../types';
import { getStockLevel } from './mockData';
import { formatPrice, formatPercentage } from './format';
import { CATEGORY_LABELS } from '../types';

/**
 * Procesa el mensaje del usuario y genera una respuesta inteligente
 */
export function generateAIResponse(
  userMessage: string,
  products: Product[],
  transactions: Transaction[],
  customers: Customer[]
): string {
  const msg = userMessage.toLowerCase();

  // Detectar intención del mensaje
  if (msg.includes('bajo') || msg.includes('crítico') || msg.includes('agotado') || msg.includes('stock')) {
    return analyzeStockStatus(products, msg);
  }

  if (msg.includes('venta') || msg.includes('vendí') || msg.includes('ingresos') || msg.includes('ganancia')) {
    return analyzeSales(transactions, msg);
  }

  if (msg.includes('cliente') || msg.includes('crédito')) {
    return analyzeCustomers(customers, msg);
  }

  if (msg.includes('recomienda') || msg.includes('recomendación') || msg.includes('debo') || msg.includes('comprar')) {
    return generateRecommendations(products, transactions);
  }

  if (msg.includes('mejor') || msg.includes('top') || msg.includes('más vendido')) {
    return getTopProducts(products, transactions);
  }

  if (msg.includes('producto') && (msg.includes('busca') || msg.includes('encuentra') || msg.includes('info'))) {
    return searchProduct(msg, products);
  }

  if (msg.includes('hola') || msg.includes('ayuda') || msg.includes('qué puedes')) {
    return '¡Hola! Puedo ayudarte con:\n\n• Ver el estado de tu inventario\n• Analizar tus ventas\n• Gestionar clientes y crédito\n• Recomendaciones de restock\n• Encontrar productos\n• Identificar tendencias\n\nPregúntame lo que necesites. Por ejemplo: "¿Qué productos están bajos de stock?" o "¿Cuánto vendí hoy?"';
  }

  // Respuesta por defecto
  return 'Entiendo tu pregunta. Aquí está la información del sistema:\n\n' +
    `📦 **Inventario**: ${products.length} productos totales\n` +
    `💰 **Ventas**: ${transactions.length} transacciones registradas\n` +
    `👥 **Clientes**: ${customers.length} clientes activos\n\n` +
    'Puedes preguntarme sobre:\n• Estado de stock\n• Análisis de ventas\n• Información de clientes\n• Recomendaciones de restock';
}

function analyzeStockStatus(products: Product[], msg: string): string {
  const lowStock = products.filter(p => getStockLevel(p) === 'low').length;
  const critical = products.filter(p => getStockLevel(p) === 'critical').length;
  const outOfStock = products.filter(p => getStockLevel(p) === 'out').length;

  let response = '📊 **Estado del Inventario:**\n\n';

  if (msg.includes('crítico') || critical > 0) {
    response += `⚠️ **${critical} productos en nivel crítico**\n`;
    if (critical > 0 && critical <= 5) {
      const criticalProducts = products
        .filter(p => getStockLevel(p) === 'critical')
        .slice(0, 5);
      response += '\nProductos críticos:\n';
      criticalProducts.forEach(p => {
        response += `• ${p.name}: ${p.currentStock}/${p.maxStock} unidades (${formatPercentage(p.currentStock / p.maxStock)})\n`;
      });
    }
  }

  if (msg.includes('agotado') || outOfStock > 0) {
    response += `\n❌ **${outOfStock} productos agotados**\n`;
    if (outOfStock > 0 && outOfStock <= 5) {
      const outProducts = products.filter(p => getStockLevel(p) === 'out').slice(0, 5);
      response += '\nProductos agotados:\n';
      outProducts.forEach(p => {
        response += `• ${p.name}\n`;
      });
    }
  }

  if (msg.includes('bajo') || lowStock > 0) {
    response += `\n⚡ **${lowStock} productos con stock bajo**\n`;
  }

  response += `\n✅ **${products.filter(p => getStockLevel(p) === 'normal').length} productos con stock normal**`;

  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.price), 0);
  response += `\n\n💵 **Valor total del inventario:** ${formatPrice(totalValue)}`;

  if (critical > 0 || outOfStock > 0) {
    response += '\n\n💡 **Recomendación:** Te sugiero revisar estos productos y hacer pedidos de restock pronto.';
  }

  return response;
}

function analyzeSales(transactions: Transaction[], msg: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = transactions.filter(t => new Date(t.date) >= today);
  const todayRevenue = todaySales.reduce((sum, t) => sum + t.total, 0);

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weekSales = transactions.filter(t => new Date(t.date) >= thisWeek);
  const weekRevenue = weekSales.reduce((sum, t) => sum + t.total, 0);

  let response = '💰 **Análisis de Ventas:**\n\n';

  if (msg.includes('hoy') || msg.includes('día')) {
    response += `📅 **Hoy:**\n`;
    response += `• ${todaySales.length} transacciones\n`;
    response += `• ${formatPrice(todayRevenue)} en ventas\n`;
    response += `• Ticket promedio: ${formatPrice(todaySales.length > 0 ? todayRevenue / todaySales.length : 0)}\n`;
  } else if (msg.includes('semana')) {
    response += `📅 **Esta Semana:**\n`;
    response += `• ${weekSales.length} transacciones\n`;
    response += `• ${formatPrice(weekRevenue)} en ventas\n`;
    response += `• Promedio diario: ${formatPrice(weekRevenue / 7)}\n`;
  } else {
    // Resumen general
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    response += `📊 **Resumen General:**\n\n`;
    response += `**Hoy:**\n• ${todaySales.length} ventas - ${formatPrice(todayRevenue)}\n\n`;
    response += `**Esta Semana:**\n• ${weekSales.length} ventas - ${formatPrice(weekRevenue)}\n\n`;
    response += `**Total:**\n• ${transactions.length} transacciones\n• ${formatPrice(totalRevenue)} en ingresos totales\n`;
  }

  // Métodos de pago
  const paymentMethods = transactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  response += '\n💳 **Métodos de pago preferidos:**\n';
  Object.entries(paymentMethods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      const methodLabel = method === 'cash' ? 'Efectivo' :
                         method === 'card' ? 'Tarjeta' :
                         method === 'transfer' ? 'Transferencia' : 'Crédito';
      response += `• ${methodLabel}: ${count} transacciones\n`;
    });

  return response;
}

function analyzeCustomers(customers: Customer[], msg: string): string {
  const withCredit = customers.filter(c => c.creditLimit > 0);
  const activeCredit = withCredit.filter(c => c.currentCredit > 0);
  const totalCreditUsed = activeCredit.reduce((sum, c) => sum + c.currentCredit, 0);
  const totalCreditLimit = withCredit.reduce((sum, c) => sum + c.creditLimit, 0);

  let response = '👥 **Análisis de Clientes:**\n\n';

  response += `📊 **Estadísticas:**\n`;
  response += `• ${customers.length} clientes totales\n`;
  response += `• ${withCredit.length} clientes con línea de crédito\n`;
  response += `• ${activeCredit.length} clientes con crédito activo\n\n`;

  if (withCredit.length > 0) {
    response += `💳 **Crédito:**\n`;
    response += `• Límite total: ${formatPrice(totalCreditLimit)}\n`;
    response += `• Crédito usado: ${formatPrice(totalCreditUsed)}\n`;
    response += `• Disponible: ${formatPrice(totalCreditLimit - totalCreditUsed)}\n`;
    response += `• Uso: ${formatPercentage(totalCreditUsed / totalCreditLimit)}\n`;
  }

  // Top clientes por compras
  const topCustomers = [...customers]
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 3);

  if (topCustomers.length > 0) {
    response += '\n🌟 **Top Clientes:**\n';
    topCustomers.forEach((c, i) => {
      response += `${i + 1}. ${c.name} - ${formatPrice(c.totalPurchases)} en compras\n`;
    });
  }

  // Clientes con crédito alto
  if (msg.includes('crédito') || msg.includes('deuda')) {
    const highCredit = activeCredit
      .filter(c => c.currentCredit / c.creditLimit > 0.8)
      .slice(0, 3);

    if (highCredit.length > 0) {
      response += '\n⚠️ **Clientes cerca del límite de crédito:**\n';
      highCredit.forEach(c => {
        response += `• ${c.name}: ${formatPrice(c.currentCredit)} / ${formatPrice(c.creditLimit)} (${formatPercentage(c.currentCredit / c.creditLimit)})\n`;
      });
    }
  }

  return response;
}

function generateRecommendations(products: Product[], _transactions: Transaction[]): string {
  // Productos que necesitan restock urgente
  const needRestock = products
    .filter(p => {
      const level = getStockLevel(p);
      const daysUntilEmpty = p.avgDailyConsumption > 0 ? p.currentStock / p.avgDailyConsumption : Infinity;
      return (level === 'critical' || level === 'out') || daysUntilEmpty < 7;
    })
    .sort((a, b) => {
      const daysA = a.avgDailyConsumption > 0 ? a.currentStock / a.avgDailyConsumption : Infinity;
      const daysB = b.avgDailyConsumption > 0 ? b.currentStock / b.avgDailyConsumption : Infinity;
      return daysA - daysB;
    })
    .slice(0, 5);

  let response = '💡 **Recomendaciones de Restock:**\n\n';

  if (needRestock.length === 0) {
    response += '✅ ¡Excelente! Tu inventario está bien surtido. No hay productos que requieran restock urgente.\n\n';
    response += 'Sigue monitoreando el consumo diario para anticipar futuras necesidades.';
    return response;
  }

  response += '🚨 **Productos que requieren atención inmediata:**\n\n';

  needRestock.forEach((p, i) => {
    const daysLeft = p.avgDailyConsumption > 0 ? Math.floor(p.currentStock / p.avgDailyConsumption) : 999;
    const level = getStockLevel(p);
    const emoji = level === 'out' ? '❌' : level === 'critical' ? '⚠️' : '⚡';

    response += `${i + 1}. ${emoji} **${p.name}**\n`;
    response += `   • Stock actual: ${p.currentStock} ${p.unit}\n`;
    response += `   • Consumo diario: ${p.avgDailyConsumption} ${p.unit}/día\n`;

    if (daysLeft < 999) {
      response += `   • Días restantes: ${daysLeft} días\n`;
    }

    const recommendedOrder = Math.max(p.maxStock - p.currentStock, p.avgDailyConsumption * 30);
    response += `   • Cantidad sugerida: ${Math.round(recommendedOrder)} ${p.unit}\n`;
    response += `   • Costo estimado: ${formatPrice(recommendedOrder * p.price)}\n\n`;
  });

  const totalCost = needRestock.reduce((sum, p) => {
    const recommendedOrder = Math.max(p.maxStock - p.currentStock, p.avgDailyConsumption * 30);
    return sum + (recommendedOrder * p.price);
  }, 0);

  response += `💵 **Inversión total recomendada:** ${formatPrice(totalCost)}\n\n`;
  response += '📋 Estos pedidos te ayudarán a mantener un stock saludable por al menos 30 días.';

  return response;
}

function getTopProducts(_products: Product[], transactions: Transaction[]): string {
  // Calcular productos más vendidos basado en transacciones
  const productSales = new Map<string, { product: Product; quantity: number; revenue: number }>();

  transactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productSales.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        productSales.set(item.product.id, {
          product: item.product,
          quantity: item.quantity,
          revenue: item.subtotal,
        });
      }
    });
  });

  const topByQuantity = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topByRevenue = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  let response = '🏆 **Productos Top:**\n\n';

  response += '**📊 Más Vendidos (por cantidad):**\n';
  topByQuantity.forEach((item, i) => {
    response += `${i + 1}. ${item.product.name}\n`;
    response += `   • ${item.quantity} unidades vendidas\n`;
    response += `   • ${formatPrice(item.revenue)} en ingresos\n\n`;
  });

  response += '**💰 Más Rentables (por ingresos):**\n';
  topByRevenue.forEach((item, i) => {
    response += `${i + 1}. ${item.product.name}\n`;
    response += `   • ${formatPrice(item.revenue)} en ingresos\n`;
    response += `   • ${item.quantity} unidades vendidas\n\n`;
  });

  response += '💡 **Insight:** Mantén estos productos siempre en stock, son los favoritos de tus clientes.';

  return response;
}

function searchProduct(msg: string, products: Product[]): string {
  // Extraer el nombre del producto del mensaje
  const words = msg.split(' ');
  const searchTerms = words.filter(w =>
    !['producto', 'busca', 'encuentra', 'info', 'información', 'sobre', 'del', 'de', 'la', 'el'].includes(w)
  );

  if (searchTerms.length === 0) {
    return '🔍 Por favor, especifica el nombre del producto que buscas. Por ejemplo: "información de Coca-Cola"';
  }

  const searchTerm = searchTerms.join(' ');
  const matches = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 3);

  if (matches.length === 0) {
    return `❌ No encontré productos que coincidan con "${searchTerm}". Intenta con otro nombre.`;
  }

  let response = `🔍 **Resultados para "${searchTerm}":**\n\n`;

  matches.forEach((p, i) => {
    const level = getStockLevel(p);
    const emoji = level === 'out' ? '❌' : level === 'critical' ? '⚠️' : level === 'low' ? '⚡' : '✅';

    response += `${i + 1}. ${emoji} **${p.name}**\n`;
    response += `   • Categoría: ${CATEGORY_LABELS[p.category]}\n`;
    response += `   • Stock: ${p.currentStock}/${p.maxStock} ${p.unit}\n`;
    response += `   • Precio: ${formatPrice(p.price)} por ${p.unit}\n`;
    response += `   • Consumo: ${p.avgDailyConsumption} ${p.unit}/día\n`;
    response += `   • Valor en stock: ${formatPrice(p.currentStock * p.price)}\n\n`;
  });

  return response;
}
