import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductBatch, ExpirationAlert, ExpirationStats, BatchStatus } from '../types';

interface BatchStore {
  // State
  batches: ProductBatch[];

  // Actions - CRUD de lotes
  addBatch: (batch: Omit<ProductBatch, 'id' | 'status' | 'receivedDate'>) => void;
  updateBatch: (id: string, updates: Partial<ProductBatch>) => void;
  deleteBatch: (id: string) => void;
  consumeFromBatch: (batchId: string, quantity: number) => void;

  // Computed - Obtener información
  getBatchesByProduct: (productId: string) => ProductBatch[];
  getActiveBatchesByProduct: (productId: string) => ProductBatch[];
  getExpirationAlerts: () => ExpirationAlert[];
  getExpirationStats: () => ExpirationStats;
  getBatchStatus: (batch: ProductBatch) => BatchStatus;

  // Utilidades
  updateBatchStatuses: () => void;
  markBatchAsSold: (batchId: string) => void;
  markBatchAsExpired: (batchId: string) => void;
}

// Calcular días hasta la caducidad
function getDaysUntilExpiration(expirationDate: Date): number {
  const now = new Date();
  const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Determinar el estado del lote según días restantes
function calculateBatchStatus(expirationDate: Date, quantity: number): BatchStatus {
  if (quantity <= 0) return 'sold';

  const daysLeft = getDaysUntilExpiration(expirationDate);

  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'critical';
  if (daysLeft <= 7) return 'warning';
  return 'active';
}

const useBatchStore = create<BatchStore>()(
  persist(
    (set, get) => ({
      // Initial State
      batches: [],

      // Actions
      addBatch: (batchData) => {
        const newBatch: ProductBatch = {
          ...batchData,
          id: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          receivedDate: new Date(),
          status: calculateBatchStatus(batchData.expirationDate, batchData.quantity),
        };

        set((state) => ({
          batches: [...state.batches, newBatch],
        }));
      },

      updateBatch: (id, updates) => {
        set((state) => ({
          batches: state.batches.map((batch) => {
            if (batch.id === id) {
              const updatedBatch = { ...batch, ...updates };
              // Recalcular estado si cambia cantidad o fecha
              if (updates.quantity !== undefined || updates.expirationDate !== undefined) {
                updatedBatch.status = calculateBatchStatus(
                  updatedBatch.expirationDate,
                  updatedBatch.quantity
                );
              }
              return updatedBatch;
            }
            return batch;
          }),
        }));
      },

      deleteBatch: (id) => {
        set((state) => ({
          batches: state.batches.filter((batch) => batch.id !== id),
        }));
      },

      consumeFromBatch: (batchId, quantity) => {
        set((state) => ({
          batches: state.batches.map((batch) => {
            if (batch.id === batchId) {
              const newQuantity = Math.max(0, batch.quantity - quantity);
              return {
                ...batch,
                quantity: newQuantity,
                status: calculateBatchStatus(batch.expirationDate, newQuantity),
              };
            }
            return batch;
          }),
        }));
      },

      // Computed Getters
      getBatchesByProduct: (productId) => {
        const batches = get().batches;
        return batches
          .filter((batch) => batch.productId === productId)
          .sort((a, b) => {
            // Ordenar por fecha de caducidad (FEFO)
            const dateA = typeof a.expirationDate === 'string' ? new Date(a.expirationDate) : a.expirationDate;
            const dateB = typeof b.expirationDate === 'string' ? new Date(b.expirationDate) : b.expirationDate;
            return dateA.getTime() - dateB.getTime();
          });
      },

      getActiveBatchesByProduct: (productId) => {
        return get()
          .getBatchesByProduct(productId)
          .filter((batch) => batch.quantity > 0 && batch.status !== 'expired' && batch.status !== 'sold');
      },

      getExpirationAlerts: () => {
        const batches = get().batches;
        const alerts: ExpirationAlert[] = [];

        batches.forEach((batch) => {
          if (batch.quantity <= 0 || batch.status === 'sold') return;

          const daysLeft = getDaysUntilExpiration(batch.expirationDate);
          const status = calculateBatchStatus(batch.expirationDate, batch.quantity);

          if (status === 'expired' || status === 'critical' || status === 'warning') {
            let priority = 3;
            let message = '';
            let suggestedDiscount = 0;

            if (status === 'expired') {
              priority = 1;
              message = `Lote ${batch.batchNumber} CADUCADO`;
              suggestedDiscount = 0; // No se puede vender
            } else if (status === 'critical') {
              priority = 1;
              message = `Lote ${batch.batchNumber} vence en ${daysLeft} día(s) - URGENTE`;
              suggestedDiscount = 30;
            } else if (status === 'warning') {
              priority = 2;
              message = `Lote ${batch.batchNumber} vence en ${daysLeft} días`;
              suggestedDiscount = 20;
            }

            alerts.push({
              id: `exp-alert-${batch.id}`,
              batch,
              product: {} as any, // Se llenará con el producto completo en el componente
              daysUntilExpiration: daysLeft,
              status,
              message,
              priority,
              suggestedDiscount,
            });
          }
        });

        return alerts.sort((a, b) => a.priority - b.priority);
      },

      getExpirationStats: () => {
        const batches = get().batches;

        const stats: ExpirationStats = {
          totalBatches: batches.length,
          activeBatches: 0,
          expiredBatches: 0,
          expiringIn3Days: 0,
          expiringIn7Days: 0,
          expiringIn15Days: 0,
          totalValueAtRisk: 0,
          totalLosses: 0,
        };

        batches.forEach((batch) => {
          const daysLeft = getDaysUntilExpiration(batch.expirationDate);

          if (batch.status === 'expired') {
            stats.expiredBatches++;
            if (batch.purchasePrice) {
              stats.totalLosses += batch.quantity * batch.purchasePrice;
            }
          } else if (batch.quantity > 0) {
            stats.activeBatches++;

            if (daysLeft <= 3) {
              stats.expiringIn3Days++;
              if (batch.purchasePrice) {
                stats.totalValueAtRisk += batch.quantity * batch.purchasePrice;
              }
            } else if (daysLeft <= 7) {
              stats.expiringIn7Days++;
              if (batch.purchasePrice) {
                stats.totalValueAtRisk += batch.quantity * batch.purchasePrice;
              }
            } else if (daysLeft <= 15) {
              stats.expiringIn15Days++;
            }
          }
        });

        return stats;
      },

      getBatchStatus: (batch) => {
        return calculateBatchStatus(batch.expirationDate, batch.quantity);
      },

      // Utilidades
      updateBatchStatuses: () => {
        set((state) => ({
          batches: state.batches.map((batch) => ({
            ...batch,
            status: calculateBatchStatus(batch.expirationDate, batch.quantity),
          })),
        }));
      },

      markBatchAsSold: (batchId) => {
        get().updateBatch(batchId, { status: 'sold', quantity: 0 });
      },

      markBatchAsExpired: (batchId) => {
        get().updateBatch(batchId, { status: 'expired' });
      },
    }),
    {
      name: 'batch-storage',
      // Convertir fechas de string a Date al cargar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.batches = state.batches.map((batch) => ({
            ...batch,
            expirationDate:
              typeof batch.expirationDate === 'string'
                ? new Date(batch.expirationDate)
                : batch.expirationDate,
            manufactureDate:
              batch.manufactureDate && typeof batch.manufactureDate === 'string'
                ? new Date(batch.manufactureDate)
                : batch.manufactureDate,
            receivedDate:
              typeof batch.receivedDate === 'string'
                ? new Date(batch.receivedDate)
                : batch.receivedDate,
          }));
          // Actualizar estados después de rehidratar
          state.updateBatchStatuses();
        }
      },
    }
  )
);

export default useBatchStore;
