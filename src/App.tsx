import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Forecast from './pages/Forecast';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import AIChat from './components/ai/AIChat';
import useInventoryStore from './store/inventoryStore';

function App() {
  const { darkMode } = useInventoryStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Sidebar />
        <main className="pl-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </main>

        {/* Asistente AI flotante */}
        <AIChat />
      </div>
    </Router>
  );
}

export default App;
