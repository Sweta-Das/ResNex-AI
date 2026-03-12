// api/projects/[id]/contributorship/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const logs = await prisma.contributorshipLog.findMany({
    where: { project_id: params.id },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}
