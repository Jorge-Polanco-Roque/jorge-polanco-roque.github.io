import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Product, Category } from '../../types';
import ShelfSection from './ShelfSection';
import ProductInstances from './ProductInstances';

interface Store3DViewProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

// Posiciones de las secciones (sincronizado con mockData.ts)
const SECTION_POSITIONS: Record<Category, [number, number, number]> = {
  bebidas: [-12, 0, -8],
  snacks: [0, 0, -8],
  lacteos: [12, 0, -8],
  panaderia: [-12, 0, 8],
  enlatados: [0, 0, 8],
  limpieza: [12, 0, 8],
};

const CATEGORIES: Category[] = ['bebidas', 'snacks', 'lacteos', 'panaderia', 'enlatados', 'limpieza'];

export default function Store3DView({ products, onProductClick }: Store3DViewProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden border border-gray-300/50 dark:border-gray-700/50">
      <Canvas
        camera={{
          position: [0, 15, 30],
          fov: 50,
        }}
        shadows
      >
        {/* Iluminación */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Piso */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#E5E7EB" />
        </mesh>

        {/* Secciones de estanterías */}
        {CATEGORIES.map((category) => (
          <ShelfSection
            key={category}
            position={SECTION_POSITIONS[category]}
          />
        ))}

        {/* Productos */}
        {CATEGORIES.map((category) => (
          <ProductInstances
            key={`products-${category}`}
            products={products}
            category={category}
            onProductClick={onProductClick}
          />
        ))}

        {/* Controles de cámara */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
