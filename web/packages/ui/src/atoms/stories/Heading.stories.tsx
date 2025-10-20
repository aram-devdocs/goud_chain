import type { Meta, StoryObj } from '@storybook/react'
import { Heading } from '../Heading'

const meta = {
  title: 'Atoms/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
    as: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
  },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

export const H1: Story = {
  args: {
    level: 1,
    children: 'Heading Level 1',
  },
}

export const H2: Story = {
  args: {
    level: 2,
    children: 'Heading Level 2',
  },
}

export const H3: Story = {
  args: {
    level: 3,
    children: 'Heading Level 3',
  },
}

export const H4: Story = {
  args: {
    level: 4,
    children: 'Heading Level 4',
  },
}

export const H5: Story = {
  args: {
    level: 5,
    children: 'Heading Level 5',
  },
}

export const H6: Story = {
  args: {
    level: 6,
    children: 'Heading Level 6',
  },
}

export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
      <Heading level={4}>Heading Level 4</Heading>
      <Heading level={5}>Heading Level 5</Heading>
      <Heading level={6}>Heading Level 6</Heading>
    </div>
  ),
}

export const SemanticVsVisual: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-1">Semantic h3, styled as h1:</p>
        <Heading level={3} as={1}>
          Large Visual Heading
        </Heading>
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">Semantic h1, styled as h4:</p>
        <Heading level={1} as={4}>
          Small Visual Heading
        </Heading>
      </div>
    </div>
  ),
}
