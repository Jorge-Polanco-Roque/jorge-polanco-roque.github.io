import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/format';
import { generateForecasts, getCategoryForecasts } from '../utils/forecast';
import { CATEGORY_LABELS } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getStockLevel } from '../utils/mockData';

export default function Forecast() {
  const { products } = useInventoryStore();
  const [forecastDays] = useState(30);

  const forecast = useMemo(() => generateForecasts(products, forecastDays), [products, forecastDays]);
  const categoryForecasts = useMemo(() => getCategoryForecasts(products), [products]);

  // Datos para la gráfica de pastel
  const chartData = Object.entries(categoryForecasts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      value: count,
    }));

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Pronósticos de Inventario
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {forecast.length} producto{forecast.length !== 1 ? 's' : ''} se agotará
              {forecast.length !== 1 ? 'n' : ''} en los próximos {forecastDays} días
            </p>
          </div>
        </div>

        {/* Gráfica por Categoría */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Pronósticos por Categoría
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Tabla de Pronósticos */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Productos Próximos a Agotarse
          </h2>

          {forecast.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sin pronósticos críticos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Todos los productos tienen stock suficiente para los próximos {forecastDays} días
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/60 dark:bg-gray-700/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Días Restantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha Estimada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {forecast.map((item) => {
                    const level = getStockLevel(item.product);

                    return (
                      <tr key={item.product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">
                            {CATEGORY_LABELS[item.product.category]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.product.currentStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={level}>
                            {item.daysUntilEmpty} días
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.estimatedEmptyDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
