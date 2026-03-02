# AI Compare - Agent Guidelines

## Build & Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Install dependencies
npm install
```

## Technology Stack

- **Framework**: Next.js 16+ with App Router
- **Runtime**: React 19+ (Server Components by default)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4
- **Build Tool**: Turbopack (via `next dev --turbopack`)
- **Package Manager**: npm
- **Node Version**: >=20.9.0

## Code Style Guidelines

### TypeScript

- **Strict mode**: Enabled - all code must be type-safe
- **Type annotations**: Explicit return types on exported functions
- **Types vs Interfaces**: Prefer `type` for props and simple structures
  ```typescript
  type PromptProps = {
    prompt: string
  }
  ```
- **Path aliases**: Use `@/*` for imports from project root
  ```typescript
  import { util } from "@/lib/utils"
  ```

### React Components

- **Export style**: Use default exports for page and layout components
- **Component functions**: Named functions for better debugging
  ```typescript
  export default function ComponentName() { ... }
  ```
- **Props**: Destructure in parameters, use readonly where appropriate
  ```typescript
  type Props = {
    readonly children: React.ReactNode
  }
  ```
- **Hooks**: Import explicitly from "react"
  ```typescript
  import { useState, useRef, useEffect } from "react"
  ```
- **Client components**: Mark with `"use client"` at top of file

### Naming Conventions

- **Components**: PascalCase (e.g., `ChatInput`, `ModelSelector`)
- **Functions/Variables**: camelCase (e.g., `handleSubmit`, `isStreaming`)
- **Types**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Event handlers**: Prefix with `handle` (e.g., `handleSubmit`, `handleClear`)
- **Boolean states**: Prefix with `is` or `has` (e.g., `isStreaming`, `hasError`)

### Imports

**Order:**
1. React and Next.js imports
2. Third-party library imports
3. Absolute imports with `@/` alias
4. Relative imports (sibling files)

**Example:**
```typescript
import { useState } from "react"
import { Inter } from "next/font/google"
import { FaCheck } from "react-icons/fa"
import { DEFAULT_MODELS } from "@/lib/model-utils"
import { formatText } from "./utils"
```

### Styling (Tailwind CSS)

- Use Tailwind utility classes exclusively
- Arbitrary values allowed when needed: `bg-[#222222]`, `max-w-[70%]`
- Prefer standard Tailwind colors: `neutral-800`, `neutral-900`
- Use semantic class ordering (layout → spacing → colors → effects)

### Error Handling

- Use try/catch for async operations
- Check for specific error types (e.g., `AbortError`)
- Always log errors with context
  ```typescript
  catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("Chat request failed:", error)
    }
  }
  ```

### State Management

- Use React hooks: `useState`, `useRef`, `useEffect`
- Prefer functional updates for state depending on previous value
  ```typescript
  setCompletions(currCompletions => [...currCompletions, newItem])
  ```
- Use `AbortController` for cancellable async operations
- Store persistent data in localStorage with typed keys

### Project Structure

```
app/
├── page.tsx              # Main page (client component)
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── components/           # React components
│   ├── chat-input.tsx
│   ├── messages.tsx
│   ├── prompt.tsx
│   ├── response.tsx
│   └── model-selector.tsx
└── api/
    └── chat/
        └── route.ts      # API route
lib/
└── model-utils.ts        # Utility functions
public/                   # Static assets
```

### API Routes

- Use App Router convention: `app/api/*/route.ts`
- Streaming responses supported via ReadableStream
- Proper signal handling for request cancellation

### Environment

- Keep secrets in `.env` file (do not commit)
- Access via `process.env.*`

### Key Libraries

- `@ai-sdk/react` - AI SDK React hooks
- `react-markdown` - Markdown rendering
- `rehype-highlight` - Code syntax highlighting
- `remark-gfm` - GitHub flavored markdown
- `zod` - Schema validation
- `react-icons` - Icon library
