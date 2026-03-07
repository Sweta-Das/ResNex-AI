// api/projects/[id]/sections/[sectionId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../../../lib/prisma'
import { moderateAndLog } from '../../../../../../lib/moderation'

export async function GET(_req: NextRequest, { params }: { params: { id: string; sectionId: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Comments stored as chat messages with context = workspace and content tagged with section ID
  const comments = await prisma.chatMessage.findMany({
    where: { project_id: params.id, context: 'workspace', content: { startsWith: `[section:${params.sectionId}]` } },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
    orderBy: { created_at: 'asc' },
  })
  return NextResponse.json(comments.map(c => ({ ...c, content: c.content.replace(`[section:${params.sectionId}] `, '') })))
}

export async function POST(req: NextRequest, { params }: { params: { id: string; sectionId: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { content } = await req.json()

  const modResult = await moderateAndLog({ content, context: 'comment', userId: user.id, projectId: params.id })
  if (!modResult.pass) {
    return NextResponse.json({
      error: 'Message flagged',
      message: 'Your comment may contain discriminatory or harmful language. Please revise before posting.',
    }, { status: 422 })
  }

  const comment = await prisma.chatMessage.create({
    data: {
      project_id: params.id,
      user_id: user.id,
      role: 'user',
      content: `[section:${params.sectionId}] ${content}`,
      context: 'workspace',
    },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
  })

  return NextResponse.json({ ...comment, content })
}
