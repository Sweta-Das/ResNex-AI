// lib/latex-pipeline/preview.ts — Stage 4: Annotate sections with color metadata

import { FillOutput, FilledSection } from './fill'
import { SectionKey } from '../latex-templates'

export type ColorCode = 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red'

export interface AnnotatedSection {
  key: SectionKey
  label: string
  content: string
  color: ColorCode
  mode: 'data' | 'generated'
  sourceTypes: string[]
  wordCount: number
}

export interface PreviewOutput {
  sections: AnnotatedSection[]
  warnings: string[]
  fullLatex: string
}

const SECTION_LABELS: Partial<Record<SectionKey, string>> = {
  title: 'Title',
  authors: 'Authors',
  abstract: 'Abstract',
  introduction: 'Introduction',
  related_work: 'Related Work',
  methodology: 'Methodology',
  experiments: 'Experiments',
  results: 'Results / Discussion',
  conclusion: 'Conclusion',
  acknowledgments: 'Acknowledgments',
  references: 'References',
  preamble_extras: 'Preamble Extras',
}

function getColor(section: FilledSection): ColorCode {
  if (section.mode === 'generated') return 'red'
  const types = section.sourceTypes
  if (types.includes('member_section')) return 'blue'
  if (types.includes('paper_summary')) return 'green'
  if (types.includes('agent_media')) return 'orange'
  if (types.includes('agent_item')) return 'yellow'
  if (types.includes('comparison')) return 'purple'
  return 'green'
}

export function buildPreview(fillOutput: FillOutput): PreviewOutput {
  const annotated: AnnotatedSection[] = []

  for (const [key, section] of Object.entries(fillOutput.sections)) {
    const sectionKey = key as SectionKey
    if (!section) continue
    annotated.push({
      key: sectionKey,
      label: SECTION_LABELS[sectionKey] || key,
      content: section.content,
      color: getColor(section),
      mode: section.mode,
      sourceTypes: section.sourceTypes,
      wordCount: section.wordCount,
    })
  }

  return {
    sections: annotated,
    warnings: fillOutput.warnings,
    fullLatex: fillOutput.latex,
  }
}

export const COLOR_LEGEND: Record<ColorCode, { label: string; description: string }> = {
  blue: { label: 'Member Section', description: 'Written by a team member' },
  green: { label: 'Paper Summary', description: 'Derived from paper library' },
  yellow: { label: 'Agent Item', description: 'Generated via @agent' },
  purple: { label: 'Comparison', description: 'From paper comparison' },
  orange: { label: 'Media', description: 'Figures, tables, equations' },
  red: { label: 'AI Generated', description: 'No source data — AI placeholder' },
}
