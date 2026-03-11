'use client'
// components/latex/SectionBlock.tsx — individual section: header + mode toggle + editor + color coding
import { useState } from 'react'
import { usePreviewStore } from '@/store/previewStore'
import VisualEditor from './VisualEditor'
import LatexEditor from './LatexEditor'
import type { LatexAsset } from './AgentSectionPopover'
import { Spinner } from '../ui'

const FILL_COLORS: Record<string, string> = {
  empty: 'border-l-red-500',
  user: 'border-l-blue-500',
  agent: 'border-l-yellow-400',
}

const FILL_BADGE: Record<string, { label: string; cls: string }> = {
  empty: { label: 'Empty', cls: 'bg-red-500/20 text-red-400' },
  user: { label: 'User', cls: 'bg-blue-500/20 text-blue-400' },
  agent: { label: 'Agent', cls: 'bg-yellow-500/20 text-yellow-400' },
}

interface Props {
  section: string
  projectId: string
  assets: LatexAsset[]
}

export default function SectionBlock({ section, projectId, assets }: Props) {
  const { sectionStates, setSectionContent, setSectionMode } = usePreviewStore()
  const state = sectionStates[section] || { content: '', mode: 'visual' as const, fillStatus: 'empty' as const }
  const [saving, setSaving] = useState(false)

  const fillStatus = state.fillStatus || 'empty'
  const mode = state.mode || 'visual'

  const handleContentChange = (content: string) => {
    setSectionContent(section, content, content.trim() ? 'user' : 'empty')
  }

  const handleAgentContent = (latex: string) => {
    setSectionContent(section, latex, 'agent')
    // Switch to LaTeX mode to show the raw output
    setSectionMode(section, 'latex')
  }

  const badge = FILL_BADGE[fillStatus]

  return (
    <div className={`border-l-4 ${FILL_COLORS[fillStatus]} bg-[#1e1e1e] rounded-r-lg overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#e8eaf0]">{section}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {saving && <Spinner size={12} />}
          {/* Mode toggle */}
          <div className="flex bg-[#1a1a1a] rounded-md border border-[#3a3a3a] text-xs overflow-hidden">
            <button
              onClick={() => setSectionMode(section, 'visual')}
              className={`px-2 py-1 transition-colors ${mode === 'visual' ? 'bg-[#4f8ef7] text-white' : 'text-[#7a839a] hover:text-white'}`}
            >
              Visual
            </button>
            <button
              onClick={() => setSectionMode(section, 'latex')}
              className={`px-2 py-1 transition-colors ${mode === 'latex' ? 'bg-[#4f8ef7] text-white' : 'text-[#7a839a] hover:text-white'}`}
            >
              LaTeX
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-[140px]">
        {mode === 'visual' ? (
          <VisualEditor
            projectId={projectId}
            section={section}
            content={state.content}
            assets={assets}
            onChange={handleContentChange}
            onAgentContent={handleAgentContent}
          />
        ) : (
          <LatexEditor
            value={state.content}
            onChange={handleContentChange}
          />
        )}
      </div>
    </div>
  )
}
