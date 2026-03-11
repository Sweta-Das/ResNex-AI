'use client'
// components/latex/VisualEditor.tsx — Tiptap editor with @agent mention support
import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { AgentMentionExtension } from './AgentMentionExtension'
import AgentSectionPopover from './AgentSectionPopover'
import type { LatexAsset } from './AgentSectionPopover'

interface Props {
  projectId: string
  section: string
  content: string
  assets: LatexAsset[]
  onChange: (json: string) => void
  onAgentContent: (latex: string) => void
  readOnly?: boolean
}

export default function VisualEditor({
  projectId,
  section,
  content,
  assets,
  onChange,
  onAgentContent,
  readOnly,
}: Props) {
  const [popover, setPopover] = useState<{ agentType: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      AgentMentionExtension,
    ],
    content: (() => {
      try { return content ? JSON.parse(content) : '' } catch { return content || '' }
    })(),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
  })

  // Re-init content when section changes
  useEffect(() => {
    if (!editor || !content) return
    try {
      const json = JSON.parse(content)
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(json)) {
        editor.commands.setContent(json, false)
      }
    } catch {
      // raw string
      if (editor.getText() !== content) {
        editor.commands.setContent(content, false)
      }
    }
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for mention clicks to open popover
  useEffect(() => {
    if (!editor) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const mention = target.closest('[data-type="mention"]')
      if (mention) {
        const agentType = (mention.getAttribute('data-id') || 'text')
        setPopover({ agentType })
      }
    }
    const el = containerRef.current
    el?.addEventListener('click', handleClick)
    return () => el?.removeEventListener('click', handleClick)
  }, [editor])

  return (
    <div ref={containerRef} className="relative">
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none min-h-[120px] px-3 py-2 text-[#e8eaf0] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[120px]"
      />

      {popover && (
        <div className="absolute z-50 top-0 right-0 mt-2">
          <AgentSectionPopover
            projectId={projectId}
            section={section}
            agentType={popover.agentType}
            assets={assets}
            existingContent={editor?.getText() || ''}
            onGenerated={(latex) => {
              onAgentContent(latex)
              setPopover(null)
            }}
            onClose={() => setPopover(null)}
          />
        </div>
      )}
    </div>
  )
}
