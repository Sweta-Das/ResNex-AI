'use client'
// components/latex/PreviewPanel.tsx — CodeMirror editor with color-coded LaTeX source annotations

import { useEffect, useRef } from 'react'
import type { ColorCode } from './SectionSidebar'

interface Props {
  value: string
  onChange: (val: string) => void
  sectionColor?: ColorCode
  readOnly?: boolean
}

const COLOR_BORDER: Record<ColorCode, string> = {
  blue: 'border-l-[#4f8ef7]',
  green: 'border-l-[#3ecf8e]',
  yellow: 'border-l-[#f59e0b]',
  purple: 'border-l-[#a78bfa]',
  orange: 'border-l-[#f97316]',
  red: 'border-l-[#f43f5e]',
}

const COLOR_BG: Record<ColorCode, string> = {
  blue: 'bg-[#4f8ef7]/5',
  green: 'bg-[#3ecf8e]/5',
  yellow: 'bg-[#f59e0b]/5',
  purple: 'bg-[#a78bfa]/5',
  orange: 'bg-[#f97316]/5',
  red: 'bg-[#f43f5e]/5',
}

export function PreviewPanel({ value, onChange, sectionColor, readOnly }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const borderClass = sectionColor ? COLOR_BORDER[sectionColor] : 'border-l-transparent'
  const bgClass = sectionColor ? COLOR_BG[sectionColor] : ''

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div className={`flex-1 h-full flex flex-col overflow-hidden border-l-4 ${borderClass} ${bgClass}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        spellCheck={false}
        className="flex-1 w-full bg-transparent text-[#c8cad0] font-mono text-xs p-4 resize-none
          focus:outline-none border-0 leading-relaxed min-h-full"
        style={{ minHeight: '100%' }}
      />
    </div>
  )
}

// Full-document read-only preview with basic LaTeX rendering
export function LatexDocumentPreview({ latex }: { latex: string }) {
  return (
    <div className="h-full overflow-y-auto bg-white rounded-lg p-6">
      <div className="text-gray-800 text-xs leading-relaxed font-mono">
        {latex.split('\n').map((line, i) => {
          if (line.startsWith('\\section{')) {
            const title = line.match(/\\section\{(.+?)\}/)?.[1] || ''
            return <h2 key={i} className="text-gray-900 text-base font-bold mt-6 mb-2 border-b border-gray-200 pb-1">{title}</h2>
          }
          if (line.startsWith('\\subsection{')) {
            const title = line.match(/\\subsection\{(.+?)\}/)?.[1] || ''
            return <h3 key={i} className="text-gray-800 text-sm font-semibold mt-4 mb-1">{title}</h3>
          }
          if (line.startsWith('\\title{')) {
            const title = line.match(/\\title\{(.+?)\}/)?.[1] || ''
            return <h1 key={i} className="text-gray-900 text-xl font-bold text-center mt-2 mb-1">{title}</h1>
          }
          if (line.startsWith('\\author{')) {
            const author = line.match(/\\author\{(.+?)\}/)?.[1] || ''
            return <p key={i} className="text-gray-600 text-sm text-center mb-4">{author}</p>
          }
          if (line === '\\begin{abstract}') return <p key={i} className="text-gray-500 text-xs italic font-bold mt-3">Abstract</p>
          if (line === '\\end{abstract}' || line.startsWith('\\documentclass') || line.startsWith('\\usepackage') || line.startsWith('\\begin{document}') || line.startsWith('\\end{document}') || line.startsWith('\\maketitle')) return null
          if (line.startsWith('%')) return <p key={i} className="text-gray-300 text-xs italic">{line}</p>
          if (!line.trim()) return <br key={i} />
          if (line.startsWith('\\')) return null
          return <p key={i} className="text-gray-700 text-xs mb-1">{line}</p>
        })}
      </div>
    </div>
  )
}
