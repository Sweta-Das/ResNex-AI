'use client'
// app/project/[id]/workspace/page.tsx

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Button, Badge, Spinner, ToastProvider, useToast } from '../../../../components/ui'

const TipTapEditor = dynamic(
  () => import('../../../../components/workspace/TipTapEditor'),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><span className="text-[#7a839a] text-sm">Loading editor...</span></div> }
)

function WordCountBar({ count, target }: { count: number; target: number }) {
  const pct = Math.min(100, Math.round((count / Math.max(target,1)) * 100))
  const color = pct >= 100 ? '#3ecf8e' : pct >= 60 ? '#f59e0b' : '#4f8ef7'
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{count}<span className="text-[#3d4558]">/{target}</span></span>
    </div>
  )
}

function AIResearchChat({ projectId, subtopic }: { projectId: string; subtopic: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'files'>('chat')
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const { error } = useToast()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages); setInput(''); setLoading(true)
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, messages: newMessages, section_subtopic: subtopic }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch { error('AI request failed') } finally { setLoading(false) }
  }

  function generateImage(e: React.FormEvent) {
    e.preventDefault()
    if (!imagePrompt.trim()) return
    setImageUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=500&nologo=true`)
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1018]">
      <div className="flex border-b border-[#252a38]">
        {(['chat','image','files'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab===tab ? 'text-[#4f8ef7] border-b-2 border-[#4f8ef7]' : 'text-[#7a839a] hover:text-[#e8eaf0]'}`}>
            {tab === 'chat' ? '🤖 AI Research' : tab === 'image' ? '🎨 Image Gen' : '📎 Files'}
          </button>
        ))}
      </div>
      {activeTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                <div className="w-12 h-12 rounded-xl bg-[#7c6af5]/10 border border-[#7c6af5]/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c6af5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-sm font-medium text-[#e8eaf0]">AI Research Assistant</p>
                <p className="text-xs text-[#7a839a] max-w-[200px]">I'll guide your research on {subtopic || 'your topic'} — not write it for you.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role==='user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${m.role==='user' ? 'bg-[#4f8ef7]/20 text-[#4f8ef7]' : 'bg-[#7c6af5]/20 text-[#7c6af5]'}`}>{m.role==='user'?'U':'AI'}</div>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role==='user' ? 'bg-[#4f8ef7]/12 text-[#e8eaf0] rounded-tr-sm' : 'bg-[#1a1f2e] text-[#c8cad0] rounded-tl-sm'}`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#7c6af5]/20 text-[#7c6af5] flex items-center justify-center text-[10px] font-bold">AI</div>
                <div className="bg-[#1a1f2e] px-3 py-2.5 rounded-xl rounded-tl-sm flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#7c6af5] animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="p-3 border-t border-[#252a38] flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a research question..."
              className="flex-1 bg-[#0a0c10] border border-[#252a38] rounded-lg px-3 py-2 text-xs text-[#e8eaf0] placeholder:text-[#3d4558] focus:outline-none focus:border-[#4f8ef7]" />
            <button type="submit" disabled={!input.trim()||loading}
              className="w-8 h-8 rounded-lg bg-[#4f8ef7] hover:bg-[#3d7de8] disabled:opacity-40 flex items-center justify-center flex-shrink-0">
              {loading ? <Spinner size={12} color="white" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>}
            </button>
          </form>
        </>
      ) : activeTab === 'image' ? (
        <div className="flex-1 flex flex-col p-4 gap-4">
          <form onSubmit={generateImage} className="flex gap-2">
            <input value={imagePrompt} onChange={e=>setImagePrompt(e.target.value)} placeholder="Describe an image..."
              className="flex-1 bg-[#0a0c10] border border-[#252a38] rounded-lg px-3 py-2 text-xs text-[#e8eaf0] placeholder:text-[#3d4558] focus:outline-none focus:border-[#4f8ef7]" />
            <Button type="submit" size="sm" disabled={!imagePrompt.trim()}>Go</Button>
          </form>
          {imageUrl ? (
            <div className="flex flex-col gap-2">
              <img src={imageUrl} alt="Generated" className="w-full rounded-lg border border-[#252a38]" />
              <p className="text-xs text-[#7a839a]">Right-click → Save, then insert into your doc.</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#3d4558] text-center">Enter a description to generate an image (Pollinations.ai — free)</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-4">
          <p className="text-xs font-semibold text-[#7a839a] uppercase tracking-wider">Reference PDFs</p>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#252a38]
            rounded-xl p-6 cursor-pointer hover:border-[#4f8ef7]/50 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <span className="text-xs text-[#7a839a] text-center">Upload reference PDFs<br/><span className="text-[#3d4558]">Max 16MB · up to 5 files</span></span>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (!files.length) return
                const formData = new FormData()
                files.forEach(f => formData.append('files', f))
                try {
                  const res = await fetch('/api/uploadthing', { method: 'POST', body: formData })
                  if (res.ok) {
                    const data = await res.json()
                    const uploaded = (data as any[]).map((f: any) => ({ name: f.name, url: f.url }))
                    setUploadedFiles(prev => [...prev, ...uploaded])
                  }
                } catch { error('Upload failed — ensure UPLOADTHING_SECRET is set') }
              }}
            />
          </label>
          {uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] rounded-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#4f8ef7] hover:underline truncate flex-1">{f.name}</a>
                </div>
              ))}
            </div>
          )}
          {uploadedFiles.length === 0 && (
            <p className="text-xs text-[#3d4558] text-center">Uploaded PDFs appear here and are linked to the project for AI reference.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [section, setSection] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [flagged, setFlagged] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { success, error } = useToast()

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}/sections/mine`).then(r => r.ok ? r.json() : null),
      fetch(`/api/projects/${id}`).then(r => r.json()),
    ]).then(([sec, proj]) => { setSection(sec); setProject(proj); if (sec) setWordCount(sec.word_count||0) })
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [id])

  function handleEditorChange(json: any, wc: number) {
    setWordCount(wc)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(json, wc), 30000)
  }

  async function autoSave(content: any, wc: number) {
    setSaving(true)
    try {
      await fetch(`/api/projects/${id}/sections/mine`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(content), word_count: wc }),
      })
    } catch { console.error('Auto-save failed') } finally { setSaving(false) }
  }

  async function submitSection() {
    setSubmitting(true); setFlagged('')
    try {
      const res = await fetch(`/api/projects/${id}/sections/mine/submit`, { method: 'POST' })
      if (res.status === 422) { const d = await res.json(); setFlagged(d.message); return }
      if (!res.ok) throw new Error()
      success('Section submitted!')
      setSection((prev: any) => prev ? { ...prev, submitted: true } : prev)
    } catch { error('Submit failed') } finally { setSubmitting(false) }
  }

  const tabs = [
    { label: 'Overview', href: `/project/${id}` },
    { label: 'Chat', href: `/project/${id}/chat` },
    { label: 'Workspace', href: `/project/${id}/workspace` },
    { label: 'Review', href: `/project/${id}/review` },
    { label: 'Output', href: `/project/${id}/output` },
    { label: 'LaTeX', href: `/project/${id}/latex` },
  ]

  return (
    <>
      <ToastProvider />
      <div className="flex flex-col h-screen overflow-hidden">
        <PageHeader
          title="My Workspace"
          subtitle={section?.subtopic ? `Writing: ${section.subtopic}` : 'Your research section'}
          tabs={tabs} activeTab={tabs[2].href}
          actions={
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-[#7a839a] flex items-center gap-1.5"><Spinner size={12} />Saving...</span>}
              <WordCountBar count={wordCount} target={500} />
              {!section?.submitted ? (
                <Button onClick={submitSection} loading={submitting} variant="success" size="sm" disabled={wordCount < 10}>Submit Section</Button>
              ) : (
                <Badge color="green">✓ Submitted</Badge>
              )}
            </div>
          }
        />
        {flagged && (
          <div className="mx-6 mt-3 p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-xs text-[#f59e0b]">⚠ {flagged}</div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden border-r border-[#1a1f2e]">
            <TipTapEditor initialContent={section?.content} onChange={handleEditorChange} />
          </div>
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <AIResearchChat projectId={id} subtopic={section?.subtopic || project?.topic || ''} />
          </div>
        </div>
      </div>
    </>
  )
}
