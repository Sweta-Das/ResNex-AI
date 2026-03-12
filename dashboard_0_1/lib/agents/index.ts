// lib/agents/index.ts
// Agent registry — ONLY this file changes when adding or removing agents.
// Nothing else in the codebase needs to be touched.

import { researchAgent } from './researchAgent'
import { mergeAgent } from './mergeAgent'
import { biasAgent } from './biasAgent'
import { latexAgent } from './latexAgent'
import { paperExplainer } from './paperExplainer'
import { Agent } from './types'

export const agents: Record<string, Agent> = {
  research: researchAgent,
  merge: mergeAgent,
  bias: biasAgent,
  latex: latexAgent,
  paperExplainer: paperExplainer, // add/remove only here
}

export function getAgent(id: string): Agent | undefined {
  return agents[id]
}

export { researchAgent, mergeAgent, biasAgent, latexAgent, paperExplainer }
export type { Agent, AgentInput, AgentOutput } from './types'
