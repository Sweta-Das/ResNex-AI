// api/ai/latex/generate/route.ts — Generate all LaTeX sections from project data

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { runFullLatexPipeline } from '../../../../../lib/agents/latexAgent'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { project_id, format } = body

  const [project, finalOutput, members, sections, logs] = await Promise.all([
    prisma.project.findUnique({ where: { id: project_id }, include: { admin: true } }),
    prisma.finalOutput.findUnique({ where: { project_id } }),
    prisma.projectMember.findMany({
      where: { project_id },
      include: { user: true },
    }),
    prisma.section.findMany({ where: { project_id, submitted: true }, include: { member: true } }),
    prisma.contributorshipLog.findMany({
      where: { project_id },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
  ])

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const projectData = {
    title: project.title,
    topic: project.topic,
    description: project.description,
    projectGoal: project.description,
    members: members.map((m) => ({ id: m.user_id, name: m.user.full_name })),
    affiliations: members.map((m) => m.user.affiliation || ''),
    mergedContent: finalOutput?.merged_content || '',
    sectionsSummary: sections.map((s) => `${s.subtopic}: ${s.content.slice(0, 200)}`).join('\n'),
    methodologyDisclosure: finalOutput?.methodology_disclosure || '',
    aiUsage: 'Claude AI used for research assistance, document merging, bias auditing, and LaTeX generation.',
    uploadedFiles: [],
    citedSources: [],
    contributorshipLog: logs.map((l) => `${l.user.full_name}: ${l.description} (${l.action})`).join('\n'),
    agentsUsed: ['researchAgent', 'mergeAgent', 'biasAgent', 'latexAgent'],
  }

  const latexSections = await runFullLatexPipeline(projectData, user.language)

  // Save to DB
  await prisma.latexDocument.upsert({
    where: { project_id },
    update: { sections: latexSections, format: format || 'Generic' },
    create: { project_id, sections: latexSections, format: format || 'Generic' },
  })

  return NextResponse.json({ sections: latexSections, format: format || 'Generic' })
}
