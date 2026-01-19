import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Sparkles } from 'lucide-react';
import useAIStore from '../../store/aiStore';
import useInventoryStore from '../../store/inventoryStore';
import usePOSStore from '../../store/posStore';
import { processAgentMessage } from '../../utils/langGraphAgent';
import { generateAIResponse } from '../../utils/aiAssistant';
import Button from '../ui/Button';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [useRealAgent, setUseRealAgent] = useState(false); // Toggle entre real/simulado
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, clearMessages, isTyping, setTyping } = useAIStore();
  const { products } = useInventoryStore();
  const { transactions, customers } = usePOSStore();

  // Scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Agregar mensaje del usuario
    addMessage({
      role: 'user',
      content: userMessage,
    });

    // Mostrar indicador de typing
    setTyping(true);

    try {
      let response: string;

      if (useRealAgent) {
        // Preparar historial de conversación (últimos 10 mensajes para contexto)
        const conversationHistory = messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // Llamar al agente real de Claude con LangGraph
        response = await processAgentMessage(
          userMessage,
          { products, transactions, customers },
          conversationHistory
        );
      } else {
        // Usar asistente simulado (sin API)
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
        response = generateAIResponse(userMessage, products, transactions, customers);
      }

      // Agregar respuesta del asistente
      addMessage({
        role: 'assistant',
        content: response,
      });
    } catch (error: any) {
      console.error('Error calling agent:', error);

      // Si falla el agente real, cambiar automáticamente al simulado
      if (useRealAgent && error.message?.includes('credit balance')) {
        setUseRealAgent(false);
        addMessage({
          role: 'assistant',
          content: `⚠️ Tu cuenta de Anthropic no tiene créditos suficientes. He activado el modo simulado automáticamente.\n\nPara usar el agente real con Claude API:\n1. Ve a https://console.anthropic.com/settings/billing\n2. Agrega un método de pago\n3. Recarga la página y activa "Usar Agente Real"\n\nMientras tanto, puedo responderte con el asistente simulado. ¿En qué puedo ayudarte?`,
        });
      } else if (useRealAgent && error.message?.includes('No API key configured')) {
        setUseRealAgent(false);
        addMessage({
          role: 'assistant',
          content: `⚠️ No tienes una API Key configurada. El modo real requiere una API key de Anthropic.\n\nPara configurar tu API key:\n1. Ve a ⚙️ Configuración en el menú lateral\n2. Ingresa tu API key de Anthropic\n3. Activa el modo "🤖 Agente Real"\n\nMientras tanto, he activado el modo simulado. ¿En qué puedo ayudarte?`,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ Lo siento, hubo un error al procesar tu mensaje. ${error.message || 'Por favor intenta de nuevo.'}`,
        });
      }
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl z-50 hover:shadow-blue-500/50 transition-all duration-300"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ventana de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Asistente AI
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {useRealAgent ? 'Modo Real (Claude API)' : 'Modo Simulado'}
                    </p>
                    <button
                      onClick={() => setUseRealAgent(!useRealAgent)}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                        useRealAgent
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                      title="Cambiar entre modo real (Claude API) y simulado"
                    >
                      {useRealAgent ? '🤖 API' : '💭 Sim'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('¿Borrar todo el historial de chat?')) {
                      clearMessages();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Limpiar chat"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  variant="primary"
                  className="flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Presiona Enter para enviar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
