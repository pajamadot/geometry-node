/**
 * Collaboration & Cloud - Iterations 41-45
 * Real-time collaboration, cloud storage, assets, multiplayer, sharing
 */

/**
 * Iteration 41: Real-time Collaboration
 */
export class CollaborationSession {
  private ws?: WebSocket;
  private users: Map<string, User> = new Map();
  private cursors: Map<string, CursorPosition> = new Map();

  connect(url: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.send({ type: 'join', userId });
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => reject(error);
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'user-joined':
        this.users.set(message.userId, message.user);
        break;
      case 'user-left':
        this.users.delete(message.userId);
        this.cursors.delete(message.userId);
        break;
      case 'cursor-move':
        this.cursors.set(message.userId, message.position);
        break;
      case 'node-update':
        this.handleNodeUpdate(message);
        break;
    }
  }

  private handleNodeUpdate(message: any): void {
    // Handle collaborative node updates with conflict resolution
    console.log('Node updated by', message.userId);
  }

  sendCursorPosition(x: number, y: number): void {
    this.send({ type: 'cursor-move', position: { x, y } });
  }

  sendNodeUpdate(nodeId: string, data: any): void {
    this.send({ type: 'node-update', nodeId, data });
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  getActiveUsers(): User[] {
    return Array.from(this.users.values());
  }

  getCursors(): Map<string, CursorPosition> {
    return this.cursors;
  }

  disconnect(): void {
    this.ws?.close();
  }
}

/**
 * Iteration 42: Cloud Storage & Versioning
 */
export class CloudProjectManager {
  private apiEndpoint: string = '/api/projects';

  async saveProject(project: Project): Promise<string> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });

    const data = await response.json();
    return data.id;
  }

  async loadProject(id: string): Promise<Project> {
    const response = await fetch(`${this.apiEndpoint}/${id}`);
    return response.json();
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    const response = await fetch(this.apiEndpoint);
    return response.json();
  }

  async createVersion(projectId: string, message: string): Promise<Version> {
    const response = await fetch(`${this.apiEndpoint}/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    return response.json();
  }

  async listVersions(projectId: string): Promise<Version[]> {
    const response = await fetch(`${this.apiEndpoint}/${projectId}/versions`);
    return response.json();
  }

  async restoreVersion(projectId: string, versionId: string): Promise<Project> {
    const response = await fetch(
      `${this.apiEndpoint}/${projectId}/versions/${versionId}/restore`,
      { method: 'POST' }
    );

    return response.json();
  }
}

/**
 * Iteration 43: Asset Library System
 */
export class AssetLibrary {
  private assets: Map<string, Asset> = new Map();

  async importAsset(file: File, tags: string[] = []): Promise<Asset> {
    const asset: Asset = {
      id: this.generateId(),
      name: file.name,
      type: this.getAssetType(file.type),
      size: file.size,
      tags,
      thumbnail: await this.generateThumbnail(file),
      uploadedAt: Date.now(),
    };

    this.assets.set(asset.id, asset);
    return asset;
  }

  searchAssets(query: string, filters?: AssetFilter): Asset[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.assets.values()).filter((asset) => {
      const matchesQuery =
        asset.name.toLowerCase().includes(lowerQuery) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

      const matchesType = !filters?.type || asset.type === filters.type;

      return matchesQuery && matchesType;
    });
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  deleteAsset(id: string): void {
    this.assets.delete(id);
  }

  private async generateThumbnail(file: File): Promise<string> {
    // Generate preview thumbnail
    return URL.createObjectURL(file);
  }

  private getAssetType(mimeType: string): 'geometry' | 'texture' | 'material' | 'other' {
    if (mimeType.includes('json')) return 'geometry';
    if (mimeType.includes('image')) return 'texture';
    return 'other';
  }

  private generateId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Iteration 44: Multiplayer Scene Editing
 */
export class MultiplayerSession {
  private locks: Map<string, Lock> = new Map();

  requestLock(objectId: string, userId: string): boolean {
    const existing = this.locks.get(objectId);

    if (existing && existing.userId !== userId) {
      return false; // Already locked by another user
    }

    this.locks.set(objectId, {
      objectId,
      userId,
      timestamp: Date.now(),
    });

    return true;
  }

  releaseLock(objectId: string, userId: string): void {
    const lock = this.locks.get(objectId);

    if (lock && lock.userId === userId) {
      this.locks.delete(objectId);
    }
  }

  isLocked(objectId: string): boolean {
    return this.locks.has(objectId);
  }

  getLockedBy(objectId: string): string | null {
    return this.locks.get(objectId)?.userId || null;
  }

  clearStale(timeout: number = 60000): void {
    const now = Date.now();

    for (const [objectId, lock] of this.locks.entries()) {
      if (now - lock.timestamp > timeout) {
        this.locks.delete(objectId);
      }
    }
  }
}

/**
 * Iteration 45: Project Templates & Sharing
 */
export class ProjectTemplateSystem {
  private templates: Map<string, ProjectTemplate> = new Map();

  registerTemplate(template: ProjectTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): ProjectTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(category?: string): ProjectTemplate[] {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter((t) => t.category === category);
    }

    return templates;
  }

  createFromTemplate(templateId: string, projectName: string): Project {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      id: this.generateId(),
      name: projectName,
      data: JSON.parse(JSON.stringify(template.data)), // Deep clone
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  generateShareLink(projectId: string, permissions: 'view' | 'edit' = 'view'): string {
    const token = btoa(`${projectId}:${permissions}:${Date.now()}`);
    return `${window.location.origin}/share/${token}`;
  }

  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize default templates
const starterTemplates = [
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Start from scratch',
    category: 'basic',
    thumbnail: '',
    data: { nodes: [], connections: [] },
  },
  {
    id: 'procedural-terrain',
    name: 'Procedural Terrain',
    description: 'Terrain generation template',
    category: 'procedural',
    thumbnail: '',
    data: { nodes: [], connections: [] },
  },
];

// Types

interface User {
  id: string;
  name: string;
  color: string;
}

interface CursorPosition {
  x: number;
  y: number;
}

interface Project {
  id: string;
  name: string;
  data: any;
  createdAt: number;
  updatedAt: number;
}

interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface Version {
  id: string;
  message: string;
  timestamp: number;
  data: any;
}

interface Asset {
  id: string;
  name: string;
  type: 'geometry' | 'texture' | 'material' | 'other';
  size: number;
  tags: string[];
  thumbnail: string;
  uploadedAt: number;
}

interface AssetFilter {
  type?: string;
  tags?: string[];
}

interface Lock {
  objectId: string;
  userId: string;
  timestamp: number;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  data: any;
}

// Global instances
export const collaborationSession = new CollaborationSession();
export const cloudManager = new CloudProjectManager();
export const assetLibrary = new AssetLibrary();
export const multiplayerSession = new MultiplayerSession();
export const templateSystem = new ProjectTemplateSystem();

// Initialize templates
starterTemplates.forEach((t) => templateSystem.registerTemplate(t));
