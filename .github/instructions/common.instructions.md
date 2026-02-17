---
name: common
description: Common instructions for any agent
applyTo: **
---

## 1. Mandatory Protocols

### 1.1 Final Reporting (`ask_report`) — CRITICAL

**⚠️ VIOLATION = PROJECT FAILURE**

- **EVERY** response MUST end with `ask_report` — no exceptions
- Complete answer/report must be inside `ask_report`, not plain text
- Applies to: answers, clarifications, error reports, partial results, everything
- **Empty user reply handling**: if user response after `ask_report` is empty/blank — retry with restructured output (same content, different format/parameters)

### 1.3 Skills & Docs Attribution

Every final report MUST include at the end:
- `Skills used: <list>` — if any skills were consulted
- `Docs used: <list>` — if any external documentation was fetched, on the new line of the report

## 2. Task-Specific Workflows

### 2.1 Code Review Request

When user asks to review changed files:
1. Run `git diff` or `git status` to identify uncommitted changes
2. Use `coderabbit` skill — execute its review script
3. Present CodeRabbit report to user
4. Ask which issues to fix, provide recommendations
5. **Ignore** suggestions for archived changes (`openspec/changes/archive/`) or outdated documents

Agent run must NOT require git operations that modify the repository.
Human performs commit/push manually outside agent run.

### 2.2 Changelog Request

When user asks to write changelog (before commit):
  1. Use `changelog` skill for format. Changelog content should be informative yet concise — find the right balance to reflect only what is truly useful to readers. Summarize minor changes as "refactoring/improvements/fixes" as appropriate. Write/update CHANGELOG.md with `[Unreleased]` section.
  2. After that, propose text for Release notes, commit message, and Pull Request description considering all changes made in the project (use `commits` skill). Create a new RELEASE.md file in project root:
    - Brief confirmation: "Changelog is ready" if it's really ready (or error details)
    - 3 branch name options (conventional: `feat/`, `fix/`, `refactor/`, etc.)
    - 3 commit message variants (short/medium/detailed) following Conventional Commits
    - Pull Request description (summarized, not full changelog)
    - Release notes
