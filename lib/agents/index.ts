// lib/agents/index.ts
// Agent registry — ONLY this file changes when adding or removing agents.
// Nothing else in the codebase needs to be touched.

import { researchAgent } from './researchAgent'
import { mergeAgent } from './mergeAgent'
import { biasAgent } from './biasAgent'
import { paperExplainer } from './paperExplainer'
import { researchSearchAgent } from './researchSearchAgent'
import { writerAgent } from './writerAgent'
import { plannerAgent } from './plannerAgent'
import { chatSummarizerAgent } from './chatSummarizerAgent'
import { Agent } from './types'

export const agents: Record<string, Agent> = {
  research: researchAgent,
  merge: mergeAgent,
  bias: biasAgent,
  paperExplainer: paperExplainer,
  'research-search': researchSearchAgent,
  writer: writerAgent,
  planner: plannerAgent,
  'chat-summarizer': chatSummarizerAgent,
}

export function getAgent(id: string): Agent | undefined {
  return agents[id]
}

export { researchAgent, mergeAgent, biasAgent, paperExplainer, researchSearchAgent, writerAgent, plannerAgent, chatSummarizerAgent }
export type { Agent, AgentInput, AgentOutput } from './types'
