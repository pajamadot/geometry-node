import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';

export interface ParticleSystemParams {
  count?: number;
  lifeTime?: number;
  speed?: number;
  size?: number;
  color?: pc.Color;
  emissionRate?: number;
  bounds?: { min: pc.Vec3; max: pc.Vec3 };
}

/**
 * ParticleSystem - Basic particle system generator
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private params: ParticleSystemParams;

  constructor(params: ParticleSystemParams = {}) {
    this.params = {
      count: 100,
      lifeTime: 2.0,
      speed: 1.0,
      size: 0.1,
      color: new pc.Color(1, 1, 1),
      emissionRate: 10,
      bounds: { min: new pc.Vec3(-5, 0, -5), max: new pc.Vec3(5, 5, 5) },
      ...params
    };
  }

  /**
   * Update particle system state
   */
  update(deltaTime: number): EnhancedGeometryData {
    // Emit new particles
    this.emit(deltaTime);

    // Update existing particles
    this.particles.forEach(p => {
      p.life -= deltaTime;
      p.velocity.y += -9.8 * deltaTime; // Gravity
      
      // p.position += p.velocity * deltaTime
      const move = p.velocity.clone().mulScalar(deltaTime);
      p.position.add(move);
    });

    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);

    return this.buildGeometry();
  }

  private emit(deltaTime: number) {
    const countToEmit = Math.floor(this.params.emissionRate! * deltaTime);
    for (let i = 0; i < countToEmit; i++) {
      if (this.particles.length < this.params.count!) {
        this.particles.push(this.createParticle());
      }
    }
  }

  private createParticle(): Particle {
    return {
      position: this.getRandomPosition(),
      velocity: new pc.Vec3(
        (Math.random() - 0.5) * this.params.speed!,
        Math.random() * this.params.speed!,
        (Math.random() - 0.5) * this.params.speed!
      ),
      acceleration: new pc.Vec3(0, -9.8, 0),
      color: this.params.color!.clone(),
      life: this.params.lifeTime!,
      size: this.params.size!
    };
  }

  private getRandomPosition(): pc.Vec3 {
    const { min, max } = this.params.bounds!;
    return new pc.Vec3(
      min.x + Math.random() * (max.x - min.x),
      min.y + Math.random() * (max.y - min.y),
      min.z + Math.random() * (max.z - min.z)
    );
  }

  private buildGeometry(): EnhancedGeometryData {
    const positions: number[] = [];
    const colors: number[] = [];
    
    this.particles.forEach(p => {
      positions.push(p.position.x, p.position.y, p.position.z);
      colors.push(p.color.r, p.color.g, p.color.b, p.life / this.params.lifeTime!); // Fade out alpha
    });

    return {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map()
      },
      vertexCount: this.particles.length,
      faceCount: 0,
      positionsArray: new Float32Array(positions),
      colorsArray: new Float32Array(colors)
    };
  }

  /**
   * Static generator for simple point clouds
   */
  static random(count: number, bounds: { min: pc.Vec3; max: pc.Vec3 }): EnhancedGeometryData {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i*3] = bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x);
      positions[i*3+1] = bounds.min.y + Math.random() * (bounds.max.y - bounds.min.y);
      positions[i*3+2] = bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z);
    }

    return {
      vertices: [],
      faces: [],
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map()
      },
      vertexCount: count,
      faceCount: 0,
      positionsArray: positions
    };
  }
}

interface Particle {
  position: pc.Vec3;
  velocity: pc.Vec3;
  acceleration: pc.Vec3;
  color: pc.Color;
  life: number;
  size: number;
}
