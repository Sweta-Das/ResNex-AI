// api/ai/latex/regenerate-section/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../lib/prisma'
import { latexAgent } from '../../../../lib/agents/latexAgent'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { project_id, section_key, instruction } = await req.json()

  const [project, output] = await Promise.all([
    prisma.project.findUnique({ where: { id: project_id }, include: { members: { include: { user: true } } } }),
    prisma.finalOutput.findUnique({ where: { project_id } }),
  ])

  const result = await latexAgent.run({
    messages: [{ role: 'user', content: JSON.stringify({
      topic: project?.topic,
      description: project?.description,
      mergedContent: output?.merged_content || '',
      instruction,
    }) }],
    context: { step: section_key },
    language: user.language,
  })

  // Save updated section
  const existing = await prisma.latexDocument.findUnique({ where: { project_id } })
  if (existing) {
    const sections = (existing.sections as Record<string, string>) || {}
    sections[section_key] = result.reply
    await prisma.latexDocument.update({
      where: { project_id },
      data: { sections },
    })
  }

  return NextResponse.json({ content: result.reply })
}
