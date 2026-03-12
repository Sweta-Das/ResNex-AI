// lib/agents/latexAgent.ts
// 10-step LaTeX pipeline: picks template, fills each LaTeX section from project data.

import { Agent, AgentInput, AgentOutput } from './types'
import { callClaude } from '../claude'

const STEP_PROMPTS: Record<string, string> = {
  template: `Given the research topic and description, pick the best academic paper format.
Choose from: IEEE | ACM | Generic. Return JSON only: { "format": "...", "reason": "..." }`,

  title_authors: `Generate LaTeX \\title{} and \\author{} blocks from the project title, member names, and affiliations.
Return only the LaTeX code.`,

  abstract: `Write a 150-word academic abstract for the research project.
Return only: \\begin{abstract}...\\end{abstract}`,

  introduction: `Write an introduction section for the research paper.
Return only: \\section{Introduction}...`,

  methodology: `Write a methodology section explaining how the research was conducted and how AI was used.
Include the methodology disclosure provided. Return only: \\section{Methodology}...`,

  results: `Write a results section from the merged member content.
Return only: \\section{Results}...`,

  discussion: `Write a discussion section analyzing the merged research content.
Return only: \\section{Discussion}...`,

  conclusion: `Write a conclusion section summarizing the research.
Return only: \\section{Conclusion}...`,

  references: `Generate a BibTeX bibliography block from the cited sources and uploaded file metadata.
Return only: \\bibliographystyle{...} \\bibliography{...} or a \\begin{thebibliography}...\\end{thebibliography} block.`,

  disclosures: `Write a contributorship statement and BERA-compliant AI usage disclosure.
Include each contributor's role from the contributorship log.
Return only the LaTeX text for these two disclosure sections.`,
}

export const latexAgent: Agent = {
  id: 'latex',
  name: 'LaTeX Paper Generator',
  description: '10-step pipeline: picks template, fills each LaTeX section from project data.',

  async run(input: AgentInput): Promise<AgentOutput> {
    const { messages, context, language } = input
    const step = context.step as string || 'template'

    const prompt = STEP_PROMPTS[step]
    if (!prompt) {
      return { reply: `Unknown LaTeX step: ${step}` }
    }

    const userMessage = messages[messages.length - 1]?.content || JSON.stringify(context)
    const reply = await callClaude(prompt, userMessage, language)

    return { reply }
  },
}

/**
 * Run the full 10-step LaTeX pipeline sequentially.
 * Each step receives only the data relevant to that section.
 */
export async function runFullLatexPipeline(
  projectData: Record<string, any>,
  language: string
): Promise<Record<string, string>> {
  const steps = [
    'template',
    'title_authors',
    'abstract',
    'introduction',
    'methodology',
    'results',
    'discussion',
    'conclusion',
    'references',
    'disclosures',
  ]

  const results: Record<string, string> = {}

  for (const step of steps) {
    const contextForStep = buildContextForStep(step, projectData)
    const userMessage = JSON.stringify(contextForStep)

    const raw = await callClaude(STEP_PROMPTS[step], userMessage, language)
    results[step] = raw
  }

  return results
}

function buildContextForStep(step: string, data: Record<string, any>): Record<string, any> {
  switch (step) {
    case 'template':
      return { topic: data.topic, description: data.description }
    case 'title_authors':
      return { title: data.title, members: data.members, affiliations: data.affiliations }
    case 'abstract':
      return { topic: data.topic, sectionsSummary: data.sectionsSummary }
    case 'introduction':
      return { topic: data.topic, description: data.description, projectGoal: data.projectGoal }
    case 'methodology':
      return { methodologyDisclosure: data.methodologyDisclosure, aiUsage: data.aiUsage }
    case 'results':
      return { mergedContent: data.mergedContent }
    case 'discussion':
      return { mergedContentAnalysis: data.mergedContent }
    case 'conclusion':
      return { mergedContentSummary: data.mergedContent }
    case 'references':
      return { uploadedFiles: data.uploadedFiles, citedSources: data.citedSources }
    case 'disclosures':
      return { contributorshipLog: data.contributorshipLog, agentsUsed: data.agentsUsed }
    default:
      return data
  }
}
