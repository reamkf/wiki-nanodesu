# Code Style and Conventions

## Formatting (Prettier Configuration)
- **Indentation**: Tabs (tabWidth: 4)
- **Semicolons**: Required (semi: true)  
- **Quotes**: Double quotes (singleQuote: false)
- **Tabs**: Use tabs instead of spaces (useTabs: true)

## ESLint Configuration
- Extends Next.js core web vitals and TypeScript configs
- Uses flat config format with @eslint/eslintrc compatibility

## TypeScript Configuration
- **Strict Mode**: Enabled
- **Path Aliases**: `@/*` for src directory
- **Target**: ES2017
- **JSX**: Preserve (handled by Next.js)
- **Bun Types**: Included for runtime compatibility

## File Organization
- Pages use App Router structure in `src/app/`
- Client components explicitly marked with `page.client.tsx`
- Components organized by feature in `src/components/`
- Types defined in `src/types/`
- Utilities in `src/utils/` with feature-specific subdirectories
- Tests co-located with source files in `__tests__/` folders

## Naming Conventions
- React components: PascalCase
- Files: kebab-case for pages, PascalCase for components
- Utilities and data files: camelCase
- Japanese text: Used throughout for UI text and content