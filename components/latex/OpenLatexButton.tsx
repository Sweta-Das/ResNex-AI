'use client'
// components/latex/OpenLatexButton.tsx — trigger button that opens the LatexDrawer
import { usePreviewStore } from '@/store/previewStore'

export default function OpenLatexButton() {
  const openDrawer = usePreviewStore(s => s.openDrawer)

  return (
    <button
      onClick={openDrawer}
      className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] hover:bg-[#252525] border border-[#3a3a3a] hover:border-[#4f8ef7] text-[#e8eaf0] text-sm rounded-lg transition-all group"
    >
      <span className="text-base font-mono text-[#4f8ef7] group-hover:text-[#60a5fa]">τ</span>
      LaTeX Editor
    </button>
  )
}
