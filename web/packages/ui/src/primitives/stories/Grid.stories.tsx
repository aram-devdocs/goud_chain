import type { Meta, StoryObj } from '@storybook/react'
import { Grid } from '../Grid'

const meta = {
  title: 'Primitives/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

const GridItem = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-center min-h-[80px]">
    <p className="text-white text-sm font-medium">{children}</p>
  </div>
)

export const TwoColumns: Story = {
  args: {
    columns: 2,
    gap: 4,
    children: (
      <>
        <GridItem>Item 1</GridItem>
        <GridItem>Item 2</GridItem>
        <GridItem>Item 3</GridItem>
        <GridItem>Item 4</GridItem>
      </>
    ),
  },
}

export const ThreeColumns: Story = {
  args: {
    columns: 3,
    gap: 4,
    children: (
      <>
        <GridItem>1</GridItem>
        <GridItem>2</GridItem>
        <GridItem>3</GridItem>
        <GridItem>4</GridItem>
        <GridItem>5</GridItem>
        <GridItem>6</GridItem>
      </>
    ),
  },
}

export const FourColumns: Story = {
  args: {
    columns: 4,
    gap: 4,
    children: (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <GridItem key={i}>{i + 1}</GridItem>
        ))}
      </>
    ),
  },
}

export const ResponsiveGrid: Story = {
  args: {
    columns: { sm: 2, md: 3, lg: 4 },
    gap: 4,
    children: (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <GridItem key={i}>Item {i + 1}</GridItem>
        ))}
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Responsive grid: 1 column on mobile, 2 on small screens, 3 on medium, 4 on large',
      },
    },
  },
}

export const TightGap: Story = {
  args: {
    columns: 3,
    gap: 2,
    children: (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <GridItem key={i}>{i + 1}</GridItem>
        ))}
      </>
    ),
  },
}

export const SpaciousGap: Story = {
  args: {
    columns: 2,
    gap: 8,
    children: (
      <>
        {Array.from({ length: 4 }, (_, i) => (
          <GridItem key={i}>Item {i + 1}</GridItem>
        ))}
      </>
    ),
  },
}

export const DifferentRowColGap: Story = {
  args: {
    columns: 3,
    rowGap: 8,
    colGap: 4,
    children: (
      <>
        {Array.from({ length: 6 }, (_, i) => (
          <GridItem key={i}>{i + 1}</GridItem>
        ))}
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Row gap (32px) larger than column gap (16px)',
      },
    },
  },
}
