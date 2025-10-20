import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from '../Stack'

const meta = {
  title: 'Primitives/Stack',
  component: Stack,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    spacing: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12],
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
    <p className="text-white text-sm">{children}</p>
  </div>
)

export const VerticalDefault: Story = {
  args: {
    direction: 'vertical',
    spacing: 4,
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
}

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    spacing: 4,
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
    ),
  },
}

export const TightSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 2,
    children: (
      <>
        <Box>Tight spacing (8px)</Box>
        <Box>Between items</Box>
        <Box>Compact layout</Box>
      </>
    ),
  },
}

export const SpaciousSpacing: Story = {
  args: {
    direction: 'vertical',
    spacing: 8,
    children: (
      <>
        <Box>Spacious layout</Box>
        <Box>More breathing room</Box>
        <Box>32px gap</Box>
      </>
    ),
  },
}

export const CenteredItems: Story = {
  args: {
    direction: 'vertical',
    spacing: 4,
    align: 'center',
    children: (
      <>
        <Box>Centered</Box>
        <Box>Alignment</Box>
        <Box>Items</Box>
      </>
    ),
  },
}

export const HorizontalCentered: Story = {
  args: {
    direction: 'horizontal',
    spacing: 4,
    align: 'center',
    justify: 'center',
    className: 'min-h-[200px]',
    children: (
      <>
        <Box>Centered</Box>
        <Box>Both ways</Box>
      </>
    ),
  },
}

export const SpaceBetween: Story = {
  args: {
    direction: 'horizontal',
    justify: 'between',
    className: 'w-full',
    children: (
      <>
        <Box>Left</Box>
        <Box>Right</Box>
      </>
    ),
  },
}

export const WithWrap: Story = {
  args: {
    direction: 'horizontal',
    spacing: 4,
    wrap: true,
    children: (
      <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
        <Box>Item 6</Box>
      </>
    ),
  },
}
