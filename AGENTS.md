# Agent Guidelines for Todo App

## Build/Lint/Test Commands
- `bun run dev` - Start development server
- `bun run lint` - Run ESLint  
- `bun run build` - Build for production (note: `bun:sqlite` import causes TS error in Next.js build; use `bun run dev` for development)
- `bun run lint` - Run ESLint
- `bun run test` - Run all tests (uses `bun test`)
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage
- **Single test**: `bun test --test-name-pattern="TaskCard"` or `bun test src/components/__tests__/task-card.test.tsx`
- **React component tests**: no special comment needed; JSDOM is provided globally via `test/setup.ts` (preloaded in `bunfig.toml`)
- **Radix UI interactions**: use `@testing-library/user-event` instead of `fireEvent` for dropdowns/menus (dispatches proper event sequence)
- **DOM matchers**: use `@testing-library/jest-dom` (custom matchers via `test/setup.ts`)

## Code Style Guidelines

### Import Organization
External libs → internal imports with `@/` alias. React imports first, then grouped by type.
```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Task } from '@/types'
```

### Formatting
- **No semicolons**, 2-space indentation, single quotes
- Trailing commas in multi-line structures
- Arrow functions preferred
- PascalCase components, camelCase functions/variables

### TypeScript & Error Handling
- Strict mode enabled, interfaces for all data structures
- Consistent API error responses with user-friendly messages
- Try-catch for async operations, console.error for debugging

### Testing
- Bun test runner + React Testing Library
- `mock.module()` for module mocking, `mock.fn()` for function mocks
- Test files in `__tests__/` or `.test.tsx`
- Use semantic queries (`getByRole`), mock external deps
- Test user interactions with `fireEvent`

### Architecture
- Zustand for global state, local React state for UI
- shadcn/ui components in `components/ui/`
- API routes in `app/api/`, SQLite database in `lib/database.ts`
- `'use client'` directive for client components

### Key Libraries
- Next.js 16 with App Router, TypeScript strict
- Tailwind CSS + shadcn/ui + Radix UI
- better-sqlite3 for local data persistence
- React Hook Form + Zod for forms
