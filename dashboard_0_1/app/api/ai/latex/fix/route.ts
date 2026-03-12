// api/ai/latex/fix/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../lib/auth'
import { callClaude } from '../../../../../lib/claude'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { latex_string, instruction } = await req.json()

  const fixed = await callClaude(
    `You are a LaTeX expert. Fix or improve the provided LaTeX code based on the instruction.
     Return ONLY the corrected LaTeX code, no explanation.`,
    `Instruction: ${instruction}\n\nLaTeX:\n${latex_string}`
  )

  return NextResponse.json({ fixed })
}
