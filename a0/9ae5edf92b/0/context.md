# Session Context

## User Prompts

### Prompt 1

[Request interrupted by user for tool use]

### Prompt 2

Implement the following plan:

# Merge `main` into `feat/export`

## Context

`feat/export` adds bookmark export (CSV/JSON) via 5 commits. Meanwhile `main` diverged with ~35 commits adding public profiles, avatar uploads, nuqs URL state, visibility toggles, RSS feeds, admin dashboard, etc. 5 files conflict. Goal: keep everything from both branches.

## Strategy

Merge `main` into `feat/export`. For each conflict, use **main's architecture as the base** and graft feat/export's export features int...

