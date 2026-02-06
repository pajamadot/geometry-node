import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * PhysicsIntegration - Helpers for physics calculations on geometry
 */
export class PhysicsIntegration {
  /**
   * Check intersection between two bounding boxes
   */
  static checkAABBIntersection(
    minA: pc.Vec3,
    maxA: pc.Vec3,
    minB: pc.Vec3,
    maxB: pc.Vec3
  ): boolean {
    return (
      minA.x <= maxB.x && maxA.x >= minB.x &&
      minA.y <= maxB.y && maxA.y >= minB.y &&
      minA.z <= maxB.z && maxA.z >= minB.z
    );
  }

  /**
   * Check if point is inside geometry bounds
   */
  static pointInBounds(point: pc.Vec3, geometry: EnhancedGeometryData): boolean {
    if (!geometry.bounds) return false;
    const { min, max } = geometry.bounds;
    return (
      point.x >= min.x && point.x <= max.x &&
      point.y >= min.y && point.y <= max.y &&
      point.z >= min.z && point.z <= max.z
    );
  }

  /**
   * Simple point in geometry check (using raycasting logic simplified)
   * Note: This is computationally expensive for complex meshes
   */
  static pointInGeometry(point: pc.Vec3, geometry: EnhancedGeometryData): boolean {
    if (!PhysicsIntegration.pointInBounds(point, geometry)) return false;
    
    // Fallback to bounds check for now as raycasting requires a raytracer implementation
    // or using the physics engine's collision system
    return true;
  }

  /**
   * Calculate approximate center of mass
   */
  static calculateCenterOfMass(geometry: EnhancedGeometryData): pc.Vec3 {
    const center = new pc.Vec3(0, 0, 0);
    if (!geometry.positionsArray) return center;

    const positions = geometry.positionsArray;
    const vertexCount = geometry.vertexCount;

    for (let i = 0; i < positions.length; i += 3) {
      center.x += positions[i];
      center.y += positions[i + 1];
      center.z += positions[i + 2];
    }

    if (vertexCount > 0) {
      center.mulScalar(1 / vertexCount);
    }

    return center;
  }

  /**
   * Apply forces to particles/vertices (Basic integration)
   */
  static applyForces(
    positions: Float32Array,
    velocities: Float32Array,
    forces: pc.Vec3[],
    deltaTime: number,
    damping: number = 0.98
  ): void {
    const vertexCount = positions.length / 3;
    
    // Aggregate force
    const totalForce = new pc.Vec3();
    forces.forEach(f => totalForce.add(f));

    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      
      // Update velocity: v = v + a * dt (assuming mass = 1)
      velocities[idx] += totalForce.x * deltaTime;
      velocities[idx+1] += totalForce.y * deltaTime;
      velocities[idx+2] += totalForce.z * deltaTime;

      // Apply damping
      velocities[idx] *= damping;
      velocities[idx+1] *= damping;
      velocities[idx+2] *= damping;

      // Update position: p = p + v * dt
      positions[idx] += velocities[idx] * deltaTime;
      positions[idx+1] += velocities[idx+1] * deltaTime;
      positions[idx+2] += velocities[idx+2] * deltaTime;
    }
  }
}

export interface PhysicsState {
  position: pc.Vec3;
  velocity: pc.Vec3;
  acceleration: pc.Vec3;
  mass: number;
}
