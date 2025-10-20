import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../Button'
import { ButtonVariant, ButtonSize } from '@goudchain/types'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ButtonVariant),
    },
    size: {
      control: 'select',
      options: Object.values(ButtonSize),
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: ButtonVariant.Primary,
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: ButtonVariant.Secondary,
    children: 'Secondary Button',
  },
}

export const Danger: Story = {
  args: {
    variant: ButtonVariant.Danger,
    children: 'Danger Button',
  },
}

export const Ghost: Story = {
  args: {
    variant: ButtonVariant.Ghost,
    children: 'Ghost Button',
  },
}

export const Small: Story = {
  args: {
    size: ButtonSize.Small,
    children: 'Small Button',
  },
}

export const Medium: Story = {
  args: {
    size: ButtonSize.Medium,
    children: 'Medium Button',
  },
}

export const Large: Story = {
  args: {
    size: ButtonSize.Large,
    children: 'Large Button',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant={ButtonVariant.Primary}>Primary</Button>
        <Button variant={ButtonVariant.Secondary}>Secondary</Button>
        <Button variant={ButtonVariant.Danger}>Danger</Button>
        <Button variant={ButtonVariant.Ghost}>Ghost</Button>
      </div>
      <div className="flex gap-4">
        <Button variant={ButtonVariant.Primary} disabled>
          Primary Disabled
        </Button>
        <Button variant={ButtonVariant.Secondary} disabled>
          Secondary Disabled
        </Button>
        <Button variant={ButtonVariant.Danger} disabled>
          Danger Disabled
        </Button>
        <Button variant={ButtonVariant.Ghost} disabled>
          Ghost Disabled
        </Button>
      </div>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size={ButtonSize.Small}>Small</Button>
      <Button size={ButtonSize.Medium}>Medium</Button>
      <Button size={ButtonSize.Large}>Large</Button>
    </div>
  ),
}
