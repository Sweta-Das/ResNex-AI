// api/projects/[id]/latex/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { fillTemplate, getTemplate } from '../../../../../lib/latex-templates'

async function requireProjectMember(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({
    where: { project_id: projectId, user_id: userId },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await requireProjectMember(id, user.id)
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const doc = await prisma.latexDocument.findUnique({ where: { project_id: id } })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await requireProjectMember(id, user.id)
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const existing = await prisma.latexDocument.findUnique({ where: { project_id: id } })
  const templateKey = body.template || existing?.template || 'generic'
  const sections =
    body.sections !== undefined
      ? body.sections
      : ((existing?.sections as Record<string, string> | null) || {})
  const preview = fillTemplate(getTemplate(templateKey), sections)

  const doc = await prisma.latexDocument.upsert({
    where: { project_id: id },
    update: {
      ...(body.sections !== undefined && { sections: body.sections }),
      ...(body.confirmed_sections !== undefined && { confirmed_sections: body.confirmed_sections }),
      ...(body.template !== undefined && { template: body.template }),
      preview,
      ...(body.confirmed !== undefined && { confirmed: body.confirmed }),
      ...(body.sectionSources !== undefined && { sectionSources: body.sectionSources }),
      ...(body.figures !== undefined && { figures: body.figures }),
      ...(body.tables !== undefined && { tables: body.tables }),
      ...(body.citations !== undefined && { citations: body.citations }),
    },
    create: {
      project_id: id,
      template: body.template || 'generic',
      sections: body.sections || {},
      confirmed_sections: body.confirmed_sections || [],
      preview,
      confirmed: body.confirmed || false,
      sectionSources: body.sectionSources || {},
    },
  })
  return NextResponse.json(doc)
}
