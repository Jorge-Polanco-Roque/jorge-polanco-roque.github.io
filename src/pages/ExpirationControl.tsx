import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import useBatchStore from '../store/batchStore';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import BatchManagement from '../components/batch/BatchManagement';
import {
  getDaysUntilExpiration,
  getBatchStatusColor,
  getBatchStatusLabel,
  formatDaysLeft,
  getUrgencyMessage,
  getSuggestedDiscount,
} from '../utils/expirationUtils';
import { formatCurrency } from '../utils/format';
import { generateMockBatches, generateDemoBatches } from '../utils/generateMockBatches';
import type { Product, ProductBatch } from '../types';

export default function ExpirationControl() {
  const { batches, getExpirationStats, addBatch } = useBatchStore();
  const { products } = useInventoryStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning' | 'expired'>('all');

  const stats = useMemo(() => getExpirationStats(), [batches]);

  // Función para generar datos de prueba
  const handleGenerateMockData = () => {
    if (batches.length > 0) {
      if (!confirm('Esto generará lotes de prueba. ¿Continuar?')) {
        return;
      }
    }

    // Generar lotes de demostración primero
    const demoBatches = generateDemoBatches(products);
    demoBatches.forEach((batch) => {
      addBatch(batch);
    });

    // Generar lotes adicionales
    const mockBatches = generateMockBatches(products);
    mockBatches.slice(0, 15).forEach((batch) => {
      addBatch(batch);
    });

    alert(`✅ Se generaron ${demoBatches.length + 15} lotes de prueba para productos perecederos`);
  };

  // Obtener alertas de caducidad con productos completos
  const expirationAlerts = useMemo(() => {
    const alerts = batches
      .filter((batch) => {
        if (batch.quantity <= 0 || batch.status === 'sold') return false;

        const daysLeft = getDaysUntilExpiration(batch.expirationDate);

        if (filterStatus === 'critical') {
          return daysLeft <= 3 && daysLeft >= 0;
        } else if (filterStatus === 'warning') {
          return daysLeft > 3 && daysLeft <= 7;
        } else if (filterStatus === 'expired') {
          return daysLeft < 0;
        }

        // 'all': mostrar todo lo que está en riesgo
        return daysLeft <= 15;
      })
      .map((batch) => {
        const product = products.find((p) => p.id === batch.productId);
        const daysLeft = getDaysUntilExpiration(batch.expirationDate);

        return {
          batch,
          product,
          daysLeft,
        };
      })
      .filter((alert) => alert.product !== undefined)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return alerts;
  }, [batches, products, filterStatus]);

  // Productos con lotes próximos a vencer
  const productsWithBatches = useMemo(() => {
    const productMap = new Map<string, { product: Product; batches: ProductBatch[] }>();

    batches.forEach((batch) => {
      if (batch.quantity > 0 && batch.status !== 'sold' && batch.status !== 'expired') {
        const product = products.find((p) => p.id === batch.productId);
        if (product) {
          if (!productMap.has(product.id)) {
            productMap.set(product.id, { product, batches: [] });
          }
          productMap.get(product.id)!.batches.push(batch);
        }
      }
    });

    return Array.from(productMap.values());
  }, [batches, products]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Control de Caducidad
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestión de lotes y fechas de vencimiento - Sistema FEFO
            </p>
          </div>
          {batches.length === 0 && (
            <Button onClick={handleGenerateMockData} variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Datos de Prueba
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Lotes Activos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.activeBatches}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  de {stats.totalBatches} totales
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Críticos (≤3 días)</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.expiringIn3Days}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Requieren atención inmediata
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Próximos (≤7 días)</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.expiringIn7Days}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Priorizar venta
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor en Riesgo</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(stats.totalValueAtRisk)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pérdidas: {formatCurrency(stats.totalLosses)}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar:
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'primary' : 'secondary'}
              size="sm"
            >
              Todos ({expirationAlerts.length})
            </Button>
            <Button
              onClick={() => setFilterStatus('critical')}
              variant={filterStatus === 'critical' ? 'primary' : 'secondary'}
              size="sm"
            >
              Críticos ({stats.expiringIn3Days})
            </Button>
            <Button
              onClick={() => setFilterStatus('warning')}
              variant={filterStatus === 'warning' ? 'primary' : 'secondary'}
              size="sm"
            >
              Próximos ({stats.expiringIn7Days})
            </Button>
            <Button
              onClick={() => setFilterStatus('expired')}
              variant={filterStatus === 'expired' ? 'primary' : 'secondary'}
              size="sm"
            >
              Caducados ({stats.expiredBatches})
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Alertas de Caducidad
                </h2>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>

              {expirationAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No hay alertas de caducidad
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Todos los lotes están en buen estado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expirationAlerts.map((alert) => {
                    const product = alert.product!;
                    const batch = alert.batch;
                    const statusColor = getBatchStatusColor(batch.status);
                    const statusLabel = getBatchStatusLabel(batch.status);
                    const urgencyMessage = getUrgencyMessage(alert.daysLeft);
                    const discount = getSuggestedDiscount(alert.daysLeft);

                    return (
                      <motion.div
                        key={batch.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {product.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Lote:
                                </span>
                                <span className="ml-1 font-mono text-gray-900 dark:text-white">
                                  {batch.batchNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Cantidad:
                                </span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {batch.quantity} {product.unit}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Caduca:
                                </span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {formatDaysLeft(alert.daysLeft)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-gray-700 dark:text-gray-300">
                                {urgencyMessage}
                              </div>
                              {discount > 0 && (
                                <Badge variant="warning">
                                  Descuento sugerido: {discount}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="ml-4">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Products with Batches Sidebar */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Productos con Lotes
              </h3>

              <div className="space-y-2">
                {productsWithBatches.map(({ product, batches: productBatches }) => {
                  const activeBatches = productBatches.filter(
                    (b) => b.quantity > 0 && b.status !== 'expired'
                  );
                  const nearestExpiration = activeBatches.sort((a, b) => {
                    const dateA = typeof a.expirationDate === 'string' ? new Date(a.expirationDate) : a.expirationDate;
                    const dateB = typeof b.expirationDate === 'string' ? new Date(b.expirationDate) : b.expirationDate;
                    return dateA.getTime() - dateB.getTime();
                  })[0];

                  const daysLeft = nearestExpiration
                    ? getDaysUntilExpiration(nearestExpiration.expirationDate)
                    : null;

                  return (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        selectedProduct?.id === product.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {activeBatches.length} lote{activeBatches.length !== 1 ? 's' : ''}{' '}
                            activo{activeBatches.length !== 1 ? 's' : ''}
                          </div>
                          {daysLeft !== null && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Próximo: {formatDaysLeft(daysLeft)}
                            </div>
                          )}
                        </div>
                        {nearestExpiration && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBatchStatusColor(
                              nearestExpiration.status
                            )}`}
                          >
                            {getBatchStatusLabel(nearestExpiration.status)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {productsWithBatches.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No hay productos con lotes activos
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedProduct.name}
                  </h2>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <span className="text-2xl text-gray-500 dark:text-gray-400">×</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <BatchManagement product={selectedProduct} />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
