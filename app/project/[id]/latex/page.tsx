'use client'
// app/project/[id]/latex/page.tsx — LaTeX pipeline: COLLECT→MAP→FILL→PREVIEW→CONFIRM

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Button, Badge, Spinner, ToastProvider, useToast } from '../../../../components/ui'
import { TemplateSelector } from '../../../../components/latex/TemplateSelector'
import { SectionSidebar } from '../../../../components/latex/SectionSidebar'
import { WarningsBar } from '../../../../components/latex/WarningsBar'
import { PreviewPanel, LatexDocumentPreview } from '../../../../components/latex/PreviewPanel'
import { fillTemplate, getTemplate } from '../../../../lib/latex-templates'
import type { ColorCode } from '../../../../components/latex/SectionSidebar'

interface FilledSection {
  key: string
  label: string
  content: string
  color: ColorCode
  mode: 'data' | 'generated'
  sourceTypes: string[]
  wordCount: number
}

interface PipelineResult {
  sections: FilledSection[]
  warnings: string[]
  fullLatex: string
}

const TABS = (id: string) => [
  { label: 'Overview', href: `/project/${id}` },
  { label: 'Chat', href: `/project/${id}/chat` },
  { label: 'Discover', href: `/project/${id}/discover` },
  { label: 'Library', href: `/project/${id}/library` },
  { label: 'Compare', href: `/project/${id}/compare` },
  { label: 'Agents', href: `/project/${id}/agents` },
  { label: 'Review', href: `/project/${id}/review` },
  { label: 'Output', href: `/project/${id}/output` },
  { label: 'LaTeX', href: `/project/${id}/latex` },
]

