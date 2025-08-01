# Task Completion Checklist

When completing any coding task in this project, follow these steps:

## Required Checks
1. **Run Tests**: `bun test` - Ensure all tests pass
2. **Run Linting**: `bun lint` - Fix any linting errors
3. **Type Checking**: Verify TypeScript compilation (handled by Next.js build)

## Pre-commit Process
The project has a precommit script that combines both checks:
```bash
bun precommit
```
This runs `bun test && bun lint` automatically.

## Build Verification (Optional)
For significant changes, verify the build works:
```bash
bun run build
```

## Testing Strategy
- Tests are located in `__tests__/` folders alongside source code
- Uses Bun's built-in test runner
- Test files follow the pattern `*.test.ts` or `*.test.tsx`

## Deployment Notes
- Changes to main branch automatically trigger GitHub Actions deployment
- Static export build is generated for GitHub Pages
- Base path `/wiki-nanodesu` is configured for GitHub Pages hosting

## Code Quality
- Follow Prettier formatting (tabs, double quotes)
- Ensure TypeScript strict mode compliance
- Use established patterns from existing codebase