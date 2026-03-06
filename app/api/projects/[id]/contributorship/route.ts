// api/projects/[id]/contributorship/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const logs = await prisma.contributorshipLog.findMany({
    where: { project_id: id },
    include: { user: { select: { id: true, full_name: true, avatar_url: true } } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}
