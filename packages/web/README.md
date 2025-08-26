# Web

The `web` workspace contains the SvelteKit-based frontend application for the Trip Settle project.
This workspace is configured as a modern web application using Svelte 5 and SvelteKit 2.

## Structure

```text
packages/web/
├── src/                    # Application source code
│   ├── app.html           # Main HTML template
│   └── *.test.ts          # Test files (Vitest)
├── static/                # Static assets
├── .svelte-kit/           # SvelteKit build artifacts (auto-generated)
├── vite.config.ts         # Vite configuration with SvelteKit integration
└── package.json           # Workspace dependencies and scripts
```

## Tech Stacks

- Language: TypeScript
- Framework: SvelteKit 2 with Svelte 5
- Build Tool: Vite 7
- Testing: Vitest 3
 