// api/projects/[id]/chat/route.ts — GET last 50 messages, POST new message with moderation

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { moderateAndLog } from '../../../../../lib/moderation'

// GET /api/projects/[id]/chat
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await prisma.projectMember.findFirst({
    where: { project_id: id, user_id: user.id },
  })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const messages = await prisma.chatMessage.findMany({
    where: { project_id: id, context: 'group_chat' },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
    orderBy: { created_at: 'desc' },
    take: 50,
  })

  return NextResponse.json(messages.reverse())
}

// POST /api/projects/[id]/chat — send message with moderation gate
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await prisma.projectMember.findFirst({
    where: { project_id: id, user_id: user.id },
  })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { content } = body

  if (!content?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })

  // Moderation gate — message must pass before save
  const modResult = await moderateAndLog({
    content,
    context: 'group_chat',
    userId: user.id,
    projectId: id,
  })

  if (!modResult.pass) {
    return NextResponse.json({
      error: 'Message flagged',
      message: 'Your message may contain discriminatory or harmful language. Please revise before sending.',
    }, { status: 422 })
  }

  const message = await prisma.chatMessage.create({
    data: {
      project_id: id,
      user_id: user.id,
      role: 'user',
      content,
      context: 'group_chat',
    },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
  })

  // Socket.io broadcast handled by the realtime server
  // The client listens to socket events directly
  return NextResponse.json(message, { status: 201 })
}
