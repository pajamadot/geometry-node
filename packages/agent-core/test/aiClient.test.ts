import { describe, it, expect } from 'vitest';
import { getAvailableModels, createStreamingSession, BASE_SYSTEM_PROMPT } from '../src/aiClient';

describe('aiClient', () => {
  it('exposes the OpenRouter model list', () => {
    const models = getAvailableModels();
    expect(models).toContain('anthropic/claude-3.5-sonnet');
    expect(models.length).toBeGreaterThan(3);
  });

  it('createStreamingSession requires an apiKey argument (no module-level env read)', () => {
    expect(createStreamingSession.length).toBeGreaterThanOrEqual(2);
    expect(BASE_SYSTEM_PROMPT).toContain('Geometry-Node');
  });
});
