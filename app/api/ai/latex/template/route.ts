// app/api/ai/latex/template/route.ts
// Pick best academic format for the project topic

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { callLLM } from '../../../../../lib/llm'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await req.json()

  const project = await prisma.project.findUnique({ where: { id: project_id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const system = `Given the research topic and description, pick the best academic paper format.
Choose from: IEEE | ACM | Generic. Return JSON only: { "format": "...", "reason": "..." }`

  const userMsg = JSON.stringify({ topic: project.topic, description: project.description })
  const raw = await callLLM({
    system,
    messages: [{ role: 'user', content: userMsg }],
    language: user.language,
  })

  let parsed: { format: string; reason: string }
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    parsed = { format: 'Generic', reason: raw }
  }

  return NextResponse.json(parsed)
}
