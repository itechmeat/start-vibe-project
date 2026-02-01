import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import { InternalError } from '../../domain/errors/index.js';
import type { ProjectConfig } from '../../domain/schemas/index.js';
import { err, ok } from '../../domain/types/result.js';
import type {
  FileSystemPort,
  LoggerPort,
  ProgressTrackerPort,
  ShellPort,
  SkillInstallerPort,
  SpinnerPort,
  TemplateLoaderPort,
} from '../ports/index.js';
import {
  type CreateProjectDeps,
  type CreateProjectInput,
  createProjectUseCase,
} from './create-project.js';

type MockedFs = {
  exists: MockedFunction<FileSystemPort['exists']>;
  mkdir: MockedFunction<FileSystemPort['mkdir']>;
  writeFile: MockedFunction<FileSystemPort['writeFile']>;
  readFile: MockedFunction<FileSystemPort['readFile']>;
  readDir: MockedFunction<FileSystemPort['readDir']>;
  copyFile: MockedFunction<FileSystemPort['copyFile']>;
  isDirectory: MockedFunction<FileSystemPort['isDirectory']>;
};

const createMockFs = (): MockedFs => ({
  exists: vi.fn().mockReturnValue(false),
  mkdir: vi.fn().mockResolvedValue(ok(undefined)),
  writeFile: vi.fn().mockResolvedValue(ok(undefined)),
  readFile: vi.fn().mockResolvedValue(ok('')),
  readDir: vi.fn().mockResolvedValue(ok([])),
  copyFile: vi.fn().mockResolvedValue(ok(undefined)),
  isDirectory: vi.fn().mockResolvedValue(ok(false)),
});

const createMockLogger = (): LoggerPort => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createMockProgressTracker = (): ProgressTrackerPort => ({
  recordStep: vi.fn().mockResolvedValue(undefined),
  markCompleted: vi.fn().mockResolvedValue(undefined),
  markError: vi.fn().mockResolvedValue(undefined),
  markCancelled: vi.fn().mockResolvedValue(undefined),
});

const createMockSkillInstaller = (): SkillInstallerPort => ({
  installSkills: vi.fn().mockResolvedValue(ok(undefined)),
});

const createMockShell = (): ShellPort => ({
  runCommand: vi.fn().mockResolvedValue(ok({ stdout: '', stderr: '' })),
});

const createMockTemplateLoader = (): TemplateLoaderPort => ({
  loadTemplate: vi.fn().mockResolvedValue(ok('template content')),
  loadFileAsset: vi.fn().mockResolvedValue(ok('asset content')),
});

const createMockSpinner = (): SpinnerPort => ({
  start: vi.fn().mockReturnValue({
    update: vi.fn(),
    stop: vi.fn(),
  }),
});

