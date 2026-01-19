import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Alert, CategoryStatus, Category } from '../types';
import { getStockLevel, generateMockProducts } from '../utils/mockData';

interface InventoryStore {
  // State
  products: Product[];
  darkMode: boolean;
  selectedProduct: Product | null;

  // Actions
  setProducts: (products: Product[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  restockProduct: (id: string) => void;
  toggleDarkMode: () => void;
  setSelectedProduct: (product: Product | null) => void;
  initializeProducts: () => void;

  // Computed
  getAlerts: () => Alert[];
  getCategoryStatus: () => CategoryStatus[];
}

const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      // Initial State
      products: [],
      darkMode: false,
      selectedProduct: null,

      // Actions
      setProducts: (products) => set({ products }),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      restockProduct: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  currentStock: p.maxStock,
                  lastRestocked: new Date(),
                }
              : p
          ),
        })),

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.darkMode;
          // Update HTML class for dark mode
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        }),

      setSelectedProduct: (product) => set({ selectedProduct: product }),

      initializeProducts: () => {
        const storedProducts = get().products;
        if (storedProducts.length === 0) {
          // Will be initialized with mock data
          set({ products: generateMockProducts(200) });
        }
      },

      // Computed getters
      getAlerts: () => {
        const products = get().products;
        const alerts: Alert[] = [];

        products.forEach((product) => {
          const level = getStockLevel(product);

          if (level === 'out') {
            alerts.push({
              id: `alert-${product.id}`,
              product,
              level,
              message: `${product.name} está agotado`,
              priority: 1,
            });
          } else if (level === 'critical') {
            alerts.push({
              id: `alert-${product.id}`,
              product,
              level,
              message: `${product.name} está en nivel crítico`,
              priority: 2,
            });
          } else if (level === 'low') {
            alerts.push({
              id: `alert-${product.id}`,
              product,
              level,
              message: `${product.name} tiene stock bajo`,
              priority: 3,
            });
          }
        });

        return alerts.sort((a, b) => a.priority - b.priority);
      },

      getCategoryStatus: () => {
        const products = get().products;
        const categories: Category[] = ['bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

        return categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category === category);

          const outOfStock = categoryProducts.filter(
            (p) => getStockLevel(p) === 'out'
          ).length;

          const lowStock = categoryProducts.filter(
            (p) => getStockLevel(p) === 'low'
          ).length;

          const criticalProducts = categoryProducts.filter(
            (p) => getStockLevel(p) === 'critical'
          ).length;

          const avgStockPercentage =
            categoryProducts.reduce(
              (acc, p) => acc + (p.currentStock / p.maxStock) * 100,
              0
            ) / (categoryProducts.length || 1);

          return {
            category,
            totalProducts: categoryProducts.length,
            outOfStock,
            lowStock,
            criticalProducts,
            avgStockPercentage,
          };
        });
      },
    }),
    {
      name: 'inventory-storage',
      // Convertir fechas de string a Date al cargar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convertir todas las fechas de string a Date
          state.products = state.products.map(p => ({
            ...p,
            lastRestocked: typeof p.lastRestocked === 'string' ? new Date(p.lastRestocked) : p.lastRestocked,
          }));
        }
      },
    }
  )
);

export default useInventoryStore;
