export type SkillSource = {
  id: string;
  label: string;
  priority: number;
  listOnInit: boolean;
};

const PRIORITY_SKILL_SOURCES: SkillSource[] = [
  {
    id: 'itechmeat/llm-code',
    label: 'itechmeat/llm-code',
    priority: 1,
    listOnInit: false,
  },
  {
    id: 'ancoleman/ai-design-components/skills',
    label: 'ancoleman/ai-design-components/skills',
    priority: 2,
    listOnInit: true,
  },
];

export function getPrioritySkillSources(): SkillSource[] {
  return [...PRIORITY_SKILL_SOURCES].sort((a, b) => a.priority - b.priority);
}
