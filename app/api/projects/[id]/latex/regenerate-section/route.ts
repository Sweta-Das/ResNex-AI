// app/api/projects/[id]/latex/regenerate-section/route.ts
// POST: Re-run FILL for a single section only

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'
import { collect } from '../../../../../../lib/latex-pipeline/collect'
import { map } from '../../../../../../lib/latex-pipeline/map'
import { fill } from '../../../../../../lib/latex-pipeline/fill'
import { fillTemplate, getTemplate } from '../../../../../../lib/latex-templates'
import type { SectionKey } from '../../../../../../lib/latex-templates'
import type { TemplateKey } from '../../../../../../lib/latex-templates'

function getSectionColor(mode: 'data' | 'generated', sourceTypes: string[]): string {
  if (mode === 'generated') return 'red'
  if (sourceTypes.includes('member_section')) return 'blue'
  if (sourceTypes.includes('paper_summary')) return 'green'
  if (sourceTypes.includes('agent_item')) return 'yellow'
  if (sourceTypes.includes('comparison')) return 'purple'
  return 'green'
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sectionKey, template } = await req.json()
  if (!sectionKey) return NextResponse.json({ error: 'sectionKey is required' }, { status: 400 })

  const project = await prisma.project.findUnique({
    where: { id },
    select: { topic: true, title: true, description: true },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const projectTopic = `${project.title}: ${project.topic || project.description || ''}`
  const templateKey = (template || 'generic') as TemplateKey

  try {
    const collected = await collect(id, user.id, templateKey)
    const mapped = map(collected)
    const filled = await fill(mapped, projectTopic)

    const section = filled.sections[sectionKey as SectionKey]
    if (!section) {
      return NextResponse.json({ error: `Section "${sectionKey}" not found in template` }, { status: 404 })
    }

    // Update just that section in the stored latex document
    const existing = await prisma.latexDocument.findUnique({ where: { project_id: id } })
    if (existing) {
      const updatedSections = { ...(existing.sections as Record<string, string>), [sectionKey]: section.content }
      const updatedSectionSources = {
        ...((existing.sectionSources as Record<string, string> | null) || {}),
        [sectionKey]: getSectionColor(section.mode, section.sourceTypes),
      }
      const preview = fillTemplate(getTemplate(templateKey), updatedSections as Record<SectionKey, string>)
      await prisma.latexDocument.update({
        where: { project_id: id },
        data: {
          sections: updatedSections,
          sectionSources: updatedSectionSources,
          preview,
          confirmed: false,
        },
      })
    }

    return NextResponse.json({
      sectionKey,
      content: section.content,
      mode: section.mode,
      wordCount: section.wordCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
