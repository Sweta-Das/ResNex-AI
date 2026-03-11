'use client'
// components/latex/TemplateSelector.tsx — Dropdown for NeurIPS / Generic template selection

interface Template {
  key: string
  label: string
  description: string
}

const TEMPLATES: Template[] = [
  { key: 'neurips', label: 'NeurIPS 2025', description: 'Standard NeurIPS conference format' },
  { key: 'generic', label: 'Generic Research Paper', description: 'Flexible A4 format' },
]

interface Props {
  value: string
  onChange: (key: string) => void
  disabled?: boolean
}

export function TemplateSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#7a839a]">Template:</span>
      <div className="flex gap-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            disabled={disabled}
            title={t.description}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              value === t.key
                ? 'bg-[#7c6af5] text-white'
                : 'bg-[#1a1f2e] text-[#7a839a] hover:text-[#e8eaf0] border border-[#252a38]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
