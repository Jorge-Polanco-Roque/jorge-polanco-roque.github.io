import { ChatAnthropic } from '@langchain/anthropic';
import type { Product, Transaction, Customer } from '../types';
import {
  getInventoryStatus,
  getSalesData,
  getCustomerInfo,
  searchProducts,
  getRecommendations,
  analyzeTrends,
  predictDemand,
  generateReport,
} from './agentTools';
import {
  getSalesAssistantSuggestions,
  getInventoryOptimization,
  detectAnomalies,
  getPricingSuggestions,
  getCustomerInsights,
} from './advancedAgentTools';

// Get API configuration from environment
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const CLAUDE_MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = parseInt(import.meta.env.VITE_MAX_TOKENS || '4096');

if (!ANTHROPIC_API_KEY) {
  console.error('⚠️ VITE_ANTHROPIC_API_KEY not found in environment variables');
}

// Initialize Claude client
const model = new ChatAnthropic({
  anthropicApiKey: ANTHROPIC_API_KEY,
  modelName: CLAUDE_MODEL,
  maxTokens: MAX_TOKENS,
  temperature: 0.7,
});

// Tool definitions for Claude API
const tools = [
  {
    name: 'get_inventory_status',
    description: 'Obtiene el estado actual del inventario con filtros opcionales para categoría, nivel de stock o búsqueda. Retorna un resumen con estadísticas y lista de productos.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'],
          description: 'Filtrar por categoría específica',
        },
        stockLevel: {
          type: 'string',
          enum: ['critical', 'low', 'normal', 'out'],
          description: 'Filtrar por nivel de stock',
        },
        search: {
          type: 'string',
          description: 'Buscar productos por nombre',
        },
      },
    },
  },
  {
    name: 'get_sales_data',
    description: 'Obtiene datos de ventas y métricas para un período específico. Incluye ventas totales, número de transacciones, ticket promedio, distribución por método de pago y productos más vendidos.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'all'],
          description: 'Período de tiempo para el reporte (hoy, semana, mes, o todo)',
        },
      },
    },
  },
  {
    name: 'get_customer_info',
    description: 'Obtiene información de clientes con filtros opcionales. Puede buscar un cliente específico o filtrar por estado de crédito.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'ID del cliente específico a consultar',
        },
        hasCredit: {
          type: 'boolean',
          description: 'Filtrar clientes que tienen línea de crédito',
        },
        search: {
          type: 'string',
          description: 'Buscar clientes por nombre, teléfono o email',
        },
      },
    },
  },
  {
    name: 'search_products',
    description: 'Busca productos por nombre o categoría. Retorna lista de productos con stock, precio y nivel de inventario.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda para nombre o categoría',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados a retornar',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Genera recomendaciones de negocio incluyendo: productos que necesitan restock, productos más vendidos, y productos de lento movimiento.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'analyze_trends',
    description: 'Analiza tendencias de ventas durante un número específico de días. Incluye ventas diarias, crecimiento y promedios.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Número de días a analizar (por defecto 7)',
        },
      },
    },
  },
  {
    name: 'predict_demand',
    description: 'Predice la demanda y agotamiento de stock para productos. Puede analizar un producto específico o todos los productos críticos.',
    input_schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'ID del producto específico a analizar (opcional)',
        },
      },
    },
  },
  {
    name: 'generate_report',
    description: 'Genera reportes completos del negocio. Puede ser de inventario, ventas, clientes, o un reporte completo con todo.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['inventory', 'sales', 'customers', 'full'],
          description: 'Tipo de reporte a generar',
        },
      },
      required: ['type'],
    },
  },
  // Advanced Tools
  {
    name: 'get_sales_assistant_suggestions',
    description: 'Obtiene recomendaciones proactivas de productos basadas en patrones de compra y carrito actual. Sugiere productos complementarios que frecuentemente se compran juntos.',
    input_schema: {
      type: 'object',
      properties: {
        currentCart: {
          type: 'array',
          description: 'Productos actualmente en el carrito (opcional)',
        },
      },
    },
  },
  {
    name: 'get_inventory_optimization',
    description: 'Analiza niveles de inventario y proporciona recomendaciones de optimización con predicciones similares a ML. Identifica productos sobrestockeados, understockeados, y calcula stock óptimo.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'detect_anomalies',
    description: 'Detecta patrones inusuales en ventas, inventario y comportamiento de clientes. Identifica caídas de ventas, productos estancados, clientes de alto riesgo, y otros problemas potenciales.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_pricing_suggestions',
    description: 'Genera sugerencias de precios dinámicos basadas en demanda y niveles de stock. Identifica oportunidades para optimizar márgenes o promover productos de lento movimiento.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_customer_insights',
    description: 'Segmenta clientes y proporciona insights sobre valor de cliente y retención. Identifica clientes VIP, clientes en riesgo, y oportunidades de marketing.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

// Context for tools
interface AgentContext {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
}

// Execute tool based on name and input
function executeTool(toolName: string, toolInput: any, context: AgentContext): any {
  try {
    switch (toolName) {
      case 'get_inventory_status':
        return getInventoryStatus(context, toolInput);
      case 'get_sales_data':
        return getSalesData(context, toolInput?.period);
      case 'get_customer_info':
        return getCustomerInfo(context, toolInput);
      case 'search_products':
        return searchProducts(context, toolInput.query, toolInput?.limit);
      case 'get_recommendations':
        return getRecommendations(context);
      case 'analyze_trends':
        return analyzeTrends(context, toolInput?.days || 7);
      case 'predict_demand':
        return predictDemand(context, toolInput?.productId);
      case 'generate_report':
        return generateReport(context, toolInput.type);
      // Advanced tools
      case 'get_sales_assistant_suggestions':
        return getSalesAssistantSuggestions(context, toolInput?.currentCart);
      case 'get_inventory_optimization':
        return getInventoryOptimization(context);
      case 'detect_anomalies':
        return detectAnomalies(context);
      case 'get_pricing_suggestions':
        return getPricingSuggestions(context);
      case 'get_customer_insights':
        return getCustomerInsights(context);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: `Error ejecutando la herramienta: ${error}` };
  }
}

// System prompt for the agent
const SYSTEM_PROMPT = `Eres un asistente inteligente y proactivo para "La Tiendita de la Esquina", un sistema de punto de venta para pequeños comercios.

Tu trabajo es ayudar al dueño de la tienda a:
📦 **Gestión de Inventario:**
- Consultar estado del inventario con filtros avanzados
- Optimizar niveles de stock con predicciones ML-like
- Predecir demanda y necesidades futuras
- Detectar productos sobrestockeados o understockeados

💰 **Análisis de Ventas:**
- Analizar ventas y tendencias por período
- Identificar productos más vendidos y de lento movimiento
- Sugerir precios dinámicos basados en demanda
- Detectar anomalías en patrones de venta

👥 **Gestión de Clientes:**
- Segmentar clientes (VIP, Leales, En Riesgo, Nuevos)
- Proporcionar insights de valor de cliente
- Identificar clientes con alto uso de crédito
- Sugerir estrategias de retención

🤖 **Capacidades Avanzadas:**
- Sugerir productos complementarios (cross-selling)
- Detectar anomalías automáticamente
- Generar reportes completos de negocio
- Proporcionar recomendaciones proactivas

Características importantes:
✅ Siempre usa las herramientas disponibles para obtener datos reales y actualizados
✅ Sé conciso pero informativo - respuestas de 3-5 párrafos máximo
✅ Usa formato claro con listas, bullets o tablas
✅ Proporciona insights accionables y próximos pasos
✅ Sé PROACTIVO - si detectas problemas, menciónalos sin que te pregunten
✅ Usa herramientas avanzadas para análisis profundos
✅ Habla en español de manera natural y amigable

Formato de respuestas:
📊 Usa emojis para mejor visualización (📦 💰 ⚠️ ✅ 🎯 📈 💡 ⭐)
📋 Organiza información con bullets o numeración
💯 Destaca números importantes con formato claro
🎯 Termina con 2-3 recomendaciones accionables concretas

Cuando el usuario pregunte algo general como "¿cómo va mi negocio?", usa múltiples herramientas para dar un análisis completo:
1. Detecta anomalías primero
2. Analiza tendencias de ventas
3. Revisa optimización de inventario
4. Proporciona insights de clientes
5. Sugiere 3-5 acciones prioritarias`;

/**
 * Process a user message through the Claude agent with tool use
 */
export async function processAgentMessage(
  userMessage: string,
  context: AgentContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    // Build messages array WITHOUT system prompt (it's already bound to model)
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    // Bind tools to the model
    const modelWithTools = model.bindTools(tools);

    // Make initial API call with tools and system prompt
    let response = await modelWithTools.invoke(messages, {
      system: SYSTEM_PROMPT,
    });

    // Handle tool calls in a loop (agent may make multiple tool calls)
    let iterationCount = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (response.tool_calls && response.tool_calls.length > 0 && iterationCount < maxIterations) {
      iterationCount++;

      // Execute all tool calls
      const toolResults = response.tool_calls.map((toolCall: any) => {
        const result = executeTool(toolCall.name, toolCall.args, context);
        return {
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result, null, 2),
        };
      });

      // Add assistant response and tool results to conversation
      // Convert content to string for message history
      let contentStr = '';
      if (typeof response.content === 'string') {
        contentStr = response.content;
      } else if (Array.isArray(response.content)) {
        const textBlocks = response.content.filter((block: any) => block.type === 'text');
        contentStr = textBlocks.map((block: any) => block.text).join('\n');
      }

      messages.push({
        role: 'assistant',
        content: contentStr || '[tool calls]',
      });

      messages.push({
        role: 'user' as const,
        content: toolResults.map(tr => tr.content).join('\n\n'),
      });

      // Get next response from Claude with tool results
      response = await modelWithTools.invoke(messages, {
        system: SYSTEM_PROMPT,
      });
    }

    // Extract final text response
    if (typeof response.content === 'string') {
      return response.content;
    } else if (Array.isArray(response.content)) {
      // Filter out tool_use blocks and concatenate text blocks
      const textBlocks = response.content.filter((block: any) => block.type === 'text');
      return textBlocks.map((block: any) => block.text).join('\n');
    } else if (response.content && typeof response.content === 'object' && 'text' in response.content) {
      return (response.content as any).text;
    } else {
      return String(response.content || '');
    }
  } catch (error: any) {
    console.error('Error in agent processing:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('API key')) {
      return '❌ Error: La API key de Claude no está configurada correctamente. Por favor verifica tu archivo .env';
    } else if (error.message?.includes('rate limit')) {
      return '⚠️ Se ha alcanzado el límite de llamadas a la API. Por favor intenta de nuevo en unos momentos.';
    } else if (error.message?.includes('timeout')) {
      return '⏱️ La solicitud tardó demasiado tiempo. Por favor intenta de nuevo.';
    } else {
      return `❌ Lo siento, ocurrió un error al procesar tu mensaje: ${error.message}`;
    }
  }
}

/**
 * Simple wrapper for single message (without conversation history)
 */
export async function askAgent(
  question: string,
  products: Product[],
  transactions: Transaction[],
  customers: Customer[]
): Promise<string> {
  return processAgentMessage(
    question,
    { products, transactions, customers },
    []
  );
}
