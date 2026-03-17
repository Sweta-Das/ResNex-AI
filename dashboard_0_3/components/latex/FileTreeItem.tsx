'use client'
// components/latex/FileTreeItem.tsx — single file row in the tree

import { useState } from 'react'
import { LatexFile, useLatexStore } from '../../store/latexStore'

interface Props {
  file: LatexFile
  projectId: string
  isActive: boolean
  onDelete: (id: string) => void
}

function fileIcon(file: LatexFile): string {
  if (file.isMain) return '⭐'
  if (file.fileName.endsWith('.json') && file.fileName.startsWith('sections/')) return '📓'
  if (file.type === 'IMAGE') return '🖼'
  if (file.type === 'DATA') return '📊'
  if (file.fileName.endsWith('.bib')) return '📚'
  return '📄'
}

function displayName(fileName: string): string {
  if (fileName.startsWith('sections/') && fileName.endsWith('.json')) {
    const raw = fileName.replace('sections/', '').replace('.json', '')
    return raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return fileName
}

export function FileTreeItem({ file, projectId, isActive, onDelete }: Props) {
  const { setActiveFile, unsavedIds } = useLatexStore()
  const [showMenu, setShowMenu] = useState(false)
  const isUnsaved = unsavedIds.has(file.id)
  const isSectionFile = file.fileName.startsWith('sections/')
  const canDelete = !file.isMain

  return (
    <div
      className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-xs select-none
        ${isActive ? 'bg-[#1a1f2e] text-[#e8eaf0]' : 'text-[#7a839a] hover:bg-[#0d1018] hover:text-[#e8eaf0]'}`}
      onClick={() => setActiveFile(file.id)}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true) }}
    >
      <span className="flex-shrink-0 text-[11px]">{fileIcon(file)}</span>
      <span className="flex-1 truncate font-mono">
        {isSectionFile ? displayName(file.fileName) : file.fileName}
      </span>
      {isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] flex-shrink-0" title="Unsaved" />}

      {/* Inline delete control (always visible on touch) */}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(file.id) }}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#3d4558] hover:text-[#f87171] hover:bg-[#1a1f2e] transition-all flex-shrink-0
            opacity-100 supports-[hover:hover]:opacity-0 supports-[hover:hover]:group-hover:opacity-100 focus:opacity-100"
          title="Delete file"
          aria-label="Delete file"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      )}

      {/* Context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute left-full top-0 ml-1 z-50 bg-[#0d1018] border border-[#252a38] rounded-lg shadow-xl overflow-hidden min-w-[120px]">
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(file.id); setShowMenu(false) }}
                className="w-full px-3 py-2 text-left text-xs text-[#f87171] hover:bg-[#1a1f2e] transition-colors"
              >
                Delete
              </button>
            )}
            {file.isMain && (
              <div className="px-3 py-2 text-xs text-[#3d4558]">Main file</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
