// app/api/projects/[id]/latex/pipeline-context/route.ts
// GET: Collect all sources for the LaTeX pipeline (COLLECT stage)

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'
import { collect } from '../../../../../../lib/latex-pipeline/collect'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const template = url.searchParams.get('template') || 'generic'

  try {
    const context = await collect(id, user.id, template)
    return NextResponse.json(context)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
