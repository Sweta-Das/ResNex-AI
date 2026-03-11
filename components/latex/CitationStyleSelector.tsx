'use client'

const STYLES = ['ieee', 'apa', 'acs', 'mla'] as const
type CitationStyle = typeof STYLES[number]

interface Props {
  value: CitationStyle
  onChange: (style: CitationStyle) => void
}

export default function CitationStyleSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Citation style:</span>
      {STYLES.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2 py-1 text-xs rounded uppercase font-medium ${value === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
