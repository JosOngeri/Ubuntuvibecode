# Frontend Optimization Plan (with Copy Approach)

This plan optimizes the frontend by creating a copy of the project, then applying optimizations to the copy for testing before applying to the original.

## Phase 0: Setup
1. Revert vite.config.js changes (remove bundle visualizer config)
2. User manually creates copy: "Ubuntu Software - Optimized Copy"
3. All subsequent work done on the copy

## Phase 1: Bundle Analysis (on copy)
1. Configure rollup-plugin-visualizer in copy's vite.config.js
2. Run production build on copy to generate bundle visualization
3. Analyze bundle sizes and identify:
   - Largest dependencies
   - Unused dependencies
   - Routes that would benefit most from code splitting

## Phase 2: Remove Unused Dependencies (on copy)
1. Remove Multer from frontend package.json (backend-only dependency)
2. Remove CORS from frontend package.json (backend-only dependency)
3. Run npm install to clean up lock files

## Phase 3: Icon Library Consolidation (on copy)
Based on bundle analysis results:
- If Lucide React is preferred: Migrate all React Icons imports to Lucide React
- If React Icons is preferred: Remove Lucide React from package.json
- Update all component imports accordingly

## Phase 4: Code Splitting Implementation (on copy)
1. Convert all route imports in App.jsx to React.lazy()
2. Create LoadingComponent for Suspense boundaries
3. Wrap all lazy-loaded routes with Suspense
4. Test navigation and loading states

## Phase 5: Final Verification (on copy)
1. Run bundle analysis again to measure improvements
2. Test all routes load correctly
3. Verify no functionality is lost
4. Report results to user for review
