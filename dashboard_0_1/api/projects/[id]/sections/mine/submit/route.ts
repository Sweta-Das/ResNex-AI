// api/projects/[id]/sections/mine/submit/route.ts
// POST — submit section (runs moderation scan first)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../../../lib/prisma'
import { moderateAndLog } from '../../../../../../lib/moderation'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const section = await prisma.section.findFirst({
    where: { project_id: params.id, member_id: user.id },
  })
  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
  if (section.submitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  // Run moderation scan on full content
  const modResult = await moderateAndLog({
    content: section.content,
    context: 'section',
    userId: user.id,
    projectId: params.id,
  })

  if (!modResult.pass) {
    return NextResponse.json({
      error: 'Content flagged',
      message: 'Your section may contain discriminatory or harmful language. Please revise before submitting.',
      reason: modResult.reason,
    }, { status: 422 })
  }

  // Mark as submitted
  const updated = await prisma.section.update({
    where: { id: section.id },
    data: { submitted: true, submitted_at: new Date() },
  })

  // Update member status
  await prisma.projectMember.updateMany({
    where: { project_id: params.id, user_id: user.id },
    data: { section_status: 'submitted' },
  })

  // Log to contributorship
  await prisma.contributorshipLog.create({
    data: {
      project_id: params.id,
      user_id: user.id,
      action: 'edited',
      description: 'Submitted section for review',
    },
  })

  return NextResponse.json(updated)
}
