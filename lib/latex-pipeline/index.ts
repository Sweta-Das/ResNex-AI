// lib/latex-pipeline/index.ts — Orchestrates COLLECT → MAP → FILL → PREVIEW

export { collect } from './collect'
export type { CollectOutput, PaperSummary, MemberSection, AgentItem, Citation } from './collect'

export { map } from './map'
export type { MapOutput, MappedItem, SectionData, SourceType } from './map'

export { fill } from './fill'
export type { FillOutput, FilledSection, FillMode } from './fill'

export { buildPreview, COLOR_LEGEND } from './preview'
export type { PreviewOutput, AnnotatedSection, ColorCode } from './preview'

import { collect } from './collect'
import { map } from './map'
import { fill } from './fill'
import { buildPreview } from './preview'
import type { PreviewOutput } from './preview'
import type { TemplateKey } from '../latex-templates'

/**
 * Run the full pipeline: COLLECT → MAP → FILL → PREVIEW
 */
export async function runPipeline(
  projectId: string,
  userId: string,
  template: TemplateKey,
  projectTopic: string
): Promise<PreviewOutput> {
  const collected = await collect(projectId, userId, template)
  const mapped = map(collected)
  const filled = await fill(mapped, projectTopic)
  return buildPreview(filled)
}
