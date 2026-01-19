import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Receipt, User, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import usePOSStore from '../store/posStore';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/format';

export default function POS() {
  const { products } = useInventoryStore();
  const {
    cart,
    selectedCustomer,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    processTransaction,
    getCartTotal,
    customers,
    selectCustomer,
  } = usePOSStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [transactionNotes, setTransactionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const totals = getCartTotal();

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 50);

    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [products, searchQuery]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      const transactionId = await processTransaction(selectedPaymentMethod, transactionNotes);
      setSuccessMessage(`Venta completada: ${transactionId}`);
      setShowCheckoutModal(false);
      setTransactionNotes('');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: Banknote, color: 'green' },
    { value: 'card', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { value: 'transfer', label: 'Transferencia', icon: Smartphone, color: 'purple' },
    { value: 'credit', label: 'Crédito', icon: Receipt, color: 'orange' },
  ] as const;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Punto de Venta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de ventas rápido y eficiente
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-800 dark:text-green-200"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <Card className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar producto por nombre o código de barras..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
                  autoFocus
                />
              </div>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Stock: {product.currentStock} {product.unit}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cliente
                </h3>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  {selectedCustomer ? 'Cambiar' : 'Seleccionar'}
                </button>
              </div>
              {selectedCustomer ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Crédito disponible: {formatCurrency(selectedCustomer.creditLimit - selectedCustomer.currentCredit)}
                    </p>
                  </div>
                  <button
                    onClick={() => selectCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Sin cliente seleccionado
                </p>
              )}
            </Card>

            {/* Cart Items */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carrito ({cart.length})
              </h3>

              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    El carrito está vacío
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.product.price)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>IVA (16%):</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="flex-1"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={cart.length === 0}
                  className="flex-1"
                >
                  Cobrar
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Customer Selection Modal */}
        <AnimatePresence>
          {showCustomerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCustomerModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Seleccionar Cliente
                  </h2>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      selectCustomer(null);
                      setShowCustomerModal(false);
                    }}
                    className="w-full p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">Sin cliente</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Venta al público general</p>
                  </button>

                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        selectCustomer(customer);
                        setShowCustomerModal(false);
                      }}
                      className="w-full p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.phone || 'Sin teléfono'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Crédito disponible
                          </p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(customer.creditLimit - customer.currentCredit)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {customers.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No hay clientes registrados
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCheckoutModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Finalizar Venta
                  </h2>
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Total */}
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white">
                  <p className="text-sm opacity-90 mb-1">Total a pagar</p>
                  <p className="text-4xl font-bold">{formatCurrency(totals.total)}</p>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethod === method.value;
                      const isDisabled = method.value === 'credit' && !selectedCustomer;

                      return (
                        <button
                          key={method.value}
                          onClick={() => setSelectedPaymentMethod(method.value)}
                          disabled={isDisabled}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${
                            isSelected ? `text-${method.color}-600` : 'text-gray-400'
                          }`} />
                          <p className={`text-sm font-medium ${
                            isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {method.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                    placeholder="Agregar notas sobre esta venta..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? 'Procesando...' : 'Confirmar Venta'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
