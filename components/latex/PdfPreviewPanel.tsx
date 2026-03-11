'use client'
// components/latex/PdfPreviewPanel.tsx — right panel: PDF iframe + Recompile button
import { usePreviewStore } from '@/store/previewStore'
import { Spinner } from '../ui'

interface Props {
  projectId: string
  onCompile: () => void
}

export default function PdfPreviewPanel({ projectId, onCompile }: Props) {
  const { pdfBlobUrl, isCompiling } = usePreviewStore()

  return (
    <div className="flex flex-col h-full bg-[#141414]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <span className="text-xs font-semibold text-[#7a839a] uppercase tracking-wide">PDF Preview</span>
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#4f8ef7] hover:bg-[#3b7de8] disabled:opacity-50 text-white text-xs rounded-md transition-colors"
        >
          {isCompiling ? <Spinner size={12} /> : '⟳'}
          {isCompiling ? 'Compiling…' : 'Recompile'}
        </button>
      </div>

      {/* PDF frame */}
      <div className="flex-1 overflow-hidden">
        {isCompiling && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#7a839a]">
            <Spinner size={32} />
            <p className="text-sm">Compiling LaTeX…</p>
          </div>
        )}
        {!isCompiling && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            title="PDF Preview"
            className="w-full h-full border-0"
          />
        )}
        {!isCompiling && !pdfBlobUrl && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#4a4a5a]">
            <span className="text-4xl">📄</span>
            <p className="text-sm text-center px-4">
              Click <span className="text-[#4f8ef7]">Recompile</span> to generate a PDF preview.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
