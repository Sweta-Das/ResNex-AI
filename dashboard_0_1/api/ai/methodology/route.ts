// api/ai/methodology/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../lib/prisma'
import { callClaude } from '../../../lib/claude'

const SYSTEM = `Generate a methodology disclosure paragraph explaining how AI was used
in this research project. Mention: which AI tools were used, for which tasks,
and how human oversight was maintained.
Write in first-person plural (we). Be transparent and academically
appropriate per BERA 2024 ethical guidelines.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const { project_id } = await req.json()
  const project = await prisma.project.findUnique({ where: { id: project_id } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const methodology = await callClaude(SYSTEM,
    `Project: ${project.title}\nTopic: ${project.topic}\nDescription: ${project.description}`,
    user.language)

  await prisma.finalOutput.upsert({
    where: { project_id },
    update: { methodology_disclosure: methodology },
    create: { project_id, methodology_disclosure: methodology },
  })

  return NextResponse.json({ methodology })
}
