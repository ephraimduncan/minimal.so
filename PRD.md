# PRD: Vercel React Best Practices - bmrks Performance Optimization

## Executive Summary
Apply 45 Vercel React performance rules to bookmark manager. Focus on CRITICAL/HIGH impact optimizations for measurable performance gains.

**Implementation Reference**:
This PRD implements optimizations from the **Vercel React Best Practices** skill located at:
```
@/Users/duncan/.claude/skills/vercel-react-best-practices/
```

When implementing this PRD, the agent MUST reference the skill's AGENTS.md and individual rule files for detailed implementation guidance, code examples, and rationale.

**Expected Outcomes**:
- 200-800ms faster cold start (bundle size reduction)
- 15-20KB smaller gzipped bundle (toast deferral)
- Cleaner codebase (single icon library)
- Better dev experience (faster HMR, fewer modules)

**Success Metrics**:
- Lighthouse Performance Score: Target 95+ (currently unmeasured)
- Time to Interactive: Reduce by 20-30%
- Bundle size: Reduce by 15-25KB gzipped
- Dev server boot: Reduce by 15-70%

---

## Phase 1: CRITICAL - Bundle Size Optimization

### 1.1 Fix Barrel File Imports - Migrate to @tabler/icons-react (Rule 2.1)
**Impact**: 200-800ms import cost elimination, 15-70% faster dev boot

**Current issue**:
```tsx
// bookmark-list.tsx:16-24
import { Copy, Pencil, Trash2, RefreshCw, ChevronsRight, Check, Bookmark } from "lucide-react";
// Loads 1,583 modules, ~2.8s dev overhead
```

**Solution**:
- Add `optimizePackageImports: ['@tabler/icons-react']` to next.config.ts
- Migrate ALL lucide-react imports to @tabler/icons-react equivalents
- Remove lucide-react dependency entirely

**Icon mapping (lucide → @tabler)**:
- `Copy` → `IconCopy` ✓
- `Pencil` → `IconPencil` ✓
- `Trash2` → `IconTrash` ✓
- `RefreshCw` → `IconRefresh` ✓
- `ChevronsRight` → `IconChevronsRight` ✓
- `Check` → `IconCheck` ✓ (already in context-menu.tsx)
- `Bookmark` → `IconBookmark` ✓
- `ChevronsUpDown` → `IconChevronsUpDown` ✓
- `Plus` → `IconPlus` ✓

**Files to modify (only 3!)**:
- `next.config.ts` (add optimizePackageImports config)
- `components/bookmark-list.tsx:16-24` (7 icons: Copy, Pencil, Trash2, RefreshCw, ChevronsRight, Check, Bookmark)
- `components/header.tsx:13` (4 icons: ChevronsUpDown, Plus, Check, Trash2)
- `components/bookmark-input.tsx:5` (1 icon: Plus)
- `package.json` (remove lucide-react dependency)

### 1.2 Defer Toast Library (Rule 2.3)
**Impact**: Reduce initial bundle, load after hydration

**Current issue**:
```tsx
// app/layout.tsx:5
import { Toaster } from "sonner";
// Entire sonner library loaded in initial bundle

// components/dashboard-content.tsx
import { toast } from "sonner";
// Dashboard component bundles toast functionality upfront
```

**Solution**: Use next/dynamic to defer Toaster component
```tsx
// app/layout.tsx
import dynamic from 'next/dynamic';

const Toaster = dynamic(
  () => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })),
  { ssr: false }
);

// Then use: <Toaster />
```

**Note**: Keep `import { toast } from "sonner"` in components as-is. The toast function itself is lightweight - the heavy part is the Toaster UI component with theme integration and icons. Dynamic import of Toaster alone saves ~15-20KB gzipped.

**Files affected**:
- `app/layout.tsx:5,49` (dynamic import Toaster)

**Optional enhancement**: If you want to defer toast calls too:
```tsx
// lib/toast.ts
let toastModule: typeof import('sonner')['toast'] | null = null;

export const toast = {
  success: async (msg: string) => {
    if (!toastModule) {
      toastModule = (await import('sonner')).toast;
    }
    toastModule.success(msg);
  },
  error: async (msg: string) => {
    if (!toastModule) {
      toastModule = (await import('sonner')).toast;
    }
    toastModule.error(msg);
  },
};
```

