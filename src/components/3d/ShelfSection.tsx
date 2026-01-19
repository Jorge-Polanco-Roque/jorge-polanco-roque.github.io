import { useRef } from 'react';

interface ShelfSectionProps {
  position: [number, number, number];
}

export default function ShelfSection({ position }: ShelfSectionProps) {
  const groupRef = useRef<any>(null);

  // Dimensiones del estante
  const shelfWidth = 10;
  const shelfDepth = 2.4;
  const shelfThickness = 0.15;

  // Alturas de los estantes (4 niveles)
  const shelfHeights = [0, 1.5, 3, 4.5];

  return (
    <group ref={groupRef} position={position}>
      {/* Estantes horizontales */}
      {shelfHeights.map((height, index) => (
        <mesh key={`shelf-${index}`} position={[0, height, 0]}>
          <boxGeometry args={[shelfWidth, shelfThickness, shelfDepth]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      ))}

      {/* Soportes verticales (postes) */}
      {[-5, 5].map((x) => (
        <mesh key={`post-${x}`} position={[x, 3, 0]}>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}
    </group>
  );
}
