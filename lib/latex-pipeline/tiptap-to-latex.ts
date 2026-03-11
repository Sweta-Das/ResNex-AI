// lib/latex-pipeline/tiptap-to-latex.ts
// Converts Tiptap JSON to LaTeX string for each section

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, any> }[]
  attrs?: Record<string, any>
}

interface TiptapDoc {
  type: 'doc'
  content: TiptapNode[]
}

function nodeToLatex(node: TiptapNode): string {
  switch (node.type) {
    case 'doc':
      return (node.content || []).map(nodeToLatex).join('\n')

    case 'paragraph': {
      const text = (node.content || []).map(nodeToLatex).join('')
      return text ? text + '\n\n' : '\n'
    }

    case 'text': {
      let text = node.text || ''
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `\\textbf{${text}}`
          if (mark.type === 'italic') text = `\\textit{${text}}`
          if (mark.type === 'code') text = `\\texttt{${text}}`
        }
      }
      return text
    }

    case 'heading': {
      const level = node.attrs?.level || 1
      const text = (node.content || []).map(nodeToLatex).join('')
      const cmds: Record<number, string> = {
        1: '\\section',
        2: '\\subsection',
        3: '\\subsubsection',
      }
      return `${cmds[level] || '\\paragraph'}{${text}}\n\n`
    }

    case 'bulletList':
      return `\\begin{itemize}\n${(node.content || []).map(nodeToLatex).join('')}\\end{itemize}\n\n`

    case 'orderedList':
      return `\\begin{enumerate}\n${(node.content || []).map(nodeToLatex).join('')}\\end{enumerate}\n\n`

    case 'listItem': {
      const text = (node.content || []).map(nodeToLatex).join('').trim()
      return `  \\item ${text}\n`
    }

    case 'blockquote': {
      const text = (node.content || []).map(nodeToLatex).join('').trim()
      return `\\begin{quote}\n${text}\n\\end{quote}\n\n`
    }

    case 'codeBlock': {
      const text = (node.content || []).map(nodeToLatex).join('')
      return `\\begin{verbatim}\n${text}\n\\end{verbatim}\n\n`
    }

    case 'hardBreak':
      return '\\\\\n'

    case 'horizontalRule':
      return '\\hrule\n\n'

    default:
      // Pass through unknown nodes by rendering children
      return (node.content || []).map(nodeToLatex).join('')
  }
}

/**
 * Convert a Tiptap JSON string (or plain string) to LaTeX content for a section body.
 * Does NOT include \section{} header — just the body content.
 */
export function tiptapToLatex(contentJson: string): string {
  if (!contentJson || contentJson.trim() === '') return ''

  // If it looks like raw LaTeX already (starts with \), return as-is
  if (contentJson.trim().startsWith('\\')) return contentJson

  try {
    const doc: TiptapDoc = JSON.parse(contentJson)
    if (doc.type !== 'doc') {
      // Maybe it's already a string
      return contentJson
    }
    return nodeToLatex(doc).trim()
  } catch {
    // Not valid JSON — treat as plain text
    return contentJson
  }
}

/**
 * Convert all sections' Tiptap JSON to a full LaTeX document.
 * sections: { [sectionKey]: tiptapJsonString }
 * template: full .tex template string with <<SECTION_NAME>> placeholders
 */
export function sectionsToLatex(
  sections: Record<string, string>,
  template: string
): string {
  let result = template
  for (const [key, value] of Object.entries(sections)) {
    const placeholder = `<<${key.toUpperCase()}>>`
    const latex = tiptapToLatex(value)
    result = result.replace(new RegExp(placeholder, 'g'), latex)
  }
  // Clear any remaining unfilled placeholders
  result = result.replace(/<<[A-Z_]+>>/g, '% [Section not yet written]')
  return result
}
