import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { ProjectConfig } from '../../config/templates.js';
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

function getSelectedSkillTags(components: ProjectConfig['components']): Set<string> {
  const selectedTags = new Set<string>(['common']);

  if (components.frontend) {
    selectedTags.add('frontend');
    selectedTags.add('design');
  }

  if (components.backend) {
    selectedTags.add('backend');
  }

  if (components.database) {
    selectedTags.add('database');
  }

  if (components.auth) {
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

      if (skill.tags.some(tag => selectedTags.has(tag))) {
        skills.add(skill.name);
      }
    }

    if (skills.size > 0) {
      installsBySource.set(source.id, { label: source.label, skills });
    }
  }

  return installsBySource;
}

function buildAddSkillCommand(sourceId: string, args: string[]): string {
  return ['npx skills add', sourceId, ...args].join(' ');
}

type SkillCommand = {
  label: string;
  command: string;
  progressMessage?: string;
};

export async function installSkills(config: ProjectConfig, targetDir: string): Promise<void> {
  const registry = await loadSkillRegistry();
  const selectedTags = getSelectedSkillTags(config.components);

  const installsBySource = buildInstallPlan(registry.start_skills, selectedTags);

  if (installsBySource.size === 0) {
    throw new Error('No skills selected for installation from start_skills registry');
  }

  const commands: SkillCommand[] = Array.from(installsBySource.entries()).map(
    ([sourceId, { label, skills }]) => ({
      label,
      command: buildAddSkillCommand(sourceId, [
        `-a ${config.aiTool}`,
        ...Array.from(skills).map(skill => `-s ${skill}`),
        '-y',
      ]),
      progressMessage: `Installing skills from ${label}`,
    })
  );

  for (const { label, command, progressMessage } of commands) {
    const spinner = progressMessage ? startSpinner(progressMessage) : null;

    try {
      await runCommand(command, targetDir);
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

      console.log(`\nRun manually: ${command}\n`);
    }
  }

  const finalizeSpinner = startSpinner('Finalizing installation...');
  await new Promise(resolve => setTimeout(resolve, 200));
  finalizeSpinner.stop('✓ Finalizing installation.');
}