describe('createProjectUseCase', () => {
  let deps: Omit<CreateProjectDeps, 'fs'> & { fs: MockedFs };
  let input: CreateProjectInput;
  let config: ProjectConfig;

  beforeEach(() => {
    config = {
      name: 'test-project',
      description: 'Test project description',
      template: 'web-app',
      components: {
        frontend: true,
        backend: true,
        database: false,
        auth: false,
      },
      frontendStack: 'react',
      backendStack: 'node',
      aiTool: 'claude-code',
      useReliefPilot: false,
      useSimpleMem: false,
    };

    input = {
      config,
      targetDir: '/test/project',
      agentSkillsDir: '.claude/skills',
      agentAgentsDir: '.claude/agents',
    };

    deps = {
      fs: createMockFs(),
      templateLoader: createMockTemplateLoader(),
      shell: createMockShell(),
      logger: createMockLogger(),
      progressTracker: createMockProgressTracker(),
      skillInstaller: createMockSkillInstaller(),
      spinner: createMockSpinner(),
    };
  });

  it('creates project successfully', async () => {
    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(true);
    expect(deps.fs.mkdir).toHaveBeenCalledWith('/test/project');
    expect(deps.progressTracker.markCompleted).toHaveBeenCalled();
  });

  it('handles directory creation failure', async () => {
    deps.fs.mkdir = vi.fn().mockResolvedValue(err(new Error('Permission denied')));

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(InternalError);
      expect(result.error.message).toContain('Create project directory failed');
    }
  });

  it('handles template loading failure', async () => {
    deps.templateLoader.loadFileAsset = vi.fn().mockResolvedValue(err(new Error('Not found')));

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('AGENTS.md');
    }
  });

  it('handles skill installation failure', async () => {
    deps.skillInstaller.installSkills = vi.fn().mockResolvedValue(err(new Error('Network error')));

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Skill installation failed');
    }
  });

  it('strips SimpleMem section when not enabled', async () => {
    const loadAsset = vi
      .fn()
      .mockResolvedValue(ok('\n## SimpleMem Instructions\ncontent\n<!-- SIMPLEMEM:END -->\nrest'));
    deps.templateLoader.loadFileAsset = loadAsset;

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(true);
    const writeCall = deps.fs.writeFile.mock.calls.find((call) =>
      String(call[0]).includes('AGENTS.md')
    );
    expect(writeCall).toBeDefined();
    if (writeCall) {
      expect(String(writeCall[1])).not.toContain('SimpleMem');
    }
  });

  it('keeps SimpleMem section when enabled', async () => {
    input.config.useSimpleMem = true;
    const loadAsset = vi
      .fn()
      .mockResolvedValue(ok('\n## SimpleMem Instructions\ncontent\n<!-- SIMPLEMEM:END -->\nrest'));
    deps.templateLoader.loadFileAsset = loadAsset;

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(true);
    const writeCall = deps.fs.writeFile.mock.calls.find((call) =>
      String(call[0]).includes('AGENTS.md')
    );
    expect(writeCall).toBeDefined();
    if (writeCall) {
      expect(String(writeCall[1])).toContain('SimpleMem');
    }
  });

  it('handles GitHub Copilot specific files', async () => {
    input.config.aiTool = 'github-copilot';

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(true);
    expect(deps.fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('.github'), true);
  });

  it('adds Relief Pilot instructions when enabled', async () => {
    input.config.aiTool = 'github-copilot';
    input.config.useReliefPilot = true;

    deps.templateLoader.loadFileAsset = vi.fn().mockImplementation((path: string) => {
      if (path.includes('relief-pilot')) {
        return ok('relief pilot content');
      }
      return ok('content');
    });

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(true);
    const reliefPilotCall = deps.fs.writeFile.mock.calls.find((call) =>
      String(call[0]).includes('relief-pilot.instructions.md')
    );
    expect(reliefPilotCall).toBeDefined();
  });

  it('tracks progress through all steps', async () => {
    await createProjectUseCase(input, deps);

    expect(deps.progressTracker.recordStep).toHaveBeenCalledWith('create-project-dir');
    expect(deps.progressTracker.recordStep).toHaveBeenCalledWith('create-project-structure');
    expect(deps.progressTracker.recordStep).toHaveBeenCalledWith('install-skills');
    expect(deps.progressTracker.markCompleted).toHaveBeenCalled();
  });

  it('logs project creation start and completion', async () => {
    await createProjectUseCase(input, deps);

    expect(deps.logger.info).toHaveBeenCalledWith(
      'Starting project creation',
      expect.objectContaining({ projectName: 'test-project' })
    );
    expect(deps.logger.info).toHaveBeenCalledWith(
      'Project creation completed',
      expect.objectContaining({ projectName: 'test-project' })
    );
  });

  it('handles unexpected errors', async () => {
    deps.fs.mkdir = vi.fn().mockRejectedValue(new Error('Unexpected crash'));

    const result = await createProjectUseCase(input, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Failed to create project');
    }
    expect(deps.progressTracker.markError).toHaveBeenCalled();
  });
});
