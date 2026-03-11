'use client'
// components/latex/AssetPanel.tsx — left panel: grouped assets (Images / Tables / Documents) + upload
import { useState, useRef } from 'react'
import type { LatexAsset } from './AgentSectionPopover'
import { Spinner } from '../ui'

interface Props {
  projectId: string
  assets: LatexAsset[]
  onAssetsChange: () => void
}

const GROUPS: { label: string; types: string[]; icon: string }[] = [
  { label: 'Images', types: ['image'], icon: '🖼' },
  { label: 'Tables', types: ['csv'], icon: '📊' },
  { label: 'Documents', types: ['pdf'], icon: '📄' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function AssetPanel({ projectId, assets, onAssetsChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Upload via Uploadthing client — we use the direct uploadthing endpoint
      const formData = new FormData()
      formData.append('file', file)

      const utRes = await fetch('/api/uploadthing', { method: 'POST', body: formData })
      const utData = await utRes.json()
      const url: string = utData?.[0]?.url || utData?.url || ''
      if (!url) throw new Error('Upload failed — no URL returned')

      // Determine file type
      const mime = file.type
      let fileType = 'pdf'
      if (mime.startsWith('image/')) fileType = 'image'
      else if (mime === 'text/csv' || file.name.endsWith('.csv')) fileType = 'csv'

      await fetch(`/api/projects/${projectId}/latex/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType,
          url,
          mimeType: mime,
          sizeBytes: file.size,
        }),
      })
      onAssetsChange()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (assetId: string) => {
    setDeleting(assetId)
    try {
      await fetch(`/api/projects/${projectId}/latex/assets/${assetId}`, { method: 'DELETE' })
      onAssetsChange()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Upload button */}
      <div className="p-3 border-b border-[#2a2a2a]">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 w-full px-3 py-2 bg-[#4f8ef7] hover:bg-[#3b7de8] disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {uploading ? <Spinner size={14} /> : <span>+</span>}
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.csv,application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <p className="text-xs text-[#4a4a5a] mt-1.5">Images, CSV, PDF</p>
      </div>

      {/* Groups */}
      <div className="flex-1 p-2 space-y-3">
        {GROUPS.map(group => {
          const grouped = assets.filter(a => group.types.includes(a.fileType))
          return (
            <div key={group.label}>
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <span className="text-sm">{group.icon}</span>
                <span className="text-xs font-semibold text-[#7a839a] uppercase tracking-wide">{group.label}</span>
                <span className="text-xs text-[#4a4a5a]">({grouped.length})</span>
              </div>
              {grouped.length === 0 ? (
                <p className="text-xs text-[#3a3a3a] px-2 py-1">None yet</p>
              ) : (
                <div className="space-y-1">
                  {grouped.map(asset => (
                    <div
                      key={asset.id}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#252525] transition-colors"
                    >
                      {asset.fileType === 'image' && (
                        <img src={asset.url} alt={asset.fileName} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      {asset.fileType !== 'image' && (
                        <div className="w-8 h-8 rounded bg-[#2a2a2a] flex items-center justify-center text-base flex-shrink-0">
                          {group.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#c4c8d4] truncate">{asset.fileName}</p>
                        <p className="text-xs text-[#4a4a5a]">{formatBytes(asset.sizeBytes)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        disabled={deleting === asset.id}
                        className="opacity-0 group-hover:opacity-100 text-[#4a4a5a] hover:text-red-400 text-sm leading-none transition-all"
                        title="Delete"
                      >
                        {deleting === asset.id ? <Spinner size={12} /> : '×'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
