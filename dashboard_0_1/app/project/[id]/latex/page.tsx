'use client'
// app/project/[id]/latex/page.tsx

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Button, Badge, Spinner, ToastProvider, useToast } from '../../../../components/ui'

const SECTION_ORDER = [
  { key: 'template', label: 'Template Info', icon: '📋' },
  { key: 'title_authors', label: 'Title & Authors', icon: '✍️' },
  { key: 'abstract', label: 'Abstract', icon: '📝' },
  { key: 'introduction', label: 'Introduction', icon: '🚀' },
  { key: 'methodology', label: 'Methodology', icon: '🔬' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'discussion', label: 'Discussion', icon: '💬' },
  { key: 'conclusion', label: 'Conclusion', icon: '🏁' },
  { key: 'references', label: 'References', icon: '📚' },
  { key: 'disclosures', label: 'Disclosures', icon: '⚖️' },
]

function SimpleLatexPreview({ latex }: { latex: string }) {
  // Basic syntax highlighting for LaTeX
  const highlighted = latex
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\\[a-zA-Z]+)/g, '<span style="color:#4f8ef7">$1</span>')
    .replace(/(\{[^}]*\})/g, '<span style="color:#3ecf8e">$1</span>')
    .replace(/(%.+)/g, '<span style="color:#7a839a;font-style:italic">$1</span>')

  return (
    <div className="h-full overflow-y-auto bg-white rounded-lg p-6">
      <div className="text-gray-800 text-xs leading-relaxed font-mono">
        {/* Minimal rendered preview for common elements */}
        {latex.split('\n').map((line, i) => {
          if (line.startsWith('\\section{')) {
            const title = line.match(/\\section\{(.+?)\}/)?.[1] || ''
            return <h2 key={i} className="text-gray-900 text-base font-bold mt-4 mb-2 border-b border-gray-200 pb-1">{title}</h2>
          }
          if (line.startsWith('\\subsection{')) {
            const title = line.match(/\\subsection\{(.+?)\}/)?.[1] || ''
            return <h3 key={i} className="text-gray-800 text-sm font-semibold mt-3 mb-1">{title}</h3>
          }
          if (line.startsWith('\\title{')) {
            const title = line.match(/\\title\{(.+?)\}/)?.[1] || ''
            return <h1 key={i} className="text-gray-900 text-xl font-bold text-center mt-2 mb-1">{title}</h1>
          }
          if (line.startsWith('\\author{')) {
            const author = line.match(/\\author\{(.+?)\}/)?.[1] || ''
            return <p key={i} className="text-gray-600 text-sm text-center mb-3">{author}</p>
          }
          if (line === '\\begin{abstract}') return <p key={i} className="text-gray-500 text-xs italic font-bold mt-3">Abstract</p>
          if (line === '\\end{abstract}') return null
          if (line.startsWith('%') || line.startsWith('\\')) return null
          if (!line.trim()) return <br key={i} />
          return <p key={i} className="text-gray-700 text-xs mb-1">{line}</p>
        })}
      </div>
    </div>
  )
}

