import { useMemo, useState } from 'react';
import type { Product, Category } from '../../types';
import { getStockLevel } from '../../utils/mockData';
import { useCursor } from '@react-three/drei';

interface ProductInstancesProps {
  products: Product[];
  category: Category;
  onProductClick: (product: Product) => void;
}

// Colores por nivel de stock
const STOCK_COLORS = {
  normal: '#10B981',   // verde
  low: '#F59E0B',      // amarillo
  critical: '#EF4444', // rojo
  out: '#6B7280',      // gris
};

export default function ProductInstances({ products, category, onProductClick }: ProductInstancesProps) {
  const categoryProducts = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category]
  );

  return (
    <group>
      {categoryProducts.map((product) => {
        const level = getStockLevel(product);
        const color = STOCK_COLORS[level];

        return (
          <ProductBox
            key={product.id}
            product={product}
            color={color}
            onClick={() => onProductClick(product)}
          />
        );
      })}
    </group>
  );
}

interface ProductBoxProps {
  product: Product;
  color: string;
  onClick: () => void;
}

function ProductBox({ product, color, onClick }: ProductBoxProps) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <mesh
      position={product.position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial
        color={color}
        emissive={hovered ? color : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}
