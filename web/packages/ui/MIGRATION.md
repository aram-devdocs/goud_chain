# Migration Guide: GoudChain Design System

This guide helps you migrate from raw HTML/inline styles to the GoudChain design system components.

## Overview

The design system provides:

- **Design Tokens**: Centralized colors, typography, spacing, breakpoints
- **Layout Primitives**: Grid, Stack, Flex, Container for responsive layouts
- **Atomic Components**: Button, Input, Card, etc. with consistent styling
- **Type Safety**: TypeScript types enforce design system constraints

## Before and After Examples

### Layout Migration

**Before (Raw HTML):**

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
    <h3 className="text-lg font-bold text-white mb-4">Card Title</h3>
    <p className="text-zinc-300">Card content</p>
  </div>
</div>
```

**After (Design System):**

```tsx
import { Grid, Card, CardHeader, CardTitle, CardContent } from '@goudchain/ui'
;<Grid columns={{ md: 3 }} gap={4}>
  <Card>
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-zinc-300">Card content</p>
    </CardContent>
  </Card>
</Grid>
```

### Button Migration

**Before:**

```tsx
<button className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg">
  Submit
</button>
```

**After:**

```tsx
import { Button } from '@goudchain/ui'
import { ButtonVariant } from '@goudchain/types'
;<Button variant={ButtonVariant.Primary}>Submit</Button>
```

### Form Migration

**Before:**

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-zinc-300">Email</label>
    <input
      type="email"
      className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2"
    />
  </div>
</div>
```

**After:**

```tsx
import { Stack, Label, Input } from '@goudchain/ui'
;<Stack direction="vertical" spacing={4}>
  <div>
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>
</Stack>
```

### Loading States

**Before:**

```tsx
<button disabled={isLoading}>{isLoading ? 'Loading...' : 'Submit'}</button>
```

**After:**

```tsx
<Button loading={isLoading}>Submit</Button>
```

### Responsive Design

**Before:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

**After:**

```tsx
<Grid columns={{ sm: 2, md: 3, lg: 4 }} gap={4}>
```

## Common Patterns

### Page Structure

```tsx
import { Stack, Grid, Heading, Text } from '@goudchain/ui'

function Page() {
  return (
    <Stack direction="vertical" spacing={6}>
      {/* Page Header */}
      <div>
        <Heading level={2}>Page Title</Heading>
        <Text color="zinc-500">Page description</Text>
      </div>

      {/* Main Content */}
      <Grid columns={{ sm: 2, md: 3 }} gap={4}>
        {/* Grid items */}
      </Grid>
    </Stack>
  )
}
```

### Form with Validation

```tsx
import { Stack, Label, Input, Button, Text } from '@goudchain/ui'
import { ButtonVariant } from '@goudchain/types'

function Form() {
  const [error, setError] = useState('')

  return (
    <Stack direction="vertical" spacing={4}>
      <div>
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        {error && (
          <Text id="email-error" size="sm" color="red-500" role="alert">
            {error}
          </Text>
        )}
      </div>
      <Button variant={ButtonVariant.Primary} type="submit">
        Submit
      </Button>
    </Stack>
  )
}
```

### Async Actions

```tsx
import { Button } from '@goudchain/ui'
import { ButtonVariant } from '@goudchain/types'

function AsyncAction() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await submitData()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={ButtonVariant.Primary}
      loading={isLoading}
      onClick={handleSubmit}
    >
      Submit Data
    </Button>
  )
}
```

## Breaking Changes

### None

This migration is **non-breaking**. Old components continue to work. Migrate incrementally page-by-page.

## Import Changes

**Old:**

```tsx
import Button from '../components/Button' // Relative import
```

**New:**

```tsx
import { Button } from '@goudchain/ui' // Workspace package
import { ButtonVariant } from '@goudchain/types' // Enums from types
```

## Design Token Usage

### Colors

Instead of hardcoded Tailwind classes, reference design tokens in documentation:

```tsx
// Component uses: bg-zinc-950
// Maps to design token: colors.zinc[950]
// Maps to semantic: colors.black (background)
```

### Spacing

```tsx
// Component uses: gap-4
// Maps to design token: spacing[4] (16px = 4 * 4px base grid)
```

### Typography

```tsx
// Component uses: text-sm
// Maps to design token: typography.bodySmall
```

## Accessibility Improvements

The design system includes built-in accessibility:

- **ARIA labels** on all interactive components
- **Keyboard navigation** support (Tab, Enter, Esc)
- **Focus indicators** (visible rings using design tokens)
- **Screen reader** utilities (`visuallyHidden`)

### Using Accessibility Utilities

```tsx
import {
  visuallyHidden,
  focusVisible,
  announceToScreenReader,
} from '@goudchain/ui'

// Visually hide but keep accessible
;<span className={visuallyHidden}>Skip to main content</span>

// Announce to screen readers
announceToScreenReader('Data saved successfully', 'polite')
```

## Storybook Documentation

All components are documented in Storybook:

```bash
pnpm --filter @goudchain/ui storybook
```

Open `http://localhost:6006` to:

- View all component variants
- Test responsive behavior
- Copy code examples
- Check accessibility with a11y addon

## Troubleshooting

### TypeScript Errors

**Error:** `Property 'variant' does not exist`

**Solution:** Import enum from `@goudchain/types`:

```tsx
import { ButtonVariant } from '@goudchain/types'
```

### Styling Conflicts

**Problem:** Custom className overrides don't work

**Solution:** Design system components accept `className` prop for extensions:

```tsx
<Button className="custom-class" variant={ButtonVariant.Primary}>
  Submit
</Button>
```

### Missing Component

**Problem:** Need a component that doesn't exist yet

**Solution:** Create it! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Need Help?

- **Storybook**: `http://localhost:6006` for interactive examples
- **README**: [packages/ui/README.md](./README.md) for full documentation
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md) for adding components
- **Issues**: Report problems in GitHub Issues with "design-system" label
