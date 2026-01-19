import { useState } from 'react';
import { RefreshCw, Receipt } from 'lucide-react';
import usePOSStore from '../store/posStore';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function SalesSimple() {
  const { transactions, initializeMockData } = usePOSStore();
  const { products } = useInventoryStore();
  const [loading, setLoading] = useState(false);

  const handleGenerateMockData = () => {
    if (confirm('¿Generar datos de prueba? Esto agregará 100 transacciones y 30 clientes de ejemplo.')) {
      setLoading(true);
      try {
        initializeMockData(products);
        setTimeout(() => {
          setLoading(false);
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error generando datos:', error);
        setLoading(false);
        alert('Error al generar datos. Revisa la consola.');
      }
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Ventas y Reportes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis detallado de tus transacciones
          </p>
        </div>

        {/* Content */}
        {transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No hay transacciones aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Genera datos de prueba para ver reportes y análisis de ventas.
              </p>
              <Button
                variant="primary"
                onClick={handleGenerateMockData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generando...' : 'Generar Datos de Prueba'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Transacciones: {transactions.length}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Se encontraron {transactions.length} transacciones en el sistema.
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Recarga la página para ver los reportes completos.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
