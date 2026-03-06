// lib/agents/researchAgent.ts
// Helps members write their section. Guides, does NOT write for them.

import { Agent, AgentInput, AgentOutput } from './types'
import { callClaudeWithSearch } from '../claude'

const SYSTEM_PROMPT = `You are a research assistant helping a student write their section
on {subtopic} for a group project on {topic}.

Help them find information, structure arguments, and cite ideas.
Do NOT write the section for them — guide and suggest only.
If they ask you to write it for them, explain why you won't
and redirect to helping them think through their own ideas.

You have web search capability — use it to find current, accurate information
when the student needs specific facts, statistics, or sources.`

export const researchAgent: Agent = {
  id: 'research',
  name: 'Research Assistant',
  description: 'Guides members in writing their section with web-search capability.',

  async run(input: AgentInput): Promise<AgentOutput> {
    const { messages, context, language } = input
    const { subtopic = 'your topic', topic = 'the project' } = context

    const system = SYSTEM_PROMPT
      .replace('{subtopic}', subtopic)
      .replace('{topic}', topic)

    const reply = await callClaudeWithSearch(system, messages, language)
    return { reply }
  },
}
