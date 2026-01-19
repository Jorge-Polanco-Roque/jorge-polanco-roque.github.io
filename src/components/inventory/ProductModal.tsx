import { useState } from 'react';
import type { Product } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Package, TrendingUp, DollarSign, Calendar, AlertTriangle, ShoppingCart } from 'lucide-react';
import { getStockLevel } from '../../utils/mockData';
import { forecastDaysUntilEmpty } from '../../utils/forecast';
import useInventoryStore from '../../store/inventoryStore';
import { formatPrice, formatPercentage, formatDate } from '../../utils/format';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { restockProduct } = useInventoryStore();
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockAmount, setRestockAmount] = useState('');

  if (!product) return null;

  const stockLevel = getStockLevel(product);
  const stockPercentage = (product.currentStock / product.maxStock);
  const daysUntilEmpty = forecastDaysUntilEmpty(product);
  const totalValue = product.currentStock * product.price;

  const handleRestock = () => {
    setIsRestocking(true);
  };

  const handleConfirmRestock = () => {
    // TODO: En el futuro, usar 'amount' para restock parcial
    // const amount = parseInt(restockAmount) || product.maxStock;
    restockProduct(product.id);
    setIsRestocking(false);
    setRestockAmount('');
    onClose();
  };

  const daysSinceRestock = Math.floor(
    (new Date().getTime() - new Date(product.lastRestocked).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Modal isOpen={!!product} onClose={onClose} title="Detalles del Producto">
      <div className="space-y-6">
        {/* Header con nombre y badge */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              SKU: {product.id}
            </p>
          </div>
          <Badge variant={stockLevel}>
            {stockLevel === 'out'
              ? 'Agotado'
              : stockLevel === 'critical'
              ? 'Crítico'
              : stockLevel === 'low'
              ? 'Bajo'
              : 'Normal'}
          </Badge>
        </div>

        {/* Grid de métricas principales */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stock Actual */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Stock Actual
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.currentStock} <span className="text-base font-normal">/ {product.maxStock}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatPercentage(stockPercentage)} disponible
            </p>
          </div>

          {/* Valor Total */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Valor en Stock
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(totalValue)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatPrice(product.price)} por {product.unit}
            </p>
          </div>

          {/* Pronóstico */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Días Restantes
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {daysUntilEmpty === Infinity ? '∞' : daysUntilEmpty}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Consumo: {product.avgDailyConsumption}/{product.unit} al día
            </p>
          </div>

          {/* Último Restock */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Último Restock
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatDate(new Date(product.lastRestocked))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Hace{' '}
              {daysSinceRestock === 0
                ? 'hoy'
                : `${daysSinceRestock} día${daysSinceRestock !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Barra de stock visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nivel de Stock
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(stockPercentage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                stockLevel === 'normal'
                  ? 'bg-green-500'
                  : stockLevel === 'low'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${stockPercentage * 100}%` }}
            />
          </div>
        </div>

        {/* Alerta si está bajo */}
        {(stockLevel === 'critical' || stockLevel === 'low' || stockLevel === 'out') && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                {stockLevel === 'out' ? '¡Producto agotado!' : '¡Stock bajo!'}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {stockLevel === 'out'
                  ? 'Este producto está agotado. Solicita restock inmediatamente.'
                  : `Quedan solo ${product.currentStock} unidades. Se recomienda reabastecer pronto.`}
              </p>
            </div>
          </div>
        )}

        {/* Sección de Restock */}
        {!isRestocking ? (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleRestock}
              className="flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Solicitar Restock
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad a solicitar
              </label>
              <input
                type="number"
                min="1"
                max={product.maxStock}
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                placeholder={`Máximo: ${product.maxStock}`}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Costo estimado: {formatPrice((parseInt(restockAmount) || product.maxStock) * product.price)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={handleConfirmRestock}>
                Confirmar Solicitud
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRestocking(false);
                  setRestockAmount('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
