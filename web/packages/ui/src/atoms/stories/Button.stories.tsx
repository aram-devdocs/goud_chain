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
    loading: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Simple icon components for demonstration
const PlusIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
)

const ArrowRightIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
)

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

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
}

export const LoadingVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant={ButtonVariant.Primary} loading>
        Primary Loading
      </Button>
      <Button variant={ButtonVariant.Secondary} loading>
        Secondary Loading
      </Button>
      <Button variant={ButtonVariant.Danger} loading>
        Danger Loading
      </Button>
    </div>
  ),
}

export const WithIconLeft: Story = {
  args: {
    iconLeft: <PlusIcon />,
    children: 'Add Item',
  },
}

export const WithIconRight: Story = {
  args: {
    iconRight: <ArrowRightIcon />,
    children: 'Continue',
  },
}

export const WithBothIcons: Story = {
  args: {
    iconLeft: <PlusIcon />,
    iconRight: <ArrowRightIcon />,
    children: 'Create and Continue',
  },
}

export const IconVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant={ButtonVariant.Primary} iconLeft={<PlusIcon />}>
          Add Item
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          iconRight={<ArrowRightIcon />}
        >
          Continue
        </Button>
        <Button
          variant={ButtonVariant.Danger}
          iconLeft={<PlusIcon />}
          size={ButtonSize.Small}
        >
          Small with Icon
        </Button>
      </div>
    </div>
  ),
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
