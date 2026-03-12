// api/ai/breakdown/route.ts — AI Coach: break topic into subtopics

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../lib/prisma'
import { callClaude, parseJsonResponse } from '../../../lib/claude'
import { SubtopicAssignment } from '../../../types'

const COACH_SYSTEM = `You are a collaborative research coach for STEM students.
Break the given topic into {n} subtopics, one per team member.
Distribute workload equitably across all members.
Consider each member's name but make no gender assumptions.
Return JSON only (no markdown): [{ "member_id": "...", "subtopic": "...", "rationale": "...", "estimated_word_count": 500 }]`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { project_id, topic, members } = body

  // Admin only
  const membership = await prisma.projectMember.findFirst({
    where: { project_id, user_id: user.id, role: 'admin' },
  })
  if (!membership) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const system = COACH_SYSTEM.replace('{n}', String(members.length))
  const userMessage = `Topic: ${topic}\nMembers: ${members.map((m: any) => `${m.id}: ${m.name}`).join(', ')}`

  const raw = await callClaude(system, userMessage, user.language)
  const assignments = parseJsonResponse<SubtopicAssignment[]>(raw)

  // Log AI use
  await prisma.contributorshipLog.create({
    data: {
      project_id,
      user_id: user.id,
      action: 'ai_prompted',
      description: 'AI Coach generated subtopic breakdown',
    },
  })

  return NextResponse.json({ assignments })
}
