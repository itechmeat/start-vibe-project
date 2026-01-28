import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import type { ProjectConfig } from '../../config/templates.js';
import { getAgentConfig, type AgentType } from '../../config/agents.js';
import { runCommand, type CommandError } from '../../lib/shell.js';
import { startSpinner } from '../../lib/spinner.js';

type SkillRegistrySkill = {
  name: string;
  tags: string[];
};

type SkillRegistrySource = {
  id: string;
  label: string;
  skills: SkillRegistrySkill[];
};

type SkillRegistry = {
  start_skills: SkillRegistrySource[];
  priority_repos?: string[];
};

export async function loadSkillRegistry(): Promise<SkillRegistry> {
  const baseDir = dirname(fileURLToPath(import.meta.url));
  const packageRoot = findPackageRoot(baseDir);
  const distPath = join(packageRoot, 'dist', 'data', 'skill-registry.json');
  const srcPath = join(packageRoot, 'src', 'data', 'skill-registry.json');
  const registryPath = existsSync(distPath) ? distPath : srcPath;

  if (!existsSync(registryPath)) {
    throw new Error(`Skill registry not found at ${distPath} or ${srcPath}`);
  }

  const content = await readFile(registryPath, 'utf8');
  const parsed = JSON.parse(content) as SkillRegistry;

  if (!parsed.start_skills || !Array.isArray(parsed.start_skills)) {
    throw new Error('Skill registry is missing a valid start_skills array');
  }

  return parsed;
}

function findPackageRoot(startDir: string): string {
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

function addStackTags(
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

function getSelectedSkillTags(config: ProjectConfig): Set<string> {
  const selectedTags = new Set<string>(['common']);

  if (config.components.frontend) {
    const frontendTag = config.template === 'mobile-app' ? 'mobile' : 'frontend';
    selectedTags.add(frontendTag);
    selectedTags.add('design');
    addStackTags(config.frontendStack, frontendStackTagMap, selectedTags);
  }

  if (config.components.backend) {
    selectedTags.add('backend');
    addStackTags(config.backendStack, backendStackTagMap, selectedTags);
  }

  if (config.components.database) {
    selectedTags.add('database');
    addStackTags(config.databaseStack, databaseStackTagMap, selectedTags);
  }

  if (config.components.auth) {
    selectedTags.add('auth');
  }

  return selectedTags;
}

function buildInstallPlan(
  sources: SkillRegistrySource[],
  selectedTags: Set<string>
): Map<string, { label: string; skills: Set<string> }> {
  const installsBySource = new Map<string, { label: string; skills: Set<string> }>();

  for (const source of sources) {
    const skills = new Set<string>();

    for (const skill of source.skills) {
      if (!Array.isArray(skill.tags)) {
        throw new Error(`Skill tags must be an array for ${source.label}/${skill.name}`);
      }

      const normalizedName = skill.name.trim();
      if (normalizedName.length === 0) {
        throw new Error(`Skill name cannot be empty for ${source.label}`);
      }

      if (skill.tags.some(tag => selectedTags.has(tag))) {
        skills.add(normalizedName);
      }
    }

    if (skills.size > 0) {
      installsBySource.set(source.id, { label: source.label, skills });
    }
  }

  return installsBySource;
}

function buildAddSkillCommand(sourceId: string, args: string[]): { command: string; args: string[] } {
  return {
    command: 'npx',
    args: ['skills', 'add', sourceId, ...args],
  };
}

type SkillCommand = {
  label: string;
  command: string;
  args: string[];
  progressMessage?: string;
};

export async function installSkills(config: ProjectConfig, targetDir: string): Promise<void> {
  const registry = await loadSkillRegistry();
  const selectedTags = getSelectedSkillTags(config);

  const installsBySource = buildInstallPlan(registry.start_skills, selectedTags);

  if (installsBySource.size === 0) {
    throw new Error('No skills selected for installation from start_skills registry');
  }

  const commands: SkillCommand[] = Array.from(installsBySource.entries()).map(
    ([sourceId, { label, skills }]) => {
      const args = [
        '-a',
        config.aiTool,
        ...Array.from(skills).flatMap(skill => ['-s', skill]),
        '-y',
      ];
      const { command, args: commandArgs } = buildAddSkillCommand(sourceId, args);

      return {
        label,
        command,
        args: commandArgs,
        progressMessage: `Installing skills from ${label}`,
      };
    }
  );

  for (const { label, command, args, progressMessage } of commands) {
    const spinner = progressMessage ? startSpinner(progressMessage) : null;

    try {
      await runCommand(command, args, targetDir);
      spinner?.stop(`✓ ${progressMessage}`);
    } catch (error) {
      const execError = error as CommandError;
      spinner?.stop(`✖ ${progressMessage ?? label}`);
      console.log(`\n⚠️  Could not install ${label}.`);

      if (execError.stderr && execError.stderr.length > 0) {
        console.log(execError.stderr.trim());
      }

      if (execError.stdout && execError.stdout.length > 0) {
        console.log(execError.stdout.trim());
      }

      if (execError.message) {
        console.log(execError.message.trim());
      }

      console.log(`\nRun manually: ${[command, ...args].join(' ')}\n`);
    }
  }

  const finalizeSpinner = startSpinner('Finalizing installation...');
  await new Promise(resolve => setTimeout(resolve, 200));
  finalizeSpinner.stop('✓ Finalizing installation.');

  await verifySkillChecksums(targetDir, config.aiTool as AgentType);
}

type SkillChecksums = Record<string, string>;

async function verifySkillChecksums(targetDir: string, aiTool: AgentType): Promise<void> {
  const agentConfig = getAgentConfig(aiTool);
  const skillsRoot = join(targetDir, agentConfig.skillsDir);

  if (!existsSync(skillsRoot)) {
    throw new Error(`Skills directory not found: ${skillsRoot}`);
  }

  const checksumPath = join(skillsRoot, '.checksums.json');
  const currentChecksums = await collectSkillChecksums(skillsRoot);

  if (existsSync(checksumPath)) {
    const content = await readFile(checksumPath, 'utf8');
    const parsed = JSON.parse(content) as { checksums?: SkillChecksums };

    if (!parsed.checksums) {
      throw new Error(`Invalid checksum file format at ${checksumPath}`);
    }

    const mismatches = findChecksumMismatches(parsed.checksums, currentChecksums);
    if (mismatches.length > 0) {
      throw new Error(`Skill checksum mismatch for: ${mismatches.join(', ')}`);
    }
  } else {
    await writeFile(
      checksumPath,
      JSON.stringify({
        checksums: currentChecksums,
        updatedAt: new Date().toISOString(),
      }, null, 2)
    );
  }
}

function findChecksumMismatches(
  expected: SkillChecksums,
  actual: SkillChecksums
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

async function collectSkillChecksums(skillsRoot: string): Promise<SkillChecksums> {
  const entries = await walkSkills(skillsRoot);
  const checksums: SkillChecksums = {};

  for (const filePath of entries) {
    const buffer = await readFile(filePath);
    const hash = createHash('sha256').update(buffer).digest('hex');
    const relativePath = relative(skillsRoot, filePath);
    checksums[relativePath] = hash;
  }

  return Object.fromEntries(Object.entries(checksums).sort(([a], [b]) => a.localeCompare(b)));
}

async function walkSkills(skillsRoot: string): Promise<string[]> {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(skillsRoot, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await walkSkills(entryPath);
      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile() && entry.name !== '.checksums.json') {
      files.push(entryPath);
    }
  }

  return files;
}
