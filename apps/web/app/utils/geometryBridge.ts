import * as pc from 'playcanvas';

// Helper to bridge custom types with PlayCanvas
export const GeometryBridge = {
    toPlayCanvasVec3: (v: {x: number, y: number, z: number}) => new pc.Vec3(v.x, v.y, v.z),
    fromPlayCanvasVec3: (v: pc.Vec3) => ({x: v.x, y: v.y, z: v.z})
};
