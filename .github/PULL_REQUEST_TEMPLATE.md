## Summary

<!-- What changes, and why. One paragraph. -->

## Type of change

- [ ] `feat:` new user-facing capability (minor bump)
- [ ] `fix:` bug fix (patch bump)
- [ ] `feat!:` or `BREAKING CHANGE:` (major bump)
- [ ] `chore:` / `docs:` / `ci:` / `refactor:` (no release)
- [ ] Spec bump (ships on its own PR — see `AGENTS.md`)

## Checklist

- [ ] Conventional Commit subject on every commit (enforced by husky/commitlint).
- [ ] `pnpm typecheck && pnpm build && pnpm test` all pass locally.
- [ ] `packages/sdk/src/generated.ts` untouched unless `pnpm generate` regenerated it.
- [ ] Updated `SKILL.md`, `README.md`, or `AGENTS.md` if behavior, flags, or commands changed.
- [ ] Scope stays within generic SDK/CLI/MCP — no downstream business logic.
