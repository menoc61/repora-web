import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GenerationProgress } from './GenerationProgress'
import type { HermesEvent } from '../hooks/useQueries'

const makeEvent = (overrides: Partial<HermesEvent> = {}): HermesEvent =>
  ({ type: 'agent_status', agent: 'Planner', status: 'thinking', ...overrides }) as HermesEvent

describe('GenerationProgress', () => {
  it('renders nothing when not streaming and no events', () => {
    const { container } = render(
      <GenerationProgress events={[]} isStreaming={false} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders one AgentStatus chip per unique agent name', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
      makeEvent({ agent: 'Writer', status: 'thinking' }),
      makeEvent({ type: 'token', agent: 'Planner', token: 'Hello' }),
      makeEvent({ agent: 'Planner', status: 'writing' }),
    ]
    render(<GenerationProgress events={events} isStreaming={true} />)
    expect(screen.getByText('Planner')).toBeInTheDocument()
    expect(screen.getByText('Writer')).toBeInTheDocument()
  })

  it('shows pulse indicator and active agent count when streaming', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
    ]
    render(<GenerationProgress events={events} isStreaming={true} />)
    expect(screen.getByText(/Orchestrateur/)).toBeInTheDocument()
    expect(screen.getByText(/1/)).toBeInTheDocument()
  })

  it('maps agent status to correct state labels', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
    ]
    render(<GenerationProgress events={events} isStreaming={true} />)
    expect(screen.getByText('reflexion')).toBeInTheDocument()
  })

  it('shows progress bar for thinking agents', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
      // Add several tokens to build up progress
      { type: 'token', agent: 'Planner', token: 'a' } as HermesEvent,
      { type: 'token', agent: 'Planner', token: 'b' } as HermesEvent,
      { type: 'token', agent: 'Planner', token: 'c' } as HermesEvent,
    ]
    const { container } = render(<GenerationProgress events={events} isStreaming={true} />)
    const progressBar = container.querySelector('.h-1')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows error state for agents with generation_error events', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
      { type: 'generation_error', agent: 'Planner', message: 'Timeout', error_type: 'timeout' } as HermesEvent,
    ]
    const { container } = render(<GenerationProgress events={events} isStreaming={true} />)
    // Should show the agent in error state (label: 'erreur')
    expect(screen.getByText('erreur')).toBeInTheDocument()
  })

  it('shows "Generation terminee" summary when stream ends with events', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'done' }),
      { type: 'done', document_id: 'doc-1' } as HermesEvent,
    ]
    render(<GenerationProgress events={events} isStreaming={false} />)
    expect(screen.getByText(/termine/)).toBeInTheDocument()
  })

  it('shows done state label for completed agents', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Writer', status: 'done' }),
    ]
    render(<GenerationProgress events={events} isStreaming={true} />)
    expect(screen.getByText('termine')).toBeInTheDocument()
  })

  it('updates agent state from thinking to writing on token events', () => {
    const events: HermesEvent[] = [
      makeEvent({ agent: 'Planner', status: 'thinking' }),
      { type: 'token', agent: 'Planner', token: 'Some content' } as HermesEvent,
    ]
    render(<GenerationProgress events={events} isStreaming={true} />)
    // The agent should now show 'redaction' (writing) label because tokens arrived
    expect(screen.getByText('redaction')).toBeInTheDocument()
  })
})
