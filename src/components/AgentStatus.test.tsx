import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentStatus } from './AgentStatus'
import StatusBadge from './StatusBadge'

describe('AgentStatus', () => {
  it('renders with Idle state', () => {
    render(<AgentStatus name="Planner" state="idle" />)
    expect(screen.getByText('Planner')).toBeInTheDocument()
    expect(screen.getByText('inactif')).toBeInTheDocument()
  })

  it('renders with Thinking state', () => {
    render(<AgentStatus name="Writer" state="thinking" />)
    expect(screen.getByText('Writer')).toBeInTheDocument()
    expect(screen.getByText('reflexion')).toBeInTheDocument()
  })

  it('renders with progress bar when progress is provided', () => {
    const { container } = render(
      <AgentStatus name="Reviewer" state="thinking" progress={60} />,
    )
    expect(screen.getByText('Reviewer')).toBeInTheDocument()
    const bar = container.querySelector('.h-1')
    expect(bar).toBeInTheDocument()
  })

  it('renders children when no progress is provided', () => {
    render(
      <AgentStatus name="Orchestrator" state="idle">
        <span data-testid="child-content">Custom content</span>
      </AgentStatus>,
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('renders with draft state label', () => {
    render(<AgentStatus name="UML Agent" state="draft" />)
    expect(screen.getByText('brouillon')).toBeInTheDocument()
  })

  it('renders with final state label', () => {
    render(<AgentStatus name="Tables" state="final" />)
    expect(screen.getByText('final')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders with draft status', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText('BROUILLON')).toBeInTheDocument()
  })

  it('renders with review status', () => {
    render(<StatusBadge status="review" />)
    expect(screen.getByText('REVISION')).toBeInTheDocument()
  })

  it('renders with final status', () => {
    render(<StatusBadge status="final" />)
    expect(screen.getByText('VALIDE')).toBeInTheDocument()
  })

  it('renders custom children instead of default label', () => {
    render(<StatusBadge status="draft">CUSTOM</StatusBadge>)
    expect(screen.getByText('CUSTOM')).toBeInTheDocument()
  })

  it('renders with active status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('EDITION ACTIVE')).toBeInTheDocument()
  })

  it('renders with autonomous status', () => {
    render(<StatusBadge status="autonomous" />)
    expect(screen.getByText('AUTONOME')).toBeInTheDocument()
  })
})
