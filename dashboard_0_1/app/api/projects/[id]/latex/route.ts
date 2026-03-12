// api/projects/[id]/latex/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const doc = await prisma.latexDocument.findUnique({ where: { project_id: id } })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const doc = await prisma.latexDocument.upsert({
    where: { project_id: id },
    update: {
      ...(body.sections && { sections: body.sections }),
      ...(body.confirmed_sections && { confirmed_sections: body.confirmed_sections }),
    },
    create: {
      project_id: id,
      sections: body.sections || {},
      confirmed_sections: body.confirmed_sections || [],
    },
  })
  return NextResponse.json(doc)
}
