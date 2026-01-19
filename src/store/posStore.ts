import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Transaction, Customer } from '../types';
import { initializeMockPOSData } from '../utils/generateMockData';
import useBatchStore from './batchStore';
import { isPerishableProduct } from '../utils/expirationUtils';

interface POSStore {
  // State
  cart: CartItem[];
  transactions: Transaction[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchQuery: string;

  // Actions - Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;

  // Actions - Transactions
  processTransaction: (paymentMethod: 'cash' | 'card' | 'transfer' | 'credit', notes?: string) => Promise<string>;
  cancelTransaction: (transactionId: string) => void;

  // Actions - Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit' | 'frequentProducts'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  selectCustomer: (customer: Customer | null) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;

  // Computed
  getCartTotal: () => { subtotal: number; tax: number; discount: number; total: number };
  getFilteredTransactions: (filters?: { startDate?: Date; endDate?: Date; paymentMethod?: string }) => Transaction[];
  getSalesReport: (period: 'day' | 'week' | 'month') => any;

  // Utilities
  initializeMockData: (products: Product[]) => void;
}

const TAX_RATE = 0.16; // 16% IVA

const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      // Initial State
      cart: [],
      transactions: [],
      customers: [],
      selectedCustomer: null,
      searchQuery: '',

      // Cart Actions
      addToCart: (product, quantity = 1) => {
        const cart = get().cart;
        const existingItem = cart.find(item => item.product.id === product.id);

        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: (item.quantity + quantity) * item.product.price,
                  }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            product,
            quantity,
            subtotal: product.price * quantity,
            discount: 0,
          };
          set({ cart: [...cart, newItem] });
        }
      },

      removeFromCart: (productId) => {
        set(state => ({
          cart: state.cart.filter(item => item.product.id !== productId),
        }));
      },

      updateCartItemQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set(state => ({
          cart: state.cart.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity,
                  subtotal: item.product.price * quantity - item.discount,
                }
              : item
          ),
        }));
      },

      updateCartItemDiscount: (productId, discount) => {
        set(state => ({
          cart: state.cart.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  discount,
                  subtotal: item.product.price * item.quantity - discount,
                }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ cart: [], selectedCustomer: null });
      },

      // Transaction Actions
      processTransaction: async (paymentMethod, notes) => {
        const cart = get().cart;
        const selectedCustomer = get().selectedCustomer;
        const totals = get().getCartTotal();

        if (cart.length === 0) {
          throw new Error('El carrito está vacío');
        }

        if (paymentMethod === 'credit' && !selectedCustomer) {
          throw new Error('Debe seleccionar un cliente para ventas a crédito');
        }

        if (paymentMethod === 'credit' && selectedCustomer) {
          const availableCredit = selectedCustomer.creditLimit - selectedCustomer.currentCredit;
          if (totals.total > availableCredit) {
            throw new Error(`Crédito insuficiente. Disponible: $${availableCredit.toFixed(2)}`);
          }
        }

        const transaction: Transaction = {
          id: `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: new Date(),
          items: [...cart],
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          paymentMethod,
          customerId: selectedCustomer?.id,
          status: paymentMethod === 'credit' ? 'pending' : 'completed',
          notes,
        };

        // Update customer if exists
        if (selectedCustomer) {
          const productIds = cart.map(item => item.product.id);
          const updatedFrequentProducts = [
            ...new Set([...selectedCustomer.frequentProducts, ...productIds])
          ].slice(0, 10); // Keep top 10

          get().updateCustomer(selectedCustomer.id, {
            totalPurchases: selectedCustomer.totalPurchases + totals.total,
            lastVisit: new Date(),
            frequentProducts: updatedFrequentProducts,
            currentCredit: paymentMethod === 'credit'
              ? selectedCustomer.currentCredit + totals.total
              : selectedCustomer.currentCredit,
          });
        }

        set(state => ({
          transactions: [transaction, ...state.transactions],
        }));

        // Consumir de lotes usando FEFO para productos perecederos
        cart.forEach((item) => {
          const product = item.product;
          if (isPerishableProduct(product)) {
            const batchStore = useBatchStore.getState();
            const productBatches = batchStore.getBatchesByProduct(product.id);
            let remainingQuantity = item.quantity;

            // Consumir de lotes usando FEFO
            for (const batch of productBatches) {
              if (remainingQuantity <= 0) break;
              if (batch.quantity <= 0 || batch.status === 'expired' || batch.status === 'sold') {
                continue;
              }

              const quantityToConsume = Math.min(batch.quantity, remainingQuantity);
              batchStore.consumeFromBatch(batch.id, quantityToConsume);
              remainingQuantity -= quantityToConsume;
            }
          }
        });

        get().clearCart();

        return transaction.id;
      },

      cancelTransaction: (transactionId) => {
        set(state => ({
          transactions: state.transactions.map(t =>
            t.id === transactionId ? { ...t, status: 'cancelled' } : t
          ),
        }));
      },

      // Customer Actions
      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          totalPurchases: 0,
          lastVisit: new Date(),
          frequentProducts: [],
        };

        set(state => ({
          customers: [...state.customers, newCustomer],
        }));
      },

      updateCustomer: (id, updates) => {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
          selectedCustomer: state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...updates }
            : state.selectedCustomer,
        }));
      },

      selectCustomer: (customer) => {
        set({ selectedCustomer: customer });
      },

      // Search Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Computed
      getCartTotal: () => {
        const cart = get().cart;
        const subtotalBeforeDiscount = cart.reduce((sum, item) =>
          sum + (item.product.price * item.quantity), 0
        );
        const discount = cart.reduce((sum, item) => sum + item.discount, 0);
        const subtotal = subtotalBeforeDiscount - discount;
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        return { subtotal, tax, discount, total };
      },

      getFilteredTransactions: (filters) => {
        let transactions = get().transactions;

        if (filters?.startDate) {
          transactions = transactions.filter(t =>
            new Date(t.date) >= filters.startDate!
          );
        }

        if (filters?.endDate) {
          transactions = transactions.filter(t =>
            new Date(t.date) <= filters.endDate!
          );
        }

        if (filters?.paymentMethod) {
          transactions = transactions.filter(t =>
            t.paymentMethod === filters.paymentMethod
          );
        }

        return transactions;
      },

      getSalesReport: (period) => {
        const now = new Date();
        let startDate = new Date();

        if (period === 'day') {
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }

        const transactions = get().getFilteredTransactions({
          startDate,
          endDate: now
        }).filter(t => t.status === 'completed');

        const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        // Sales by payment method
        const salesByPaymentMethod = transactions.reduce((acc, t) => {
          acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
          return acc;
        }, {} as Record<string, number>);

        // Top products
        const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();

        transactions.forEach(t => {
          t.items.forEach(item => {
            const existing = productSales.get(item.product.id);
            if (existing) {
              existing.quantity += item.quantity;
              existing.revenue += item.subtotal;
            } else {
              productSales.set(item.product.id, {
                quantity: item.quantity,
                revenue: item.subtotal,
                name: item.product.name,
              });
            }
          });
        });

        const topProducts = Array.from(productSales.entries())
          .map(([productId, data]: [string, { quantity: number; revenue: number; name: string }]) => ({
            productId,
            name: data.name,
            quantity: data.quantity,
            revenue: data.revenue,
          }))
          .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          period,
          totalSales,
          totalTransactions,
          averageTicket,
          salesByPaymentMethod,
          topProducts,
          transactions,
        };
      },

      // Utilities
      initializeMockData: (products) => {
        const mockData = initializeMockPOSData(products);
        set({
          transactions: mockData.transactions,
          customers: mockData.customers,
        });
      },
    }),
    {
      name: 'pos-storage',
      // Convertir fechas de string a Date al cargar desde localStorage
      partialize: (state) => ({
        ...state,
        transactions: state.transactions,
        customers: state.customers,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir todas las fechas de string a Date
          state.transactions = state.transactions.map(t => ({
            ...t,
            date: typeof t.date === 'string' ? new Date(t.date) : t.date,
          }));

          state.customers = state.customers.map(c => ({
            ...c,
            lastVisit: typeof c.lastVisit === 'string' ? new Date(c.lastVisit) : c.lastVisit,
          }));
        }
      },
    }
  )
);

export default usePOSStore;
