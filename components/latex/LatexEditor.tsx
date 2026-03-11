'use client'
// components/latex/LatexEditor.tsx — CodeMirror 6 raw LaTeX editor per section
import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { StreamLanguage } from '@codemirror/language'

// Minimal LaTeX stream language for basic syntax highlighting
const latexLang = StreamLanguage.define({
  name: 'latex',
  token(stream) {
    if (stream.match(/\\[a-zA-Z]+/)) return 'keyword'
    if (stream.match(/\$[^$]*\$/)) return 'string'
    if (stream.match(/%.*$/)) return 'comment'
    if (stream.match(/\{|\}/)) return 'bracket'
    stream.next()
    return null
  },
})

const darkTheme = EditorView.theme({
  '&': { background: '#1a1a1a', color: '#e8eaf0', height: '100%', fontSize: '13px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  '.cm-content': { padding: '8px 4px' },
  '.cm-gutters': { background: '#141414', border: 'none', color: '#4a4a5a' },
  '.cm-activeLine': { background: '#252525' },
  '.cm-cursor': { borderLeftColor: '#4f8ef7' },
  '.cm-selectionBackground': { background: '#1e3a5f !important' },
  '.cm-keyword': { color: '#60a5fa' },
  '.cm-string': { color: '#f59e0b' },
  '.cm-comment': { color: '#6b7280', fontStyle: 'italic' },
  '.cm-bracket': { color: '#a78bfa' },
}, { dark: true })

interface Props {
  value: string
  onChange: (val: string) => void
  readOnly?: boolean
}

export default function LatexEditor({ value, onChange, readOnly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineNumbers(),
        highlightActiveLine(),
        latexLang,
        darkTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.editable.of(!readOnly),
      ],
    })

    viewRef.current = new EditorView({ state, parent: containerRef.current })
    return () => viewRef.current?.destroy()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. agent fill)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[120px] overflow-auto rounded-b-lg border-t border-[#2a2a2a]"
    />
  )
}
