// api/ai/latex/fix/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callClaude } from '../../../../lib/claude'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { latex_string, instruction } = await req.json()

  const fixed = await callClaude(
    `You are a LaTeX expert. Fix or improve the provided LaTeX code based on the instruction.
     Return ONLY the corrected LaTeX code, no explanation.`,
    `Instruction: ${instruction}\n\nLaTeX:\n${latex_string}`
  )

  return NextResponse.json({ fixed })
}
