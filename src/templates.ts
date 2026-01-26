export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
}

export const templates: ProjectTemplate[] = [
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Full-stack or frontend web application',
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application',
    description: 'iOS, Android, or cross-platform mobile app',
  },
  {
    id: 'api-service',
    name: 'API Service',
    description: 'Backend REST or GraphQL API service',
  },
  {
    id: 'library',
    name: 'Library / Package',
    description: 'Reusable library or npm package',
  },
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Blank project with just documentation structure',
  },
];

export interface FrontendStack {
  id: string;
  name: string;
}

export const frontendStacks: FrontendStack[] = [
  { id: 'react-vite', name: 'React + Vite' },
  { id: 'nextjs', name: 'Next.js' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'nuxtjs', name: 'Nuxt.js' },
  { id: 'other', name: 'Other (to be specified by agent)' },
];

export interface BackendStack {
  id: string;
  name: string;
}

export const backendStacks: BackendStack[] = [
  { id: 'fastapi', name: 'FastAPI (Python)' },
  { id: 'django', name: 'Django (Python)' },
  { id: 'flask', name: 'Flask (Python)' },
  { id: 'express', name: 'Express.js (Node.js)' },
  { id: 'nestjs', name: 'NestJS (Node.js)' },
  { id: 'other', name: 'Other (to be specified by agent)' },
];

export interface ProjectComponents {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  auth: boolean;
}

export interface ProjectConfig {
  name: string;
  template: string;
  description: string;
  components: ProjectComponents;
  frontendStack?: string;
  backendStack?: string;
  aiTool: string;
  useSimpleMem?: boolean;
  useReliefPilot?: boolean;
}
