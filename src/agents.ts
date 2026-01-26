import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

export type AgentType =
  | 'github-copilot'
  | 'claude-code'
  | 'opencode'
  | 'codex'
  | 'cursor'
  | 'windsurf'
  | 'cline'
  | 'continue'
  | 'amp'
  | 'roo'
  | 'goose';

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  skillsDir: string;
  agentsDir: string;
  globalSkillsDir: string;
  detectInstalled: () => Promise<boolean>;
}

const home = homedir();

export const agents: Record<AgentType, AgentConfig> = {
  'github-copilot': {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    agentsDir: '.github/agents',
    globalSkillsDir: join(home, '.copilot/skills'),
    detectInstalled: async () => {
      return existsSync(join(process.cwd(), '.github')) || existsSync(join(home, '.copilot'));
    },
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    agentsDir: '.claude/agents',
    globalSkillsDir: join(home, '.claude/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.claude'));
    },
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skills',
    agentsDir: '.opencode/agents',
    globalSkillsDir: join(home, '.config/opencode/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.config/opencode'));
    },
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    agentsDir: '.codex/agents',
    globalSkillsDir: join(home, '.codex/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.codex'));
    },
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    agentsDir: '.cursor/agents',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.cursor'));
    },
  },
  windsurf: {
    name: 'windsurf',
    displayName: 'Windsurf',
    skillsDir: '.windsurf/skills',
    agentsDir: '.windsurf/agents',
    globalSkillsDir: join(home, '.codeium/windsurf/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.codeium/windsurf'));
    },
  },
  cline: {
    name: 'cline',
    displayName: 'Cline',
    skillsDir: '.cline/skills',
    agentsDir: '.cline/agents',
    globalSkillsDir: join(home, '.cline/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.cline'));
    },
  },
  continue: {
    name: 'continue',
    displayName: 'Continue',
    skillsDir: '.continue/skills',
    agentsDir: '.continue/agents',
    globalSkillsDir: join(home, '.continue/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.continue'));
    },
  },
  amp: {
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.agents/skills',
    agentsDir: '.agents/agents',
    globalSkillsDir: join(home, '.config/agents/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.config/amp'));
    },
  },
  roo: {
    name: 'roo',
    displayName: 'Roo Code',
    skillsDir: '.roo/skills',
    agentsDir: '.roo/agents',
    globalSkillsDir: join(home, '.roo/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.roo'));
    },
  },
  goose: {
    name: 'goose',
    displayName: 'Goose',
    skillsDir: '.goose/skills',
    agentsDir: '.goose/agents',
    globalSkillsDir: join(home, '.config/goose/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.config/goose'));
    },
  },
};

export function getAgentConfig(type: AgentType): AgentConfig {
  return agents[type];
}

export async function detectInstalledAgents(): Promise<AgentType[]> {
  const installed: AgentType[] = [];
  for (const [type, config] of Object.entries(agents)) {
    if (await config.detectInstalled()) {
      installed.push(type as AgentType);
    }
  }
  return installed;
}
