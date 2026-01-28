import type { ProjectConfig } from '../../config/templates.js';
import { loadTemplate } from './assets.js';
import {
  applyTemplate,
  formatComponentDisplay,
  getOpsxFFCommand,
  getTemplateDisplayName,
} from './text-utils.js';
import { loadSkillRegistry } from './skills';

export async function generateInitMd(config: ProjectConfig): Promise<string> {
  const templateName = getTemplateDisplayName(config.template);
  const createdDate = new Date().toISOString().split('T')[0];
  const opsxFFCommand = getOpsxFFCommand(config.aiTool);

  const frontendComponent = formatComponentDisplay({
    enabled: config.components.frontend,
    stack: config.frontendStack,
    label: 'frontendStack',
  });
  const backendComponent = formatComponentDisplay({
    enabled: config.components.backend,
    stack: config.backendStack,
    label: 'backendStack',
  });

  const registry = await loadSkillRegistry();
  const priorityRepos = registry.priority_repos ?? [];
  const prioritySkillList =
    priorityRepos.length > 0
      ? priorityRepos.map((repo: string) => `  - \`npx skills add ${repo} --list\``).join('\n')
      : '  - _No priority repos configured in skill-registry.json_';

  const template = await loadTemplate('plans/init.md');
  return applyTemplate(template, {
    aiTool: config.aiTool,
    templateName,
    createdDate,
    name: config.name,
    frontendComponent,
    backendComponent,
    databaseComponent: config.components.database ? 'Yes' : 'No',
    authComponent: config.components.auth ? 'Yes' : 'No',
    opsxFFCommand,
    prioritySkillList,
  });
}
