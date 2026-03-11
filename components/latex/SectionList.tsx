'use client'
// components/latex/SectionList.tsx — center panel: scrollable stack of SectionBlocks
import SectionBlock from './SectionBlock'
import type { LatexAsset } from './AgentSectionPopover'

const DEFAULT_SECTIONS = [
  'Abstract',
  'Introduction',
  'Related Work',
  'Methodology',
  'Experiments',
  'Results',
  'Discussion',
  'Conclusion',
  'References',
]

interface Props {
  projectId: string
  sections?: string[]
  assets: LatexAsset[]
}

export default function SectionList({ projectId, sections = DEFAULT_SECTIONS, assets }: Props) {
  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      <p className="text-xs text-[#7a839a] px-1">
        Click <span className="text-[#4f8ef7]">@agent</span> in the Visual editor to trigger an AI agent for that section.
        Color-coding: <span className="text-blue-400">■ user</span> · <span className="text-yellow-400">■ agent</span> · <span className="text-red-400">■ empty</span>
      </p>
      {sections.map(section => (
        <SectionBlock
          key={section}
          section={section}
          projectId={projectId}
          assets={assets}
        />
      ))}
    </div>
  )
}
