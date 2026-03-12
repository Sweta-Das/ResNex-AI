// api/ai/moderate/route.ts — Run moderation check on any content

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { moderateContent } from '../../../lib/moderation'
import { ModerationContext } from '../../../types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { content, context } = body as { content: string; context: ModerationContext }

  if (!content || !context) {
    return NextResponse.json({ error: 'content and context required' }, { status: 400 })
  }

  const result = await moderateContent(content, context)
  return NextResponse.json(result)
}
