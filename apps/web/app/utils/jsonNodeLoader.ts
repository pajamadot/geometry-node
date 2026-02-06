import * as pc from 'playcanvas';
import { NodeDefinition } from '../types/nodes';

export const jsonNodeLoader = {
  load: (json: string) => {
    // Stub
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
  }
};

export function validateJsonNode(json: any): { valid: boolean; errors: string[] } {
    // Stub - always valid for now
    return { valid: true, errors: [] };
}

export function jsonToNodeDefinition(json: any): NodeDefinition | null {
    return null; // Stub
}

export function loadJsonNodes(): NodeDefinition[] {
    return []; // Stub
}

export function parseJsonNodeCollection(json: string): { version: string; created: string; modified: string; nodes: any[] } {
    try {
        const parsed = JSON.parse(json);
        // Handle both array of nodes and full collection format
        if (Array.isArray(parsed)) {
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                nodes: parsed
            };
        }
        return {
            version: parsed.version || '1.0.0',
            created: parsed.created || new Date().toISOString(),
            modified: parsed.modified || new Date().toISOString(),
            nodes: parsed.nodes || []
        };
    } catch {
        return { version: '1.0.0', created: '', modified: '', nodes: [] };
    }
}

export function stringifyJsonNodeCollection(collection: any): string {
    return JSON.stringify(collection, null, 2);
}
