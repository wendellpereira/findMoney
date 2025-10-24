# Project Memory

## Configuration Files
The following config files define our project standards:
- @package.json - Scripts, dependencies, project metadata
- @.eslintrc.json - Linting rules for code quality
- @tsconfig.json - TypeScript compiler settings
- @vite.config.ts - Build and dev server configuration
- @tailwind.config.js - Tailwind CSS configuration
- @README.md - Architecture, tech stack, project overview

## Self-Maintenance Instructions
**When adding new configuration files** (e.g., .prettierrc, vitest.config.ts, playwright.config.ts):
1. Automatically update this CLAUDE.md file
2. Add the new config file to the "Configuration Files" section above
3. Follow the format: `- @filename - Brief description of what it configures`

**When removing configuration files**:
1. Remove the corresponding line from this CLAUDE.md

This ensures CLAUDE.md stays synchronized with the project's tooling.

## Development Notes
- Always lint before committing
- Full stack dev mode: `npm run dev:fullstack` (ports 3000/3001)