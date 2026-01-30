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
Do this after every code change:
`bun run typecheck && bun run lint && bun run build && bun link`
<!-- CUSTOM:END -->
