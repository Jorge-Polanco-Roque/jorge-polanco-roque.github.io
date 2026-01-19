import type { Product, Category, StockLevel } from '../types';

// Nombres de productos por categoría
const PRODUCT_NAMES = {
  bebidas: ['Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Agua Mineral', 'Jugo Naranja', 'Jugo Manzana', 'Té Helado'],
  snacks: ['Papas Fritas', 'Doritos', 'Cheetos', 'Ruffles', 'Galletas Oreo', 'Chocolates', 'Cacahuates', 'Palomitas'],
  lacteos: ['Leche Entera', 'Leche Deslactosada', 'Yogurt Natural', 'Yogurt Fresa', 'Queso Panela', 'Crema', 'Mantequilla', 'Queso Amarillo'],
  panaderia: ['Pan Blanco', 'Pan Integral', 'Bolillo', 'Pan Dulce', 'Donas', 'Muffins', 'Croissant', 'Panqué'],
  enlatados: ['Atún', 'Sardinas', 'Frijoles', 'Chiles Jalapeños', 'Champiñones', 'Maíz', 'Chícharos', 'Sopa'],
  limpieza: ['Detergente', 'Cloro', 'Jabón', 'Shampoo', 'Papel Higiénico', 'Toallas', 'Limpiador', 'Desinfectante'],
};

const CATEGORIES: Category[] = ['bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

// Posiciones de las secciones en el espacio 3D
// Sincronizado con Store3DView.tsx
const SECTION_POSITIONS: Record<Category, { x: number; y: number; z: number }> = {
  bebidas: { x: -12, y: 0, z: -8 },
  snacks: { x: 0, y: 0, z: -8 },
  lacteos: { x: 12, y: 0, z: -8 },
  panaderia: { x: -12, y: 0, z: 8 },
  enlatados: { x: 0, y: 0, z: 8 },
  limpieza: { x: 12, y: 0, z: 8 },
};

/**
 * Determina el nivel de stock de un producto
 */
export function getStockLevel(product: Product): StockLevel {
  if (product.currentStock === 0) return 'out';

  const percentage = (product.currentStock / product.maxStock) * 100;

  if (percentage <= product.minStock) return 'critical';
  if (percentage <= 30) return 'low';
  return 'normal';
}

/**
 * Genera una posición 3D única para un producto dentro de su sección
 * SIN COLISIONES: Garantiza que ninguna caja ocupe el mismo espacio
 */
function generate3DPosition(
  category: Category,
  sectionIndex: number
): [number, number, number] {
  // Posición 3D en la estantería - SINCRONIZADA con ShelfSection.tsx
  const sectionPos = SECTION_POSITIONS[category];

  // DISTRIBUCIÓN SIN COLISIONES: 6 columnas × 4 estantes × 2 profundidades = 48 espacios únicos
  const COLS = 6;
  const ROWS = 4;
  const DEPTHS = 2;
  const MAX_PRODUCTS_PER_SECTION = COLS * ROWS * DEPTHS; // 48

  // Limitar sectionIndex para evitar colisiones (máximo 48 productos por sección)
  if (sectionIndex >= MAX_PRODUCTS_PER_SECTION) {
    // Si hay más de 48 productos, reutilizar posiciones (no ideal pero evita undefined)
    sectionIndex = sectionIndex % MAX_PRODUCTS_PER_SECTION;
  }

  // ALGORITMO DE MAPEO ÚNICO: garantiza que cada sectionIndex [0-47] → posición única
  const col = sectionIndex % COLS; // 0-5 (columna)
  const row = Math.floor((sectionIndex % (COLS * ROWS)) / COLS); // 0-3 (estante)
  const zRow = Math.floor(sectionIndex / (COLS * ROWS)); // 0-1 (profundidad)

  // IMPORTANTE: Estas alturas DEBEN coincidir con shelfHeights en ShelfSection.tsx
  const shelfHeights = [0, 1.5, 3, 4.5];
  const productHalfHeight = 0.3;
  const shelfLevels = shelfHeights.map(h => h + 0.08 + productHalfHeight);

  // Posición X: 6 columnas distribuidas uniformemente
  const xSpacing = 1.5;
  const xStart = -3.75;
  // Distribución: -3.75, -2.25, -0.75, 0.75, 2.25, 3.75

  // Posición Z: 2 filas de profundidad (frente/fondo)
  const zPositions = [-0.6, 0.6];

  const position: [number, number, number] = [
    sectionPos.x + col * xSpacing + xStart,
    shelfLevels[row],
    sectionPos.z + zPositions[zRow],
  ];

  return position;
}

/**
 * Genera productos mock para el inventario
 */
export function generateMockProducts(count: number = 200): Product[] {
  const products: Product[] = [];
  const MAX_PER_SECTION = 48; // 6 cols × 4 rows × 2 depths
  const productsPerCategory = Math.min(
    Math.floor(count / CATEGORIES.length),
    MAX_PER_SECTION
  );

  CATEGORIES.forEach((category) => {
    let sectionIndex = 0;

    for (let i = 0; i < productsPerCategory; i++) {
      const names = PRODUCT_NAMES[category];
      const baseName = names[Math.floor(Math.random() * names.length)];
      const variant = Math.floor(Math.random() * 10) + 1;
      const name = `${baseName} ${variant}`;

      const maxStock = Math.floor(Math.random() * 80) + 20;
      const minStock = Math.floor(maxStock * 0.2);
      const currentStock = Math.floor(Math.random() * maxStock);

      const price = parseFloat((Math.random() * 50 + 10).toFixed(2));

      const units = ['pza', 'kg', 'lt', 'caja', 'paquete'] as const;
      const unit = units[Math.floor(Math.random() * units.length)];

      const daysAgo = Math.floor(Math.random() * 30);
      const lastRestocked = new Date();
      lastRestocked.setDate(lastRestocked.getDate() - daysAgo);

      const avgDailyConsumption = Math.floor(Math.random() * 10) + 1;

      // Generar posición 3D sin colisiones
      const position = generate3DPosition(category, sectionIndex);
      sectionIndex++;

      products.push({
        id: `${category}-${i}`,
        name,
        category,
        currentStock,
        minStock,
        maxStock,
        price,
        unit,
        lastRestocked,
        avgDailyConsumption,
        position,
      });
    }
  });

  return products;
}
