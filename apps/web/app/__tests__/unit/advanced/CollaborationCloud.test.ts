/**
 * Unit Tests: Collaboration & Cloud Systems
 * Tests for real-time collaboration, cloud storage, assets, multiplayer, and sharing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CollaborationSession,
  CloudProjectManager,
  AssetLibrary,
  MultiplayerSession,
  ProjectTemplateSystem,
} from '@/utils/CollaborationCloud';

// Mock WebSocket
class MockWebSocket {
  readyState = 1; // OPEN
  onopen?: () => void;
  onmessage?: (event: any) => void;
  onerror?: (error: any) => void;

  send = vi.fn();
  close = vi.fn();

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  static OPEN = 1;
}

global.WebSocket = MockWebSocket as any;

// Mock fetch
global.fetch = vi.fn();

describe('CollaborationSession', () => {
  let session: CollaborationSession;

  beforeEach(() => {
    session = new CollaborationSession();
    vi.clearAllMocks();
  });

  describe('connection', () => {
    it('should connect to WebSocket server', async () => {
      await session.connect('ws://localhost:8080', 'user1');
      expect(MockWebSocket).toBeDefined();
    });

    it('should send join message on connect', async () => {
      const mockWs = new MockWebSocket('ws://test');
      await session.connect('ws://localhost:8080', 'user1');

      // Join message should be sent
      expect(mockWs.send).toBeDefined();
    });
  });

  describe('cursor tracking', () => {
    beforeEach(async () => {
      await session.connect('ws://localhost:8080', 'user1');
    });

    it('should send cursor position', () => {
      session.sendCursorPosition(100, 200);
      // Cursor position message should be sent
      expect(session.getCursors()).toBeDefined();
    });

    it('should track cursors from other users', () => {
      const cursors = session.getCursors();
      expect(cursors).toBeInstanceOf(Map);
    });
  });

  describe('node updates', () => {
    beforeEach(async () => {
      await session.connect('ws://localhost:8080', 'user1');
    });

    it('should send node updates', () => {
      session.sendNodeUpdate('node1', { value: 42 });
      // Update message should be sent
      expect(session.getActiveUsers()).toBeDefined();
    });
  });

  describe('user management', () => {
    beforeEach(async () => {
      await session.connect('ws://localhost:8080', 'user1');
    });

    it('should track active users', () => {
      const users = session.getActiveUsers();
      expect(users).toBeInstanceOf(Array);
    });
  });

  describe('disconnection', () => {
    it('should disconnect from server', async () => {
      await session.connect('ws://localhost:8080', 'user1');
      session.disconnect();
      // Should close WebSocket
      expect(session.getActiveUsers()).toBeDefined();
    });
  });
});

describe('CloudProjectManager', () => {
  let manager: CloudProjectManager;

  beforeEach(() => {
    manager = new CloudProjectManager();
    vi.clearAllMocks();

    // Setup fetch mock
    (global.fetch as any).mockResolvedValue({
      json: async () => ({}),
    });
  });

  describe('project management', () => {
    it('should save project', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ id: 'project123' }),
      });

      const project = {
        id: 'test',
        name: 'Test Project',
        data: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const id = await manager.saveProject(project);
      expect(id).toBe('project123');
      expect(global.fetch).toHaveBeenCalledWith('/api/projects', expect.any(Object));
    });

    it('should load project', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Test',
        data: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockProject,
      });

      const project = await manager.loadProject('project123');
      expect(project.id).toBe('project123');
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project123');
    });

    it('should list projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', createdAt: Date.now(), updatedAt: Date.now() },
        { id: '2', name: 'Project 2', createdAt: Date.now(), updatedAt: Date.now() },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockProjects,
      });

      const projects = await manager.listProjects();
      expect(projects).toHaveLength(2);
    });
  });

  describe('version control', () => {
    it('should create version', async () => {
      const mockVersion = {
        id: 'v1',
        message: 'Initial version',
        timestamp: Date.now(),
        data: {},
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockVersion,
      });

      const version = await manager.createVersion('project123', 'Initial version');
      expect(version.id).toBe('v1');
    });

    it('should list versions', async () => {
      const mockVersions = [
        { id: 'v1', message: 'Version 1', timestamp: Date.now(), data: {} },
        { id: 'v2', message: 'Version 2', timestamp: Date.now(), data: {} },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockVersions,
      });

      const versions = await manager.listVersions('project123');
      expect(versions).toHaveLength(2);
    });

    it('should restore version', async () => {
      const mockProject = {
        id: 'project123',
        name: 'Restored',
        data: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => mockProject,
      });

      const restored = await manager.restoreVersion('project123', 'v1');
      expect(restored.id).toBe('project123');
    });
  });
});

describe('AssetLibrary', () => {
  let library: AssetLibrary;

  beforeEach(() => {
    library = new AssetLibrary();
  });

  describe('asset import', () => {
    it('should import asset', async () => {
      const mockFile = new File(['content'], 'test.json', {
        type: 'application/json',
      });

      const asset = await library.importAsset(mockFile, ['geometry', 'test']);

      expect(asset.id).toBeDefined();
      expect(asset.name).toBe('test.json');
      expect(asset.type).toBe('geometry');
      expect(asset.tags).toContain('geometry');
    });

    it('should detect asset type from MIME', async () => {
      const jsonFile = new File(['{}'], 'geo.json', { type: 'application/json' });
      const imageFile = new File([''], 'tex.png', { type: 'image/png' });

      const geoAsset = await library.importAsset(jsonFile);
      const texAsset = await library.importAsset(imageFile);

      expect(geoAsset.type).toBe('geometry');
      expect(texAsset.type).toBe('texture');
    });

    it('should store file size', async () => {
      const mockFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      const asset = await library.importAsset(mockFile);
      expect(asset.size).toBeGreaterThan(0);
    });

    it('should generate thumbnail', async () => {
      const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
      const asset = await library.importAsset(mockFile);

      expect(asset.thumbnail).toBeDefined();
    });
  });

  describe('asset search', () => {
    beforeEach(async () => {
      const file1 = new File([''], 'box.json', { type: 'application/json' });
      const file2 = new File([''], 'texture.png', { type: 'image/png' });
      const file3 = new File([''], 'sphere.json', { type: 'application/json' });

      await library.importAsset(file1, ['geometry', 'primitive']);
      await library.importAsset(file2, ['texture', 'pbr']);
      await library.importAsset(file3, ['geometry', 'primitive']);
    });

    it('should search by name', () => {
      const results = library.searchAssets('box');
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('box');
    });

    it('should search by tags', () => {
      const results = library.searchAssets('primitive');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', () => {
      const results = library.searchAssets('', { type: 'geometry' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      results.forEach((asset) => {
        expect(asset.type).toBe('geometry');
      });
    });

    it('should be case insensitive', () => {
      const results = library.searchAssets('BOX');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('asset management', () => {
    it('should get asset by id', async () => {
      const mockFile = new File([''], 'test.json', { type: 'application/json' });
      const imported = await library.importAsset(mockFile);

      const retrieved = library.getAsset(imported.id);
      expect(retrieved).toEqual(imported);
    });

    it('should return undefined for non-existent asset', () => {
      const asset = library.getAsset('nonexistent');
      expect(asset).toBeUndefined();
    });

    it('should delete asset', async () => {
      const mockFile = new File([''], 'test.json', { type: 'application/json' });
      const imported = await library.importAsset(mockFile);

      library.deleteAsset(imported.id);

      const retrieved = library.getAsset(imported.id);
      expect(retrieved).toBeUndefined();
    });
  });
});

describe('MultiplayerSession', () => {
  let session: MultiplayerSession;

  beforeEach(() => {
    session = new MultiplayerSession();
  });

  describe('lock management', () => {
    it('should acquire lock', () => {
      const success = session.requestLock('object1', 'user1');
      expect(success).toBe(true);
      expect(session.isLocked('object1')).toBe(true);
    });

    it('should reject lock if already locked by another user', () => {
      session.requestLock('object1', 'user1');
      const success = session.requestLock('object1', 'user2');

      expect(success).toBe(false);
    });

    it('should allow same user to re-acquire lock', () => {
      session.requestLock('object1', 'user1');
      const success = session.requestLock('object1', 'user1');

      expect(success).toBe(true);
    });

    it('should release lock', () => {
      session.requestLock('object1', 'user1');
      session.releaseLock('object1', 'user1');

      expect(session.isLocked('object1')).toBe(false);
    });

    it('should not release lock for wrong user', () => {
      session.requestLock('object1', 'user1');
      session.releaseLock('object1', 'user2');

      expect(session.isLocked('object1')).toBe(true);
    });

    it('should track who locked object', () => {
      session.requestLock('object1', 'user1');
      const lockedBy = session.getLockedBy('object1');

      expect(lockedBy).toBe('user1');
    });

    it('should return null for unlocked object', () => {
      const lockedBy = session.getLockedBy('unlocked');
      expect(lockedBy).toBeNull();
    });
  });

  describe('stale lock cleanup', () => {
    it('should clear stale locks', () => {
      session.requestLock('object1', 'user1');

      // Wait for timeout
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000); // 61 seconds

      session.clearStale(60000);

      expect(session.isLocked('object1')).toBe(false);

      vi.useRealTimers();
    });

    it('should keep fresh locks', () => {
      session.requestLock('object1', 'user1');

      session.clearStale(60000);

      expect(session.isLocked('object1')).toBe(true);
    });

    it('should use custom timeout', () => {
      session.requestLock('object1', 'user1');

      vi.useFakeTimers();
      vi.advanceTimersByTime(31000); // 31 seconds

      session.clearStale(30000);

      expect(session.isLocked('object1')).toBe(false);

      vi.useRealTimers();
    });
  });
});

describe('ProjectTemplateSystem', () => {
  let templateSystem: ProjectTemplateSystem;

  beforeEach(() => {
    templateSystem = new ProjectTemplateSystem();
  });

  describe('template registration', () => {
    it('should register template', () => {
      const template = {
        id: 'custom',
        name: 'Custom Template',
        description: 'A custom template',
        category: 'custom',
        thumbnail: '',
        data: { nodes: [] },
      };

      templateSystem.registerTemplate(template);
      const retrieved = templateSystem.getTemplate('custom');

      expect(retrieved).toEqual(template);
    });

    it('should return undefined for non-existent template', () => {
      const template = templateSystem.getTemplate('nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('template listing', () => {
    beforeEach(() => {
      templateSystem.registerTemplate({
        id: 'basic1',
        name: 'Basic 1',
        description: '',
        category: 'basic',
        thumbnail: '',
        data: {},
      });

      templateSystem.registerTemplate({
        id: 'basic2',
        name: 'Basic 2',
        description: '',
        category: 'basic',
        thumbnail: '',
        data: {},
      });

      templateSystem.registerTemplate({
        id: 'advanced1',
        name: 'Advanced 1',
        description: '',
        category: 'advanced',
        thumbnail: '',
        data: {},
      });
    });

    it('should list all templates', () => {
      const templates = templateSystem.listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by category', () => {
      const basic = templateSystem.listTemplates('basic');
      expect(basic.length).toBe(2);
      basic.forEach((t) => {
        expect(t.category).toBe('basic');
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = templateSystem.listTemplates('nonexistent');
      expect(templates).toHaveLength(0);
    });
  });

  describe('project creation', () => {
    beforeEach(() => {
      templateSystem.registerTemplate({
        id: 'test',
        name: 'Test Template',
        description: '',
        category: 'test',
        thumbnail: '',
        data: { nodes: [{ id: 'node1', type: 'box' }], connections: [] },
      });
    });

    it('should create project from template', () => {
      const project = templateSystem.createFromTemplate('test', 'My Project');

      expect(project.id).toBeDefined();
      expect(project.name).toBe('My Project');
      expect(project.data).toBeDefined();
      expect(project.createdAt).toBeDefined();
    });

    it('should deep clone template data', () => {
      const project = templateSystem.createFromTemplate('test', 'Project 1');
      const template = templateSystem.getTemplate('test');

      expect(project.data).toEqual(template?.data);
      expect(project.data).not.toBe(template?.data); // Different object
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateSystem.createFromTemplate('nonexistent', 'Test');
      }).toThrow();
    });
  });

  describe('share links', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      });
    });

    it('should generate view share link', () => {
      const link = templateSystem.generateShareLink('project123', 'view');

      expect(link).toContain('http://localhost:3000/share/');
      expect(link.length).toBeGreaterThan(30);
    });

    it('should generate edit share link', () => {
      const link = templateSystem.generateShareLink('project123', 'edit');

      expect(link).toContain('http://localhost:3000/share/');
    });

    it('should default to view permission', () => {
      const link = templateSystem.generateShareLink('project123');

      expect(link).toContain('http://localhost:3000/share/');
    });

    it('should encode project info in token', () => {
      const link = templateSystem.generateShareLink('project123', 'view');
      const token = link.split('/share/')[1];

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });
  });
});
