import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';

export class GeometryCache {
    private cache = new Map<string, EnhancedGeometryData>();
    
    add(key: string, geometry: EnhancedGeometryData) {
        this.cache.set(key, geometry);
    }
    
    get(key: string): EnhancedGeometryData | undefined {
        return this.cache.get(key);
    }
    
    clear() {
        this.cache.clear();
    }
}
