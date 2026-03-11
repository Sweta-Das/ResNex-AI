import { create } from 'zustand'

export interface FillOutput {
  latex: string
  sections: Record<string, { content: string; mode: 'data' | 'generated'; sourceType: string[]; wordCount: number }>
  warnings: string[]
}

// Section fill state for the drawer editor
export interface SectionState {
  content: string              // Tiptap JSON or raw LaTeX string
  mode: 'visual' | 'latex'    // which editor mode is active
  fillStatus: 'empty' | 'user' | 'agent'  // color coding
}

interface PreviewStore {
  // Legacy pipeline preview state
  fillOutput: FillOutput | null
  activeSection: string
  editedLatex: string
  isDirty: boolean
  regenerating: string | null
  warnings: string[]
  setFillOutput: (output: FillOutput) => void
  setSection: (section: string) => void
  updateLatex: (latex: string) => void
  setRegenerating: (section: string | null) => void

  // Drawer state (DECISIONS4 §16)
  isDrawerOpen: boolean
  pdfBlobUrl: string | null
  isCompiling: boolean
  selectedTemplate: 'neurips' | 'generic'
  sectionStates: Record<string, SectionState>

  openDrawer: () => void
  closeDrawer: () => void
  setPdfBlob: (url: string | null) => void
  setCompiling: (v: boolean) => void
  setTemplate: (t: 'neurips' | 'generic') => void
  setSectionContent: (section: string, content: string, fillStatus?: 'empty' | 'user' | 'agent') => void
  setSectionMode: (section: string, mode: 'visual' | 'latex') => void
  clearPdfBlob: () => void
}

export const usePreviewStore = create<PreviewStore>((set) => ({
  // Legacy
  fillOutput: null,
  activeSection: 'Abstract',
  editedLatex: '',
  isDirty: false,
  regenerating: null,
  warnings: [],
  setFillOutput: (output) => set({ fillOutput: output, editedLatex: output.latex, warnings: output.warnings }),
  setSection: (section) => set({ activeSection: section }),
  updateLatex: (latex) => set({ editedLatex: latex, isDirty: true }),
  setRegenerating: (section) => set({ regenerating: section }),

  // Drawer
  isDrawerOpen: false,
  pdfBlobUrl: null,
  isCompiling: false,
  selectedTemplate: 'generic',
  sectionStates: {},

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setPdfBlob: (url) => set({ pdfBlobUrl: url }),
  clearPdfBlob: () => set({ pdfBlobUrl: null }),
  setCompiling: (v) => set({ isCompiling: v }),
  setTemplate: (t) => set({ selectedTemplate: t }),
  setSectionContent: (section, content, fillStatus = 'user') =>
    set(state => ({
      sectionStates: {
        ...state.sectionStates,
        [section]: {
          ...state.sectionStates[section],
          content,
          fillStatus,
          mode: state.sectionStates[section]?.mode || 'visual',
        },
      },
    })),
  setSectionMode: (section, mode) =>
    set(state => ({
      sectionStates: {
        ...state.sectionStates,
        [section]: {
          ...state.sectionStates[section],
          mode,
          content: state.sectionStates[section]?.content || '',
          fillStatus: state.sectionStates[section]?.fillStatus || 'empty',
        },
      },
    })),
}))
