// lib/latex-pipeline/collect.ts — Stage 1: Gather all sources in parallel

import { prisma } from '../prisma'

export interface AgentItem {
  id: string
  result: string
  action: string
  targetSection: string | null
  createdAt: Date
}

export interface MemberSection {
  subtopic: string
  content: string
  memberName: string
}

export interface PaperSummary {
  title: string
  summary: string
  problem_statement: string
  methodology: string
  findings: string
  limitations: string
  keywords: string[]
  authors: string[]
  year: number | null
  arxivId: string | null
  doi: string | null
}

export interface Citation {
  bibKey: string
  title: string
  authors: string[]
  year: number | null
  arxivId: string | null
  doi: string | null
}

export interface CollectOutput {
  projectId: string
  userId: string
  template: string
  text: {
    agentItems: AgentItem[]
    memberSections: MemberSection[]
    paperSummaries: PaperSummary[]
    comparisonResult: { narrative: string | null; matrix: any } | null
  }
  citations: Citation[]
}

function makeBibKey(authors: string[], year: number | null): string {
  const first = authors[0]?.split(' ').pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown'
  return `${first}${year || 'nd'}`
}

export async function collect(projectId: string, userId: string, template: string): Promise<CollectOutput> {
  const [agentItems, sections, papers, finalOutput] = await Promise.all([
    // AgentPanelItems marked addedToLatex=true for this user
    prisma.agentPanelItem.findMany({
      where: { projectId, userId, addedToLatex: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Submitted member sections
    prisma.section.findMany({
      where: { project_id: projectId, submitted: true },
      include: { member: { select: { full_name: true } } },
    }),

    // Ready papers with summaries
    prisma.paper.findMany({
      where: { projectId, status: 'ready' },
    }),

    // Latest final output (for comparison results)
    prisma.finalOutput.findFirst({
      where: { project_id: projectId },
    }),
  ])

  const paperSummaries: PaperSummary[] = papers.map((p) => {
    const s = p.summary as any
    return {
      title: p.title,
      summary: s?.summary_short || '',
      problem_statement: s?.problem_statement || '',
      methodology: s?.methodology || '',
      findings: s?.findings || '',
      limitations: s?.limitations || '',
      keywords: s?.keywords || [],
      authors: (p.authors as string[]) || [],
      year: p.year,
      arxivId: p.arxivId,
      doi: p.doi,
    }
  })

  const citations: Citation[] = papers
    .filter((p) => p.arxivId || p.doi)
    .map((p) => ({
      bibKey: makeBibKey((p.authors as string[]) || [], p.year),
      title: p.title,
      authors: (p.authors as string[]) || [],
      year: p.year,
      arxivId: p.arxivId,
      doi: p.doi,
    }))

  return {
    projectId,
    userId,
    template,
    text: {
      agentItems: agentItems.map((item) => ({
        id: item.id,
        result: item.result,
        action: item.action,
        targetSection: item.targetSection,
        createdAt: item.createdAt,
      })),
      memberSections: sections.map((s) => ({
        subtopic: s.subtopic,
        content: s.content,
        memberName: (s as any).member?.full_name || 'Unknown',
      })),
      paperSummaries,
      comparisonResult: finalOutput
        ? { narrative: finalOutput.merged_content || null, matrix: null }
        : null,
    },
    citations,
  }
}
