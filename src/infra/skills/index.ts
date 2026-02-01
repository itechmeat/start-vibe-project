import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  FileSystemPort,
  LoggerPort,
  ShellPort,
  SkillInstallerPort,
  SpinnerPort,
} from '../../app/ports/index.js';
import { InternalError, SkillInstallError } from '../../domain/errors/index.js';
import {
  type ProjectConfig,
  type SkillRegistry,
  SkillRegistrySchema,
} from '../../domain/schemas/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';

const frontendStackTagMap: Record<string, string[]> = {
  'react-vite': ['react'],
  vue: ['vue'],
  nextjs: ['nextjs'],
  nuxtjs: ['nuxtjs'],
};

const backendStackTagMap: Record<string, string[]> = {
  fastapi: ['fastapi'],
  django: ['django'],
  flask: ['flask'],
  express: ['express'],
  nestjs: ['nestjs'],
};

const databaseStackTagMap: Record<string, string[]> = {
  postgresql: ['postgresql'],
  mysql: ['mysql'],
  mongodb: ['mongodb'],
  turso: ['turso'],
};

export class SkillInstallerAdapter implements SkillInstallerPort {
  constructor(
    private fs: FileSystemPort,
    private shell: ShellPort,
    private logger: LoggerPort,
    private spinner: SpinnerPort
  ) {}

  async installSkills(
    config: ProjectConfig,
    targetDir: string,
    _onProgress?: (message: string, status: 'start' | 'success' | 'error') => void
  ): Promise<Result<void, SkillInstallError | InternalError>> {
    try {
      this.logger.info('Loading skill registry', { targetDir });

      const registryResult = await this.loadSkillRegistry();
      if (!registryResult.ok) {
        return err(registryResult.error);
      }
      const registry = registryResult.value;

      const selectedTags = this.getSelectedSkillTags(config);
      this.logger.info('Selected skill tags', { tags: Array.from(selectedTags) });

      const installsBySource = this.buildInstallPlan(registry.start_skills, selectedTags);

      if (installsBySource.size === 0) {
        return err(
          new SkillInstallError(
            'No skills selected for installation from start_skills registry',
            'unknown'
          )
        );
      }

      const commands = Array.from(installsBySource.entries()).map(
        ([sourceId, { label, skills }]) => {
          const args = [
            '-a',
            config.aiTool,
            ...Array.from(skills).flatMap((skill) => ['-s', skill]),
            '-y',
          ];

          return {
            label,
            command: 'npx',
            args: ['skills', 'add', sourceId, ...args],
            progressMessage: `Installing skills from ${label}`,
          };
        }
      );

      const failedSources: string[] = [];

      for (const { label, command, args, progressMessage } of commands) {
        const spinnerHandle = this.spinner.start(
          progressMessage ?? `Installing skills from ${label}`
        );

        this.logger.info('Installing skills', {
          source: label,
          command: `${command} ${args.join(' ')}`,
        });

        const result = await this.shell.runCommand(command, args, targetDir, { timeout: 300000 });

        if (result.ok) {
          spinnerHandle.stop(`✓ ${progressMessage}`);
          this.logger.info('Skills installed successfully', { source: label });
        } else {
          spinnerHandle.stop(`✖ ${progressMessage ?? label}`);
          this.logger.error('Failed to install skills', {
            source: label,
            error: result.error.message,
          });

          failedSources.push(label);

          console.log(`\n⚠️  Could not install ${label}.`);
          if (result.error.context?.stderr) {
            console.log(String(result.error.context.stderr).trim());
          }
          console.log(`\nRun manually: ${[command, ...args].join(' ')}\n`);
        }
      }

      if (failedSources.length > 0) {
        return err(
          new SkillInstallError(
            `Failed to install skills from sources: ${failedSources.join(', ')}`,
            'multiple-sources'
          )
        );
      }

      await this.verifySkillChecksums(targetDir, config.aiTool);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Skill installation failed', { error: message });
      return err(new InternalError(`Failed to install skills: ${message}`));
    }
  }

