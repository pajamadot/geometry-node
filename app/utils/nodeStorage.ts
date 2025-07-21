import { JsonNodeDefinition, JsonNodeCollection } from '../types/jsonNodes';
import { stringifyJsonNodeCollection, parseJsonNodeCollection } from './jsonNodeLoader';

// File-based storage implementation
export class FileNodeStorage {
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

// Simple storage manager for file operations only
export class NodeStorageManager {
  private fileStorage: FileNodeStorage;

  constructor() {
    this.fileStorage = new FileNodeStorage();
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