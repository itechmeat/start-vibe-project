# AI Coding Instructions

## 1. Critical Requirement

- **MANDATORY**: Agent MUST follow the instructions in `.github/instructions/relief-pilot.instructions.md` and `.github/instructions/common.instructions.md` at all times.

### 3 Rebuild & Relink (Required)
- After modifying project code, you MUST rebuild and relink the package: `bun run typecheck && bun run lint && bun run build && bun link`
