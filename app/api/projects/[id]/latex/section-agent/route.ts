// POST /api/projects/[id]/latex/section-agent
// @agent in LaTeX section context → sectionOrchestrator
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectionOrchestrator } from '@/lib/agents/orchestratorAgent'
import { logContribution } from '@/lib/streaks/tracker'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { section, userInstruction, referencedAssetIds, existingContent, projectContext } = body

  if (!section || !userInstruction) {
    return NextResponse.json({ error: 'section and userInstruction are required' }, { status: 400 })
  }

  // Fetch referenced assets
  const referencedAssets = referencedAssetIds?.length
    ? await prisma.latexAsset.findMany({
        where: { id: { in: referencedAssetIds }, projectId: id },
      })
    : []

  const result = await sectionOrchestrator({
    section,
    userInstruction,
    referencedAssets: referencedAssets.map(a => ({
      id: a.id,
      fileType: a.fileType,
      fileName: a.fileName,
      url: a.url,
    })),
    existingContent: existingContent || '',
    projectContext: projectContext || {},
    projectId: id,
    userId: user.id,
  })

  // Log contribution
  await logContribution(id, user.id, '@agent_section')

  return NextResponse.json(result)
}
