import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatPrice } from '../utils/format';
import type { StockLevel, Category } from '../types';
import { CATEGORY_LABELS } from '../types';

export default function Alerts() {
  const { getAlerts } = useInventoryStore();
  const alerts = getAlerts();

  const [levelFilter, setLevelFilter] = useState<StockLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesLevel = levelFilter === 'all' || alert.level === levelFilter;
      const matchesCategory = categoryFilter === 'all' || alert.product.category === categoryFilter;
      return matchesLevel && matchesCategory;
    });
  }, [alerts, levelFilter, categoryFilter]);

  const categories: (Category | 'all')[] = ['all', 'bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Alertas de Inventario
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAlerts.length} producto{filteredAlerts.length !== 1 ? 's' : ''} requiere
            {filteredAlerts.length !== 1 ? 'n' : ''} atención
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Filtro por Nivel de Stock */}
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

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
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

          {filteredAlerts.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No hay alertas
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron productos que coincidan con los filtros seleccionados
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
