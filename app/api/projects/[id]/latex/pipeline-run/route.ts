// app/api/projects/[id]/latex/pipeline-run/route.ts
// POST: Run full COLLECT → MAP → FILL → PREVIEW pipeline

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'
import { runPipeline } from '../../../../../../lib/latex-pipeline'
import type { TemplateKey } from '../../../../../../lib/latex-templates'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { template = 'generic' } = await req.json()

  // Get project topic for AI context
  const project = await prisma.project.findUnique({
    where: { id },
    select: { topic: true, title: true, description: true },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const projectTopic = `${project.title}: ${project.topic || project.description || ''}`

  try {
    const preview = await runPipeline(id, user.id, template as TemplateKey, projectTopic)

    // preview.sections is AnnotatedSection[] — map by s.key not array index
    const sectionsMap = Object.fromEntries(preview.sections.map((s) => [s.key, s.content]))
    const sourcesMap = Object.fromEntries(preview.sections.map((s) => [s.key, s.color]))

    await prisma.latexDocument.upsert({
      where: { project_id: id },
      create: {
        project_id: id,
        template,
        format: template === 'neurips' ? 'NeurIPS' : 'Generic',
        preview: preview.fullLatex,
        sections: sectionsMap,
        sectionSources: sourcesMap,
        confirmed: false,
      },
      update: {
        template,
        preview: preview.fullLatex,
        sections: sectionsMap,
        sectionSources: sourcesMap,
        confirmed: false,
      },
    })

    return NextResponse.json(preview)
  } catch (err: any) {
    console.error('Pipeline error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
