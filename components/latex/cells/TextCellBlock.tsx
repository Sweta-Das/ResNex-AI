'use client'
import { useEffect, useRef } from 'react'
import { TextCell } from '../../../lib/cell-types'

interface Props {
  cell: TextCell
  onChange: (updated: TextCell) => void
  isActive: boolean
  onFocus: () => void
}

export function TextCellBlock({ cell, onChange, isActive, onFocus }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to content height
  function resize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => { resize() }, [cell.content])

  return (
    <textarea
      ref={ref}
      value={cell.content}
      placeholder="Write your paragraph here…"
      onFocus={onFocus}
      onChange={(e) => {
        onChange({ ...cell, content: e.target.value })
        resize()
      }}
      onInput={resize}
      rows={1}
      className={`w-full resize-none bg-transparent text-[13px] text-[#c9cdd8] placeholder-[#3d4558] leading-relaxed
        focus:outline-none transition-colors
        ${isActive ? '' : 'hover:bg-[#0d1018]'}`}
      style={{ minHeight: '2rem', overflow: 'hidden' }}
    />
  )
}
