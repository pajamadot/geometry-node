import { describe, it, expect } from 'vitest';
import { buildPromptForTask } from '../src/contextBuilders';

describe('buildPromptForTask', () => {
  it('injects the provided catalog into a generate_scene prompt', () => {
    const catalog = 'CATALOG_SENTINEL_12345';
    const prompt = buildPromptForTask(
      { task: 'generate_scene', scene_description: 'a red cube' },
      catalog,
    );
    expect(prompt).toContain('CATALOG_SENTINEL_12345');
    expect(prompt).toContain('a red cube');
  });

  it('does not require a catalog for create_node (uses static examples)', () => {
    const prompt = buildPromptForTask(
      { task: 'create_node', behavior: 'doubles a number' },
      '',
    );
    expect(prompt).toContain('create_node');
    expect(prompt).toContain('doubles a number');
  });
});
