import * as pc from 'playcanvas';

/**
 * GPUNoiseGenerator - GPU-accelerated noise generation
 */
export class GPUNoiseGenerator {
  // PlayCanvas doesn't strictly need a dedicated class for shader noise if using the node material system,
  // but for procedural textures, we can use shader chunks.

  static generateNoiseTexture(device: pc.GraphicsDevice, width: number, height: number): pc.Texture {
    const texture = new pc.Texture(device, {
        width,
        height,
        format: pc.PIXELFORMAT_RGBA8,
        mipmaps: false
    });
    
    // Fill with random noise for now (CPU fallback)
    const pixels = texture.lock();
    const count = width * height * 4;
    for(let i=0; i<count; i++) {
        pixels[i] = Math.floor(Math.random() * 255);
    }
    texture.unlock();
    
    return texture;
  }
}
