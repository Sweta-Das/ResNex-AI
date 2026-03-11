// lib/latex-pipeline/map.ts — Stage 2: Route collected data to template sections

import { CollectOutput, AgentItem, MemberSection, PaperSummary } from './collect'
import { SectionKey } from '../latex-templates'

export type SourceType = 'member_section' | 'paper_summary' | 'agent_item' | 'agent_media' | 'comparison'

export interface MappedItem {
  content: string
  sourceType: SourceType
  sourceName: string
  explicit: boolean
}

export interface CitationItem {
  bibKey: string
  title: string
  authors: string[]
  year: number | null
  arxivId: string | null
  doi: string | null
}

export interface SectionData {
  text: MappedItem[]
  citations: CitationItem[]
}

export interface MapOutput {
  template: string
  sections: Partial<Record<SectionKey, SectionData>>
}

// Keywords that suggest a member section belongs to a given template section
const SECTION_KEYWORDS: Record<SectionKey, string[]> = {
  title: ['title'],
  authors: ['author', 'contributor'],
  abstract: ['abstract', 'summary', 'overview'],
  introduction: ['intro', 'introduction', 'background', 'motivation'],
  related_work: ['related', 'literature', 'prior work', 'survey', 'state of the art'],
  methodology: ['method', 'methodology', 'approach', 'technique', 'procedure', 'algorithm', 'design'],
  experiments: ['experiment', 'evaluation', 'setup', 'implementation', 'dataset', 'benchmark'],
  results: ['result', 'finding', 'performance', 'analysis', 'outcome', 'discussion'],
  conclusion: ['conclusion', 'future work', 'limitation', 'summary'],
  acknowledgments: ['acknowledgment', 'acknowledgement', 'funding', 'thanks'],
  references: ['reference', 'citation', 'bibliography'],
  preamble_extras: [],
}

function matchSection(text: string): SectionKey {
  const lower = text.toLowerCase()
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return section as SectionKey
  }
  return 'results'
}

function addToSection(
  sections: Partial<Record<SectionKey, SectionData>>,
  key: SectionKey,
  item: MappedItem
) {
  if (!sections[key]) sections[key] = { text: [], citations: [] }
  sections[key]!.text.push(item)
}

export function map(collected: CollectOutput): MapOutput {
  const sections: Partial<Record<SectionKey, SectionData>> = {}

  // 1. Agent items — explicit targetSection first, then keyword match
  for (const item of collected.text.agentItems) {
    const target = item.targetSection as SectionKey | null
    const key: SectionKey = target && target in SECTION_KEYWORDS ? target : matchSection(item.result)
    const sourceType: SourceType =
      ['equation_image', 'figure_upload', 'figure_latex', 'table', 'table_csv', 'describe_data'].includes(item.action)
        ? 'agent_media'
        : 'agent_item'
    addToSection(sections, key, {
      content: item.result,
      sourceType,
      sourceName: `Agent: ${item.action}`,
      explicit: !!item.targetSection,
    })
  }

  // 2. Member sections — match by subtopic keyword
  for (const sec of collected.text.memberSections) {
    const key = matchSection(sec.subtopic)
    // Strip HTML tags from TipTap content for LaTeX
    const plainText = sec.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    addToSection(sections, key, {
      content: plainText,
      sourceType: 'member_section',
      sourceName: sec.memberName,
      explicit: false,
    })
  }

  // 3. Paper summaries → Related Work
  if (collected.text.paperSummaries.length > 0) {
    const relatedItems: MappedItem[] = collected.text.paperSummaries.map((p) => ({
      content: [
        p.problem_statement && `Problem: ${p.problem_statement}`,
        p.methodology && `Methodology: ${p.methodology}`,
        p.findings && `Findings: ${p.findings}`,
      ]
        .filter(Boolean)
        .join('\n'),
      sourceType: 'paper_summary',
      sourceName: p.title,
      explicit: false,
    }))
    if (!sections.related_work) sections.related_work = { text: [], citations: [] }
    sections.related_work!.text.push(...relatedItems)
  }

  // 4. Comparison result → Related Work narrative
  if (collected.text.comparisonResult?.narrative) {
    addToSection(sections, 'related_work', {
      content: collected.text.comparisonResult.narrative,
      sourceType: 'comparison',
      sourceName: 'Paper Comparison',
      explicit: false,
    })
  }

  // 5. Citations → references section
  if (!sections.references) sections.references = { text: [], citations: [] }
  sections.references!.citations.push(...collected.citations)

  // Sort: explicit items first in each section
  for (const section of Object.values(sections)) {
    if (section) {
      section.text.sort((a, b) => (a.explicit === b.explicit ? 0 : a.explicit ? -1 : 1))
    }
  }

  return { template: collected.template, sections }
}