export default function LaTeXPage() {
  const { id } = useParams<{ id: string }>()
  const { success, error } = useToast()

  const [template, setTemplate] = useState('generic')
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null)
  const [sectionContents, setSectionContents] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState('')
  const [running, setRunning] = useState(false)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)

  // Load existing latex doc on mount
  useEffect(() => {
    fetch(`/api/projects/${id}/latex`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setTemplate(data.template || 'generic')
          setConfirmed(data.confirmed || false)
          if (data.sections && Object.keys(data.sections).length > 0) {
            setSectionContents(data.sections)
            const sectionSources = data.sectionSources || {}
            const sections: FilledSection[] = Object.entries(data.sections as Record<string, string>).map(([key, content]) => ({
              key,
              label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              content,
              color: (sectionSources[key] || 'blue') as ColorCode,
              mode: 'data' as const,
              sourceTypes: [],
              wordCount: content.split(/\s+/).filter(Boolean).length,
            }))
            setPipelineResult({ sections, warnings: [], fullLatex: data.preview || '' })
            if (sections[0]) setActiveSection(sections[0].key)
          }
        }
      })
      .catch(console.error)
  }, [id])

  async function runPipeline() {
    setRunning(true)
    try {
      const res = await fetch(`/api/projects/${id}/latex/pipeline-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Pipeline failed')
      }
      const result: PipelineResult = await res.json()
      setPipelineResult(result)
      const contents: Record<string, string> = {}
      result.sections.forEach((s) => { contents[s.key] = s.content })
      setSectionContents(contents)
      if (result.sections[0]) setActiveSection(result.sections[0].key)
      setConfirmed(false)
      success('Pipeline complete! Review and confirm each section.')
    } catch (err: any) {
      error(err.message || 'Pipeline failed')
    } finally {
      setRunning(false)
    }
  }

  async function regenerateSection(sectionKey: string) {
    setRegenerating(sectionKey)
    try {
      const res = await fetch(`/api/projects/${id}/latex/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionKey, template }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSectionContents((prev) => ({ ...prev, [sectionKey]: data.content }))
      setPipelineResult((prev) => prev ? {
        ...prev,
        sections: prev.sections.map((s) =>
          s.key === sectionKey ? { ...s, content: data.content, wordCount: data.wordCount, mode: data.mode } : s
        ),
      } : prev)
      success(`${sectionKey.replace(/_/g, ' ')} regenerated!`)
    } catch (err: any) {
      error(err.message || 'Regeneration failed')
    } finally {
      setRegenerating(null)
    }
  }

  async function confirmAndSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${id}/latex`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, sections: sectionContents, confirmed: true }),
      })
      if (!res.ok) throw new Error('Save failed')
      const saved = await res.json()
      setPipelineResult((prev) => prev ? { ...prev, fullLatex: saved.preview || prev.fullLatex } : prev)
      setConfirmed(true)
      success('LaTeX saved successfully!')
    } catch (err: any) {
      error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function compilePdf() {
    setCompiling(true)
    try {
      const res = await fetch(`/api/projects/${id}/latex/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: currentFullLatex }),
      })
      if (!res.ok) throw new Error('Compilation failed')
      const blob = await res.blob()
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfUrl(URL.createObjectURL(blob))
      setShowPreview(true)
      success('PDF compiled successfully!')
    } catch (err: any) {
      error(err.message || 'Compilation failed')
    } finally {
      setCompiling(false)
    }
  }

  function exportTex() {
    const full = currentFullLatex
    const blob = new Blob([full], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'paper.tex'; a.click()
    URL.revokeObjectURL(url)
  }

  const activeSection_ = pipelineResult?.sections.find((s) => s.key === activeSection)
  const currentFullLatex = fillTemplate(getTemplate(template as 'generic' | 'neurips'), sectionContents as any)
  const sidebarSections = pipelineResult?.sections.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    wordCount: sectionContents[s.key]?.split(/\s+/).filter(Boolean).length || s.wordCount,
    mode: s.mode,
  })) || []

  const tabs = TABS(id)

  return (
    <>
      <ToastProvider />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PageHeader
          title="LaTeX Pipeline"
          subtitle={
            pipelineResult
              ? `${pipelineResult.sections.length} sections · ${confirmed ? '✓ Confirmed' : 'Review & Confirm'}`
              : 'Run the pipeline to generate your paper'
          }
          tabs={tabs}
          activeTab={tabs[9].href}
          actions={
            <div className="flex items-center gap-2">
              <TemplateSelector value={template} onChange={setTemplate} disabled={running} />
              {pipelineResult && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? 'Editor' : 'Preview'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={compilePdf} loading={compiling}>
                    Compile PDF
                  </Button>
                  <Button size="sm" variant="secondary" onClick={exportTex}>Export .tex</Button>
                  {!confirmed ? (
                    <Button size="sm" variant="success" onClick={confirmAndSave} loading={saving}>
                      Confirm & Save
                    </Button>
                  ) : (
                    <Badge color="green">✓ Saved</Badge>
                  )}
                </>
              )}
              <Button size="sm" onClick={runPipeline} loading={running}>
                {pipelineResult ? 'Re-run Pipeline' : 'Run Pipeline'}
              </Button>
            </div>
          }
        />

        {pipelineResult && (
          <WarningsBar warnings={pipelineResult.warnings} projectId={id} />
        )}

        {running ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Spinner size={32} />
            <p className="text-sm font-medium text-[#e8eaf0]">Running LaTeX pipeline…</p>
            <div className="flex flex-col items-center gap-1 text-xs text-[#3d4558]">
              <p>COLLECT → gathering sources</p>
              <p>MAP → routing to sections</p>
              <p>FILL → LLM generating content</p>
              <p>PREVIEW → annotating sources</p>
            </div>
          </div>
        ) : !pipelineResult ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-[#7c6af5]/10 border border-[#7c6af5]/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c6af5" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#e8eaf0] mb-2">LaTeX Pipeline</h2>
              <p className="text-sm text-[#7a839a] mb-4">
                Collects member sections, paper summaries, and @agent outputs — then fills a LaTeX template with AI.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                {[
                  { icon: '📥', label: 'COLLECT', desc: 'Gathers all sources' },
                  { icon: '🗺️', label: 'MAP', desc: 'Routes to sections' },
                  { icon: '✍️', label: 'FILL', desc: 'AI writes content' },
                  { icon: '👁️', label: 'PREVIEW', desc: 'Color-coded review' },
                ].map((step) => (
                  <div key={step.label} className="bg-[#0d1018] border border-[#1a1f2e] rounded-xl p-3">
                    <p className="text-base mb-1">{step.icon}</p>
                    <p className="text-xs font-bold text-[#e8eaf0]">{step.label}</p>
                    <p className="text-[10px] text-[#3d4558]">{step.desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={runPipeline} loading={running}>Run LaTeX Pipeline</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <SectionSidebar
              sections={sidebarSections}
              activeSection={activeSection}
              regenerating={regenerating}
              onSelect={setActiveSection}
              onRegenerate={regenerateSection}
            />

            {showPreview ? (
              <div className="flex-1 overflow-hidden p-4 bg-[#f8f9fa] flex gap-4">
                <div className="flex-1 min-w-0">
                  <LatexDocumentPreview latex={currentFullLatex} />
                </div>
                <div className="w-[42%] min-w-[320px] bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      title="Compiled PDF Preview"
                      className="w-full h-full min-h-[600px]"
                    />
                  ) : (
                    <div className="h-full min-h-[600px] flex items-center justify-center text-center p-6 text-sm text-gray-500">
                      Click "Compile PDF" to generate a real LaTeX PDF preview.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#252a38] bg-[#0d1018]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#e8eaf0]">
                      {activeSection_?.label || activeSection}
                    </span>
                    {activeSection_ && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        activeSection_.mode === 'generated'
                          ? 'bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/20'
                          : 'bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/20'
                      }`}>
                        {activeSection_.mode === 'generated' ? 'AI generated' : `from ${activeSection_.sourceTypes[0] || 'data'}`}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => regenerateSection(activeSection)}
                    loading={regenerating === activeSection}
                    disabled={!!regenerating}
                  >
                    ↺ Regenerate
                  </Button>
                </div>

                <PreviewPanel
                  value={sectionContents[activeSection] || ''}
                  onChange={(val) => setSectionContents((prev) => ({ ...prev, [activeSection]: val }))}
                  sectionColor={activeSection_?.color}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
