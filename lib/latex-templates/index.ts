// lib/latex-templates/index.ts — Template registry and loader

import { TEMPLATE_CONTENT } from './templates'

export const TEMPLATES = {
  neurips: { label: 'NeurIPS 2025', file: 'neurips.tex' },
  generic: { label: 'Generic Research Paper', file: 'generic.tex' },
} as const

export type TemplateKey = keyof typeof TEMPLATES

// Placeholder keys used in .tex files (<<key>>)
export const SECTION_KEYS = [
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
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

export function getTemplate(key: TemplateKey): string {
  const meta = TEMPLATES[key]
  if (!meta) throw new Error(`Unknown template key: ${key}`)
  return TEMPLATE_CONTENT[key]
}

export function fillTemplate(template: string, sections: Partial<Record<SectionKey, string>>): string {
  let result = template
  for (const [key, value] of Object.entries(sections)) {
    result = result.replaceAll(`<<${key}>>`, value || '')
  }
  return result
}

export function getTemplateSections(key: TemplateKey): SectionKey[] {
  const template = getTemplate(key)
  const found: SectionKey[] = []
  for (const sec of SECTION_KEYS) {
    if (template.includes(`<<${sec}>>`)) found.push(sec)
  }
  return found
}
