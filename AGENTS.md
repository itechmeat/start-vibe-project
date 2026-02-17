<!-- SIMPLEMEM:START -->
## SimpleMem Instructions

**SimpleMem** — persistent conversational memory across sessions.

### When to SAVE (proactively):
- Important decisions or commitments made in conversation
- Complex solutions that took effort to uncover
- Context from long discussions worth preserving
- User preferences, project-specific knowledge

### When to QUERY (before answering):
- Questions about past conversations
- Resuming work from previous sessions
- Building on earlier discussion topics

### MCP Tools (preferred):
```
mcp_simplemem_memory_add      — save dialogue
mcp_simplemem_memory_query    — ask questions about past
mcp_simplemem_memory_retrieve — browse raw entries
mcp_simplemem_memory_stats    — check status
```

### Usage pattern:
1. **Start of session**: Query memories for relevant context
2. **During work**: Save important decisions/solutions
3. **End of session**: Save summary of key outcomes
<!-- SIMPLEMEM:END -->

<!-- CUSTOM:START -->
## 1. Build & Verify

After every code change:
```bash
bun run typecheck && bun run lint && bun run build && bun link
```

## 2. Timeouts

- **ALWAYS** specify `timeout` for `execute_command` (e.g., 30000ms)
- Set timeouts for HTTP requests (e.g., `httpx.AsyncClient(timeout=10.0)`)
- Max single wait: 5 minutes; may extend by another 5 min if still running
- Max total duration: 30 minutes

## 3. Git Safety

**FORBIDDEN** (modifies repo/history):
- `git commit`, `push`, `reset`, `rebase`, `merge`, `cherry-pick`, `revert`, `checkout`, `switch`, `pull`, `fetch --prune`, `clean`

**ALLOWED** (read-only):
- `git status`, `diff`, `log`, `show`, `blame`, `grep`

**File deletion**: use `trash` instead of `rm -rf`

## 4. Code Quality

**PROHIBITED**:
- Silent fallbacks (`or "default"`, `get() or fallback`)
- Mock/stub implementations
- Hardcoded credentials or API keys
- Generic error messages
- Bare `except:` clauses

**REQUIRED**:
- Explicit error handling (fail fast)
- Real implementations only
- `TODO`/`FIXME` comments for unimplemented features
- ENV variables for configuration
<!-- CUSTOM:END -->
