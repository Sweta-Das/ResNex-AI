// lib/moderation.ts
// MODULE 10: Message moderation wrapper — every message passes through this before save/display

import { callClaude, parseJsonResponse } from './claude'
import { ModerationContext, ModerationResult } from '../types'

const MODERATION_SYSTEM = `You are a content moderator for an academic research platform.

Check if the message contains:
- Discrimination (gender, caste, religion, race, disability, socioeconomic)
- Harassment or personal attacks on individuals
- Hate speech of any kind

Respond ONLY with JSON (no markdown, no extra text):
{ "pass": true } if clean
{ "pass": false, "reason": "brief reason" } if flagged

Note: Academic critique of ideas is allowed.
Personal attacks on people are not.
Be strict but fair.`

/**
 * Run moderation check on any content.
 * Returns { pass: true } if clean, { pass: false, reason: "..." } if flagged.
 */
export async function moderateContent(
  content: string,
  context: ModerationContext
): Promise<ModerationResult> {
  const userMessage = `Context: ${context}\n\nContent to moderate:\n${content}`

  try {
    const raw = await callClaude(MODERATION_SYSTEM, userMessage)
    return parseJsonResponse<ModerationResult>(raw)
  } catch (err) {
    // On parse error, default to pass (fail-open, log internally)
    console.error('[moderation] parse error:', err)
    return { pass: true }
  }
}

/**
 * Convenience: moderate and optionally log to DB if flagged.
 * Used by API routes.
 */
export async function moderateAndLog(params: {
  content: string
  context: ModerationContext
  userId: string
  projectId: string
}): Promise<ModerationResult> {
  const result = await moderateContent(params.content, params.context)

  if (!result.pass) {
    // Dynamically import prisma to avoid circular deps in edge runtime
    const { prisma } = await import('./prisma')
    await prisma.moderationLog.create({
      data: {
        content: params.content,
        user_id: params.userId,
        project_id: params.projectId,
        context: params.context,
        reason: result.reason || 'flagged',
      },
    })
  }

  return result
}
