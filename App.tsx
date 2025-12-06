import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import HandController from './components/HandController';
import { TreeMorphState, UserPhoto, HandData } from './types';
import { getTreePoint, getRandomSpherePoint } from './utils/math';
import { SCATTER_RADIUS } from './constants';

const App: React.FC = () => {
  // Start in TREE_SHAPE so the user sees the tree immediately
  const [mode, setMode] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [handData, setHandData] = useState<HandData>({ active: false, x: 0.5, y: 0.5, z: 0 });

  const handleImageUpload = (base64: string) => {
    const normalizedHeight = 0.2 + (Math.random() * 0.7);
    
    const newPhoto: UserPhoto = {
      id: uuidv4(),
      url: base64,
      scatterPosition: getRandomSpherePoint(SCATTER_RADIUS),
      // Use the improved math function implicitly via import
      treePosition: getTreePoint(normalizedHeight, 2.0),
      rotation: [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        0
      ]
    };
    
    // Push photo out to surface + random offset
    const distance = Math.sqrt(newPhoto.treePosition.x**2 + newPhoto.treePosition.z**2);
    const scaleOut = (distance + 2.0) / distance;
    newPhoto.treePosition.x *= scaleOut;
    newPhoto.treePosition.z *= scaleOut;

    setPhotos(prev => [...prev, newPhoto]);
  };

  // Hand Control Callbacks
  const handleGesture = useCallback((gesture: string) => {
    if (gesture === 'Open_Palm') {
      setMode(TreeMorphState.SCATTERED);
    } else if (gesture === 'Closed_Fist') {
      setMode(TreeMorphState.TREE_SHAPE);
    }
  }, []);

  const handleHandMove = useCallback((x: number, y: number, z: number) => {
    setHandData(prev => ({ ...prev, x, y, z }));
  }, []);

  const handleTrackingStatus = useCallback((active: boolean) => {
    setHandData(prev => ({ ...prev, active }));
  }, []);

  // Keyboard fallback for testing without camera
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setMode(prev => prev === TreeMorphState.TREE_SHAPE ? TreeMorphState.SCATTERED : TreeMorphState.TREE_SHAPE);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <Scene mode={mode} photos={photos} handData={handData} />
      <Overlay 
        mode={mode} 
        setMode={setMode} 
        onImageUpload={handleImageUpload} 
        handData={handData}
      />
      <HandController 
        onGesture={handleGesture}
        onMove={handleHandMove}
        onTrackingStatus={handleTrackingStatus}
      />
    </div>
  );
};

export default App;