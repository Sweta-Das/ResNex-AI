// api/ai/bias-audit/route.ts — Audit merged content for biased language

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../lib/prisma'
import { biasAgent } from '../../../lib/agents/biasAgent'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { project_id } = body

  const finalOutput = await prisma.finalOutput.findUnique({ where: { project_id } })
  if (!finalOutput?.merged_content) {
    return NextResponse.json({ error: 'No merged content found. Run merge first.' }, { status: 400 })
  }

  const result = await biasAgent.run({
    messages: [{ role: 'user', content: finalOutput.merged_content }],
    context: { project_id },
    language: user.language,
  })

  // Save audit report
  await prisma.finalOutput.update({
    where: { project_id },
    data: { bias_audit_report: result.reply },
  })

  return NextResponse.json({
    report: result.reply,
    ...result.metadata,
  })
}
