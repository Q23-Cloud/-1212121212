import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, MathUtils, Mesh, Shape } from 'three';
import { ParticleData, ParticleType, TreeMorphState } from '../types';
import { COUNTS, COLORS, TREE_DIMENSIONS, SCATTER_RADIUS } from '../constants';
import { getTreePoint, getRandomSpherePoint } from '../utils/math';

interface TreeSystemProps {
  mode: TreeMorphState;
}

const tempObject = new Object3D();
const tempPos = new Vector3();

const TreeSystem: React.FC<TreeSystemProps> = ({ mode }) => {
  const needlesRef = useRef<InstancedMesh>(null);
  const goldOrnamentsRef = useRef<InstancedMesh>(null);
  const redOrnamentsRef = useRef<InstancedMesh>(null);
  const diamondsRef = useRef<InstancedMesh>(null);
  const lightsRef = useRef<InstancedMesh>(null);
  const starRef = useRef<Mesh>(null);

  // Generate Data
  const { needles, goldOrnaments, redOrnaments, diamonds, lights, starData } = useMemo(() => {
    const generateParticles = (count: number, type: ParticleType): ParticleData[] => {
      return Array.from({ length: count }).map((_, i) => {
        const normalizedIndex = i / count;
        return {
          id: i,
          type,
          scatterPosition: getRandomSpherePoint(SCATTER_RADIUS),
          treePosition: getTreePoint(normalizedIndex, type === 'NEEDLE' ? 1.5 : 1.0),
          scale: Math.random() * 0.5 + 0.5,
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
          speed: Math.random() * 2 + 1,
          phase: Math.random() * Math.PI * 2
        };
      });
    };

    return {
      needles: generateParticles(COUNTS.NEEDLES, 'NEEDLE'),
      goldOrnaments: generateParticles(COUNTS.ORNAMENTS_GOLD, 'ORNAMENT_GOLD'),
      redOrnaments: generateParticles(COUNTS.ORNAMENTS_RED, 'ORNAMENT_RED'),
      diamonds: generateParticles(COUNTS.ORNAMENTS_DIAMOND, 'ORNAMENT_DIAMOND'),
      lights: generateParticles(COUNTS.LIGHTS, 'LIGHT'),
      starData: {
        scatterPosition: getRandomSpherePoint(SCATTER_RADIUS),
        // Position exactly at top of tree + padding
        treePosition: new Vector3(0, TREE_DIMENSIONS.HEIGHT / 2 + 1.0, 0),
      }
    };
  }, []);

  // Create the Star Shape
  const { starShape, extrudeSettings } = useMemo(() => {
    const shape = new Shape();
    const points = 5;
    const outerRadius = 1.4;
    const innerRadius = 0.6;
    const angleStep = Math.PI / points;

    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = i * angleStep;
      // Rotate by PI/2 to point upwards
      const x = Math.cos(a + Math.PI / 2) * r;
      const y = Math.sin(a + Math.PI / 2) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    
    return {
      starShape: shape,
      extrudeSettings: {
        steps: 1,
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.2,
        bevelSegments: 3
      }
    };
  }, []);

  const progress = useRef(0);

  useFrame((state, delta) => {
    const target = mode === TreeMorphState.TREE_SHAPE ? 1 : 0;
    progress.current = MathUtils.damp(progress.current, target, 2, delta);

    const t = progress.current;
    const time = state.clock.elapsedTime;

    const updateMesh = (
      mesh: InstancedMesh | null, 
      data: ParticleData[], 
      baseScale: number,
      isLight: boolean = false
    ) => {
      if (!mesh) return;

      data.forEach((particle, i) => {
        tempPos.lerpVectors(particle.scatterPosition, particle.treePosition, t);
        
        if (t < 0.99) {
           const floatFactor = (1 - t) * 2;
           tempPos.y += Math.sin(time * particle.speed + particle.phase) * 0.1 * floatFactor;
           tempPos.x += Math.cos(time * 0.5 + particle.phase) * 0.1 * floatFactor;
        }

        tempObject.position.copy(tempPos);
        tempObject.rotation.set(
          particle.rotation[0] + time * 0.1 * (1 - t),
          particle.rotation[1] + time * 0.2 * (1 - t),
          particle.rotation[2]
        );

        let s = particle.scale * baseScale;
        if (isLight) {
          const twinkle = Math.sin(time * particle.speed * 3 + particle.phase);
          const intensity = MathUtils.mapLinear(twinkle, -1, 1, 0.4, 1.2);
          s *= intensity;
        }
        
        tempObject.scale.setScalar(s);
        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateMesh(needlesRef.current, needles, 0.5);
    updateMesh(goldOrnamentsRef.current, goldOrnaments, 0.7);
    updateMesh(redOrnamentsRef.current, redOrnaments, 0.8);
    updateMesh(diamondsRef.current, diamonds, 0.6);
    updateMesh(lightsRef.current, lights, 0.18, true);

    // Update Star
    if (starRef.current) {
        tempPos.lerpVectors(starData.scatterPosition, starData.treePosition, t);
        // Float when scattered
        if (t < 0.99) {
            tempPos.y += Math.sin(time) * 0.5 * (1 - t);
            starRef.current.rotation.x = time * 0.2;
            starRef.current.rotation.y = time * 0.3;
        } else {
             // Upright spin when formed
            starRef.current.rotation.x = 0;
            starRef.current.rotation.y = time * 0.5;
            starRef.current.rotation.z = 0;
        }
       
        starRef.current.position.copy(tempPos);

        // Scale up when forming
        const starScale = MathUtils.lerp(0.1, 1.5, t);
        starRef.current.scale.setScalar(starScale);
    }
  });

  return (
    <group>
      {/* Needles */}
      <instancedMesh ref={needlesRef} args={[undefined, undefined, COUNTS.NEEDLES]}>
        <coneGeometry args={[0.6, 1.8, 4]} />
        <meshStandardMaterial color={COLORS.EMERALD} roughness={0.8} metalness={0.1} />
      </instancedMesh>

      {/* Gold Ornaments */}
      <instancedMesh ref={goldOrnamentsRef} args={[undefined, undefined, COUNTS.ORNAMENTS_GOLD]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color={COLORS.GOLD_METAL} roughness={0.1} metalness={1} envMapIntensity={2} />
      </instancedMesh>

      {/* Red Ornaments */}
      <instancedMesh ref={redOrnamentsRef} args={[undefined, undefined, COUNTS.ORNAMENTS_RED]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshPhysicalMaterial color={COLORS.VELVET_RED} roughness={0.7} metalness={0.1} clearcoat={1} clearcoatRoughness={0.1} sheen={1} sheenColor={new Color(0xff5555)} />
      </instancedMesh>

      {/* Diamonds */}
      <instancedMesh ref={diamondsRef} args={[undefined, undefined, COUNTS.ORNAMENTS_DIAMOND]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={1} 
          roughness={0} 
          thickness={2} 
          envMapIntensity={3}
          clearcoat={1}
        />
      </instancedMesh>

      {/* Lights */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, COUNTS.LIGHTS]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color={COLORS.LIGHT_WARM} emissive={COLORS.LIGHT_WARM} emissiveIntensity={2} toneMapped={false} />
      </instancedMesh>

      {/* Top Star */}
      <mesh ref={starRef}>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
            color={COLORS.GOLD} 
            emissive={COLORS.GOLD} 
            emissiveIntensity={4} 
            toneMapped={false} 
            metalness={0.8}
            roughness={0.2}
        />
        {/* Center alignment fix for extruded geometry */}
        <group position={[0, 0, -0.2]} /> 
      </mesh>
    </group>
  );
};

export default TreeSystem;