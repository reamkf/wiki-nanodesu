# Project Patterns and Guidelines

## Architecture Patterns

### Next.js App Router Structure
- Server components by default in `page.tsx`
- Client components explicitly marked as `page.client.tsx`
- Layout components in `layout.tsx`
- Metadata handling in dedicated `metadata.ts` files

### Component Organization
- **Feature-based**: Components grouped by domain (friends, photo, table, etc.)
- **Shared**: Common components in `src/components/common/`
- **Layout**: Section and structural components in `src/components/section/`

### Data Management
- Static data files in `src/data/`
- CSV import from Google Sheets
- Type-safe data processing with TypeScript interfaces
- Utility functions for data transformation

### State Management
- React Context for global state (SidebarContext)
- Local state with useState for component-specific needs
- @tanstack/react-table for complex table state

## Design Patterns

### Internationalization
- Japanese text used throughout the application
- Consistent naming for UI elements and data labels

### Performance Optimizations
- Static site generation (SSG) with Next.js export
- Image optimization disabled for static export
- Turbopack for faster development builds

### Accessibility
- Semantic HTML structure
- Material-UI components for consistent UX
- Proper image alt texts

## Integration Patterns
- **Google Sheets**: Data source via CSV export
- **Seesaa Wiki**: External links and image references
- **GitHub Pages**: Static deployment target