### 1.3 Lazy Initialize QueryClient (Rule 5.6)
**Impact**: Prevent expensive QueryClient instantiation on every render

**Status**: Already correct! ✓ Using function initializer properly in query-provider.tsx.

---

## Phase 2: CRITICAL - Eliminate Server Waterfalls

### 2.1 Parallel Data Fetching in Page (Rule 1.4)
**Impact**: 2x faster initial page load (currently sequential)

**Current issue**:
```tsx
// app/page.tsx:15-42
const groups = await db.group.findMany(...);
const defaultGroupId = groups[0]?.id;
if (defaultGroupId) {
  const bookmarks = await db.bookmark.findMany(...); // WATERFALL
}
```

**Solution**: Restructure to minimize waterfall
```tsx
const groups = await db.group.findMany(...);
const defaultGroupId = groups[0]?.id;

// Can't fully parallelize since bookmarks depends on groups[0].id
// But we can ensure no other blocking operations before this
const initialBookmarks = defaultGroupId
  ? await db.bookmark.findMany(...)
  : [];
```

**Note**: True parallelization not possible here due to data dependency. Main optimization is ensuring no other blocking operations (like session fetching) create additional waterfall steps.

**Files affected**:
- `app/page.tsx:8-63` (HomeContent component)

---

## Phase 3: HIGH - Server-Side Performance

### 3.1 Minimize Serialization at RSC Boundaries (Rule 3.2)
**Impact**: Reduce JSON serialization overhead

**Current issue**:
```tsx
// app/page.tsx:44-53
initialBookmarks = bookmarks.map((b) => ({
  id: b.id,
  title: b.title,
  url: b.url,
  favicon: b.favicon,
  type: b.type,
  color: b.color,
  groupId: b.groupId,
  createdAt: b.createdAt, // Date serialized to string
}));
```

**Analysis**: Currently passing full bookmark objects. Consider:
- Only pass IDs and titles for initial render
- Fetch full data client-side via React Query
- Trade-off: Smaller RSC payload vs extra client request

**Decision needed**: Current approach is reasonable for small datasets. Skip unless bookmarks exceed 100+ items.

---

## Phase 4: MEDIUM - Re-render Optimization

### 4.1 Defer State Reads (Rule 5.1)
**Impact**: Avoid unnecessary subscriptions

**Current issue**:
```tsx
// dashboard-content.tsx:526-532
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (renamingId) return;
    // Uses renamingId in dependency but only checks at start
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [filteredBookmarks, selectedIndex, hoveredIndex, renamingId, handleDeleteBookmark]);
```

**Solution**: Use `useRef` to store latest values, reduce re-subscriptions
```tsx
const renamingIdRef = useRef(renamingId);
useEffect(() => { renamingIdRef.current = renamingId; }, [renamingId]);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (renamingIdRef.current) return; // No re-subscription needed
    ...
  };
}, []); // Empty deps
```

**Files affected**:
- `dashboard-content.tsx:461-532` (keyboard handler)

### 4.2 Stable Callback References (Rule 5.5)
**Impact**: Prevent child re-renders from unstable callbacks

**Current issue**:
```tsx
// dashboard-content.tsx:544-582
const handleAddBookmark = useCallback((value: string) => {
  if (!currentGroupId) return;
  // Uses currentGroupId from closure
}, [currentGroupId, createBookmarkMutation]);
```

**Solution**: Already using `useCallback` correctly! ✓

### 4.3 Extract Memoized Components (Rule 5.2)
**Impact**: Isolate expensive renders

**Candidate**:
```tsx
// bookmark-list.tsx:288-356 (BookmarkIcon)
function BookmarkIcon({ bookmark, isCopied }) {
  const [faviconError, setFaviconError] = useState(false);
  // Rendered for EVERY bookmark on list re-render
}
```

**Solution**: Wrap with `React.memo()`
```tsx
const BookmarkIcon = React.memo(({ bookmark, isCopied }) => { ... });
```

