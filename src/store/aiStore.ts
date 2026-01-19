import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIStore {
  messages: Message[];
  isTyping: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setTyping: (typing: boolean) => void;
}

const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente virtual de La Tiendita. Puedo ayudarte con:\n\n• 📊 Consultas sobre inventario\n• 💰 Análisis de ventas\n• 📈 Recomendaciones de restock\n• 👥 Información de clientes\n• 📦 Estado de productos\n\n¿En qué puedo ayudarte hoy?',
          timestamp: new Date(),
        },
      ],
      isTyping: false,

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: Date.now().toString(),
              timestamp: new Date(),
            },
          ],
        })),

      clearMessages: () =>
        set({
          messages: [
            {
              id: '1',
              role: 'assistant',
              content: '¡Hola! Soy tu asistente virtual de La Tiendita. Puedo ayudarte con:\n\n• 📊 Consultas sobre inventario\n• 💰 Análisis de ventas\n• 📈 Recomendaciones de restock\n• 👥 Información de clientes\n• 📦 Estado de productos\n\n¿En qué puedo ayudarte hoy?',
              timestamp: new Date(),
            },
          ],
        }),

      setTyping: (typing) => set({ isTyping: typing }),
    }),
    {
      name: 'ai-chat-storage',
    }
  )
);

export default useAIStore;
