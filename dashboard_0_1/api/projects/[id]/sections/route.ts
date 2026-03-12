// api/projects/[id]/sections/route.ts — GET all submitted sections
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sections = await prisma.section.findMany({
    where: { project_id: params.id, submitted: true },
    include: { member: { select: { id: true, full_name: true, avatar_url: true } } },
    orderBy: { submitted_at: 'asc' },
  })
  return NextResponse.json(sections)
}
