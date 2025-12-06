import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Image } from '@react-three/drei';
import { Group, Vector3, MathUtils } from 'three';
import { UserPhoto, TreeMorphState } from '../types';

interface PhotoGalleryProps {
  photos: UserPhoto[];
  mode: TreeMorphState;
}

const PhotoItem: React.FC<{ photo: UserPhoto; mode: TreeMorphState; index: number }> = ({ photo, mode, index }) => {
  const groupRef = useRef<Group>(null);
  const progress = useRef(0);
  
  // Calculate specific target position for photos on the tree
  // We place them in a spiral but slightly pushed out compared to ornaments
  // We use the ID or index to determine slot
  
  useFrame((state, delta) => {
    const target = mode === TreeMorphState.TREE_SHAPE ? 1 : 0;
    progress.current = MathUtils.damp(progress.current, target, 2, delta);
    
    if (groupRef.current) {
      const t = progress.current;
      const time = state.clock.elapsedTime;
      
      const currentPos = new Vector3().lerpVectors(photo.scatterPosition, photo.treePosition, t);
      
      // Add slight float
      currentPos.y += Math.sin(time * 0.5 + index) * 0.2;
      
      groupRef.current.position.copy(currentPos);
      
      // Rotate towards camera slightly or just spin slowly
      // When scattered: tumble
      // When tree: face outwards roughly
      
      const targetRotX = 0; // Upright
      const targetRotY = Math.atan2(photo.treePosition.x, photo.treePosition.z); // Face out from center
      const targetRotZ = Math.sin(time + index) * 0.1; // Gentle sway

      groupRef.current.rotation.x = MathUtils.lerp(photo.rotation[0] + time * 0.2, targetRotX, t);
      groupRef.current.rotation.y = MathUtils.lerp(photo.rotation[1] + time * 0.2, targetRotY, t);
      groupRef.current.rotation.z = MathUtils.lerp(photo.rotation[2], targetRotZ, t);
    }
  });

  return (
    <group ref={groupRef}>
      <Image 
        url={photo.url} 
        transparent 
        scale={[3, 3.6, 1]} // Aspect ratio of our canvas 500x600
        toneMapped={false}
      />
    </group>
  );
};

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, mode }) => {
  return (
    <group>
      {photos.map((photo, i) => (
        <PhotoItem key={photo.id} photo={photo} mode={mode} index={i} />
      ))}
    </group>
  );
};

export default PhotoGallery;
