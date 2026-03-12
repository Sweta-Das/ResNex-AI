// app/api/projects/[id]/latex/compile/route.ts
// POST: Compile LaTeX via latexonline.cc (GET /compile?text=) or custom JSON compiler

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const compilerUrl = process.env.LATEX_COMPILER_URL
    if (!compilerUrl) {
      return NextResponse.json({
        success: false,
        pdfUrl: null,
        logs: 'LATEX_COMPILER_URL is not configured. Set this env var to enable PDF compilation.',
      })
    }

    // Fetch all files for this project
    const files = await prisma.latexFile.findMany({ where: { projectId: id } })
    if (files.length === 0) {
      return NextResponse.json({ error: 'No LaTeX files found. Sync sections first.' }, { status: 400 })
    }

    // Get main .tex content (isMain first, then any CODE file)
    const mainFile = files.find((f) => f.isMain && f.type === 'CODE') ?? files.find((f) => f.type === 'CODE')
    if (!mainFile?.content) {
      return NextResponse.json({ error: 'No main LaTeX file with content found.' }, { status: 400 })
    }

    // ── latexonline.cc / compatible GET API ──────────────────────────────
    // latexonline.cc: GET /compile?text=<url-encoded-latex> → returns PDF binary
    const encoded = encodeURIComponent(mainFile.content)
    const compileUrl = `${compilerUrl.replace(/\/$/, '')}/compile?text=${encoded}`

    let compileRes: Response
    try {
      compileRes = await fetch(compileUrl, { method: 'GET' })
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        pdfUrl: null,
        logs: `Failed to reach compiler at ${compilerUrl}: ${err.message}`,
      })
    }

    const contentType = compileRes.headers.get('content-type') || ''

    // If compiler returned a PDF directly (binary)
    if (compileRes.ok && contentType.includes('application/pdf')) {
      const pdfBuffer = await compileRes.arrayBuffer()
      const base64 = Buffer.from(pdfBuffer).toString('base64')
      const pdfDataUrl = `data:application/pdf;base64,${base64}`

      await prisma.project.update({ where: { id }, data: { pdfUrl: pdfDataUrl } })

      return NextResponse.json({ success: true, pdfUrl: pdfDataUrl, logs: 'Compiled successfully.' })
    }

    // If compiler returned an error page or non-PDF
    const rawBody = await compileRes.text()

    // Try JSON parse (custom compile server protocol)
    let compileData: any = null
    try {
      compileData = JSON.parse(rawBody)
    } catch {
      // not JSON — show snippet
    }

    if (compileData) {
      const logs: string = compileData.log || compileData.logs || ''
      const success: boolean = compileData.success === true

      if (success && compileData.pdf) {
        const pdfDataUrl = `data:application/pdf;base64,${compileData.pdf}`
        await prisma.project.update({ where: { id }, data: { pdfUrl: pdfDataUrl } })
        return NextResponse.json({ success: true, pdfUrl: pdfDataUrl, logs })
      }

      const errorMatch = logs.match(/^.*:(\d+):.*error/mi)
      const errorLine = errorMatch ? parseInt(errorMatch[1]) : undefined
      return NextResponse.json({ success: false, pdfUrl: null, logs, errorLine })
    }

    // Non-JSON, non-PDF response — likely an error page
    return NextResponse.json({
      success: false,
      pdfUrl: null,
      logs: `Compiler returned HTTP ${compileRes.status} (${contentType}).\n\nResponse preview:\n${rawBody.slice(0, 500)}`,
    })
  } catch (err: any) {
    const msg = err?.message || String(err) || 'Internal server error'
    console.error('[POST /latex/compile]', msg)
    return NextResponse.json({ success: false, pdfUrl: null, logs: msg })
  }
}