  private async loadSkillRegistry(): Promise<Result<SkillRegistry, InternalError>> {
    try {
      const currentFile = fileURLToPath(import.meta.url);
      const packageRoot = this.findPackageRoot(dirname(currentFile));

      const distPath = join(packageRoot, 'dist', 'data', 'skill-registry.json');
      const srcPath = join(packageRoot, 'src', 'data', 'skill-registry.json');

      const registryPath = existsSync(distPath) ? distPath : srcPath;

      if (!existsSync(registryPath)) {
        return err(new InternalError(`Skill registry not found at ${distPath} or ${srcPath}`));
      }

      const result = await this.fs.readFile(registryPath);
      if (!result.ok) {
        return err(new InternalError(`Failed to read skill registry: ${result.error.message}`));
      }

      const parseResult = SkillRegistrySchema.safeParse(JSON.parse(result.value));

      if (!parseResult.success) {
        return err(
          new InternalError(`Skill registry validation failed: ${parseResult.error.message}`)
        );
      }

      return ok(parseResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return err(new InternalError(`Failed to load skill registry: ${message}`));
    }
  }

  private findPackageRoot(startDir: string): string {
    let current = startDir;

    for (let i = 0; i < 8; i += 1) {
      if (existsSync(join(current, 'package.json'))) {
        return current;
      }

      const parent = dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }

    throw new Error(`Could not locate package.json starting from ${startDir}`);
  }

  private getSelectedSkillTags(config: ProjectConfig): Set<string> {
    const selectedTags = new Set<string>(['common']);

    if (config.components.frontend) {
      const frontendTag = config.template === 'mobile-app' ? 'mobile' : 'frontend';
      selectedTags.add(frontendTag);
      selectedTags.add('design');
      this.addStackTags(config.frontendStack, frontendStackTagMap, selectedTags);
    }

    if (config.components.backend) {
      selectedTags.add('backend');
      this.addStackTags(config.backendStack, backendStackTagMap, selectedTags);
    }

    if (config.components.database) {
      selectedTags.add('database');
      this.addStackTags(config.databaseStack, databaseStackTagMap, selectedTags);
    }

    if (config.components.auth) {
      selectedTags.add('auth');
    }

    return selectedTags;
  }

  private addStackTags(
    stackId: string | undefined,
    stackTagMap: Record<string, string[]>,
    selectedTags: Set<string>
  ): void {
    if (!stackId) {
      return;
    }

    const stackTags = stackTagMap[stackId];
    if (!stackTags) {
      return;
    }

    for (const tag of stackTags) {
      selectedTags.add(tag);
    }
  }

  private buildInstallPlan(
    sources: SkillRegistry['start_skills'],
    selectedTags: Set<string>
  ): Map<string, { label: string; skills: Set<string> }> {
    const installsBySource = new Map<string, { label: string; skills: Set<string> }>();

    for (const source of sources) {
      const skills = new Set<string>();

      for (const skill of source.skills) {
        if (!Array.isArray(skill.tags)) {
          this.logger.warn(`Skill tags must be an array for ${source.label}/${skill.name}`);
          continue;
        }

        const normalizedName = skill.name.trim();
        if (normalizedName.length === 0) {
          this.logger.warn(`Skill name cannot be empty for ${source.label}`);
          continue;
        }

        if (skill.tags.some((tag) => selectedTags.has(tag))) {
          skills.add(normalizedName);
        }
      }

      if (skills.size > 0) {
        installsBySource.set(source.id, { label: source.label, skills });
      }
    }

    return installsBySource;
  }

  private async verifySkillChecksums(targetDir: string, aiTool: string): Promise<void> {
    const skillsDir = `.${aiTool}/skills`;
    const skillsRoot = join(targetDir, skillsDir);

    if (!existsSync(skillsRoot)) {
      this.logger.warn('Skills directory not found for checksum verification', { skillsRoot });
      return;
    }

    const checksumPath = join(skillsRoot, '.checksums.json');
    const currentChecksums = await this.collectSkillChecksums(skillsRoot);

    if (existsSync(checksumPath)) {
      const result = await this.fs.readFile(checksumPath);
      if (result.ok) {
        try {
          const parsed = JSON.parse(result.value) as { checksums?: Record<string, string> };
          if (parsed.checksums) {
            const mismatches = this.findChecksumMismatches(parsed.checksums, currentChecksums);
            if (mismatches.length > 0) {
              this.logger.warn('Skill checksum mismatch', { mismatches });
            }
          }
        } catch {
          this.logger.warn('Invalid checksum file format');
        }
      }
    } else {
      const writeResult = await this.fs.writeFile(
        checksumPath,
        JSON.stringify(
          {
            checksums: currentChecksums,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
      if (!writeResult.ok) {
        this.logger.error('Failed to write checksum file', { error: writeResult.error.message });
      }
    }
  }

  private findChecksumMismatches(
    expected: Record<string, string>,
    actual: Record<string, string>
  ): string[] {
    const mismatches: string[] = [];
    const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);

    for (const key of allKeys) {
      if (expected[key] !== actual[key]) {
        mismatches.push(key);
      }
    }

    return mismatches;
  }

  private async collectSkillChecksums(skillsRoot: string): Promise<Record<string, string>> {
    const entries = await this.walkSkills(skillsRoot);
    const checksums: Record<string, string> = {};

    for (const filePath of entries) {
      const result = await this.fs.readFile(filePath);
      if (result.ok) {
        const hash = createHash('sha256').update(result.value).digest('hex');
        const relativePath = relative(skillsRoot, filePath);
        checksums[relativePath] = hash;
      }
    }

    return Object.fromEntries(Object.entries(checksums).sort(([a], [b]) => a.localeCompare(b)));
  }

  private async walkSkills(skillsRoot: string): Promise<string[]> {
    const result = await this.fs.readDir(skillsRoot);
    if (!result.ok) {
      return [];
    }

    const entries: string[] = [];

    for (const entry of result.value) {
      const entryPath = join(skillsRoot, entry);
      const isDirResult = await this.fs.isDirectory(entryPath);

      if (isDirResult.ok && isDirResult.value) {
        const nestedFiles = await this.walkSkills(entryPath);
        entries.push(...nestedFiles);
      } else if (entry !== '.checksums.json') {
        entries.push(entryPath);
      }
    }

    return entries;
  }
}
