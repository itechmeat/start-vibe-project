export function getStackDisplayName(stack: string): string {
  const names: Record<string, string> = {
    'react-vite': 'React + Vite',
    'nextjs': 'Next.js',
    'vue': 'Vue.js',
    'nuxtjs': 'Nuxt.js',
    'fastapi': 'FastAPI',
    'django': 'Django',
    'flask': 'Flask',
    'express': 'Express.js',
    'nestjs': 'NestJS',
    'other': 'To be specified',
  };
  return names[stack] || stack;
}

export function getTemplateDisplayName(template: string): string {
  return template.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getOpsxFFCommand(aiTool: string): string {
  const dashSyntaxTools = new Set(['github-copilot', 'cursor', 'windsurf']);
  return dashSyntaxTools.has(aiTool) ? '/opsx-ff initial-setup' : '/opsx:ff initial-setup';
}

export function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/

# Misc
.cache/
tmp/
`;
}

export function formatComponentDisplay({
  enabled,
  stack,
  label,
}: {
  enabled: boolean;
  stack: string | undefined;
  label: string;
}): string {
  if (!enabled) {
    return 'No';
  }

  if (!stack) {
    throw new Error(`${label} is required when the component is enabled.`);
  }

  return `Yes (${stack})`;
}

export function applyTemplate(template: string, values: Record<string, string>): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    result = result.split(`{{${key}}}`).join(value);
  }

  const unresolved = Array.from(result.matchAll(/\{\{([^}]+)\}\}/g)).map(match => match[1]);
  if (unresolved.length > 0) {
    const uniqueUnresolved = Array.from(new Set(unresolved));
    throw new Error(`Template placeholders not resolved: ${uniqueUnresolved.join(', ')}`);
  }

  return result;
}
