'use client'
// components/latex/LatexDrawer.tsx — 95vh Overleaf-style slide-up dark drawer (3-panel)
import { useEffect, useState, useCallback } from 'react'
import { usePreviewStore } from '@/store/previewStore'
import AssetPanel from './AssetPanel'
import SectionList from './SectionList'
import PdfPreviewPanel from './PdfPreviewPanel'
import type { LatexAsset } from './AgentSectionPopover'
import { tiptapToLatex, sectionsToLatex } from '@/lib/latex-pipeline/tiptap-to-latex'
import { Spinner } from '../ui'

interface Props {
  projectId: string
  defaultSections?: string[]
}

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

export default function LatexDrawer({ projectId, defaultSections = DEFAULT_SECTIONS }: Props) {
  const {
    isDrawerOpen,
    closeDrawer,
    selectedTemplate,
    setTemplate,
    sectionStates,
    isCompiling,
    setCompiling,
    setPdfBlob,
    clearPdfBlob,
    pdfBlobUrl,
  } = usePreviewStore()

  const [assets, setAssets] = useState<LatexAsset[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch assets when drawer opens
  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/latex/assets`)
      if (res.ok) setAssets(await res.json())
    } catch {}
  }, [projectId])

  useEffect(() => {
    if (isDrawerOpen) fetchAssets()
  }, [isDrawerOpen, fetchAssets])

  // Build full LaTeX from section states
  const buildFullLatex = () => {
    const sectionMap: Record<string, string> = {}
    for (const [name, state] of Object.entries(sectionStates)) {
      if (state.mode === 'latex') {
        sectionMap[name] = state.content
      } else {
        try {
          sectionMap[name] = tiptapToLatex(state.content)
        } catch {
          sectionMap[name] = state.content
        }
      }
    }
    return sectionsToLatex(sectionMap, selectedTemplate)
  }

  const handleCompile = async () => {
    setCompiling(true)
    clearPdfBlob()
    try {
      const latex = buildFullLatex()
      const res = await fetch(`/api/projects/${projectId}/latex/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex }),
      })
      if (!res.ok) {
        setWarnings(['Compilation failed. Check your LaTeX for errors.'])
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPdfBlob(url)
      setWarnings([])
    } catch {
      setWarnings(['Network error during compilation.'])
    } finally {
      setCompiling(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const sectionMap: Record<string, string> = {}
      for (const [name, state] of Object.entries(sectionStates)) {
        if (state.mode === 'latex') {
          sectionMap[name] = state.content
        } else {
          try {
            sectionMap[name] = tiptapToLatex(state.content)
          } catch {
            sectionMap[name] = state.content
          }
        }
      }
      await fetch(`/api/projects/${projectId}/latex`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: sectionMap, template: selectedTemplate }),
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch {
      setWarnings(['Save failed.'])
    } finally {
      setSaving(false)
    }
  }

  if (!isDrawerOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{ height: '95vh', background: '#1e1e1e' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#e8eaf0]">LaTeX Editor</span>

            {/* Template selector */}
            <div className="flex bg-[#1e1e1e] rounded-md border border-[#3a3a3a] text-xs overflow-hidden">
              {(['generic', 'neurips'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-2.5 py-1 transition-colors capitalize ${
                    selectedTemplate === t ? 'bg-[#4f8ef7] text-white' : 'text-[#7a839a] hover:text-white'
                  }`}
                >
                  {t === 'neurips' ? 'NeurIPS' : 'Generic'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4f8ef7] hover:bg-[#3b7de8] disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {isCompiling ? <Spinner size={14} /> : '⟳'}
              Compile PDF
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#353535] text-[#e8eaf0] text-sm rounded-lg border border-[#3a3a3a] transition-colors"
            >
              {saving ? <Spinner size={14} /> : saveSuccess ? '✓' : '💾'}
              {saveSuccess ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={closeDrawer}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] text-[#7a839a] hover:text-white text-xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex-shrink-0">
            <span className="text-yellow-400 text-sm">⚠</span>
            <div className="flex gap-3 flex-wrap">
              {warnings.map((w, i) => (
                <span key={i} className="text-xs text-yellow-300">{w}</span>
              ))}
            </div>
            <button
              onClick={() => setWarnings([])}
              className="ml-auto text-yellow-400/60 hover:text-yellow-400 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Asset Panel (240px) */}
          <div className="w-60 flex-shrink-0 border-r border-[#2a2a2a] overflow-y-auto">
            <div className="px-3 py-2 border-b border-[#2a2a2a]">
              <h2 className="text-xs font-semibold text-[#7a839a] uppercase tracking-wide">Assets</h2>
            </div>
            <AssetPanel
              projectId={projectId}
              assets={assets}
              onAssetsChange={fetchAssets}
            />
          </div>

          {/* Center: Section Editor (flex-1) */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a] sticky top-0 z-10">
              <h2 className="text-xs font-semibold text-[#7a839a] uppercase tracking-wide">Sections</h2>
            </div>
            <SectionList
              projectId={projectId}
              sections={defaultSections}
              assets={assets}
            />
          </div>

          {/* Right: PDF Preview (420px) */}
          <div className="w-[420px] flex-shrink-0 border-l border-[#2a2a2a]">
            <PdfPreviewPanel
              projectId={projectId}
              onCompile={handleCompile}
            />
          </div>
        </div>
      </div>
    </>
  )
}
