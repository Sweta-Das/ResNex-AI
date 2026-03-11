import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { latex } = await req.json()
  const compileRes = await fetch(process.env.LATEX_COMPILE_URL || 'https://latexonline.cc/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: latex })
  })
  if (!compileRes.ok) return NextResponse.json({ error: 'Compilation failed' }, { status: 500 })

  const pdfBuffer = await compileRes.arrayBuffer()

  // Store PDF URL in FinalOutput
  await prisma.finalOutput.upsert({
    where: { project_id: id },
    update: { pdf_url: `compiled-${id}-${Date.now()}.pdf` },
    create: { project_id: id, pdf_url: `compiled-${id}-${Date.now()}.pdf` }
  })

  return new NextResponse(pdfBuffer, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="paper-${id}.pdf"` }
  })
}
