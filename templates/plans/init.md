# Project Initialization Checklist

> **AI Tool**: {{aiTool}}
> **Template**: {{templateName}}
> **Created**: {{createdDate}}

This checklist guides the `creator` agent through project initialization.
Mark items as complete by changing `[ ]` to `[x]`.

---

## Phase 1: Project Foundation

- [x] **Deploy project directory** — Project scaffolded via `start-vibe-project`
- [ ] **Complete about.md** — User confirmed project description is complete
  - Check if user has PreVibe research document to accelerate this step
  - Ensure Vision, Problem, Goals, Target Audience, and Features are defined
- [ ] **Complete specs.md** — User confirmed technical specifications
  - Validate consistency with about.md
  - Define all technology versions and constraints

## Phase 2: Skills Discovery

- [ ] **List available skills from priority sources** — Run:
{{prioritySkillList}}
  - Review which skills match project's technology stack from specs.md
  - Inform user which skills will be installed
- [ ] **Install matching skills by source (after specs.md and architecture.md are complete)** — Run: `npx skills add <source> -a {{aiTool}} -s skill1 -s skill2 -y` once per source
  - Install only skills relevant to project's tech stack
- [ ] **Search for missing skills** — Check https://skills.sh/?q=[technology] for additional skills
  - For each missing technology, search and install: `npx skills add [skill-package] -a {{aiTool}} -y`

## Phase 3: Architecture & Context

- [ ] **Complete architecture.md** — User confirmed system architecture
  - Validate consistency with specs.md
  - Include diagrams if complex system
- [ ] **Complete project-context.md** — Initialize living context document
  - Add key decisions made during setup
  - Note any constraints or assumptions

## Phase 4: User Stories

- [ ] **Complete stories/stories.md** — User confirmed story list is complete
  - Derive stories from Features in about.md
  - Prioritize for MVP
- [ ] **Create Story #1 (Project setup & baseline)** — Must be the first story
  - Include dependency install, environment setup, scripts, and optional Docker
  - Create the corresponding story file in stories/
- [ ] **Create individual story files** — One file per story in stories/
  - Include acceptance criteria
  - Link to relevant architecture components

## Phase 5: Final Review

- [ ] **Review installed skills** — Check if any additional skills needed for stories
  - If yes, repeat skills discovery for missing technologies
- [ ] **User confirms initialization complete** — All documents reviewed and approved

## Phase 6: OpenSpec First Story Planning

- [ ] **Verify OpenSpec is installed** — If missing, suggest installation:
  - https://openspec.dev/
  - `npm install -g @fission-ai/openspec@latest`
- [ ] **Initialize OpenSpec** — Run: `openspec init`
- [ ] **Plan first story** — Run: `{{opsxFFCommand}}`

---

## Completion

When user confirms initialization is complete:
1. Delete this INIT.md file
2. Summarize what was created
3. Suggest next steps for development

---

## Technical Details

```
Project: {{name}}
AI Tool: {{aiTool}}
Template: {{templateName}}
Components:
  - Frontend: {{frontendComponent}}
  - Backend: {{backendComponent}}
  - Database: {{databaseComponent}}
  - Auth: {{authComponent}}
```
