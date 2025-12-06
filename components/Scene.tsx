import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Sparkles, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { MathUtils } from 'three';
import TreeSystem from './TreeSystem';
import PhotoGallery from './PhotoGallery';
import { TreeMorphState, UserPhoto, HandData } from '../types';
import { COLORS } from '../constants';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface SceneProps {
  mode: TreeMorphState;
  photos: UserPhoto[];
  handData: HandData;
}

// Internal component to handle camera logic
const CameraController: React.FC<{ handData: HandData; mode: TreeMorphState }> = ({ handData, mode }) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  const currentAzimuth = useRef(0);
  const currentPolar = useRef(Math.PI / 2.5);
  const currentDistance = useRef(40);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (handData.active) {
      // 1. ROTATION
      const targetAzimuth = (handData.x - 0.5) * Math.PI * 1.5; 
      const targetPolar = MathUtils.mapLinear(handData.y, 0, 1, Math.PI / 4, Math.PI / 1.8);

      // 2. ZOOM
      const clampedZ = MathUtils.clamp(handData.z, 0.1, 0.4);
      const targetDistance = MathUtils.mapLinear(clampedZ, 0.1, 0.4, 60, 20);

      const smoothing = 3 * delta;
      currentAzimuth.current = MathUtils.lerp(currentAzimuth.current, targetAzimuth, smoothing);
      currentPolar.current = MathUtils.lerp(currentPolar.current, targetPolar, smoothing);
      currentDistance.current = MathUtils.lerp(currentDistance.current, targetDistance, smoothing);

      controlsRef.current.setAzimuthalAngle(currentAzimuth.current);
      controlsRef.current.setPolarAngle(currentPolar.current);
      
      const camPos = controlsRef.current.object.position;
      camPos.setLength(currentDistance.current);
      
      controlsRef.current.update();
    } else {
      currentAzimuth.current = controlsRef.current.getAzimuthalAngle();
      currentPolar.current = controlsRef.current.getPolarAngle();
      currentDistance.current = controlsRef.current.getDistance();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      minPolarAngle={Math.PI / 4} 
      maxPolarAngle={Math.PI / 1.8}
      minDistance={15}
      maxDistance={70}
      autoRotate={!handData.active && mode === TreeMorphState.TREE_SHAPE}
      autoRotateSpeed={0.5}
      enableDamping={!handData.active}
      dampingFactor={0.05}
    />
  );
};

const Scene: React.FC<SceneProps> = ({ mode, photos, handData }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 45], fov: 45 }}
      gl={{ antialias: false, stencil: false, alpha: false }}
    >
      <color attach="background" args={[COLORS.BG_DARK]} />
      
      {/* --- Lighting Setup --- */}
      <ambientLight intensity={0.2} color="#ffddaa" />
      <spotLight 
        position={[20, 40, 20]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#ffd700" 
        castShadow 
      />
      <pointLight position={[-15, 10, -15]} intensity={1} color="#550000" />
      <pointLight position={[0, -10, 15]} intensity={0.5} color="#001133" />

      <Suspense fallback={null}>
        <Environment preset="city" blur={1} />
        
        {/* Centered Group: Moved from y=-10 to y=-2 to center the tree volume in screen */}
        <group position={[0, -2, 0]}>
          <TreeSystem mode={mode} />
          <PhotoGallery photos={photos} mode={mode} />
          <ContactShadows 
            opacity={0.6} 
            scale={50} 
            blur={2} 
            far={10} 
            resolution={256} 
            color="#000000" 
            position={[0, -13, 0]} // Shadow at the bottom of the tree
          />
        </group>

        <Sparkles 
          count={300} 
          scale={45} 
          size={5} 
          speed={0.4} 
          opacity={0.5} 
          color="#FFF"
        />
      </Suspense>

      <CameraController handData={handData} mode={mode} />

      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={0.5} 
          radius={0.2}
          kernelSize={KernelSize.LARGE}
        />
        <Noise opacity={0.025} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;