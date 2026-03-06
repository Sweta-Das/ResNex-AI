// api/projects/[id]/latex/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const doc = await prisma.latexDocument.findUnique({ where: { project_id: params.id } })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const doc = await prisma.latexDocument.upsert({
    where: { project_id: params.id },
    update: {
      ...(body.sections && { sections: body.sections }),
      ...(body.confirmed_sections && { confirmed_sections: body.confirmed_sections }),
    },
    create: {
      project_id: params.id,
      sections: body.sections || {},
      confirmed_sections: body.confirmed_sections || [],
    },
  })
  return NextResponse.json(doc)
}
