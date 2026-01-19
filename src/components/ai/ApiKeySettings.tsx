import { useState } from 'react';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hasKey = localStorage.getItem('anthropic_api_key');

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleClear = () => {
    if (confirm('¿Estás seguro de eliminar la API key?')) {
      localStorage.removeItem('anthropic_api_key');
      setApiKey('');
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de API Key
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            API Key de Anthropic para el asistente AI
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Seguridad de tu API Key:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Tu API key se guarda <strong>solo en tu navegador</strong> (localStorage)</li>
                <li>Nunca se envía a ningún servidor excepto a Anthropic</li>
                <li>Nadie más puede acceder a tu key</li>
                <li>Puedes eliminarla en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Anthropic API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={!apiKey.trim()}
            className="flex-1"
          >
            {hasKey ? 'Actualizar API Key' : 'Guardar API Key'}
          </Button>
          {hasKey && (
            <Button onClick={handleClear} variant="secondary">
              Eliminar
            </Button>
          )}
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">API Key guardada exitosamente</span>
            </div>
          </div>
        )}

        {/* How to get API Key */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            ¿Cómo obtener una API Key?
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              Ve a{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                console.anthropic.com/settings/keys
              </a>
            </li>
            <li>Crea una nueva API key</li>
            <li>Copia la key (empieza con "sk-ant-api03-...")</li>
            <li>Pégala aquí y guárdala</li>
          </ol>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Estado:</span>
            <span
              className={`font-medium ${
                hasKey
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-500'
              }`}
            >
              {hasKey ? '✓ API Key configurada' : '✗ Sin API Key (usando modo simulado)'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
