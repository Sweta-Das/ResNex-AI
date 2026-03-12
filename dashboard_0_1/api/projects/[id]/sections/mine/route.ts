// api/projects/[id]/sections/mine/route.ts — GET/PATCH my section, POST submit

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../../lib/prisma'
import { moderateAndLog } from '../../../../../lib/moderation'

async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.user.findFirst({ where: { email: userId } })
}

// GET /api/projects/[id]/sections/mine
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const section = await prisma.section.findFirst({
    where: { project_id: params.id, member_id: user.id },
  })

  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

  return NextResponse.json(section)
}

// PATCH /api/projects/[id]/sections/mine — auto-save content
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { content, word_count } = body

  const section = await prisma.section.upsert({
    where: {
      project_id_member_id: { project_id: params.id, member_id: user.id },
    },
    update: { content, word_count },
    create: {
      project_id: params.id,
      member_id: user.id,
      subtopic: 'Unassigned',
      content,
      word_count,
    },
  })

  // Log edit to contributorship
  await prisma.contributorshipLog.create({
    data: {
      project_id: params.id,
      user_id: user.id,
      action: 'edited',
      description: `Added ${word_count} words to section`,
    },
  })

  // Update member's section status to in_progress
  await prisma.projectMember.updateMany({
    where: { project_id: params.id, user_id: user.id },
    data: { section_status: 'in_progress' },
  })

  return NextResponse.json(section)
}
