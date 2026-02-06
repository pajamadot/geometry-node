import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';
import { VertexDataUtils } from '../VertexDataUtils';

/**
 * AdvancedExporters - Handles exporting geometry to various formats
 */
export class AdvancedExporters {
  /**
   * Export to GLTF/GLB
   * Note: PlayCanvas doesn't have a built-in GLTF exporter in the engine runtime.
   * This would typically require a custom implementation or external library.
   * For now, we'll export a simple JSON representation or placeholder.
   */
  static async exportGLTF(
    geometry: EnhancedGeometryData,
    binary: boolean = true
  ): Promise<ArrayBuffer | string> {
    console.warn('GLTF Export not fully implemented for PlayCanvas runtime yet.');
    
    // Minimal JSON export as placeholder
    const exportData = {
      vertices: geometry.vertexCount,
      faces: geometry.faceCount,
      bounds: geometry.bounds
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export to OBJ format
   */
  static exportOBJ(geometry: EnhancedGeometryData): string {
    let output = '# Exported from Geometry Nodes\n';
    output += `o Geometry_${Date.now()}\n`;

    // Vertices
    const positions = geometry.positionsArray;
    if (positions) {
      for (let i = 0; i < positions.length; i += 3) {
        output += `v ${positions[i]} ${positions[i+1]} ${positions[i+2]}\n`;
      }
    }

    // Normals
    const normals = geometry.normalsArray;
    if (normals) {
      for (let i = 0; i < normals.length; i += 3) {
        output += `vn ${normals[i]} ${normals[i+1]} ${normals[i+2]}\n`;
      }
    }

    // UVs
    const uvs = geometry.uvsArray;
    if (uvs) {
      for (let i = 0; i < uvs.length; i += 2) {
        output += `vt ${uvs[i]} ${uvs[i+1]}\n`;
      }
    }

    // Faces
    const indices = geometry.indicesArray;
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] + 1;
        const b = indices[i+1] + 1;
        const c = indices[i+2] + 1;
        
        if (normals && uvs) {
          output += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
        } else if (normals) {
          output += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
        } else if (uvs) {
          output += `f ${a}/${a} ${b}/${b} ${c}/${c}\n`;
        } else {
          output += `f ${a} ${b} ${c}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Export to STL (Binary)
   */
  static exportSTL(geometry: EnhancedGeometryData): ArrayBuffer {
    if (!geometry.positionsArray || !geometry.indicesArray) {
      return new ArrayBuffer(0);
    }

    const indices = geometry.indicesArray;
    const positions = geometry.positionsArray;
    const faceCount = indices.length / 3;

    const bufferLength = 80 + 4 + (50 * faceCount);
    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);

    // Header (80 bytes) - skip
    // Face count (4 bytes)
    view.setUint32(80, faceCount, true);

    let offset = 84;
    const v1 = new pc.Vec3();
    const v2 = new pc.Vec3();
    const v3 = new pc.Vec3();
    const normal = new pc.Vec3();
    const edge1 = new pc.Vec3();
    const edge2 = new pc.Vec3();

    for (let i = 0; i < indices.length; i += 3) {
      const idx1 = indices[i] * 3;
      const idx2 = indices[i+1] * 3;
      const idx3 = indices[i+2] * 3;

      v1.set(positions[idx1], positions[idx1+1], positions[idx1+2]);
      v2.set(positions[idx2], positions[idx2+1], positions[idx2+2]);
      v3.set(positions[idx3], positions[idx3+1], positions[idx3+2]);

      // Calculate normal
      edge1.sub2(v2, v1);
      edge2.sub2(v3, v1);
      normal.cross(edge1, edge2).normalize();

      // Normal
      view.setFloat32(offset, normal.x, true);
      view.setFloat32(offset + 4, normal.y, true);
      view.setFloat32(offset + 8, normal.z, true);
      offset += 12;

      // Vertex 1
      view.setFloat32(offset, v1.x, true);
      view.setFloat32(offset + 4, v1.y, true);
      view.setFloat32(offset + 8, v1.z, true);
      offset += 12;

      // Vertex 2
      view.setFloat32(offset, v2.x, true);
      view.setFloat32(offset + 4, v2.y, true);
      view.setFloat32(offset + 8, v2.z, true);
      offset += 12;

      // Vertex 3
      view.setFloat32(offset, v3.x, true);
      view.setFloat32(offset + 4, v3.y, true);
      view.setFloat32(offset + 8, v3.z, true);
      offset += 12;

      // Attribute byte count
      view.setUint16(offset, 0, true);
      offset += 2;
    }

    return buffer;
  }
}
