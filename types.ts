import { Vector3 } from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export type ParticleType = 'NEEDLE' | 'ORNAMENT_GOLD' | 'ORNAMENT_RED' | 'ORNAMENT_DIAMOND' | 'LIGHT';

export interface ParticleData {
  id: number;
  type: ParticleType;
  scatterPosition: Vector3;
  treePosition: Vector3;
  scale: number;
  rotation: [number, number, number];
  speed: number; // For breathing/twinkle animation
  phase: number; // Random offset for animation
}

export interface UserPhoto {
  id: string;
  url: string; // Base64
  scatterPosition: Vector3;
  treePosition: Vector3;
  rotation: [number, number, number];
}

export interface HandData {
  active: boolean;
  x: number; // 0..1 (Horizontal rotation)
  y: number; // 0..1 (Vertical rotation)
  z: number; // 0..1 (Zoom/Depth proxy based on hand size)
}