import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from '../Pagination'

const meta = {
  title: 'Molecules/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    currentPage: 0,
    totalPages: 10,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
}

export const WithTotalItems: Story = {
  args: {
    currentPage: 2,
    totalPages: 8,
    totalItems: 156,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
}

export const FirstPage: Story = {
  args: {
    currentPage: 0,
    totalPages: 5,
    totalItems: 100,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
}

export const LastPage: Story = {
  args: {
    currentPage: 4,
    totalPages: 5,
    totalItems: 100,
    onPageChange: (page) => console.log('Page changed to:', page),
  },
}

export const Interactive: Story = {
  args: {
    currentPage: 0,
    totalPages: 10,
    totalItems: 195,
    onPageChange: () => {},
  },
  render: () => {
    const [currentPage, setCurrentPage] = useState(0)
    const totalPages = 10

    return (
      <div>
        <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded">
          <p className="text-sm text-zinc-400">
            Current page: {currentPage + 1}
          </p>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={195}
          onPageChange={setCurrentPage}
        />
      </div>
    )
  },
}
