// api/projects/[id]/moderation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Admin only
  const member = await prisma.projectMember.findFirst({ where: { project_id: params.id, user_id: user.id, role: 'admin' } })
  if (!member) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const logs = await prisma.moderationLog.findMany({
    where: { project_id: params.id },
    include: { user: { select: { id: true, full_name: true } } },
    orderBy: { timestamp: 'desc' },
  })
  return NextResponse.json(logs)
}
