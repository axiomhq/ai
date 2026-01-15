Study spec.md and pick the next thing to do
The big picture context of your work can be seen in @docs/design/trials-api-options.md
A task is only done when the following pass:
- `pnpm build`
- `pnpm test`
- `pnpm format:check` (you can fix with `pnpm format`)
- `pnpm lint`
- `pnmp typecheck`
Make sure you check off each task as you complete it
If you want to leave notes for future agents, leave them in @memory.md
If something in @memory.md is no longer relevant, remove it
Every time a task is complete, commit. Use conventional commit syntax.