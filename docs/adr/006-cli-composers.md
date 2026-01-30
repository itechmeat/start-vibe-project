# ADR-006: CLI Composers Pattern

## Status

**Accepted**

## Context

The CLI entry point (`src/cli/index.ts`) had grown to over 470 lines, handling multiple responsibilities:

- Project name validation and input
- Template selection
- Component selection (frontend, backend, database, auth)
- Stack selection (frontend, backend, database)
- AI tool selection
- Feature toggles (Relief Pilot, SimpleMem)
- Project summary display
- Error handling
- Success messaging

This violated the Single Responsibility Principle and made the code difficult to test and maintain.

## Decision

We will refactor the CLI into a **composers pattern** with the following structure:

```
src/cli/composers/
├── prompts.ts      # All user input collection
├── display.ts      # UI display and formatting
├── error-handler.ts # Error handling and exit
└── utils.ts        # Utility functions (path safety)
```

### Composer Responsibilities

1. **prompts.ts**: All user interaction through @clack/prompts
   - `askProjectName()` - Project name with validation
   - `selectTemplate()` - Template selection
   - `askDescription()` - Project description
   - `selectComponents()` - Component multi-select
   - `selectStack()` - Technology stack selection
   - `selectAiTool()` - AI tool selection
   - `selectYesNo()` - Boolean confirmations
   - `confirmProjectCreation()` - Final confirmation

2. **display.ts**: All UI output formatting
   - `showSummary()` - Project configuration summary
   - `showSuccessMessage()` - Post-creation instructions
   - `showIntro()` - CLI banner
   - `showOutro()` - Gradient farewell message
   - `applyHorizontalGradient()` - Text color gradients

3. **error-handler.ts**: Error handling
   - `handleCliError()` - Centralized error handling

4. **utils.ts**: Helper utilities
   - `assertPathWithin()` - Path traversal protection
   - `safeTrashPath()` - Safe file deletion

## Consequences

### Positive

- **Single Responsibility**: Each composer has one clear purpose
- **Testability**: Composers can be tested in isolation
- **Reusability**: Display functions can be reused across different flows
- **Maintainability**: Changes to prompts don't affect display logic
- **Readability**: Main CLI flow is now ~150 lines and reads like a story

### Negative

- **More files**: Code is spread across multiple files
- **Import overhead**: More imports in the main CLI file
- **Learning curve**: New developers need to understand the composer structure

## Example Usage

```typescript
// Before: All in one 470-line file
async function runCli() {
  // 400+ lines of mixed concerns
}

// After: Composed from focused modules
async function runCli() {
  showIntro();
  
  const projectName = await askProjectName();
  const template = await selectTemplate();
  // ... more prompts
  
  showSummary(projectName, template, ...);
  
  if (await confirmProjectCreation()) {
    await createProject(...);
    showSuccessMessage(projectName);
    showOutro();
  }
}
```

## Related Decisions

- ADR-001: Clean Architecture (composers are part of the CLI layer)
- ADR-002: Result Type (composers use Result for error handling)

## References

- [Composers Pattern](../ARCHITECTURE.md#composers-pattern)
- Original implementation: `src/cli/index.ts` (pre-refactor)