**Files affected**:
- `components/bookmark-list.tsx:288-356`

---

## Phase 5: MEDIUM - Rendering Performance

### 5.1 Hoist Static JSX (Rule 6.3)
**Impact**: Prevent recreating identical JSX objects

**Current opportunities**:
```tsx
// bookmark-list.tsx:127-134 (Empty state)
<Empty className="border-none py-16">
  <EmptyMedia>
    <Bookmark className="size-5 text-muted-foreground fill-muted-foreground" />
  </EmptyMedia>
  <EmptyTitle>No bookmarks here</EmptyTitle>
  <EmptyDescription>Add some cool links to get started</EmptyDescription>
</Empty>
```

**Solution**: Extract to module-level constant
```tsx
const EMPTY_STATE_JSX = (
  <Empty className="border-none py-16">...</Empty>
);

// In component:
if (bookmarks.length === 0) return EMPTY_STATE_JSX;
```

**Files affected**:
- `components/bookmark-list.tsx:125-135`

### 5.2 Use Explicit Conditional Rendering (Rule 6.7)
**Impact**: Avoid React 18 auto-stringification edge cases

**Current state**:
```tsx
// bookmark-list.tsx:202-206
{bookmark.url && !renamingId && copiedId !== bookmark.id && (
  <span className="text-[13px] text-muted-foreground">
    {new URL(bookmark.url).hostname.replace("www.", "")}
  </span>
)}
```

**Solution**: Use ternary instead of `&&`
```tsx
{bookmark.url && !renamingId && copiedId !== bookmark.id ? (
  <span>...</span>
) : null}
```

**Files affected**:
- `components/bookmark-list.tsx` (~5 instances)
- `components/dashboard-content.tsx` (~2 instances)

---

## Phase 6: LOW-MEDIUM - JavaScript Performance

### 6.1 Cache Property Access in Loops (Rule 7.3)
**Impact**: Reduce object traversal overhead

**Current opportunity**:
```tsx
// dashboard-content.tsx:601-606
const usedColors = new Set(groups.map((g) => g.color));
const availableColors = palette.filter((c) => !usedColors.has(c));
```

**Analysis**: Already optimal - using Set for O(1) lookups. ✓

### 6.2 Use Set for O(1) Lookups (Rule 7.11)
**Current state**: Already using Sets correctly in `handleCreateGroup`. ✓

### 6.3 Cache Storage API Calls (Rule 7.5)
**No current usage** of localStorage/sessionStorage. Skip.

---

## Phase 7: Advanced Patterns

### 7.1 Store Event Handlers in Refs (Rule 8.1)
**Impact**: Stable references without useCallback dependencies

**Opportunity**:
```tsx
// dashboard-content.tsx:440-449
const handleDeleteBookmark = useCallback((id: string) => {
  deleteBookmarkMutation.mutate({
    id,
    _groupId: currentGroupId ?? undefined,
  });
}, [deleteBookmarkMutation, currentGroupId]);
```

**Solution**: Use ref pattern
```tsx
const handleDeleteBookmarkRef = useRef((id: string) => {
  deleteBookmarkMutation.mutate({ id, _groupId: currentGroupId ?? undefined });
});

useEffect(() => {
  handleDeleteBookmarkRef.current = (id: string) => {
    deleteBookmarkMutation.mutate({ id, _groupId: currentGroupId ?? undefined });
  };
});

// Use: handleDeleteBookmarkRef.current(id)
```

**Trade-off**: More complex, minimal benefit since currentGroupId rarely changes. Skip unless performance critical.

---

## Critical Files to Modify

### High Priority
1. `next.config.ts` - Add optimizePackageImports for @tabler/icons-react
2. `components/bookmark-list.tsx` - Migrate lucide → @tabler icons, memo, conditionals
3. `app/layout.tsx` - Defer Toaster component with next/dynamic (lines 5, 49)
4. `components/dashboard-content.tsx` - Keyboard handler optimization (optional: update toast imports if creating wrapper)
5. `lib/toast.ts` - OPTIONAL: Create toast wrapper for deferred loading (if deferring toast calls too)

