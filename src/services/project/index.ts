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

export async function createProject(config: ProjectConfig, targetDir: string): Promise<void> {
  // Create project directory
  await mkdir(targetDir, { recursive: true });

  // Create .project directory structure
  await mkdir(join(targetDir, '.project', 'stories'), { recursive: true });

  // Get agent config for skills/agents paths
  const agentConfig = getAgentConfig(config.aiTool as AgentType);

  // Create agent-specific directories
  await mkdir(join(targetDir, agentConfig.skillsDir), { recursive: true });
  await mkdir(join(targetDir, agentConfig.agentsDir), { recursive: true });

  // Create INIT.md checklist for the creator agent
  const initContent = await generateInitMd(config);
  await writeFile(join(targetDir, '.project', 'INIT.md'), initContent);

  // Create about.md with user's description
  const aboutContent = generateAboutMd(config);
  await writeFile(join(targetDir, '.project', 'about.md'), aboutContent);

  // Create specs.md with stack info
  const specsContent = generateSpecsMd(config);
  await writeFile(join(targetDir, '.project', 'specs.md'), specsContent);

  // Create architecture.md
  const architectureContent = generateArchitectureMd(config);
  await writeFile(join(targetDir, '.project', 'architecture.md'), architectureContent);

  // Create empty project-context.md
  await writeFile(
    join(targetDir, '.project', 'project-context.md'),
    '# Project Context\n\n_Living document that grows with the project._\n'
  );

  // Create stories.md
  const storiesContent = generateStoriesMd(config);
  await writeFile(join(targetDir, '.project', 'stories', 'stories.md'), storiesContent);

  // Create AGENTS.md
  const agentsMdTemplate = await loadFileAsset('AGENTS.md');
  const agentsMdContent = config.useSimpleMem
    ? agentsMdTemplate
    : stripSimpleMemSection(agentsMdTemplate);
  await writeFile(join(targetDir, 'AGENTS.md'), agentsMdContent);

  // Create creator.md agent
  let creatorAgentContent = await loadTemplate('agents/creator.md');
  if (config.useReliefPilot) {
    const creatorTools = await loadTemplate('agents/creator-tools.md');
    creatorAgentContent = applyCreatorTools(creatorAgentContent, creatorTools);
  }
  await writeFile(join(targetDir, agentConfig.agentsDir, 'creator.md'), creatorAgentContent);

  // Create .editorconfig
  const editorConfigContent = await loadFileAsset('.editorconfig');
  await writeFile(join(targetDir, '.editorconfig'), editorConfigContent);

  // Add Relief Pilot files for GitHub Copilot if enabled
  if (config.useReliefPilot) {
    await mkdir(join(targetDir, '.github', 'instructions'), { recursive: true });
    const copilotInstructions = await loadFileAsset('.github/copilot-instructions.md');
    await writeFile(join(targetDir, '.github', 'copilot-instructions.md'), copilotInstructions);
    const reliefPilotInstructions = await loadFileAsset('.github/instructions/relief-pilot.instructions.md');
    await writeFile(
      join(targetDir, '.github', 'instructions', 'relief-pilot.instructions.md'),
      reliefPilotInstructions
    );
  }

  // Create .gitignore
  const gitignoreContent = generateGitignore();
  await writeFile(join(targetDir, '.gitignore'), gitignoreContent);

  // Install skills using skills CLI
  await installSkills(config, targetDir);
}

function stripSimpleMemSection(content: string): string {
  return content.replace(/\n## SimpleMem Instructions[\s\S]*?<!-- SIMPLEMEM:END -->\n?/g, '\n');
}

function applyCreatorTools(content: string, toolsBlock: string): string {
  const normalizedTools = toolsBlock.trim();
  return content.replace(/^tools:.*$/m, normalizedTools);
}
