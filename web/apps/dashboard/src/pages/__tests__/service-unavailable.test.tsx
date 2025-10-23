/**
 * Unit tests for ServiceUnavailablePage
 * Tests component rendering and user interactions
 *
 * NOTE: Requires test infrastructure setup (vitest + @testing-library/react) to run
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ServiceUnavailablePage from '../service-unavailable'
import { EXTERNAL_URLS, ROUTES } from '@goudchain/utils'

describe('ServiceUnavailablePage', () => {
  const mockLocation = {
    href: '',
  }

  const mockWindowOpen = vi.fn()

  beforeEach(() => {
    // Reset location mock
    mockLocation.href = ''
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })

    // Reset window.open mock
    mockWindowOpen.mockClear()
    mockWindowOpen.mockReturnValue({ opener: null })
    window.open = mockWindowOpen
  })

  it('should render 503 error heading', () => {
    render(<ServiceUnavailablePage />)
    expect(screen.getByText('503')).toBeInTheDocument()
  })

  it('should render service unavailable title', () => {
    render(<ServiceUnavailablePage />)
    expect(
      screen.getByText('Service Temporarily Unavailable')
    ).toBeInTheDocument()
  })

  it('should render explanation text', () => {
    render(<ServiceUnavailablePage />)
    expect(
      screen.getByText(
        /service is currently experiencing high load or maintenance/i
      )
    ).toBeInTheDocument()
  })

  it('should render what happened section', () => {
    render(<ServiceUnavailablePage />)
    expect(screen.getByText('What happened?')).toBeInTheDocument()
    expect(
      screen.getByText(
        /temporarily unavailable due to high load or ongoing maintenance/i
      )
    ).toBeInTheDocument()
  })

  it('should render what can you do section with action items', () => {
    render(<ServiceUnavailablePage />)
    expect(screen.getByText('What can you do?')).toBeInTheDocument()
    expect(
      screen.getByText(/Wait a few minutes and try again/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Check the service status page for updates/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/If the issue persists, contact support/i)
    ).toBeInTheDocument()
  })

  it('should render Try Again button', () => {
    render(<ServiceUnavailablePage />)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should render Check Status button', () => {
    render(<ServiceUnavailablePage />)
    expect(screen.getByText('Check Status')).toBeInTheDocument()
  })

  it('should render technical details', () => {
    render(<ServiceUnavailablePage />)
    expect(
      screen.getByText(/Technical details: Service returned a 5xx error/i)
    ).toBeInTheDocument()
  })

  describe('Try Again button', () => {
    it('should redirect to home page when clicked', () => {
      render(<ServiceUnavailablePage />)
      const tryAgainButton = screen.getByText('Try Again')

      fireEvent.click(tryAgainButton)

      expect(mockLocation.href).toBe(ROUTES.HOME)
    })
  })

  describe('Check Status button', () => {
    it('should open status page in new tab when clicked', () => {
      render(<ServiceUnavailablePage />)
      const checkStatusButton = screen.getByText('Check Status')

      fireEvent.click(checkStatusButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(
        EXTERNAL_URLS.STATUS_PAGE,
        '_blank'
      )
    })

    it('should set opener to null for security (prevent tabnapping)', () => {
      const mockNewWindow = { opener: 'not-null' }
      mockWindowOpen.mockReturnValue(mockNewWindow)

      render(<ServiceUnavailablePage />)
      const checkStatusButton = screen.getByText('Check Status')

      fireEvent.click(checkStatusButton)

      expect(mockNewWindow.opener).toBe(null)
    })

    it('should handle window.open returning null gracefully', () => {
      mockWindowOpen.mockReturnValue(null)

      render(<ServiceUnavailablePage />)
      const checkStatusButton = screen.getByText('Check Status')

      // Should not throw error
      expect(() => fireEvent.click(checkStatusButton)).not.toThrow()
    })
  })

  describe('Design system usage', () => {
    it('should use Button components from design system', () => {
      const { container } = render(<ServiceUnavailablePage />)

      // Check that buttons use design system classes (not raw inline styles)
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)

      // Buttons should not have inline style attributes (would indicate non-design-system usage)
      buttons.forEach((button: Element) => {
        expect(button.getAttribute('style')).toBeFalsy()
      })
    })

    it('should use Card component from design system', () => {
      const { container } = render(<ServiceUnavailablePage />)

      // Card component should be present (has specific design system classes)
      const cards = container.querySelectorAll(
        '[class*="border"][class*="rounded"]'
      )
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ServiceUnavailablePage />)

      // Main heading (503)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      // Subheadings
      const h3Headings = screen.getAllByRole('heading', { level: 3 })
      expect(h3Headings.length).toBeGreaterThan(0)
    })

    it('should have clickable buttons', () => {
      render(<ServiceUnavailablePage />)

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      const checkStatusButton = screen.getByRole('button', {
        name: /check status/i,
      })

      expect(tryAgainButton).toBeEnabled()
      expect(checkStatusButton).toBeEnabled()
    })
  })
})
