import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Calendar, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import useBatchStore from '../../store/batchStore';
import type { Product, ProductBatch } from '../../types';
import {
  getDaysUntilExpiration,
  getBatchStatusColor,
  getBatchStatusLabel,
  formatDaysLeft,
  generateBatchNumber,
  calculateExpirationDate,
  isPerishableProduct,
  validateExpirationDate,
} from '../../utils/expirationUtils';
import { formatDate } from '../../utils/format';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

interface BatchManagementProps {
  product: Product;
}

export default function BatchManagement({ product }: BatchManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);

  const { batches, deleteBatch } = useBatchStore();
  const productBatches = batches
    .filter((b) => b.productId === product.id)
    .sort((a, b) => {
      const dateA = typeof a.expirationDate === 'string' ? new Date(a.expirationDate) : a.expirationDate;
      const dateB = typeof b.expirationDate === 'string' ? new Date(b.expirationDate) : b.expirationDate;
      return dateA.getTime() - dateB.getTime();
    });

  const handleAddBatch = () => {
    setEditingBatch(null);
    setIsAddModalOpen(true);
  };

  const handleEditBatch = (batch: ProductBatch) => {
    setEditingBatch(batch);
    setIsAddModalOpen(true);
  };

  const handleDeleteBatch = (batchId: string) => {
    if (confirm('¿Estás seguro de eliminar este lote?')) {
      deleteBatch(batchId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Lotes de {product.name}
          </h3>
        </div>
        {isPerishableProduct(product) && (
          <Button onClick={handleAddBatch} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar Lote
          </Button>
        )}
      </div>

      {!isPerishableProduct(product) && (
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Este producto no es perecedero. No requiere gestión de lotes.
          </p>
        </Card>
      )}

      {isPerishableProduct(product) && productBatches.length === 0 && (
        <Card className="p-8 text-center bg-gray-50 dark:bg-gray-800">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            No hay lotes registrados para este producto
          </p>
          <Button onClick={handleAddBatch} variant="primary" size="sm">
            Agregar Primer Lote
          </Button>
        </Card>
      )}

      {productBatches.length > 0 && (
        <div className="space-y-2">
          {productBatches.map((batch) => {
            const daysLeft = getDaysUntilExpiration(batch.expirationDate);
            const statusColor = getBatchStatusColor(batch.status);
            const statusLabel = getBatchStatusLabel(batch.status);

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                          {batch.batchNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Caducidad:</span>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatDate(batch.expirationDate)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDaysLeft(daysLeft)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Cantidad:
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {batch.quantity} {product.unit}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            de {batch.originalQuantity}
                          </div>
                        </div>

                        {batch.supplier && (
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Proveedor:
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {batch.supplier}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Recibido:
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(batch.receivedDate)}
                          </div>
                        </div>
                      </div>

                      {batch.notes && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                          {batch.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar lote"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Eliminar lote"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <BatchFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBatch(null);
        }}
        product={product}
        editingBatch={editingBatch}
      />
    </div>
  );
}

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  editingBatch: ProductBatch | null;
}

function BatchFormModal({ isOpen, onClose, product, editingBatch }: BatchFormModalProps) {
  const { addBatch, updateBatch } = useBatchStore();

  const [formData, setFormData] = useState({
    batchNumber: editingBatch?.batchNumber || generateBatchNumber(product.id),
    quantity: editingBatch?.quantity || 0,
    expirationDate: editingBatch?.expirationDate
      ? new Date(editingBatch.expirationDate).toISOString().split('T')[0]
      : calculateExpirationDate(product).toISOString().split('T')[0],
    manufactureDate: editingBatch?.manufactureDate
      ? new Date(editingBatch.manufactureDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    supplier: editingBatch?.supplier || '',
    purchasePrice: editingBatch?.purchasePrice || product.price * 0.6, // 60% del precio de venta
    notes: editingBatch?.notes || '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expDate = new Date(formData.expirationDate);
    const validation = validateExpirationDate(expDate);

    if (!validation.valid) {
      setValidationError(validation.message || 'Fecha de caducidad inválida');
      return;
    }

    if (editingBatch) {
      // Editar lote existente
      updateBatch(editingBatch.id, {
        batchNumber: formData.batchNumber,
        quantity: formData.quantity,
        expirationDate: expDate,
        manufactureDate: formData.manufactureDate ? new Date(formData.manufactureDate) : undefined,
        supplier: formData.supplier || undefined,
        purchasePrice: formData.purchasePrice || undefined,
        notes: formData.notes || undefined,
      });
    } else {
      // Agregar nuevo lote
      addBatch({
        productId: product.id,
        batchNumber: formData.batchNumber,
        quantity: formData.quantity,
        originalQuantity: formData.quantity,
        expirationDate: expDate,
        manufactureDate: formData.manufactureDate ? new Date(formData.manufactureDate) : undefined,
        supplier: formData.supplier || undefined,
        purchasePrice: formData.purchasePrice || undefined,
        notes: formData.notes || undefined,
      });
    }

    onClose();
    setValidationError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingBatch ? 'Editar Lote' : 'Agregar Nuevo Lote'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{validationError}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de Lote
          </label>
          <input
            type="text"
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cantidad ({product.unit})
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Fabricación
            </label>
            <input
              type="date"
              value={formData.manufactureDate}
              onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Caducidad *
            </label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proveedor
          </label>
          <input
            type="text"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Nombre del proveedor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio de Compra
          </label>
          <input
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Notas adicionales sobre el lote..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            {editingBatch ? 'Actualizar Lote' : 'Agregar Lote'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