export default function LaTeXPage() {
  const { id } = useParams<{ id: string }>()
  const [sections, setSections] = useState<Record<string, string>>({})
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [activeSection, setActiveSection] = useState('abstract')
  const [format, setFormat] = useState('Generic')
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [fixInstruction, setFixInstruction] = useState('')
  const { success, error } = useToast()

  useEffect(() => {
    fetch(`/api/projects/${id}/latex`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSections(data.sections || {})
          setConfirmed(new Set(data.confirmed_sections || []))
          setFormat(data.format || 'Generic')
        }
      })
  }, [id])

  async function generateAll() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/latex/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, format }),
      })
      const data = await res.json()
      setSections(data.sections || {})
      success('LaTeX paper generated!')
    } catch { error('Generation failed') }
    finally { setGenerating(false) }
  }

  async function regenerateSection() {
    setRegenerating(true)
    try {
      const res = await fetch('/api/ai/latex/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, section_key: activeSection }),
      })
      const data = await res.json()
      setSections(prev => ({ ...prev, [activeSection]: data.content }))
      success('Section regenerated!')
    } catch { error('Regeneration failed') }
    finally { setRegenerating(false) }
  }

  async function fixSection() {
    if (!fixInstruction.trim()) return
    setFixing(true)
    try {
      const res = await fetch('/api/ai/latex/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex_string: sections[activeSection] || '',
          instruction: fixInstruction,
        }),
      })
      const data = await res.json()
      setSections(prev => ({ ...prev, [activeSection]: data.fixed }))
      setFixInstruction('')
      success('Section fixed!')
    } catch { error('Fix failed') }
    finally { setFixing(false) }
  }

  async function saveSections() {
    await fetch(`/api/projects/${id}/latex`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sections,
        confirmed_sections: Array.from(confirmed),
      }),
    })
    success('Saved!')
  }

  function exportTex() {
    const full = SECTION_ORDER
      .map(s => sections[s.key] || '')
      .filter(Boolean)
      .join('\n\n')
    const blob = new Blob([full], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'paper.tex'; a.click()
    URL.revokeObjectURL(url)
  }

  const currentLatex = sections[activeSection] || ''
  const completedCount = SECTION_ORDER.filter(s => sections[s.key]).length

  const tabs = [
    { label: 'Overview', href: `/project/${id}` },
    { label: 'Chat', href: `/project/${id}/chat` },
    { label: 'Workspace', href: `/project/${id}/workspace` },
    { label: 'Review', href: `/project/${id}/review` },
    { label: 'Output', href: `/project/${id}/output` },
    { label: 'LaTeX', href: `/project/${id}/latex` },
  ]

  return (
    <>
      <ToastProvider />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PageHeader
          title="LaTeX Paper Editor"
          subtitle={`Format: ${format} · ${completedCount}/10 sections`}
          tabs={tabs}
          activeTab={tabs[5].href}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={saveSections}>Save</Button>
              <Button size="sm" variant="secondary" onClick={exportTex}>Export .tex</Button>
              <Button size="sm" onClick={generateAll} loading={generating}>
                {completedCount > 0 ? 'Regenerate All' : 'Generate Paper'}
              </Button>
            </div>
          }
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Section navigator */}
          <div className="w-48 flex-shrink-0 border-r border-[#1a1f2e] bg-[#0d1018] py-3 flex flex-col gap-0.5 px-2">
            {SECTION_ORDER.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left ${
                  activeSection === s.key
                    ? 'bg-[#4f8ef7]/10 text-[#4f8ef7] border border-[#4f8ef7]/20'
                    : 'text-[#7a839a] hover:text-[#e8eaf0] hover:bg-[#1a1f2e]'
                }`}
              >
                <span className="text-sm">{s.icon}</span>
                <span className="flex-1 truncate font-medium">{s.label}</span>
                {sections[s.key] && (
                  confirmed.has(s.key) ? (
                    <span className="text-[#3ecf8e] text-[10px]">✓</span>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7]" />
                  )
                )}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-[#1a1f2e]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#252a38] bg-[#0d1018]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#e8eaf0]">
                  {SECTION_ORDER.find(s => s.key === activeSection)?.label}
                </span>
                {sections[activeSection] && !confirmed.has(activeSection) && (
                  <button
                    onClick={() => setConfirmed(prev => new Set([...prev, activeSection]))}
                    className="text-xs text-[#3ecf8e] hover:underline"
                  >
                    Confirm ✓
                  </button>
                )}
                {confirmed.has(activeSection) && <Badge color="green">Confirmed</Badge>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={regenerateSection} loading={regenerating}>
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Simple textarea editor (CodeMirror can be added with full npm install) */}
            <textarea
              value={currentLatex}
              onChange={e => setSections(prev => ({ ...prev, [activeSection]: e.target.value }))}
              className="flex-1 bg-[#0a0c10] text-[#c8cad0] font-mono text-xs p-4 resize-none
                focus:outline-none border-0 leading-relaxed"
              placeholder={`% LaTeX content for ${SECTION_ORDER.find(s => s.key === activeSection)?.label} will appear here\n% Click "Generate Paper" to auto-generate all sections`}
              spellCheck={false}
            />

            {/* AI Fix bar */}
            <div className="border-t border-[#252a38] px-4 py-3 bg-[#0d1018] flex gap-2">
              <input
                value={fixInstruction}
                onChange={e => setFixInstruction(e.target.value)}
                placeholder="Describe what to fix in this section..."
                className="flex-1 bg-[#0a0c10] border border-[#252a38] rounded-lg px-3 py-1.5 text-xs
                  text-[#e8eaf0] placeholder:text-[#3d4558] focus:outline-none focus:border-[#4f8ef7]"
              />
              <Button size="sm" onClick={fixSection} loading={fixing} disabled={!fixInstruction.trim()}>
                AI Fix
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden bg-[#f8f9fa]">
            <div className="px-4 py-2 border-b border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-600">Preview</p>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              {currentLatex ? (
                <SimpleLatexPreview latex={currentLatex} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center">
                    Generate the paper to see a preview here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
