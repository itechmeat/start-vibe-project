# Project Initialization Checklist

> **AI Tool**: {{aiTool}}
> **Template**: {{templateName}}
> **Created**: {{createdDate}}

This checklist guides the `creator` agent through project initialization.
Mark items as complete by changing `[ ]` to `[x]`.

---

## Phase 1: Project Foundation

- [x] **Deploy project directory** — Project scaffolded via `start-vibe-project`
- [x] **Git repository initialized** — Automatically done by CLI
- [ ] **Complete about.md** — User confirmed project description is complete
  - Check if user has PreVibe research document to accelerate this step
  - Ensure Vision, Problem, Goals, Target Audience, and Features are defined
- [ ] **Complete specs.md** — User confirmed technical specifications
  - Validate consistency with about.md
  - **⛔ MANDATORY**: Use `deps-dev` skill to find latest stable versions for ALL packages
    - Read the `deps-dev` skill first
    - Call API for EACH package and **WAIT for actual response**
    - Parse `isDefault: true` from API response to get stable version
    - If data is truncated, filter for `isDefault` flag before extracting version
    - **NEVER propose versions before API confirms them**
    - Never guess versions or use "^18.x"/"latest"/"TBD" placeholders
  - Define all technology versions and constraints
  - **⛔ BLOCKER**: After specs.md — MUST complete Phase 2 (Skills Discovery) before architecture
- [ ] **Create README.md** — Basic project description
  - Include project name, brief description based on about.md
  - Add setup instructions placeholder (will be updated in final story)

## Phase 2: Skills Discovery

> ⛔ **BLOCKER — Required Before Architecture**
> **DO NOT proceed to Phase 3 until all items in Phase 2 are checked.**
> Install skills matching your tech stack from specs.md.
> Skills provide patterns, templates, and best practices that improve architecture quality.
> Verify: `{{skillsDir}}` directory contains relevant skills.
>
> ⛔ **AI TOOL RESTRICTION**: Use ONLY `{{aiTool}}` — installing for other AI tools is FORBIDDEN.

- [ ] **List available skills from priority sources** — Run:
{{prioritySkillList}}
  - Review which skills match project's technology stack from specs.md
  - Inform user which skills will be installed
- [ ] **Install matching skills by source** — Run: `npx skills add <source> -a {{aiTool}} -s skill1 -s skill2 -y` once per source
  - **⛔ FORBIDDEN**: Using any `-a` value other than `{{aiTool}}`
  - Install only skills relevant to project's tech stack
- [ ] **⛔ MANDATORY — Search for remaining skills using `find-skills`**:
  - Compare specs.md tech stack with installed skills — identify gaps
  - Read the `find-skills` skill and follow its instructions
  - For each missing technology, search using `find-skills` skill
  - Install found skills: `npx skills add [skill-package] -a {{aiTool}} -y`
  - **DO NOT SKIP** — this step is required even if priority sources covered some technologies
- [ ] **Verify skills are loaded** — Confirm all installed skills appear in `{{skillsDir}}`
  - **⛔ BLOCKER**: DO NOT proceed to Phase 3 until skills are verified

## Phase 3: Architecture & Context

> ⛔ **BLOCKER — Prerequisites Required**:
> - [ ] Phase 2 is FULLY complete (all checkboxes marked)
> - [ ] `{{skillsDir}}` directory exists AND contains skills
> - [ ] Skills matching tech stack from specs.md are installed
>
> **If any prerequisite is missing — STOP and return to Phase 2 first.**

- [ ] **Complete architecture.md** — User confirmed system architecture
  - Validate consistency with specs.md
  - **Use Mermaid format for all diagrams** — refer to `pretty-mermaid` skill
  - Include system, sequence, and ER diagrams as needed
- [ ] **Complete project-context.md** — Initialize living context document
  - Add key decisions made during setup
  - Note any constraints or assumptions

## Phase 4: User Stories

- [ ] **Complete stories/stories.md** — User confirmed story list is complete
  - Derive stories from Features in about.md
  - Prioritize for MVP
  - **Last story must include task**: Update README.md with project documentation (installation, usage, configuration, scripts)
- [ ] **Create Story #1 (Project setup & baseline)** — Must be the first story
  - Include dependency install, environment setup, scripts, and optional Docker
  - Include `.env.example` file with required environment variables
  - Create the corresponding story file in stories/
- [ ] **Create individual story files** — One file per story in stories/
  - Include acceptance criteria
  - Link to relevant architecture components

## Phase 5: Pre-OpenSpec Review

- [ ] **Review installed skills** — Check if any additional skills needed for stories
  - If yes, repeat skills discovery for missing technologies
- [ ] **Verify project structure** — Ensure all .project/ files are complete and consistent
- [ ] **User confirms documentation complete** — All documents reviewed and approved

## Phase 6: OpenSpec First Story Planning

> ✅ **Note**: OpenSpec is automatically installed/updated by the CLI.
> Run `openspec init` before any planning to create the artifact graph.

- [x] **OpenSpec installed** — Automatically done by CLI
- [ ] **Initialize OpenSpec** — Run: `openspec init`
  - **Required**: Wait for successful completion
  - Verify `openspec/` folder is created
  - If init fails, resolve errors first
- [ ] **Verify openspec initialization** — Check that `openspec/AGENTS.md` exists
- [ ] **Offer commit for OpenSpec init** — Generate commit message with `commits` skill:
  - Suggest: `chore(openspec): initialize artifact-driven workflow`
  - Present to user and ask if they want to commit
  - User decides (agent does not commit) — wait for confirmation
- [ ] **Plan first story** — Run: `{{opsxFFCommand}}`
  - Run only after `openspec init` succeeds and user confirms

## Phase 7: Story Execution Loop

> ✅ **Required Between Stories**: Refresh skills before each new story.
> Tech stack evolves — new technologies benefit from new skills.
> ⛔ **AI TOOL**: Use ONLY `{{aiTool}}` — never install for other AI tools.

- [ ] **Complete first story implementation** — Follow OpenSpec artifacts
- [ ] **Before next story — Refresh skills**:
  - Re-analyze current tech stack (may have changed)
  - Run `npx skills add <source> --list` for priority sources
  - Identify any new technologies added during implementation
  - Install missing skills: `npx skills add [source] -a {{aiTool}} -s new-skill -y`
  - **⛔ FORBIDDEN**: Using any `-a` value other than `{{aiTool}}`
  - Verify new skills appear in `{{skillsDir}}`
- [ ] **Plan and execute next story** — Repeat skill refresh before each subsequent story

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
