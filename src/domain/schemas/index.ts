import { z } from 'zod';

export const ProjectComponentsSchema = z.object({
  frontend: z.boolean(),
  backend: z.boolean(),
  database: z.boolean(),
  auth: z.boolean(),
});

export const ProjectConfigSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .regex(
        /^[a-z][a-z0-9-]*$/,
        'Name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens'
      ),
    template: z.enum(['web-app', 'mobile-app', 'api-service']),
    description: z.string().default(''),
    components: ProjectComponentsSchema,
    frontendStack: z.string().optional(),
    backendStack: z.string().optional(),
    databaseStack: z.string().optional(),
    aiTool: z.string(),
    useSimpleMem: z.boolean().optional().default(false),
    useReliefPilot: z.boolean().optional().default(false),
  })
  .refine((d) => !d.components.frontend || Boolean(d.frontendStack), {
    path: ['frontendStack'],
    message: 'Frontend stack is required when frontend is enabled',
  })
  .refine((d) => !d.components.backend || Boolean(d.backendStack), {
    path: ['backendStack'],
    message: 'Backend stack is required when backend is enabled',
  })
  .refine((d) => !d.components.database || Boolean(d.databaseStack), {
    path: ['databaseStack'],
    message: 'Database stack is required when database is enabled',
  });

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type ProjectComponents = z.infer<typeof ProjectComponentsSchema>;

export const SkillRegistrySkillSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});

export const SkillRegistrySourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  skills: z.array(SkillRegistrySkillSchema),
});

export const SkillRegistrySchema = z.object({
  start_skills: z.array(SkillRegistrySourceSchema),
  priority_repos: z.array(z.string()).optional(),
});

export type SkillRegistrySkill = z.infer<typeof SkillRegistrySkillSchema>;
export type SkillRegistrySource = z.infer<typeof SkillRegistrySourceSchema>;
export type SkillRegistry = z.infer<typeof SkillRegistrySchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const StackSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Stack = z.infer<typeof StackSchema>;

export const AgentConfigSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  skillsDir: z.string(),
  agentsDir: z.string(),
  globalSkillsDir: z.string(),
  detectInstalled: z.custom<() => Promise<boolean>>((val) => typeof val === 'function'),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export type AgentType =
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
