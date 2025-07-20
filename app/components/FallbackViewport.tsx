'use client';

import React from 'react';
import { useGeometry } from './GeometryContext';

export default function FallbackViewport() {
  const { compiledGeometry, error, isCompiling } = useGeometry();

  const getGeometryInfo = () => {
    if (!compiledGeometry) return null;
    
    const position = compiledGeometry.attributes.position;
    const vertexCount = position ? position.count : 0;
    const hasNormals = !!compiledGeometry.attributes.normal;
    const hasUVs = !!compiledGeometry.attributes.uv;
    
    return {
      vertices: vertexCount,
      triangles: Math.floor(vertexCount / 3),
      hasNormals,
      hasUVs
    };
  };

  const geometryInfo = getGeometryInfo();

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-md">
        <div className="text-6xl mb-6">🎯</div>
        <h2 className="text-xl font-semibold mb-4">Geometry Node Preview</h2>
        <div className="text-gray-300 mb-6">
          WebGL is not available, but your node graph is still processing geometry data.
        </div>

        {isCompiling && (
          <div className="mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-cyan-400 text-sm">Compiling nodes...</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded">
            <div className="text-red-400 text-sm font-medium mb-1">Compilation Error</div>
            <div className="text-red-300 text-xs">{error}</div>
          </div>
        )}

        {geometryInfo && !error && (
          <div className="bg-gray-800/50 rounded-lg p-4 text-left">
            <div className="text-green-400 text-sm font-medium mb-2">✓ Geometry Generated</div>
            <div className="space-y-1 text-xs text-gray-300">
              <div>Vertices: <span className="text-white">{geometryInfo.vertices.toLocaleString()}</span></div>
              <div>Triangles: <span className="text-white">{geometryInfo.triangles.toLocaleString()}</span></div>
              <div>Normals: <span className={geometryInfo.hasNormals ? "text-green-400" : "text-gray-500"}>
                {geometryInfo.hasNormals ? "✓ Yes" : "✗ No"}
              </span></div>
              <div>UV Mapping: <span className={geometryInfo.hasUVs ? "text-green-400" : "text-gray-500"}>
                {geometryInfo.hasUVs ? "✓ Yes" : "✗ No"}
              </span></div>
            </div>
          </div>
        )}

        {!geometryInfo && !error && !isCompiling && (
          <div className="text-gray-500 text-sm">
            Create geometry nodes to see data here
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          Enable WebGL to see 3D visualization
        </div>
      </div>
    </div>
  );
} 