### Medium Priority
6. `components/header.tsx:13` - Migrate lucide → @tabler icons (ChevronsUpDown, Plus, Check, Trash2)
7. `components/bookmark-input.tsx:5` - Migrate lucide → @tabler icons (Plus)
8. `package.json` - Remove lucide-react dependency after migration

---

## Implementation Phases

### Phase 1: Setup & Baseline (Day 1)
**Objective**: Establish baseline metrics before optimization

**Tasks**:
1. Run `bun run build` and capture current bundle sizes
2. Measure dev server boot time: `time bun dev`
3. Run Lighthouse audit on localhost:3000 (with existing bookmarks)
4. Document current metrics in METRICS.md

**Acceptance Criteria**:
- [ ] Baseline bundle sizes recorded
- [ ] Baseline Lighthouse scores recorded
- [ ] Dev boot time measured (3 runs, average)

### Phase 2: Icon Library Migration (Day 1-2)
**Objective**: Consolidate to @tabler/icons-react, add optimizePackageImports

**Skill Reference**: See `rules/bundle-barrel-imports.md` for detailed rationale and examples.

**Tasks**:
1. Add `optimizePackageImports: ['@tabler/icons-react']` to next.config.ts
2. Update 3 files: bookmark-list.tsx, header.tsx, bookmark-input.tsx
3. Remove lucide-react from package.json: `bun remove lucide-react`
4. Verify all icons render correctly

**Acceptance Criteria**:
- [x] All lucide imports replaced with @tabler equivalents
- [x] `bun dev` starts 15-70% faster
- [x] No visual regressions in icon display
- [x] No console errors

### Phase 3: Toast Deferral (Day 2)
**Objective**: Lazy load Toaster component for smaller initial bundle

**Skill Reference**: See `rules/bundle-defer-third-party.md` for deferred loading patterns.

**Tasks**:
1. Update app/layout.tsx to use next/dynamic for Toaster
2. Test toast notifications still work (success, error)
3. Measure bundle size reduction

**Acceptance Criteria**:
- [ ] Toaster loads after hydration (not in initial bundle)
- [ ] Toast notifications work correctly
- [ ] Bundle reduced by ~15-20KB gzipped

### Phase 4: Re-render Optimizations (Day 3)
**Objective**: Optimize keyboard handler and memoization

**Skill Reference**:
- `rules/rerender-defer-reads.md` - Keyboard handler refs
- `rules/rerender-memo.md` - React.memo() patterns
- `rules/rendering-conditional-render.md` - Ternary vs &&

**Tasks**:
1. Refactor keyboard handler in dashboard-content.tsx to use refs
2. Wrap BookmarkIcon with React.memo()
3. Use explicit conditional rendering (ternary vs &&)
4. Profile with React DevTools before/after

**Acceptance Criteria**:
- [ ] Keyboard handler recreates less frequently
- [ ] BookmarkIcon renders only when props change
- [ ] React DevTools shows fewer re-renders

### Phase 5: Verification & Rollout (Day 3-4)
**Objective**: Verify all optimizations, measure improvements

**Tasks**:
1. Run `bun run build` and compare bundle sizes
2. Measure dev boot time improvement
3. Run Lighthouse audit
4. Manual QA (see Testing Checklist below)
5. Document improvements in METRICS.md

**Acceptance Criteria**:
- [ ] All tests pass: `bun test` (if applicable)
- [ ] Bundle size reduced by 15-25KB gzipped
- [ ] Dev boot time improved by 15-70%
- [ ] Lighthouse Performance score 95+
- [ ] No regressions in functionality

---

## Testing Checklist

### Functional Testing
- [ ] Keyboard shortcuts work (↑↓ arrows, Cmd+C, Cmd+E, Cmd+Backspace)
- [ ] Create bookmark (link, text, color)
- [ ] Delete bookmark
- [ ] Rename bookmark
- [ ] Move bookmark between groups
- [ ] Refetch bookmark metadata
- [ ] Create group
- [ ] Delete group
- [ ] Switch between groups
- [ ] Search/filter bookmarks
- [ ] Copy bookmark to clipboard
- [ ] Toast notifications appear on actions

