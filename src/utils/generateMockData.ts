import type { Transaction, Customer, Product } from '../types';

/**
 * Generate mock transactions for testing
 */
export function generateMockTransactions(products: Product[], count: number = 50): Transaction[] {
  const transactions: Transaction[] = [];
  const paymentMethods: Array<'cash' | 'card' | 'transfer' | 'credit'> = ['cash', 'card', 'transfer', 'credit'];
  const statuses: Array<'completed' | 'pending' | 'cancelled'> = ['completed', 'completed', 'completed', 'pending'];

  for (let i = 0; i < count; i++) {
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let subtotal = 0;

    // Select random products for this transaction
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const itemSubtotal = product.price * quantity;
      const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0;

      items.push({
        product,
        quantity,
        subtotal: itemSubtotal - discount,
        discount,
      });

      subtotal += itemSubtotal - discount;
    }

    const tax = subtotal * 0.16;
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const total = subtotal + tax;

    // Generate date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 8); // Between 8am and 8pm
    date.setMinutes(Math.floor(Math.random() * 60));

    transactions.push({
      id: `trans-${Date.now()}-${i}`,
      date,
      items,
      subtotal,
      tax,
      discount: totalDiscount,
      total,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: Math.random() > 0.9 ? 'Venta especial' : undefined,
    });
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate mock customers for testing
 */
export function generateMockCustomers(count: number = 20): Customer[] {
  const firstNames = [
    'Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Rosa',
    'Carlos', 'Patricia', 'Miguel', 'Laura', 'Jorge', 'Elena', 'Roberto',
    'Isabel', 'Antonio', 'Sofía', 'Francisco', 'Lucía'
  ];

  const lastNames = [
    'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
    'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Gutiérrez', 'Jiménez'
  ];

  const customers: Customer[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;

    const hasCredit = Math.random() > 0.5;
    const creditLimit = hasCredit ? Math.floor(Math.random() * 10000) + 1000 : 0;
    const currentCredit = hasCredit ? Math.floor(Math.random() * creditLimit * 0.8) : 0;
    const totalPurchases = Math.floor(Math.random() * 50000) + 1000;

    const daysAgo = Math.floor(Math.random() * 60);
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - daysAgo);

    // Generate 2-5 frequent product IDs (these would match real product IDs)
    const numFrequentProducts = Math.floor(Math.random() * 4) + 2;
    const frequentProducts = Array.from({ length: numFrequentProducts }, () =>
      `product-${Math.floor(Math.random() * 100)}`
    );

    customers.push({
      id: `customer-${Date.now()}-${i}`,
      name,
      phone: Math.random() > 0.3 ? `55${Math.floor(Math.random() * 90000000) + 10000000}` : undefined,
      email: Math.random() > 0.5 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com` : undefined,
      creditLimit,
      currentCredit,
      totalPurchases,
      lastVisit,
      frequentProducts,
    });
  }

  // Sort by total purchases (highest first)
  return customers.sort((a, b) => b.totalPurchases - a.totalPurchases);
}

/**
 * Initialize mock data for POS system
 */
export function initializeMockPOSData(products: Product[]) {
  return {
    transactions: generateMockTransactions(products, 100),
    customers: generateMockCustomers(30),
  };
}
