// lib/latex-pipeline/fill.ts — Stage 3: LLM fills each template section

import { callLLM } from '../llm'
import { MapOutput, SectionData } from './map'
import { TemplateKey, SectionKey, getTemplate, fillTemplate, getTemplateSections } from '../latex-templates'

export type FillMode = 'data' | 'generated'

export interface FilledSection {
  content: string
  mode: FillMode
  sourceTypes: string[]
  wordCount: number
}

export interface FillOutput {
  latex: string
  template: TemplateKey
  sections: Partial<Record<SectionKey, FilledSection>>
  warnings: string[]
}

const FILL_ORDER: SectionKey[] = [
  'title',
  'authors',
  'abstract',
  'introduction',
  'related_work',
  'methodology',
  'experiments',
  'results',
  'conclusion',
  'acknowledgments',
  'references',
  'preamble_extras',
]

function buildBibTeX(citations: { bibKey: string; title: string; authors: string[]; year: number | null; arxivId: string | null; doi: string | null }[]): string {
  return citations
    .map((c) => {
      const author = c.authors.join(' and ')
      const url = c.arxivId
        ? `https://arxiv.org/abs/${c.arxivId}`
        : c.doi
        ? `https://doi.org/${c.doi}`
        : ''
      return `@article{${c.bibKey},
  title={${c.title}},
  author={${author}},
  year={${c.year || 'n/a'}},
  url={${url}}
}`
    })
    .join('\n\n')
}

function countWords(text: string): number {
  return text
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

async function fillSection(
  sectionKey: SectionKey,
  templateKey: TemplateKey,
  sectionData: SectionData | undefined,
  projectTopic: string,
  filledSoFar: string
): Promise<{ content: string; mode: FillMode }> {
  // References — build BibTeX without LLM
  if (sectionKey === 'references') {
    const citations = sectionData?.citations || []
    if (citations.length === 0) return { content: '% No citations collected yet.', mode: 'generated' }
    return { content: buildBibTeX(citations), mode: 'data' }
  }

  // preamble_extras — skip (leave empty)
  if (sectionKey === 'preamble_extras') {
    return { content: '% Additional packages can be added here.', mode: 'generated' }
  }

  const hasData = sectionData && sectionData.text.length > 0
  const mode: FillMode = hasData ? 'data' : 'generated'

  const sectionLabel = sectionKey.replace(/_/g, ' ')

  let dataContext = ''
  if (hasData) {
    dataContext = sectionData!.text
      .map((item, i) => `[${i + 1}] ${item.sourceName}: ${item.content.slice(0, 800)}`)
      .join('\n\n')
  }

  const system = hasData
    ? `You are an academic LaTeX writing assistant. Fill the "${sectionLabel}" section of a ${templateKey} research paper.
Return ONLY valid LaTeX content for this section — no \\begin{document}, no preamble, no explanations.
Base your writing strictly on the provided data. Do not hallucinate facts.
Use proper LaTeX formatting: \\section{}, \\subsection{}, \\emph{}, \\cite{} etc.`
    : `You are an academic LaTeX writing assistant. Fill the "${sectionLabel}" section of a ${templateKey} research paper.
The project topic is: ${projectTopic}
Return ONLY valid LaTeX content for this section — no \\begin{document}, no preamble, no explanations.
Write a reasonable placeholder based on the project topic and context provided.
Use proper LaTeX formatting.`

  const userContent = hasData
    ? `Fill the "${sectionLabel}" section using this data:\n\n${dataContext}\n\nAlready written sections for context:\n${filledSoFar.slice(0, 2000)}`
    : `Generate the "${sectionLabel}" section. Project topic: ${projectTopic}\n\nAlready written sections:\n${filledSoFar.slice(0, 1500)}`

  try {
    const content = await callLLM({
      system,
      messages: [{ role: 'user', content: userContent }],
      maxTokens: 2000,
    })
    return { content: content.trim(), mode }
  } catch {
    return {
      content: `% Failed to generate ${sectionLabel} — add content manually.`,
      mode: 'generated',
    }
  }
}

export async function fill(
  mapped: MapOutput,
  projectTopic: string
): Promise<FillOutput> {
  const templateKey = mapped.template as TemplateKey
  const template = getTemplate(templateKey)
  const availableSections = getTemplateSections(templateKey)

  const filledSections: Partial<Record<SectionKey, FilledSection>> = {}
  const warnings: string[] = []
  const sectionContents: Partial<Record<SectionKey, string>> = {}

  for (const sectionKey of FILL_ORDER) {
    if (!availableSections.includes(sectionKey)) continue

    const sectionData = mapped.sections[sectionKey]
    const filledSoFar = Object.entries(sectionContents)
      .map(([k, v]) => `% --- ${k} ---\n${v}`)
      .join('\n\n')

    const { content, mode } = await fillSection(
      sectionKey,
      templateKey,
      sectionData,
      projectTopic,
      filledSoFar
    )

    sectionContents[sectionKey] = content
    filledSections[sectionKey] = {
      content,
      mode,
      sourceTypes: sectionData?.text.map((i) => i.sourceType) || [],
      wordCount: countWords(content),
    }

    if (mode === 'generated') {
      warnings.push(`"${sectionKey.replace(/_/g, ' ')}" had no source data — AI generated placeholder.`)
    }
  }

  const latex = fillTemplate(template, sectionContents as any)

  return {
    latex,
    template: templateKey,
    sections: filledSections,
    warnings,
  }
}
