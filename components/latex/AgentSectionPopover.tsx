'use client'
// components/latex/AgentSectionPopover.tsx — Popover for @agent instruction input + asset selection
import { useState } from 'react'
import { Button, Spinner } from '../ui'

export interface LatexAsset {
  id: string
  fileName: string
  fileType: string
  url: string
  mimeType: string
  sizeBytes: number
}

interface Props {
  projectId: string
  section: string
  agentType: string
  assets: LatexAsset[]
  existingContent: string
  onGenerated: (latex: string) => void
  onClose: () => void
}

export default function AgentSectionPopover({
  projectId,
  section,
  agentType,
  assets,
  existingContent,
  onGenerated,
  onClose,
}: Props) {
  const [instruction, setInstruction] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredAssets = assets.filter(a => {
    if (agentType === 'equation' || agentType === 'figure') return a.fileType === 'image'
    if (agentType === 'table') return a.fileType === 'csv' || a.fileType === 'image'
    if (agentType === 'citation') return a.fileType === 'pdf'
    return true
  })

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      setError('Please enter an instruction')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/latex/section-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          userInstruction: instruction,
          referencedAssetIds: selectedAssets,
          existingContent,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Generation failed')
      }
      const data = await res.json()
      onGenerated(data.latex || data.content || '')
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl shadow-2xl w-80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8eaf0]">
          @{agentType} agent · <span className="text-[#7a839a] font-normal">{section}</span>
        </h3>
        <button onClick={onClose} className="text-[#7a839a] hover:text-white text-lg leading-none">×</button>
      </div>

      <textarea
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        placeholder={`Describe what to ${agentType === 'text' ? 'write' : 'generate'}…`}
        rows={3}
        className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#e8eaf0] placeholder-[#4a4a5a] resize-none focus:outline-none focus:border-[#4f8ef7]"
      />

      {filteredAssets.length > 0 && (
        <div>
          <p className="text-xs text-[#7a839a] mb-1.5">Attach files (optional)</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filteredAssets.map(a => (
              <label key={a.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAssets.includes(a.id)}
                  onChange={() => toggleAsset(a.id)}
                  className="rounded border-[#3a3a3a] bg-[#1a1a1a] accent-[#4f8ef7]"
                />
                <span className="text-xs text-[#c4c8d4] group-hover:text-white truncate flex-1">{a.fileName}</span>
                <span className="text-xs text-[#4a4a5a] uppercase">{a.fileType}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button
        onClick={handleGenerate}
        disabled={loading || !instruction.trim()}
        className="w-full"
        size="sm"
      >
        {loading ? <><Spinner size={12} /> Generating…</> : 'Generate LaTeX'}
      </Button>
    </div>
  )
}
