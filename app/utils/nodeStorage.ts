import { JsonNodeDefinition, JsonNodeCollection } from '../types/jsonNodes';
import { stringifyJsonNodeCollection, parseJsonNodeCollection } from './jsonNodeLoader';

// Storage interface for different storage backends
export interface NodeStorage {
  save(collection: JsonNodeCollection): Promise<void>;
  load(): Promise<JsonNodeCollection | null>;
  exists(): Promise<boolean>;
  clear(): Promise<void>;
}

// File-based storage implementation
export class FileNodeStorage implements NodeStorage {
  private filename: string;

  constructor(filename: string = 'custom-nodes.json') {
    this.filename = filename;
  }

  async save(collection: JsonNodeCollection): Promise<void> {
    try {
      const jsonString = stringifyJsonNodeCollection(collection);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = this.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to save nodes to file: ${error}`);
    }
  }

  async load(): Promise<JsonNodeCollection | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        try {
          const text = await file.text();
          const collection = parseJsonNodeCollection(text);
          resolve(collection);
        } catch (error) {
          reject(new Error(`Failed to load nodes from file: ${error}`));
        }
      };
      
      input.click();
    });
  }

  async exists(): Promise<boolean> {
    // File storage doesn't have a persistent existence check
    return false;
  }

  async clear(): Promise<void> {
    // File storage doesn't have a clear operation
  }
}

// LocalStorage-based storage implementation
export class LocalStorageNodeStorage implements NodeStorage {
  private key: string;

  constructor(key: string = 'geometry-script-custom-nodes') {
    this.key = key;
  }

  async save(collection: JsonNodeCollection): Promise<void> {
    // Check if localStorage is available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage not available, skipping save');
      return;
    }
    
    try {
      const jsonString = stringifyJsonNodeCollection(collection);
      localStorage.setItem(this.key, jsonString);
    } catch (error) {
      throw new Error(`Failed to save nodes to localStorage: ${error}`);
    }
  }

  async load(): Promise<JsonNodeCollection | null> {
    // Check if localStorage is available
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;
      
      return parseJsonNodeCollection(stored);
    } catch (error) {
      throw new Error(`Failed to load nodes from localStorage: ${error}`);
    }
  }

  async exists(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(this.key) !== null;
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.key);
  }
}

// Storage manager that handles different storage backends
export class NodeStorageManager {
  private localStorage: LocalStorageNodeStorage;
  private fileStorage: FileNodeStorage;

  constructor() {
    this.localStorage = new LocalStorageNodeStorage();
    this.fileStorage = new FileNodeStorage();
  }

  // Save nodes to localStorage (automatic backup)
  async saveToLocal(nodes: JsonNodeDefinition[]): Promise<void> {
    const collection: JsonNodeCollection = {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes
    };
    
    await this.localStorage.save(collection);
  }

  // Load nodes from localStorage
  async loadFromLocal(): Promise<JsonNodeDefinition[]> {
    const collection = await this.localStorage.load();
    return collection?.nodes || [];
  }

  // Export nodes to file
  async exportToFile(nodes: JsonNodeDefinition[], filename?: string): Promise<void> {
    const collection: JsonNodeCollection = {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes
    };
    
    const fileStorage = filename ? new FileNodeStorage(filename) : this.fileStorage;
    await fileStorage.save(collection);
  }

  // Import nodes from file
  async importFromFile(): Promise<JsonNodeDefinition[]> {
    const collection = await this.fileStorage.load();
    return collection?.nodes || [];
  }

  // Clear local storage
  async clearLocal(): Promise<void> {
    await this.localStorage.clear();
  }

  // Check if local storage has data
  async hasLocalData(): Promise<boolean> {
    return await this.localStorage.exists();
  }

  // Create a backup of current nodes
  async createBackup(nodes: JsonNodeDefinition[]): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `geometry-script-nodes-backup-${timestamp}.json`;
    await this.exportToFile(nodes, filename);
  }

  // Import nodes from JSON string (for copy-paste functionality)
  importFromString(jsonString: string): JsonNodeDefinition[] {
    try {
      const collection = parseJsonNodeCollection(jsonString);
      return collection.nodes;
    } catch (error) {
      throw new Error(`Failed to import nodes from string: ${error}`);
    }
  }

  // Export nodes to JSON string (for copy-paste functionality)
  exportToString(nodes: JsonNodeDefinition[]): string {
    const collection: JsonNodeCollection = {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes
    };
    
    return stringifyJsonNodeCollection(collection);
  }
}

// Default storage manager instance
export const nodeStorageManager = new NodeStorageManager(); 