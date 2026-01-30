import { describe, expect, it } from 'vitest';
import { ProjectConfigSchema } from './index.js';

describe('ProjectConfigSchema', () => {
  it('accepts valid web-app config', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'my-project',
      template: 'web-app',
      description: 'Test project',
      components: { frontend: true, backend: true, database: true, auth: true },
      frontendStack: 'react-vite',
      backendStack: 'fastapi',
      databaseStack: 'postgresql',
      aiTool: 'github-copilot',
      useSimpleMem: false,
      useReliefPilot: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid project name with spaces', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'My Project',
      template: 'web-app',
      description: '',
      components: { frontend: true, backend: false, database: false, auth: false },
      frontendStack: 'react-vite',
      aiTool: 'github-copilot',
    });

    expect(result.success).toBe(false);
  });

  it('rejects project name starting with number', () => {
    const result = ProjectConfigSchema.safeParse({
      name: '123-project',
      template: 'web-app',
      description: '',
      components: { frontend: true, backend: false, database: false, auth: false },
      frontendStack: 'react-vite',
      aiTool: 'github-copilot',
    });

    expect(result.success).toBe(false);
  });

  it('requires frontendStack when frontend is enabled', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'my-project',
      template: 'web-app',
      description: '',
      components: { frontend: true, backend: false, database: false, auth: false },
      frontendStack: undefined,
      aiTool: 'github-copilot',
    });

    expect(result.success).toBe(false);
  });

  it('accepts minimal valid config', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'api-service',
      template: 'api-service',
      description: '',
      components: { frontend: false, backend: true, database: false, auth: false },
      backendStack: 'fastapi',
      aiTool: 'opencode',
    });

    expect(result.success).toBe(true);
  });

  it('accepts mobile-app template', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'mobile-app',
      template: 'mobile-app',
      description: '',
      components: { frontend: true, backend: false, database: false, auth: false },
      frontendStack: 'react-native',
      aiTool: 'cursor',
    });

    expect(result.success).toBe(true);
  });
});
