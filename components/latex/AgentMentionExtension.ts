// components/latex/AgentMentionExtension.ts — Tiptap Mention extension configured for @agent triggers
import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'

export const AGENT_ITEMS = [
  { id: 'equation', label: 'equation', description: 'Generate LaTeX equation from image/description' },
  { id: 'table', label: 'table', description: 'Generate LaTeX table from CSV or description' },
  { id: 'figure', label: 'figure', description: 'Generate figure with auto-caption' },
  { id: 'citation', label: 'citation', description: 'Insert citation from library' },
  { id: 'text', label: 'text', description: 'Rewrite or expand this section' },
]

export type AgentItem = typeof AGENT_ITEMS[number]

// Minimal suggestion list rendered into a div (no React portal needed)
function buildSuggestionEl(items: AgentItem[], onSelect: (item: AgentItem) => void): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl overflow-hidden w-56'

  items.forEach((item, i) => {
    const btn = document.createElement('button')
    btn.className = 'flex flex-col w-full px-3 py-2 text-left hover:bg-[#353535] transition-colors'
    btn.innerHTML = `
      <span class="text-sm font-medium text-[#e8eaf0]">@${item.label}</span>
      <span class="text-xs text-[#7a839a]">${item.description}</span>
    `
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault()
      onSelect(item)
    })
    wrapper.appendChild(btn)
  })

  return wrapper
}

export const AgentMentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#1e3a5f] text-[#60a5fa] cursor-pointer',
  },
  suggestion: {
    char: '@',
    items: ({ query }: { query: string }) =>
      AGENT_ITEMS.filter(item =>
        item.label.toLowerCase().startsWith(query.toLowerCase())
      ),
    render() {
      let popup: TippyInstance[] | null = null
      let el: HTMLElement | null = null

      return {
        onStart(props: any) {
          el = buildSuggestionEl(props.items, (item) => {
            props.command({ id: item.id, label: item.label })
          })

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: el,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props: any) {
          if (!el) return
          el.innerHTML = ''
          buildSuggestionEl(props.items, (item) => {
            props.command({ id: item.id, label: item.label })
          }).childNodes.forEach(n => el!.appendChild(n))

          popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide()
            return true
          }
          return false
        },

        onExit() {
          popup?.[0]?.destroy()
          popup = null
        },
      }
    },
  },
})
