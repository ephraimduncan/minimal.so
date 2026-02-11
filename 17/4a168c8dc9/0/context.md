# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Fix useEffect Anti-Patterns

## Context
Audit found **17 useEffect instances** across 16 files. 9 are legitimate (external system sync, event listeners, timers). **8 are improvable** — ranging from clear anti-patterns to minor cleanup. One has an actual bug (missing dependency).

---

## Fixes (by priority)

### 1. `hooks/use-mobile.ts` — useSyncExternalStore ⬆️ HIGH
**Anti-pattern**: useEffect + useState subscribing to `window.matchMedia`
**Fix**: ...

### Prompt 2

## Context

- Current git status: On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .claude/settings.local.json
	modified:   components/bulk-move-dialog.tsx
	modified:   components/dashboard-content.tsx
	modified:   components/export-dialog.tsx
	modified:   components/header.tsx
	modified:   components/setting...

