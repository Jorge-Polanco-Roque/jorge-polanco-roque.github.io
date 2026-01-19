import { useEffect, useState } from 'react';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import { Package, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { formatPrice, formatPercentage } from '../utils/format';
import Store3DView from '../components/3d/Store3DView';
import ProductModal from '../components/inventory/ProductModal';
import { CATEGORY_LABELS } from '../types';
import { getStockLevel } from '../utils/mockData';
import type { Product } from '../types';

export default function Dashboard() {
  const { products, getCategoryStatus, initializeProducts } =
    useInventoryStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  const categoryStatus = getCategoryStatus();

  const outOfStockCount = products.filter((p) => getStockLevel(p) === 'out').length;
  const criticalCount = products.filter((p) => getStockLevel(p) === 'critical').length;
  const totalValue = products.reduce((sum, p) => sum + p.currentStock * p.price, 0);

  const mostCriticalCategory = categoryStatus
    .filter((s) => s.criticalProducts > 0)
    .sort((a, b) => b.criticalProducts - a.criticalProducts)[0];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vista general del inventario
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Productos Agotados */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productos Agotados
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {outOfStockCount}
                </p>
              </div>
              <div className="p-4 bg-red-100/60 dark:bg-red-900/40 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50">
                <Package className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          {/* Alertas Críticas */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Alertas Críticas
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {criticalCount}
                </p>
              </div>
              <div className="p-4 bg-yellow-100/60 dark:bg-yellow-900/40 backdrop-blur-sm rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          {/* Valor Total */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Total
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatPrice(totalValue)}
                </p>
              </div>
              <div className="p-4 bg-green-100/60 dark:bg-green-900/40 backdrop-blur-sm rounded-xl border border-green-200/50 dark:border-green-800/50">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          {/* Categoría Más Crítica */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categoría Crítica
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {mostCriticalCategory
                    ? CATEGORY_LABELS[mostCriticalCategory.category]
                    : 'Ninguna'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {mostCriticalCategory?.criticalProducts || 0} productos
                </p>
              </div>
              <div className="p-4 bg-red-100/60 dark:bg-red-900/40 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50">
                <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Vista 3D */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Vista 3D del Inventario
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            <span className="font-semibold">Haz click en cualquier caja para ver detalles.</span> Los colores indican el nivel de stock:
            <span className="text-green-600 dark:text-green-400 font-medium"> Verde (Normal)</span>,
            <span className="text-yellow-600 dark:text-yellow-400 font-medium"> Amarillo (Bajo)</span>,
            <span className="text-red-600 dark:text-red-400 font-medium"> Rojo (Crítico)</span>,
            <span className="text-gray-600 dark:text-gray-400 font-medium"> Gris (Agotado)</span>
          </p>
          <Store3DView products={products} onProductClick={setSelectedProduct} />
        </Card>

        {/* Estado por Categoría */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Estado por Categoría
          </h2>
          <div className="space-y-4">
            {categoryStatus.map((status) => (
              <div key={status.category} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {CATEGORY_LABELS[status.category]}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatPercentage(status.avgStockPercentage / 100, 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${status.avgStockPercentage}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Total: {status.totalProducts}</span>
                  <span>Agotados: {status.outOfStock}</span>
                  <span>Bajo: {status.lowStock}</span>
                  <span>Críticos: {status.criticalProducts}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal de Producto */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
