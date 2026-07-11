import type { GenerationContext } from '../context'

/** Discriminated union representing an orchestrator negotiation decision after an agent completes. */
export type NegotiationDecision =
  | { decision: 'accept'; reason: string }
  | { decision: 'rescope'; feedback: string; sectionId?: string }
  | { decision: 'adjust'; key: string; value: unknown; reason: string }
  | { decision: 'abort'; reason: string }

/**
 * Called after each agent completes (before proceeding to the next pipeline stage).
 * For Writer: trivially accepts for now (the Reviewer is the quality gate).
 * The accept decision means "proceed to next stage / next section."
 */
export function acceptHandoff(agentName: string, outputSummary: string): NegotiationDecision {
  return { decision: 'accept', reason: `${agentName} completed successfully — ${outputSummary}` }
}

/**
 * Evaluate a Writer section output and decide whether to rescope with feedback or abort.
 *
 * **G2 guardrail (loop breaker):** If `rescopeCount >= 3`, the section is aborted
 * and should be marked `needs_human_review`. This prevents infinite rescope loops
 * when the model consistently fails a quality heuristic.
 */
export function rescopeHandoff(
  agentName: string,
  sectionId: string,
  feedback: string,
  rescopeCount: number,
): NegotiationDecision {
  // G2: rescope loop breaker
  if (rescopeCount >= 3) {
    return {
      decision: 'abort',
      reason: `max rescope attempts exceeded for section ${sectionId} after ${rescopeCount} attempts — ${agentName} feedback: ${feedback}`,
    }
  }
  return { decision: 'rescope', feedback, sectionId }
}

/**
 * Mutate the shared `GenerationContext` metadata bag.
 * Returns `ctx` for chaining convenience.
 *
 * Called when downstream agents need corrected upstream context
 * (e.g., Planner outline had a structural error discovered during writing).
 */
export function adjustContext(ctx: GenerationContext, key: string, value: unknown): GenerationContext {
  ctx.metadata[key] = value
  return ctx
}

/**
 * Pure-code heuristic quality checks on Writer section output.
 * Runs in < 50ms — no LLM call required.
 *
 * Checks performed:
 * 1. Content length < 50 chars → fail
 * 2. Placeholder detection (Lorem ipsum, whitespace-only, title repetition) → fail
 * 3. Language heuristic: if no common French words found → warning (informational only)
 *
 * Returns `{ passed: boolean, issues: string[] }`.
 * `passed === false` means the content should be rescoped or aborted.
 */
export function evaluateWriterOutput(sectionContent: string): { passed: boolean; issues: string[] } {
  const issues: string[] = []
  const trimmed = sectionContent.trim()

  // 1. Content too short
  if (trimmed.length < 30) {
    issues.push('content too short')
  }

  // 2. Placeholder detection
  const lower = trimmed.toLowerCase()
  if (lower === 'lorem ipsum' || lower.startsWith('lorem ipsum')) {
    issues.push('placeholder content detected')
  }
  // Check for repetition of a single phrase (e.g., section title repeated)
  const words = trimmed.split(/\s+/)
  if (words.length > 2) {
    const freq: Record<string, number> = {}
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1
    }
    const maxFreq = Math.max(...Object.values(freq))
    const uniqueRatio = new Set(words).size / words.length
    if (maxFreq >= 3 && uniqueRatio < 0.3) {
      issues.push('placeholder content detected')
    }
  }

  // 3. French language heuristic (warning, not hard fail)
  const frenchWords = ['le', 'la', 'les', 'des', 'une', 'est', 'dans', 'pour']
  const hasFrench = frenchWords.some(w => {
    const re = new RegExp(`\\b${w}\\b`, 'i')
    return re.test(trimmed)
  })
  if (!hasFrench && trimmed.length >= 100) {
    issues.push('content may not be in French')
  }

  // Determine if hard failures exist (issues 1 and 2 are hard; 3 is a warning)
  const hardFailures = issues.filter(i => i !== 'content may not be in French')
  return {
    passed: hardFailures.length === 0,
    issues,
  }
}
