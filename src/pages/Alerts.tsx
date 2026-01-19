import { useState, useMemo } from 'react';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import useInventoryStore from '../store/inventoryStore';
import useBatchStore from '../store/batchStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatPrice, formatDate } from '../utils/format';
import {
  getDaysUntilExpiration,
  getBatchStatusLabel,
  formatDaysLeft,
  getSuggestedDiscount,
} from '../utils/expirationUtils';
import type { StockLevel, Category } from '../types';
import { CATEGORY_LABELS } from '../types';

type AlertType = 'stock' | 'expiration';

export default function Alerts() {
  const { getAlerts, products } = useInventoryStore();
  const { batches } = useBatchStore();
  const stockAlerts = getAlerts();

  const [alertType, setAlertType] = useState<AlertType>('stock');
  const [levelFilter, setLevelFilter] = useState<StockLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  // Alertas de caducidad
  const expirationAlerts = useMemo(() => {
    return batches
      .filter((batch) => {
        if (batch.quantity <= 0 || batch.status === 'sold') return false;
        const daysLeft = getDaysUntilExpiration(batch.expirationDate);
        return daysLeft <= 15; // Mostrar productos que vencen en 15 días o menos
      })
      .map((batch) => {
        const product = products.find((p) => p.id === batch.productId);
        const daysLeft = getDaysUntilExpiration(batch.expirationDate);
        return { batch, product, daysLeft };
      })
      .filter((alert) => alert.product !== undefined)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [batches, products]);

  const filteredStockAlerts = useMemo(() => {
    return stockAlerts.filter((alert) => {
      const matchesLevel = levelFilter === 'all' || alert.level === levelFilter;
      const matchesCategory = categoryFilter === 'all' || alert.product.category === categoryFilter;
      return matchesLevel && matchesCategory;
    });
  }, [stockAlerts, levelFilter, categoryFilter]);

  const filteredExpirationAlerts = useMemo(() => {
    return expirationAlerts.filter((alert) => {
      const matchesCategory = categoryFilter === 'all' || alert.product!.category === categoryFilter;
      return matchesCategory;
    });
  }, [expirationAlerts, categoryFilter]);

  const categories: (Category | 'all')[] = ['all', 'bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Alertas del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {alertType === 'stock'
              ? `${filteredStockAlerts.length} alerta${filteredStockAlerts.length !== 1 ? 's' : ''} de stock`
              : `${filteredExpirationAlerts.length} alerta${filteredExpirationAlerts.length !== 1 ? 's' : ''} de caducidad`}
          </p>
        </div>

        {/* Selector de tipo de alerta */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={alertType === 'stock' ? 'primary' : 'secondary'}
            onClick={() => setAlertType('stock')}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Stock ({stockAlerts.length})
          </Button>
          <Button
            variant={alertType === 'expiration' ? 'primary' : 'secondary'}
            onClick={() => setAlertType('expiration')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Caducidad ({expirationAlerts.length})
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Filtro por Nivel de Stock - solo para alertas de stock */}
            {alertType === 'stock' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de Stock
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant={levelFilter === 'all' ? 'primary' : 'ghost'}
                    onClick={() => setLevelFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={levelFilter === 'out' ? 'primary' : 'ghost'}
                    onClick={() => setLevelFilter('out')}
                  >
                    Agotados
                  </Button>
                  <Button
                    size="sm"
                    variant={levelFilter === 'critical' ? 'primary' : 'ghost'}
                    onClick={() => setLevelFilter('critical')}
                  >
                    Críticos
                  </Button>
                  <Button
                    size="sm"
                    variant={levelFilter === 'low' ? 'primary' : 'ghost'}
                    onClick={() => setLevelFilter('low')}
                  >
                    Bajos
                  </Button>
                </div>
              </div>
            )}

            {/* Filtro por Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={categoryFilter === cat ? 'primary' : 'ghost'}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat as Category]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Alertas de Stock */}
        {alertType === 'stock' && (
          <div className="space-y-4">
            {filteredStockAlerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {alert.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <Badge variant={alert.level}>
                        {alert.level === 'out' ? 'Agotado' : alert.level === 'critical' ? 'Crítico' : 'Bajo'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Categoría</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {CATEGORY_LABELS[alert.product.category]}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Stock actual</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {alert.product.currentStock} / {alert.product.maxStock}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Precio</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(alert.product.price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Valor actual</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(alert.product.currentStock * alert.product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredStockAlerts.length === 0 && (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay alertas de stock
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No se encontraron productos que coincidan con los filtros seleccionados
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Lista de Alertas de Caducidad */}
        {alertType === 'expiration' && (
          <div className="space-y-4">
            {filteredExpirationAlerts.map((alert) => {
              const product = alert.product!;
              const batch = alert.batch;
              const discount = getSuggestedDiscount(alert.daysLeft);
              const statusLabel = getBatchStatusLabel(batch.status);

              return (
                <Card key={batch.id} className="hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-lg ${
                        alert.daysLeft < 0
                          ? 'bg-black/10 dark:bg-black/30'
                          : alert.daysLeft <= 3
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-orange-100 dark:bg-orange-900/30'
                      }`}>
                        <Calendar className={`w-6 h-6 ${
                          alert.daysLeft < 0
                            ? 'text-black dark:text-gray-400'
                            : alert.daysLeft <= 3
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Lote: {batch.batchNumber} - {formatDaysLeft(alert.daysLeft)}
                          </p>
                        </div>
                        <Badge variant={alert.daysLeft < 0 ? 'critical' : alert.daysLeft <= 3 ? 'critical' : 'warning'}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Categoría</span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {CATEGORY_LABELS[product.category]}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Cantidad</span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {batch.quantity} {product.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Fecha de caducidad</span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(batch.expirationDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Descuento sugerido</span>
                          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            {discount > 0 ? `${discount}%` : 'No aplica'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredExpirationAlerts.length === 0 && (
              <Card>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay alertas de caducidad
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Todos los lotes están en buen estado o no hay productos perecederos
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
