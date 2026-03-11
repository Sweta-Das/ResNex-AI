'use client'
// components/latex/WarningsBar.tsx — Top bar showing AI-generated section warnings

interface Props {
  warnings: string[]
  projectId: string
}

export function WarningsBar({ warnings, projectId }: Props) {
  if (warnings.length === 0) return null

  return (
    <div className="bg-[#f59e0b]/10 border-b border-[#f59e0b]/20 px-4 py-2.5 flex items-start gap-3">
      <span className="text-[#f59e0b] flex-shrink-0 mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#f59e0b] mb-1">
          {warnings.length} section{warnings.length !== 1 ? 's' : ''} AI-generated (no source data)
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-[#f59e0b]/80">{w}</p>
          ))}
        </div>
      </div>
      <a
        href={`/project/${projectId}/workspace`}
        className="flex-shrink-0 text-[10px] text-[#f59e0b] hover:underline font-medium"
      >
        Add data →
      </a>
    </div>
  )
}
