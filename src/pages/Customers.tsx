import { useState, useMemo } from 'react';
import { UserPlus, Search, Edit2, ShoppingBag, CreditCard, Phone, Mail, X, DollarSign, Receipt, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import usePOSStore from '../store/posStore';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import type { Customer } from '../types';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, transactions, initializeMockData } = usePOSStore();
  const { products } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    creditLimit: 0,
    currentCredit: 0,
  });

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        creditLimit: customer.creditLimit,
        currentCredit: customer.currentCredit,
      });
      setSelectedCustomer(customer);
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        creditLimit: 0,
        currentCredit: 0,
      });
      setSelectedCustomer(null);
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, formData);
    } else {
      addCustomer(formData);
    }

    setShowModal(false);
  };

  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const customerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions
      .filter(t => t.customerId === selectedCustomer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomer, transactions]);

  const getCustomerStats = (customer: Customer) => {
    const customerTrx = transactions.filter(t => t.customerId === customer.id && t.status === 'completed');
    const totalSpent = customerTrx.reduce((sum, t) => sum + t.total, 0);
    const totalPurchases = customerTrx.length;

    return { totalSpent, totalPurchases };
  };

  const handleGenerateMockData = () => {
    if (confirm('¿Generar datos de prueba? Esto agregará 100 transacciones y 30 clientes de ejemplo.')) {
      initializeMockData(products);
    }
  };

  // Empty state when no customers
  if (customers.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona tu base de clientes y créditos
            </p>
          </div>

          {/* Empty State */}
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Genera datos de prueba para ver análisis de clientes, o agrega tu primer cliente manualmente.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={handleGenerateMockData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generar Datos de Prueba
                </Button>
                <Button variant="secondary" onClick={() => handleOpenModal()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Cliente
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona tu base de clientes y créditos
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <UserPlus className="w-5 h-5 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Clientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {customers.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Con Crédito
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.creditLimit > 0).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Crédito Total Otorgado
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.creditLimit, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Crédito Usado
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.currentCredit, 0))}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente por nombre, teléfono o email..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
        </Card>

        {/* Customers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-12">
                <div className="text-center">
                  <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No hay clientes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Comienza agregando tu primer cliente
                  </p>
                  <Button onClick={() => handleOpenModal()}>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Agregar Cliente
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const stats = getCustomerStats(customer);
              const availableCredit = customer.creditLimit - customer.currentCredit;
              const creditUsagePercent = customer.creditLimit > 0
                ? (customer.currentCredit / customer.creditLimit) * 100
                : 0;

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </h3>
                          {customer.creditLimit > 0 && (
                            <Badge variant="success" className="text-xs">
                              Cliente con crédito
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Credit Info */}
                    {customer.creditLimit > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Crédito usado</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(customer.currentCredit)} / {formatCurrency(customer.creditLimit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              creditUsagePercent > 80
                                ? 'bg-red-500'
                                : creditUsagePercent > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Disponible: {formatCurrency(availableCredit)}
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Total Compras
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(stats.totalSpent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Visitas
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.totalPurchases}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowHistory(customer)}
                      className="w-full"
                    >
                      Ver Historial
                    </Button>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Add/Edit Customer Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="555-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="cliente@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Límite de Crédito
                    </label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  {selectedCustomer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Crédito Actual Usado
                      </label>
                      <input
                        type="number"
                        value={formData.currentCredit}
                        onChange={(e) => setFormData({ ...formData, currentCredit: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {selectedCustomer ? 'Guardar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer History Modal */}
        <AnimatePresence>
          {showHistoryModal && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Historial de {selectedCustomer.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {customerTransactions.length} transacciones
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {customerTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No hay transacciones
                    </p>
                  ) : (
                    customerTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                              {transaction.id}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(transaction.total)}
                            </p>
                            <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'}>
                              {transaction.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {transaction.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.quantity}x {item.product.name}
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
