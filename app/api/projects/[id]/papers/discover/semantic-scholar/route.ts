// app/api/projects/[id]/papers/discover/semantic-scholar/route.ts
// POST: search Semantic Scholar and return results

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const member = await prisma.projectMember.findFirst({ where: { project_id: id, user_id: user.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { query, limit = 15 } = await req.json()
  if (!query?.trim()) return NextResponse.json({ error: 'query is required' }, { status: 400 })

  const fields = 'paperId,title,authors,year,abstract,citationCount,openAccessPdf,externalIds'
  const encoded = encodeURIComponent(query.trim())
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&fields=${fields}&limit=${limit}`

  const headers: Record<string, string> = {}
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY
  }

  const res = await fetch(url, { headers })
  if (!res.ok) return NextResponse.json({ error: 'Semantic Scholar API error' }, { status: 502 })

  const data = await res.json()
  const results = (data.data || []).map((p: any) => ({
    semanticScholarId: p.paperId,
    title: p.title || '',
    authors: (p.authors || []).map((a: any) => a.name),
    year: p.year,
    abstract: p.abstract || '',
    citationCount: p.citationCount,
    openAccessPdfUrl: p.openAccessPdf?.url || null,
    arxivId: p.externalIds?.ArXiv || null,
    doi: p.externalIds?.DOI || null,
    url: `https://www.semanticscholar.org/paper/${p.paperId}`,
  }))

  return NextResponse.json({ results })
}
