import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { ProjectConfig } from '../../config/templates.js';
import { getAgentConfig, type AgentType } from '../../config/agents.js';
import { loadFileAsset, loadTemplate } from './assets.js';
import { generateInitMd } from './init-content.js';
import {
  generateAboutMd,
  generateArchitectureMd,
  generateSpecsMd,
  generateStoriesMd,
} from './doc-content.js';
import { generateGitignore } from './text-utils.js';
import { installSkills } from './skills';

export async function createProject(
  config: ProjectConfig,
  targetDir: string,
  options?: { onProgress?: (step: string) => Promise<void> | void }
): Promise<void> {
  const reportStep = async (step: string): Promise<void> => {
    if (options?.onProgress) {
      await options.onProgress(step);
    }
  };

  // Create project directory
  await mkdir(targetDir, { recursive: true });
  await reportStep('create-project-dir');

  // Create .project directory structure
  await mkdir(join(targetDir, '.project', 'stories'), { recursive: true });
  await reportStep('create-project-structure');

  // Get agent config for skills/agents paths
  const agentConfig = getAgentConfig(config.aiTool as AgentType);

  // Create agent-specific directories
  await mkdir(join(targetDir, agentConfig.skillsDir), { recursive: true });
  await mkdir(join(targetDir, agentConfig.agentsDir), { recursive: true });
  await reportStep('create-agent-dirs');

  // Create INIT.md checklist for the creator agent
  const initContent = await generateInitMd(config);
  await writeFile(join(targetDir, '.project', 'INIT.md'), initContent);
  await reportStep('write-init');

  // Create about.md with user's description
  const aboutContent = generateAboutMd(config);
  await writeFile(join(targetDir, '.project', 'about.md'), aboutContent);
  await reportStep('write-about');

  // Create specs.md with stack info
  const specsContent = generateSpecsMd(config);
  await writeFile(join(targetDir, '.project', 'specs.md'), specsContent);
  await reportStep('write-specs');

  // Create architecture.md
  const architectureContent = generateArchitectureMd(config);
  await writeFile(join(targetDir, '.project', 'architecture.md'), architectureContent);
  await reportStep('write-architecture');

  // Create empty project-context.md
  await writeFile(
    join(targetDir, '.project', 'project-context.md'),
    '# Project Context\n\n_Living document that grows with the project._\n'
  );
  await reportStep('write-project-context');

  // Create stories.md
  const storiesContent = generateStoriesMd(config);
  await writeFile(join(targetDir, '.project', 'stories', 'stories.md'), storiesContent);
  await reportStep('write-stories');

  // Create AGENTS.md
  const agentsMdTemplate = await loadFileAsset('AGENTS.md');
  const agentsMdContent = config.useSimpleMem
    ? agentsMdTemplate
    : stripSimpleMemSection(agentsMdTemplate);
  await writeFile(join(targetDir, 'AGENTS.md'), agentsMdContent);
  await reportStep('write-agents-md');

  // Create creator.md agent
  let creatorAgentContent = await loadTemplate('agents/creator.md');
  if (config.useReliefPilot) {
    const creatorTools = await loadTemplate('agents/creator-tools.md');
    creatorAgentContent = applyCreatorTools(creatorAgentContent, creatorTools);
  }
  await writeFile(join(targetDir, agentConfig.agentsDir, 'creator.md'), creatorAgentContent);
  await reportStep('write-creator-agent');

  // Create .editorconfig
  const editorConfigContent = await loadFileAsset('.editorconfig');
  await writeFile(join(targetDir, '.editorconfig'), editorConfigContent);
  await reportStep('write-editorconfig');

  // Add GitHub Copilot instructions (always) and Relief Pilot files (if enabled)
  if (config.aiTool === 'github-copilot') {
    await mkdir(join(targetDir, '.github', 'instructions'), { recursive: true });

    const copilotInstructions = await loadFileAsset('.github/copilot-instructions.md');
    const copilotContent = config.useReliefPilot
      ? copilotInstructions
      : stripReliefPilotRequirement(copilotInstructions);
    await writeFile(join(targetDir, '.github', 'copilot-instructions.md'), copilotContent);
    await reportStep('write-copilot-instructions');

    if (config.useReliefPilot) {
      const reliefPilotInstructions = await loadFileAsset('.github/instructions/relief-pilot.instructions.md');
      await writeFile(
        join(targetDir, '.github', 'instructions', 'relief-pilot.instructions.md'),
        reliefPilotInstructions
      );
      await reportStep('write-relief-pilot-instructions');
    }
  }

  // Create .gitignore
  const gitignoreContent = generateGitignore();
  await writeFile(join(targetDir, '.gitignore'), gitignoreContent);
  await reportStep('write-gitignore');

  // Install skills using skills CLI
  await reportStep('install-skills');
  await installSkills(config, targetDir);
  await reportStep('install-skills-complete');
}

function stripSimpleMemSection(content: string): string {
  return content.replace(/\n## SimpleMem Instructions[\s\S]*?<!-- SIMPLEMEM:END -->\n?/g, '\n');
}

function stripReliefPilotRequirement(content: string): string {
  return content.replace(
    /## 0\. Critical Requirement[\s\S]*?\n## 1\. Mandatory Protocols\n/,
    '## 1. Mandatory Protocols\n'
  );
}

function applyCreatorTools(content: string, toolsBlock: string): string {
  const normalizedTools = toolsBlock.trim();
  return content.replace(/^tools:.*$/m, normalizedTools);
}
