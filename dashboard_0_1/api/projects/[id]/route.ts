// api/projects/[id]/route.ts — GET single project, PATCH update project

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../lib/prisma'

async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.user.findFirst({ where: { email: userId } })
}

async function assertMember(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({
    where: { project_id: projectId, user_id: userId },
  })
}

// GET /api/projects/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const membership = await assertMember(params.id, user.id)
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { id: true, full_name: true, email: true, avatar_url: true } },
      members: {
        include: {
          user: { select: { id: true, full_name: true, email: true, avatar_url: true, affiliation: true } },
        },
      },
      sections: {
        select: {
          id: true,
          member_id: true,
          subtopic: true,
          word_count: true,
          submitted: true,
          submitted_at: true,
          updated_at: true,
        },
      },
    },
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...project, myRole: membership.role })
}

// PATCH /api/projects/[id] — admin only
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const membership = await assertMember(params.id, user.id)
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, status } = body

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status }),
    },
  })

  return NextResponse.json(updated)
}
