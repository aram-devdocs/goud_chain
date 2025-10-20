# Contributing to GoudChain UI

Guide for adding new components to the design system.

## Quick Start

1. **Choose component level** (Atom, Molecule, Organism, or Template)
2. **Create component file** in appropriate directory
3. **Create Storybook story** with all variants
4. **Export from index.ts**
5. **Test and document**

## Component Hierarchy

### Atoms

**Location:** `src/atoms/`

Small, indivisible UI elements that can't be broken down further.

**Examples:** Button, Input, Label, Badge, Spinner

**Characteristics:**

- Single responsibility
- No internal composition of other components
- Highly reusable
- Maps directly to HTML elements (often)

**Template:**

```tsx
// src/atoms/MyAtom.tsx
import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface MyAtomProps extends HTMLAttributes<HTMLDivElement> {
  /** Prop description */
  variant?: 'default' | 'alternate'
  /** Another prop */
  size?: 'small' | 'medium' | 'large'
}

export const MyAtom = forwardRef<HTMLDivElement, MyAtomProps>(
  (
    { variant = 'default', size = 'medium', className, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'base-styles',
          {
            'variant-default': variant === 'default',
            'variant-alternate': variant === 'alternate',
            'size-small': size === 'small',
            'size-medium': size === 'medium',
            'size-large': size === 'large',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MyAtom.displayName = 'MyAtom'
```

### Molecules

**Location:** `src/molecules/`

Combinations of atoms that form functional units.

**Examples:** Card, Toast, MetricCard, ProgressBar

**Characteristics:**

- Combines 2-5 atoms
- Single functional purpose
- Still highly reusable
- No business logic

**Template:**

```tsx
// src/molecules/MyMolecule.tsx
import { type ReactNode } from 'react'
import { Button } from '../atoms/Button'
import { Heading } from '../atoms/Heading'

export interface MyMoleculeProps {
  title: string
  action?: () => void
  children?: ReactNode
}

export function MyMolecule({ title, action, children }: MyMoleculeProps) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <Heading level={3}>{title}</Heading>
      {children}
      {action && <Button onClick={action}>Action</Button>}
    </div>
  )
}
```

### Organisms

**Location:** `src/organisms/`

Complex components combining molecules and atoms.

**Examples:** ChainHealthDashboard, CollectionsTable, NetworkHealthCard

**Characteristics:**

- Domain-specific
- Combines multiple molecules/atoms
- May include logic
- Represents distinct UI sections

### Templates

**Location:** `src/templates/`

Page-level layouts that define structure.

**Examples:** DashboardLayout, AuthLayout, PageContainer

**Characteristics:**

- Defines page structure
- Accepts children for content areas
- No business logic
- Highly reusable across pages

## Creating a Storybook Story

**Location:** Same directory as component in `stories/` subfolder

```tsx
// src/atoms/stories/MyAtom.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyAtom } from '../MyAtom'

const meta = {
  title: 'Atoms/MyAtom',
  component: MyAtom,
  parameters: {
    layout: 'centered', // or 'fullscreen' for layouts
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'alternate'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof MyAtom>

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'medium',
    children: 'My Atom Content',
  },
}

// Variant stories
export const Alternate: Story = {
  args: {
    variant: 'alternate',
    children: 'Alternate Variant',
  },
}

// Size stories
export const Small: Story = {
  args: {
    size: 'small',
    children: 'Small Size',
  },
}

// Showcase all variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <MyAtom variant="default">Default</MyAtom>
      <MyAtom variant="alternate">Alternate</MyAtom>
    </div>
  ),
}

// Complex example
export const WithContent: Story = {
  render: () => (
    <MyAtom variant="default" size="large">
      <div>
        <h3>Complex Content</h3>
        <p>Demonstrating component with nested elements</p>
      </div>
    </MyAtom>
  ),
}
```

## Design System Guidelines

### Use Design Tokens

Instead of hardcoding values, use Tailwind classes that map to design tokens:

**Colors:**

- Background: `bg-zinc-950` (dark), `bg-white` (light)
- Text: `text-zinc-100` (primary), `text-zinc-400` (secondary)
- Borders: `border-zinc-800`
- Semantic: `text-blue-400` (primary), `text-red-500` (danger), `text-green-500` (success)

