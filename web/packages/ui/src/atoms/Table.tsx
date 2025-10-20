/**
 * Table Components
 * 
 * Semantic table elements with consistent styling
 * Includes Table, Thead, Tbody, Tr, Th, Td
 */

import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

// Main Table component
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Enable zebra striping */
  striped?: boolean
}

export function Table({
  striped = false,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx(
          'w-full text-sm',
          {
            '[&_tbody_tr:nth-child(even)]:bg-zinc-900/30': striped,
          },
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

// Table Head
export function Thead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx('bg-zinc-900 border-b border-zinc-800', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

// Table Body
export function Tbody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={clsx(
        '[&_tr]:border-b [&_tr]:border-zinc-800 [&_tr:last-child]:border-0',
        '[&_tr]:hover:bg-zinc-900/50 [&_tr]:transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  )
}

// Table Row
export function Tr({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx(className)} {...props}>
      {children}
    </tr>
  )
}

// Table Header Cell
export function Th({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left font-medium text-zinc-400',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

// Table Data Cell
export function Td({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('px-4 py-3 text-zinc-300', className)} {...props}>
      {children}
    </td>
  )
}
