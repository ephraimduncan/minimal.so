# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: v0.1.0 Changelog + Release Tag

## Context
Last release was v0.0.1 (Jan 27, 2026). ~15 commits since then with significant features. `package.json` already at `0.1.0`. User wants a minor version bump → v0.1.0 aligns with both semver and existing package.json.

## Steps

### 1. Add v0.1.0 entry to `app/changelog/page.tsx`
Prepend new entry to the `changelog` array with today's date (February 11, 2026).

**Added:**
- RSS/Atom feeds for public profiles (#49)...