### Performance Testing
- [ ] Run `bun run build` - no build errors
- [ ] Run `time bun dev` - measure boot time
- [ ] Lighthouse Performance score 95+
- [ ] No layout shift on page load
- [ ] Smooth interactions (no jank)

### Visual Regression Testing
- [ ] All icons render correctly
- [ ] Toast notifications styled correctly
- [ ] Dark mode works
- [ ] Mobile responsive (if applicable)

---

## Decision Log

### Resolved
1. **Icon library**: Migrate lucide → @tabler (user preference)
2. **Toast approach**: Use next/dynamic for Toaster (simpler, sufficient savings)
3. **React.cache**: Skip for now (not needed for current dataset size)
4. **Package manager**: Use bun for all commands (project standard)

### Open Questions
1. **Toast wrapper**: Create lib/toast.ts for deferred imports? Or keep direct sonner imports?
   - **Recommendation**: Start with dynamic Toaster only, add wrapper if needed later
2. **Re-render priority**: Focus keyboard handler or memoization first?
   - **Recommendation**: Keyboard handler (bigger impact on UX)
3. **Additional lazy loading**: Are there other heavy components to defer?
   - **Recommendation**: Profile after Phase 3, defer if >20KB found

---

## Commands Reference

### Development
```bash
bun dev          # Start dev server
bun run build    # Production build
time bun dev     # Measure boot time
```

### Dependencies
```bash
bun add <package>       # Add dependency
bun remove <package>    # Remove dependency
bun install             # Install all deps
```

### Performance Analysis
```bash
# Bundle analysis (after adding @next/bundle-analyzer)
ANALYZE=true bun run build

# Lighthouse CLI
npx lighthouse http://localhost:3000 --view

# React DevTools Profiler
# Open devtools → Profiler tab → Record interaction
```

---

## Risk Mitigation & Rollback

### Risks
1. **Icon visual regressions**: Some @tabler icons may look different from lucide
   - *Mitigation*: Visual QA checklist, screenshot comparison
   - *Rollback*: Revert commits, `bun add lucide-react`

2. **Toast notifications breaking**: Dynamic import could fail
   - *Mitigation*: Test success/error toasts in dev
   - *Rollback*: Change back to static import in layout.tsx

3. **Performance worse after optimization**: Bundle size increases
   - *Mitigation*: Measure before/after with `bun run build`
   - *Rollback*: Git revert to baseline commit

4. **Dev experience degraded**: Slower HMR or build times
   - *Mitigation*: Measure `time bun dev` before/after
   - *Rollback*: Remove optimizePackageImports from config

### Rollback Plan
```bash
# Full rollback to baseline
git log --oneline          # Find baseline commit hash
git revert <commit-hash>   # Revert optimization commits
bun install                # Restore dependencies
bun dev                    # Verify app works
```

---

## Appendix: Vercel Rules Applied

### CRITICAL Priority
- **Rule 2.1**: Avoid Barrel File Imports → Migrate to @tabler + optimizePackageImports
- **Rule 2.3**: Defer Non-Critical Third-Party Libraries → Dynamic import Toaster
- **Rule 1.4**: Promise.all() for Independent Operations → Page.tsx optimization

### HIGH Priority
- **Rule 3.2**: Minimize Serialization at RSC Boundaries → Analyzed, skipped (small dataset)

### MEDIUM Priority
- **Rule 5.1**: Defer State Reads → Keyboard handler ref optimization
- **Rule 5.2**: Extract Memoized Components → React.memo(BookmarkIcon)
- **Rule 5.6**: Lazy State Initialization → Already implemented ✓
- **Rule 6.3**: Hoist Static JSX → Empty state optimization
- **Rule 6.7**: Explicit Conditional Rendering → Ternary instead of &&

### Rules Skipped (Not Applicable)
- **Rule 3.1**: LRU Caching → Dataset too small
- **Rule 3.4**: React.cache() → Deferred per user feedback
- **Rule 7.x**: JavaScript Performance → Already optimized (using Sets/Maps correctly)
