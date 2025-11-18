# Agent Guidelines for Todo App

## Build/Lint/Test Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production  
- `bun run lint` - Run ESLint
- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- **Single test**: `bun test -- src/components/__tests__/task-card.test.tsx` or `bun test -- --testNamePattern="TaskCard"`

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
- Jest + React Testing Library
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
