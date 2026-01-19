import { useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import useInventoryStore from '../store/inventoryStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProductModal from '../components/inventory/ProductModal';
import { formatPrice } from '../utils/format';
import type { Category, Product } from '../types';
import { CATEGORY_LABELS } from '../types';
import { getStockLevel } from '../utils/mockData';
import { generateMockProducts } from '../utils/mockData';

type SortField = 'name' | 'category' | 'currentStock' | 'price';
type SortDirection = 'asc' | 'desc';

export default function Inventory() {
  const { products, setProducts } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories: (Category | 'all')[] = ['all', 'bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      let compareA: any = a[sortField];
      let compareB: any = b[sortField];

      if (sortField === 'name' || sortField === 'category') {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRegenerateProducts = () => {
    if (confirm('¿Estás seguro de que quieres regenerar todos los productos? Esto eliminará los datos actuales.')) {
      setProducts(generateMockProducts(200));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Inventario Completo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredAndSortedProducts.length} producto
              {filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado
              {filteredAndSortedProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="secondary" onClick={handleRegenerateProducts}>
            Regenerar Productos
          </Button>
        </div>

        {/* Búsqueda y Filtros */}
        <Card className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
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
        </Card>

        {/* Tabla de Productos */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/60 dark:bg-gray-700/60 backdrop-blur-sm">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('name')}
                  >
                    Producto {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('category')}
                  >
                    Categoría {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('currentStock')}
                  >
                    Stock {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('price')}
                  >
                    Precio {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Consumo Diario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedProducts.map((product) => {
                  const level = getStockLevel(product);
                  const stockPercentage = (product.currentStock / product.maxStock);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-700/60 hover:backdrop-blur-sm cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">
                          {CATEGORY_LABELS[product.category]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {product.currentStock} / {product.maxStock}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                level === 'normal'
                                  ? 'bg-green-500'
                                  : level === 'low'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${stockPercentage * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={level}>
                          {level === 'out'
                            ? 'Agotado'
                            : level === 'critical'
                            ? 'Crítico'
                            : level === 'low'
                            ? 'Bajo'
                            : 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {product.avgDailyConsumption}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Producto */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
