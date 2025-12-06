import { Vector3 } from 'three';
import { TREE_DIMENSIONS } from '../constants';

// Helper to get a random point inside a sphere
export const getRandomSpherePoint = (radius: number): Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper to get a point on a spiral cone (Tree shape) using Golden Angle
export const getTreePoint = (
  normalizedIndex: number, 
  jitter: number = 0.5
): Vector3 => {
  const { HEIGHT, RADIUS_BOTTOM } = TREE_DIMENSIONS;
  
  // y goes from -HEIGHT/2 to HEIGHT/2
  const y = (normalizedIndex - 0.5) * HEIGHT;
  
  // Cone radius at this height
  // Linear taper modified by power curve for slight bulge
  const radiusProgress = 1 - normalizedIndex; 
  const currentRadius = RADIUS_BOTTOM * Math.pow(radiusProgress, 0.9);
  
  // Golden Angle increment (Phyllotaxis)
  // This ensures perfect distribution without vertical "lines"
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.3999 radians
  const angle = normalizedIndex * 10000 * GOLDEN_ANGLE; // Multiply by large number to spread
  
  const x = Math.cos(angle) * currentRadius;
  const z = Math.sin(angle) * currentRadius;

  // Add some randomness so it's not too synthetic
  return new Vector3(
    x + (Math.random() - 0.5) * jitter,
    y + (Math.random() - 0.5) * jitter,
    z + (Math.random() - 0.5) * jitter
  );
};