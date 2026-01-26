<!-- OPENSPEC:START -->
## OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.
<!-- OPENSPEC:END -->

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
