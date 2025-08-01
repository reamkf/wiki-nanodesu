# Suggested Commands

## Development Commands
```bash
# Install dependencies
bun install

# Start development server with Turbopack
bun dev
# Alternative: bun run dev

# Build for production
bun run build
# Alternative build with Turbopack: bun run build-turbopack

# Run tests
bun test

# Lint code
bun lint
# Alternative: bun run lint

# Pre-commit checks (runs tests + lint)
bun precommit
# Alternative: bun run precommit
```

## Google Apps Script Integration
```bash
# Login to Google Apps Script
bun run clasp:login

# Push code to GAS
bun run gas:push

# Pull code from GAS  
bun run gas:pull
```

## Windows System Commands
Since this is a Windows environment, use these commands:
- `dir` instead of `ls` for listing directories
- `type` instead of `cat` for reading file contents
- `cd` for changing directories
- `mkdir` for creating directories
- `del` for deleting files
- `rmdir` for removing directories

## Git Commands
Standard git commands work on Windows:
- `git status`
- `git add .`
- `git commit -m "message"`
- `git push origin main`