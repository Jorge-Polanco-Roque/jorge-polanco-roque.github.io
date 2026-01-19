import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, TrendingUp, Package, Moon, Sun, Store, ShoppingCart, DollarSign, Users, Calendar } from 'lucide-react';
import useInventoryStore from '../../store/inventoryStore';

export default function Sidebar() {
  const { darkMode, toggleDarkMode } = useInventoryStore();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
    { to: '/sales', icon: DollarSign, label: 'Ventas' },
    { to: '/customers', icon: Users, label: 'Clientes' },
    { to: '/inventory', icon: Package, label: 'Inventario' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alertas' },
    { to: '/expiration', icon: Calendar, label: 'Caducidad' },
    { to: '/forecast', icon: TrendingUp, label: 'Pronósticos' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              La Tiendita
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              de la Esquina
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
        >
          {darkMode ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="font-medium">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="font-medium">Modo Oscuro</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
