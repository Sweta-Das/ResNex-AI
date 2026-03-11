import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reformatCitations, CitationStyle } from '@/lib/citations/formatter'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { style, bibliographyLatex } = await req.json()
  const reformatted = await reformatCitations(bibliographyLatex, style as CitationStyle)

  return NextResponse.json({ reformatted })
}