**Spacing:**

- Use 4px grid: `gap-4` (16px), `p-6` (24px), `mt-2` (8px)

**Typography:**

- Sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Mono: `font-mono` for code/hashes

### Accessibility Checklist

- [ ] **ARIA labels** on interactive elements
- [ ] **Keyboard navigation** support (Tab, Enter, Esc)
- [ ] **Focus indicators** visible (`focus:ring-2`)
- [ ] **Semantic HTML** (use `<button>` not `<div onClick>`)
- [ ] **Screen reader** text for icons (`aria-label`)
- [ ] **Color contrast** meets WCAG AA (use a11y addon)

### TypeScript Requirements

- [ ] All props have types
- [ ] No `any` types (use `unknown` or proper types)
- [ ] Export prop interface
- [ ] Use `forwardRef` for DOM components
- [ ] Set `displayName` for debugging

### Component Checklist

- [ ] Component file created
- [ ] Storybook story created with all variants
- [ ] Exported from `src/index.ts`
- [ ] TypeScript types exported
- [ ] Accessibility tested (keyboard nav, screen reader)
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Documented with JSDoc comments

## Exporting Components

Add to `src/index.ts`:

```tsx
// Atoms
export { MyAtom } from './atoms/MyAtom'
export type { MyAtomProps } from './atoms/MyAtom'

// If component has enums/types, export those too
export type { MyAtomVariant } from './atoms/MyAtom'
```

## Testing

### Manual Testing

1. **Storybook**: Run `pnpm --filter @goudchain/ui storybook`
2. **All variants**: Verify each story renders correctly
3. **Responsive**: Test mobile (375px), tablet (768px), desktop (1920px)
4. **Keyboard**: Tab through interactive elements
5. **A11y addon**: Check accessibility tab in Storybook

### Build Testing

```bash
# From /web directory
pnpm --filter @goudchain/ui build
pnpm --filter @goudchain/ui type-check
```

## Common Patterns

### Loading States

```tsx
export interface MyComponentProps {
  loading?: boolean
}

export function MyComponent({ loading }: MyComponentProps) {
  if (loading) {
    return <Spinner />
  }
  return <div>Content</div>
}
```

### Error States

```tsx
export interface MyInputProps {
  error?: boolean
  errorMessage?: string
}

export function MyInput({ error, errorMessage }: MyInputProps) {
  return (
    <div>
      <input
        className={clsx({ 'border-red-500': error })}
        aria-invalid={error}
        aria-describedby={error ? 'error-message' : undefined}
      />
      {error && errorMessage && (
        <p id="error-message" className="text-red-500 text-sm" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
```

### Responsive Design

```tsx
// Use Grid/Stack/Flex primitives
import { Grid } from '../primitives/Grid'
;<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap={4}>
  {/* Items */}
</Grid>
```

### Icons

```tsx
// Simple SVG icons (no external libraries)
const MyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  </svg>
)

// Use in component
<Button iconLeft={<MyIcon />}>With Icon</Button>
```

## File Structure

```
src/
├── atoms/
│   ├── MyAtom.tsx
│   └── stories/
│       └── MyAtom.stories.tsx
├── molecules/
│   ├── MyMolecule.tsx
│   └── stories/
│       └── MyMolecule.stories.tsx
├── organisms/
│   ├── MyOrganism.tsx
│   └── stories/
│       └── MyOrganism.stories.tsx
├── templates/
│   ├── MyTemplate.tsx
│   └── stories/
│       └── MyTemplate.stories.tsx
├── primitives/
│   └── (layout components)
├── tokens/
│   └── (design tokens)
├── utils/
│   └── (utilities like a11y.ts)
├── __mocks__/
│   └── data.ts (mock data for stories)
└── index.ts (exports)
```

## Questions?

- Check [README.md](./README.md) for design system overview
- See [MIGRATION.md](./MIGRATION.md) for usage examples
- View Storybook at `http://localhost:6006` for live examples
- Ask in GitHub Discussions with "design-system" tag
