# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Vercel React Best Practices Audit — bmrks

**Stack**: Next.js 16.1.1, React 19, TanStack Query 5, oRPC, Prisma + libsql, Tailwind 4, shadcn/ui

---

## Scorecard

| # | Category | Impact | Score | Notes |
|---|----------|--------|-------|-------|
| 1 | Eliminating Waterfalls | CRITICAL | B+ | Server pages excellent, two RPC procedures have sequential awaits |
| 2 | Bundle Size | CRITICAL | A | Dynamic imports, conditional queries, deferred analytics |
| 3 | Ser...

### Prompt 2

## Context

- Current git status: On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .claude/settings.local.json
	modified:   components/bookmark-list.tsx
	modified:   components/dashboard-content.tsx
	modified:   components/header.tsx
	modified:   hooks/use-focus-refetch.ts
	modified:   server/procedures/bookm...

