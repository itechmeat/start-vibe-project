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

export const mobileFrontendStacks: FrontendStack[] = [
  { id: 'react-native', name: 'React Native' },
  { id: 'flutter', name: 'Flutter' },
  { id: 'ios-swift', name: 'Native iOS (Swift)' },
  { id: 'android-kotlin', name: 'Native Android (Kotlin)' },
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

export interface DatabaseStack {
  id: string;
  name: string;
}

export const databaseStacks: DatabaseStack[] = [
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'mongodb', name: 'MongoDB' },
  { id: 'turso', name: 'Turso' },
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
  databaseStack?: string;
  aiTool: string;
  useSimpleMem?: boolean;
  useReliefPilot?: boolean;
}
