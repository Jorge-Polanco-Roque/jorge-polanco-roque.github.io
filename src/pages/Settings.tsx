import { Settings as SettingsIcon, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import ApiKeySettings from '../components/ai/ApiKeySettings';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configuración
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Ajustes y configuración del sistema
          </p>
        </div>

        {/* Info Banner */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Acerca del Asistente AI</p>
              <p>
                El asistente tiene dos modos: <strong>Simulado</strong> (gratuito, respuestas
                básicas) y <strong>Real</strong> (con Claude API, respuestas avanzadas con
                herramientas). Para usar el modo real, necesitas configurar tu propia API key de
                Anthropic.
              </p>
            </div>
          </div>
        </Card>

        {/* API Key Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Asistente AI
          </h2>
          <ApiKeySettings />
        </div>

        {/* Other Settings Sections (Future) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Otras Configuraciones
          </h2>
          <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Más opciones de configuración próximamente...
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
