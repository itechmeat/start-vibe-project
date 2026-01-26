# start-vibe-project

Initialize a new project with AI-first documentation structure for spec-driven development using OpenSpec.

## Quick Start

### Using bun (recommended)

```bash
bunx start-vibe-project my-project
```

Or run interactively:

```bash
bunx start-vibe-project
```

### Using npm/npx

```bash
npx start-vibe-project my-project
```

Or run interactively:

```bash
npx start-vibe-project
```

## Features

- **Interactive setup**: Guided CLI prompts to configure your project
- **AI-first documentation**: Pre-structured `.project/` folder for AI agents
- **Multiple templates**: Web app, mobile app, API service, library, or empty project
- **Tech stack selection**: Choose frontend and backend frameworks
- **Multi-agent support**: Works with GitHub Copilot, Claude Code, Cursor, and more
- **Automatic skill installation**: Installs essential skills for your AI tool

## What Gets Created

```
my-project/
├── .project/
│   ├── INIT.md           # Project setup checklist for the creator agent
│   ├── about.md          # Project overview (pre-filled with your description)
│   ├── specs.md          # Technical specifications (with your stack choices)
│   ├── architecture.md   # System architecture (to be defined by agent)
│   ├── project-context.md # Living context document
│   └── stories/
│       └── stories.md    # User stories (to be defined)
├── .github/skills/       # Skills for your AI tool (or .claude/, .cursor/, etc.)
├── .github/agents/
│   └── creator.md        # Project Creator agent
├── .github/instructions/relief-pilot.instructions.md # Relief Pilot instructions (GitHub Copilot only, if enabled)
├── .github/copilot-instructions.md # Copilot instructions (if Relief Pilot is enabled)
├── .editorconfig         # Editor configuration
├── AGENTS.md             # Agent instructions
└── .gitignore
```

## Workflow

1. **Run the CLI**: `bunx start-vibe-project` (or `npx start-vibe-project`)
2. **Answer prompts**: Name, template, description, components, stack, AI tool
3. **Open in your AI tool**: VS Code with Copilot, Claude Code, Cursor, etc.
4. **Select `creator` agent**: The agent will continue project documentation
5. **Follow agent instructions**: Complete about.md, specs.md, architecture.md, stories

## Supported AI Tools

| Tool | Skills Path | Agents Path |
|------|-------------|-------------|
| GitHub Copilot | `.github/skills/` | `.github/agents/` |
| Claude Code | `.claude/skills/` | `.claude/agents/` |
| OpenCode | `.opencode/skills/` | `.opencode/agents/` |
| Codex | `.codex/skills/` | `.codex/agents/` |
| Cursor | `.cursor/skills/` | `.cursor/agents/` |
| Windsurf | `.windsurf/skills/` | `.windsurf/agents/` |
| Cline | `.cline/skills/` | `.cline/agents/` |
| Continue | `.continue/skills/` | `.continue/agents/` |
| Amp | `.agents/skills/` | `.agents/agents/` |
| Roo Code | `.roo/skills/` | `.roo/agents/` |
| Goose | `.goose/skills/` | `.goose/agents/` |

## Installed Skills

The following skills are automatically installed:

- **commits**: Conventional Commits specification
- **skill-master**: Create and edit Agent Skills
- **coderabbit**: AI code review
- **changelog**: Keep a Changelog format
- **openspec**: OpenSpec artifact-driven workflow
- **social-writer**: Social media content creation
- **project-creator**: Project documentation scaffolding
- **ask-questions-if-underspecified**: Prompts for clarifying requirements

```sh
npx add-skill itechmeat/llm-code -a github-copilot -a claude-code -s commits -s skill-master -s coderabbit -s changelog -s openspec -s social-writer -s project-creator
```

```sh
npx add-skill https://github.com/trailofbits/skills -a [ai-tool] -s ask-questions-if-underspecified
```

## Templates

| Template | Description |
|----------|-------------|
| Web Application | Full-stack or frontend web application |
| Mobile Application | iOS, Android, or cross-platform mobile app |
| API Service | Backend REST or GraphQL API service |
| Library / Package | Reusable library or npm package |
| Empty Project | Blank project with just documentation structure |

## Development

### Local testing (without publishing to npm)

Link the package globally:

```bash
bun link
```

Now you can run it from anywhere:

```bash
start-vibe-project my-test-project
```

Or run directly from source:

```bash
bun run dev
```

### Unlink after testing

```bash
bun unlink start-vibe-project
```

### Build

```bash
bun run build
```

## License

MIT
