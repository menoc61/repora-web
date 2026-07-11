/**
 * Review and quality-assurance tools for the Reviewer agent.
 *
 * These tools handle issue flagging, fix suggestions, section approval,
 * and document status updates during the review pipeline stage.
 * DB imports are lazy-loaded inside each execute function.
 *
 * @module ai/tools/review
 */

import { tool } from 'ai'
import { z } from 'zod'

/** System user ID used for automated review comments. */
const SYSTEM_USER_ID = 'a0000000-0000-0000-0000-000000000001'

/**
 * Flag an issue found in a specific section during review.
 * Records the problem as a comment with a [REVIEW FLAG] prefix.
 */
export const flagIssue = tool({
  description: 'Flag an issue on a specific section during review. Records the problem in the comments table with a [REVIEW FLAG] prefix.',
  inputSchema: z.object({
    sectionId: z.string().describe('The section UUID'),
    message: z.string().describe('Description of the issue found'),
  }),
  execute: async ({ sectionId, message }) => {
    const { db } = await import('../../db')
    const { comments } = await import('../../db/schema')
    await db.insert(comments).values({
      sectionId,
      authorId: SYSTEM_USER_ID,
      text: `[REVIEW FLAG] ${message}`,
    })
    return { ok: true }
  },
})

/**
 * Suggest a textual improvement for a section.
 * Records the suggestion as a comment with a [SUGGESTED FIX] prefix.
 */
export const suggestFix = tool({
  description: 'Suggest a textual fix for a section. Records the suggestion in the comments table with a [SUGGESTED FIX] prefix.',
  inputSchema: z.object({
    sectionId: z.string().describe('The section UUID'),
    text: z.string().describe('The suggested improvement text'),
  }),
  execute: async ({ sectionId, text }) => {
    const { db } = await import('../../db')
    const { comments } = await import('../../db/schema')
    await db.insert(comments).values({
      sectionId,
      authorId: SYSTEM_USER_ID,
      text: `[SUGGESTED FIX] ${text}`,
    })
    return { ok: true }
  },
})

/**
 * Approve a section after review.
 * Updates the section status to 'reviewed'.
 */
export const approveSection = tool({
  description: 'Approve a section after review. Updates the section status to "reviewed".',
  inputSchema: z.object({
    sectionId: z.string().describe('The section UUID'),
  }),
  execute: async ({ sectionId }) => {
    const { db } = await import('../../db')
    const { sections: sectionsTable } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db
      .update(sectionsTable)
      .set({ status: 'reviewed' })
      .where(eq(sectionsTable.id, sectionId))
    return { ok: true }
  },
})

/**
 * Update the overall document status after review.
 * Used by the Reviewer agent to mark review completion.
 */
export const updateDocumentStatus = tool({
  description: 'Update the overall document status after review',
  inputSchema: z.object({
    documentId: z.string().describe('The document UUID'),
    status: z
      .enum(['draft', 'in_review', 'reviewed', 'validated', 'rejected'])
      .describe('New document status'),
  }),
  execute: async ({ documentId, status }) => {
    const { db } = await import('../../db')
    const { documents } = await import('../../db/schema')
    const { eq } = await import('drizzle-orm')
    await db
      .update(documents)
      .set({ status })
      .where(eq(documents.id, documentId))
    return { ok: true }
  },
})
