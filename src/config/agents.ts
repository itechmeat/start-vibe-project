import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type AgentType =
  // Source of truth: https://github.com/vercel-labs/skills/blob/main/README.md#supported-agents
  // (table between <!-- available-agents:start --> and <!-- available-agents:end -->)
  | 'amp'
  | 'antigravity'
  | 'claude-code'
  | 'clawdbot'
  | 'cline'
  | 'codebuddy'
  | 'codex'
  | 'command-code'
  | 'continue'
  | 'crush'
  | 'cursor'
  | 'droid'
  | 'gemini-cli'
  | 'github-copilot'
  | 'goose'
  | 'kilo'
  | 'kiro-cli'
  | 'mcpjam'
  | 'mux'
  | 'opencode'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'roo'
  | 'trae'
  | 'windsurf'
  | 'zencoder'
  | 'neovate';

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
  'gemini-cli': {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    agentsDir: '.gemini/agents',
    globalSkillsDir: join(home, '.gemini/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.gemini'));
    },
  },
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
  amp: {
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.agents/skills',
    agentsDir: '.agents/agents',
    globalSkillsDir: join(home, '.config/agents/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.config/amp')) || existsSync(join(home, '.config/agents'));
    },
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agent/skills',
    agentsDir: '.agent/agents',
    globalSkillsDir: join(home, '.gemini/antigravity/global_skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.gemini/antigravity'));
    },
  },
  clawdbot: {
    name: 'clawdbot',
    displayName: 'Clawdbot',
    skillsDir: 'skills',
    agentsDir: 'agents',
    globalSkillsDir: join(home, '.clawdbot/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.clawdbot'));
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
  codebuddy: {
    name: 'codebuddy',
    displayName: 'CodeBuddy',
    skillsDir: '.codebuddy/skills',
    agentsDir: '.codebuddy/agents',
    globalSkillsDir: join(home, '.codebuddy/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.codebuddy'));
    },
  },
  'command-code': {
    name: 'command-code',
    displayName: 'Command Code',
    skillsDir: '.commandcode/skills',
    agentsDir: '.commandcode/agents',
    globalSkillsDir: join(home, '.commandcode/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.commandcode'));
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
  crush: {
    name: 'crush',
    displayName: 'Crush',
    skillsDir: '.crush/skills',
    agentsDir: '.crush/agents',
    globalSkillsDir: join(home, '.config/crush/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.config/crush'));
    },
  },
  droid: {
    name: 'droid',
    displayName: 'Droid',
    skillsDir: '.factory/skills',
    agentsDir: '.factory/agents',
    globalSkillsDir: join(home, '.factory/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.factory'));
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
  kilo: {
    name: 'kilo',
    displayName: 'Kilo Code',
    skillsDir: '.kilocode/skills',
    agentsDir: '.kilocode/agents',
    globalSkillsDir: join(home, '.kilocode/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.kilocode'));
    },
  },
  'kiro-cli': {
    name: 'kiro-cli',
    displayName: 'Kiro CLI',
    skillsDir: '.kiro/skills',
    agentsDir: '.kiro/agents',
    globalSkillsDir: join(home, '.kiro/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.kiro'));
    },
  },
  mcpjam: {
    name: 'mcpjam',
    displayName: 'MCPJam',
    skillsDir: '.mcpjam/skills',
    agentsDir: '.mcpjam/agents',
    globalSkillsDir: join(home, '.mcpjam/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.mcpjam'));
    },
  },
  mux: {
    name: 'mux',
    displayName: 'Mux',
    skillsDir: '.mux/skills',
    agentsDir: '.mux/agents',
    globalSkillsDir: join(home, '.mux/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.mux'));
    },
  },
  openhands: {
    name: 'openhands',
    displayName: 'OpenHands',
    skillsDir: '.openhands/skills',
    agentsDir: '.openhands/agents',
    globalSkillsDir: join(home, '.openhands/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.openhands'));
    },
  },
  pi: {
    name: 'pi',
    displayName: 'Pi',
    skillsDir: '.pi/skills',
    agentsDir: '.pi/agents',
    globalSkillsDir: join(home, '.pi/agent/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.pi'));
    },
  },
  qoder: {
    name: 'qoder',
    displayName: 'Qoder',
    skillsDir: '.qoder/skills',
    agentsDir: '.qoder/agents',
    globalSkillsDir: join(home, '.qoder/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.qoder'));
    },
  },
  'qwen-code': {
    name: 'qwen-code',
    displayName: 'Qwen Code',
    skillsDir: '.qwen/skills',
    agentsDir: '.qwen/agents',
    globalSkillsDir: join(home, '.qwen/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.qwen'));
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
  trae: {
    name: 'trae',
    displayName: 'Trae',
    skillsDir: '.trae/skills',
    agentsDir: '.trae/agents',
    globalSkillsDir: join(home, '.trae/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.trae'));
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
  zencoder: {
    name: 'zencoder',
    displayName: 'Zencoder',
    skillsDir: '.zencoder/skills',
    agentsDir: '.zencoder/agents',
    globalSkillsDir: join(home, '.zencoder/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.zencoder'));
    },
  },
  neovate: {
    name: 'neovate',
    displayName: 'Neovate',
    skillsDir: '.neovate/skills',
    agentsDir: '.neovate/agents',
    globalSkillsDir: join(home, '.neovate/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.neovate'));
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
