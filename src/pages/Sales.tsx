import { useState, useMemo } from 'react';
import { Download, TrendingUp, DollarSign, ShoppingBag, Receipt, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import usePOSStore from '../store/posStore';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/format';

export default function Sales() {
  const { transactions, getSalesReport, initializeMockData } = usePOSStore();
  const { products } = useInventoryStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');

  const report = useMemo(() => {
    const data = getSalesReport(selectedPeriod);
    // Ensure report has default values
    return {
      totalSales: data?.totalSales || 0,
      totalTransactions: data?.totalTransactions || 0,
      averageTicket: data?.averageTicket || 0,
      salesByPaymentMethod: data?.salesByPaymentMethod || {},
      topProducts: data?.topProducts || [],
      transactions: data?.transactions || [],
      ...data
    };
  }, [selectedPeriod, getSalesReport]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (dateFilter.start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFilter.start));
    }
    if (dateFilter.end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateFilter.end));
    }
    if (paymentMethodFilter) {
      filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, paymentMethodFilter]);

  // Chart data
  const salesByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date).toISOString().split('T')[0];
        return transactionDate === day && t.status === 'completed';
      });

      const total = dayTransactions.reduce((sum, t) => sum + t.total, 0);
      const count = dayTransactions.length;

      return {
        date: new Date(day).toLocaleDateString('es-MX', { weekday: 'short' }),
        ventas: total,
        transacciones: count,
      };
    });
  }, [transactions]);

  const paymentMethodsData = useMemo(() => {
    const methods = [
      { name: 'Efectivo', value: 'cash', color: '#10b981' },
      { name: 'Tarjeta', value: 'card', color: '#3b82f6' },
      { name: 'Transferencia', value: 'transfer', color: '#8b5cf6' },
      { name: 'Crédito', value: 'credit', color: '#f59e0b' },
    ];

    return methods.map(method => ({
      ...method,
      amount: report.salesByPaymentMethod[method.value] || 0,
    })).filter(m => m.amount > 0);
  }, [report]);

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'credit': return 'Crédito';
      default: return method;
    }
  };

  const handleGenerateMockData = () => {
    if (confirm('¿Generar datos de prueba? Esto agregará 100 transacciones y 30 clientes de ejemplo.')) {
      initializeMockData(products);
    }
  };

  // Empty state when no transactions
  if (transactions.length === 0) {
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

          {/* Empty State */}
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No hay transacciones aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Genera datos de prueba para ver reportes y análisis de ventas, o realiza tu primera venta en el POS.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={handleGenerateMockData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generar Datos de Prueba
                </Button>
                <Button variant="secondary" onClick={() => window.location.href = '/pos'}>
                  Ir al POS
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Ventas y Reportes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis detallado de tus transacciones
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-3">
          {(['day', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {period === 'day' ? 'Hoy' : period === 'week' ? 'Esta Semana' : 'Este Mes'}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Ventas Totales
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.totalSales)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Transacciones
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {report.totalTransactions}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Ticket Promedio
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.averageTicket)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Productos Vendidos
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {report.topProducts.reduce((sum: number, p: { quantity: number }) => sum + p.quantity, 0)}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Tendencia de Ventas (7 días)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Ventas por Método de Pago
            </h2>
            {paymentMethodsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                No hay datos de ventas
              </div>
            )}
          </Card>
        </div>

        {/* Top Products */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Productos Más Vendidos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.topProducts.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Transactions List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historial de Transacciones
            </h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de Pago
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="credit">Crédito</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Método
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay transacciones
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {transaction.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {transaction.items.length} productos
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {paymentMethodLabel(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.total)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadgeColor(transaction.status)}>
                          {statusLabel(transaction.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
