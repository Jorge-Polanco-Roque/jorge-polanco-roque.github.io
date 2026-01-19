# 🏪 La Tiendita de la Esquina - Sistema POS

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema completo de Punto de Venta para pequeños comercios con IA integrada**

[Demo](#-características) · [Instalación](#-instalación) · [Documentación](#-documentación)

</div>

---

## 📋 Descripción

Sistema moderno de gestión de inventario y ventas diseñado específicamente para pequeñas tiendas de barrio. Incluye gestión completa de productos, punto de venta, análisis de ventas, predicción de demanda y un asistente de IA powered by Claude.

### 🎯 Características Principales

- **📦 Gestión de Inventario**
  - Control completo de productos con 6 categorías
  - Alertas automáticas de stock bajo/crítico/agotado
  - Sistema de restock con historial
  - Visualización 3D interactiva de la tienda

- **💰 Punto de Venta (POS)**
  - Carrito de compras intuitivo
  - Múltiples métodos de pago (efectivo, tarjeta, transferencia, crédito)
  - Descuentos por producto
  - Búsqueda rápida de productos
  - Impresión de tickets

- **👥 Gestión de Clientes**
  - Sistema de crédito para clientes frecuentes
  - Historial de compras
  - Productos favoritos
  - Segmentación automática (VIP, Leales, En Riesgo)

- **📊 Reportes y Análisis**
  - Dashboard con métricas en tiempo real
  - Análisis de ventas por período
  - Top productos más vendidos
  - Distribución por métodos de pago
  - Pronósticos de demanda con ML

- **🤖 Asistente AI (Claude)**
  - Dos modos: Real (Claude API) y Simulado
  - Análisis de inventario con herramientas avanzadas
  - Recomendaciones proactivas de negocio
  - Detección de anomalías
  - Sugerencias de precios dinámicos
  - Cross-selling inteligente

- **🎨 Experiencia de Usuario**
  - Modo oscuro/claro
  - Diseño responsive
  - Animaciones fluidas con Framer Motion
  - Interfaz moderna con Tailwind CSS
  - Datos persistentes en localStorage

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn
- (Opcional) API Key de Anthropic para el asistente AI real

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Jorge-Polanco-Roque/POS.git
cd POS
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tu API key (opcional):
```env
VITE_ANTHROPIC_API_KEY=tu-api-key-aqui
VITE_CLAUDE_MODEL=claude-3-5-sonnet-20241022
VITE_MAX_TOKENS=4096
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

---

## 📦 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Preview de la build de producción
npm run lint         # Ejecuta ESLint
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.3.1** - Framework UI
- **TypeScript 5.6.2** - Type safety
- **Vite 7.3.1** - Build tool & dev server
- **Tailwind CSS 3.4.17** - Estilos
- **Framer Motion 11.15.0** - Animaciones

### State Management
- **Zustand 5.0.2** - State management
- **Zustand Persist** - Persistencia en localStorage

### IA y Datos
- **@langchain/anthropic 0.3.14** - Integración con Claude
- **@langchain/core 0.3.28** - Core LangChain
- **Anthropic SDK** - Claude API

### Visualización 3D
- **Three.js 0.172.0** - Renderizado 3D
- **@react-three/fiber 8.18.3** - React renderer para Three.js
- **@react-three/drei 9.119.2** - Helpers para R3F

### Utilidades
- **Lucide React 0.469.0** - Iconos
- **React Router DOM 7.1.1** - Routing
- **Recharts** - Gráficas (futuro)

---

## 📖 Documentación

### Estructura del Proyecto

```
tiendita-inventory/
├── src/
│   ├── components/
│   │   ├── 3d/              # Componentes Three.js
│   │   ├── ai/              # Chatbot AI
│   │   ├── inventory/       # Gestión de inventario
│   │   ├── layout/          # Layout y navegación
│   │   └── ui/              # Componentes UI reutilizables
│   ├── pages/
│   │   ├── Dashboard.tsx    # Dashboard principal
│   │   ├── Inventory.tsx    # Gestión de inventario
│   │   ├── POS.tsx          # Punto de venta
│   │   ├── Sales.tsx        # Análisis de ventas
│   │   ├── Customers.tsx    # Gestión de clientes
│   │   ├── Alerts.tsx       # Alertas de stock
│   │   └── Forecast.tsx     # Pronósticos
│   ├── store/
│   │   ├── inventoryStore.ts # Estado de inventario
│   │   ├── posStore.ts       # Estado de POS
│   │   └── aiStore.ts        # Estado del chatbot
│   ├── utils/
│   │   ├── langGraphAgent.ts # Agente AI con LangGraph
│   │   ├── agentTools.ts     # Herramientas básicas
│   │   ├── advancedAgentTools.ts # Herramientas avanzadas
│   │   ├── aiAssistant.ts    # Asistente simulado
│   │   ├── mockData.ts       # Datos de prueba
│   │   ├── forecast.ts       # Predicción de demanda
│   │   └── format.ts         # Utilidades de formato
│   └── types/
│       └── index.ts          # Definiciones de tipos
├── public/
│   └── clear-storage.html    # Utilidad para limpiar localStorage
├── AGENTE_AI.md              # Documentación del agente
└── SISTEMA_COMPLETO.md       # Documentación completa
```

### Agente de IA

El asistente incluye **15 herramientas** para análisis de negocio:

#### Herramientas Básicas
- `get_inventory_status` - Estado del inventario
- `get_sales_data` - Datos de ventas
- `get_customer_info` - Información de clientes
- `search_products` - Búsqueda de productos
- `get_recommendations` - Recomendaciones
- `analyze_trends` - Análisis de tendencias
- `predict_demand` - Predicción de demanda
- `generate_report` - Reportes completos

#### Herramientas Avanzadas
- `get_sales_assistant_suggestions` - Cross-selling
- `get_inventory_optimization` - Optimización de stock
- `detect_anomalies` - Detección de anomalías
- `get_pricing_suggestions` - Sugerencias de precios
- `get_customer_insights` - Segmentación de clientes

Ver documentación completa en [AGENTE_AI.md](./AGENTE_AI.md)

---

## 🎮 Uso

### Primera Vez

Al iniciar por primera vez:
1. La app generará **200 productos de prueba** en 6 categorías
2. Se crearán **50 transacciones simuladas**
3. Se generarán **30 clientes de prueba**
4. Todos los datos se guardan en localStorage

### Limpiar Datos

Para resetear todos los datos: `http://localhost:5173/clear-storage.html`

### Asistente AI

El chatbot tiene dos modos:

- **💭 Modo Simulado** (por defecto)
  - Sin API, sin costo
  - Respuestas básicas
  - Perfecto para testing

- **🤖 Modo Real (Claude API)**
  - Requiere API key de Anthropic
  - Análisis avanzado con 15 herramientas
  - Conversacional y proactivo
  - Ver [AGENTE_AI.md](./AGENTE_AI.md) para setup

---

## 🔐 Seguridad

- ⚠️ **NUNCA** subas tu `.env` al repositorio
- Las API keys deben estar en `.env` (ya está en `.gitignore`)
- El archivo `.env.example` muestra las variables necesarias
- Para producción, usa variables de entorno del servidor

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

- [ ] Deploy a Vercel/Netlify
- [ ] Backend con API REST (Node.js/Express)
- [ ] Base de datos PostgreSQL/MongoDB
- [ ] Autenticación de usuarios
- [ ] Reportes PDF exportables
- [ ] Integración con impresoras de tickets
- [ ] App móvil con React Native
- [ ] Multi-tienda support
- [ ] Integración con WhatsApp Business

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Jorge Polanco Roque**

- GitHub: [@Jorge-Polanco-Roque](https://github.com/Jorge-Polanco-Roque)

---

## 🙏 Agradecimientos

- [Anthropic](https://www.anthropic.com/) por Claude API
- [Vite](https://vitejs.dev/) por el increíble dev experience
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Zustand](https://github.com/pmndrs/zustand) por el state management simple
- [Three.js](https://threejs.org/) por la visualización 3D

---

<div align="center">

**⭐ Si te gustó este proyecto, dale una estrella en GitHub ⭐**

Hecho con ❤️ y ☕ en México

</div>
