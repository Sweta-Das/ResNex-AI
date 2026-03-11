'use client'
// components/latex/SectionSidebar.tsx — Section navigator with color indicators and regenerate buttons

import { Spinner } from '../ui'

export type ColorCode = 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red'

export interface SidebarSection {
  key: string
  label: string
  color: ColorCode
  wordCount: number
  mode: 'data' | 'generated'
}

const COLOR_STYLES: Record<ColorCode, { dot: string; label: string }> = {
  blue: { dot: 'bg-[#4f8ef7]', label: 'Member' },
  green: { dot: 'bg-[#3ecf8e]', label: 'Paper' },
  yellow: { dot: 'bg-[#f59e0b]', label: 'Agent' },
  purple: { dot: 'bg-[#a78bfa]', label: 'Compare' },
  orange: { dot: 'bg-[#f97316]', label: 'Media' },
  red: { dot: 'bg-[#f43f5e]', label: 'AI Gen' },
}

const LEGEND: { color: ColorCode; label: string; desc: string }[] = [
  { color: 'blue', label: 'Member', desc: 'Team member content' },
  { color: 'green', label: 'Paper Library', desc: 'From paper summaries' },
  { color: 'yellow', label: '@agent', desc: 'Via agent panel' },
  { color: 'purple', label: 'Comparison', desc: 'Paper comparison' },
  { color: 'red', label: 'AI Generated', desc: 'No source data' },
]

interface Props {
  sections: SidebarSection[]
  activeSection: string
  regenerating: string | null
  onSelect: (key: string) => void
  onRegenerate: (key: string) => void
  showLegend?: boolean
}

export function SectionSidebar({
  sections,
  activeSection,
  regenerating,
  onSelect,
  onRegenerate,
  showLegend = true,
}: Props) {
  return (
    <div className="w-52 flex-shrink-0 border-r border-[#1a1f2e] bg-[#0d1018] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {sections.map((s) => {
          const styles = COLOR_STYLES[s.color]
          const isActive = activeSection === s.key
          const isRegen = regenerating === s.key
          return (
            <div
              key={s.key}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#4f8ef7]/10 border border-[#4f8ef7]/20'
                  : 'hover:bg-[#1a1f2e] border border-transparent'
              }`}
              onClick={() => onSelect(s.key)}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isActive ? 'text-[#4f8ef7]' : 'text-[#7a839a] group-hover:text-[#e8eaf0]'}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-[#3d4558]">{s.wordCount}w</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerate(s.key) }}
                disabled={!!regenerating}
                title={`Regenerate ${s.label}`}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#3d4558] hover:text-[#4f8ef7] hover:bg-[#4f8ef7]/10 transition-all flex-shrink-0 disabled:pointer-events-none"
              >
                {isRegen ? <Spinner size={10} /> : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {showLegend && (
        <div className="border-t border-[#1a1f2e] p-3">
          <p className="text-[9px] font-bold text-[#3d4558] uppercase tracking-wider mb-2">Legend</p>
          <div className="flex flex-col gap-1">
            {LEGEND.map((l) => (
              <div key={l.color} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${COLOR_STYLES[l.color].dot}`} />
                <span className="text-[9px] text-[#3d4558]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
