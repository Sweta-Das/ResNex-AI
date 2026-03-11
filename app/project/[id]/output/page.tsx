'use client'
// app/project/[id]/output/page.tsx

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Button, Badge, Card, Spinner, ToastProvider, useToast } from '../../../../components/ui'

function BiasReport({ report }: { report: string }) {
  let parsed: any = null
  try { parsed = JSON.parse(report) } catch { }

  if (!parsed) return <p className="text-sm text-[#c8cad0] whitespace-pre-wrap">{report}</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-[#0a0c10] rounded-lg border border-[#1a1f2e]">
        <p className="text-sm text-[#c8cad0]">{parsed.summary}</p>
      </div>
      {parsed.flags?.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider">
            {parsed.flags.length} Flag{parsed.flags.length !== 1 ? 's' : ''} Found
          </p>
          {parsed.flags.map((flag: any, i: number) => (
            <div key={i} className="p-4 bg-[#f59e0b]/5 border border-[#f59e0b]/15 rounded-lg">
              <p className="text-xs text-[#e8eaf0] mb-2">
                <span className="text-[#f59e0b] font-medium">Flagged: </span>
                "{flag.sentence}"
              </p>
              <p className="text-xs text-[#7a839a] mb-1"><span className="font-medium text-[#c8cad0]">Issue:</span> {flag.issue}</p>
              <p className="text-xs text-[#7a839a]"><span className="font-medium text-[#3ecf8e]">Suggestion:</span> {flag.suggestion}</p>
            </div>
          ))}
        </div>
      )}
      {parsed.flags?.length === 0 && (
        <div className="p-4 bg-[#3ecf8e]/5 border border-[#3ecf8e]/20 rounded-lg text-center">
          <p className="text-sm text-[#3ecf8e] font-medium">✓ No bias flags found</p>
        </div>
      )}
    </div>
  )
}

export default function OutputPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [output, setOutput] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [runningMerge, setRunningMerge] = useState(false)
  const [runningBias, setRunningBias] = useState(false)
  const [runningVisual, setRunningVisual] = useState(false)
  const [activeSection, setActiveSection] = useState<'doc' | 'methodology' | 'bias' | 'credits' | 'visual'>('doc')
  const { success, error, toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}/output`).then(r => r.ok ? r.json() : null),
      fetch(`/api/projects/${id}/contributorship`).then(r => r.ok ? r.json() : []),
    ]).then(([out, logData]) => {
      setOutput(out)
      setLogs(logData)
    }).finally(() => setLoading(false))
  }, [id])

  async function runMerge() {
    setRunningMerge(true)
    try {
      const res = await fetch('/api/ai/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id }),
      })
      const data = await res.json()
      setOutput((prev: any) => ({ ...(prev || {}), merged_content: data.merged_content }))
      success('Document merged!')
    } catch { error('Merge failed') }
    finally { setRunningMerge(false) }
  }

  async function runBiasAudit() {
    setRunningBias(true)
    try {
      const res = await fetch('/api/ai/bias-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id }),
      })
      const data = await res.json()
      setOutput((prev: any) => ({ ...(prev || {}), bias_audit_report: JSON.stringify(data) }))
      success('Bias audit complete!')
    } catch { error('Bias audit failed') }
    finally { setRunningBias(false) }
  }

  async function generateVisual() {
    setRunningVisual(true)
    try {
      const res = await fetch('/api/ai/visual-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id }),
      })
      const data = await res.json()
      setOutput((prev: any) => ({ ...(prev || {}), visual_summary_url: data.image_url }))
      success('Visual summary generated!')
    } catch { error('Visual generation failed') }
    finally { setRunningVisual(false) }
  }

  async function exportPdf() {
    const { exportElementAsPdf } = await import('../../../../lib/pdf')
    await exportElementAsPdf('output-doc', 'research-output.pdf')
  }

  const tabs = [
    { label: 'Overview', href: `/project/${id}` },
    { label: 'Chat', href: `/project/${id}/chat` },
    { label: 'Discover', href: `/project/${id}/discover` },
    { label: 'Library', href: `/project/${id}/library` },
    { label: 'Compare', href: `/project/${id}/compare` },
    { label: 'Agents', href: `/project/${id}/agents` },
    { label: 'Review', href: `/project/${id}/review` },
    { label: 'Output', href: `/project/${id}/output` },
  ]

  const navItems = [
    { key: 'doc', label: 'Merged Document', icon: '📄' },
    { key: 'methodology', label: 'Methodology', icon: '🔬' },
    { key: 'bias', label: 'Bias Audit', icon: '⚖️' },
    { key: 'credits', label: 'Contributor Credits', icon: '👥' },
    { key: 'visual', label: 'Visual Summary', icon: '🖼️' },
  ]

  return (
    <>
      <ToastProvider />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PageHeader
          title="Final Output"
          subtitle="Merged document, bias audit, and exports"
          tabs={tabs}
          activeTab={tabs[8].href}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={exportPdf}>Export PDF</Button>
              <Button size="sm" onClick={() => router.push(`/project/${id}/latex`)}>LaTeX Editor →</Button>
            </div>
          }
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left nav */}
          <div className="w-52 flex-shrink-0 border-r border-[#1a1f2e] bg-[#0d1018] py-4 flex flex-col gap-1 px-3">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key as any)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                  activeSection === item.key
                    ? 'bg-[#4f8ef7]/10 text-[#4f8ef7] border border-[#4f8ef7]/20'
                    : 'text-[#7a839a] hover:text-[#e8eaf0] hover:bg-[#1a1f2e]'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#0a0c10]">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>
            ) : (
              <div className="max-w-3xl mx-auto">
                {activeSection === 'doc' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-[#e8eaf0]">Merged Research Document</h2>
                      <Button size="sm" onClick={runMerge} loading={runningMerge} variant="secondary">
                        {output?.merged_content ? 'Regenerate' : 'Run Merge'}
                      </Button>
                    </div>
                    {output?.merged_content ? (
                      <div id="output-doc" className="bg-[#12151c] border border-[#252a38] rounded-xl p-8">
                        <p className="text-sm text-[#c8cad0] leading-relaxed whitespace-pre-wrap">
                          {output.merged_content}
                        </p>
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <p className="text-[#7a839a] mb-4">No merged document yet.</p>
                        <Button onClick={runMerge} loading={runningMerge}>Merge All Sections</Button>
                      </Card>
                    )}
                  </div>
                )}

                {activeSection === 'methodology' && (
                  <div>
                    <h2 className="text-lg font-bold text-[#e8eaf0] mb-6">Methodology Disclosure</h2>
                    {output?.methodology_disclosure ? (
                      <div className="bg-[#12151c] border border-[#252a38] rounded-xl p-8">
                        <p className="text-sm text-[#c8cad0] leading-relaxed whitespace-pre-wrap">
                          {output.methodology_disclosure}
                        </p>
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <p className="text-[#7a839a] mb-4">BERA-compliant AI usage disclosure not yet generated.</p>
                        <Button onClick={async () => {
                          const res = await fetch('/api/ai/methodology', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ project_id: id }),
                          })
                          const data = await res.json()
                          setOutput((prev: any) => ({ ...(prev || {}), methodology_disclosure: data.methodology }))
                          success('Methodology disclosure generated!')
                        }}>Generate Disclosure</Button>
                      </Card>
                    )}
                  </div>
                )}

                {activeSection === 'bias' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-[#e8eaf0]">Bias Audit Report</h2>
                      <Button size="sm" onClick={runBiasAudit} loading={runningBias} variant="secondary">
                        {output?.bias_audit_report ? 'Re-audit' : 'Run Audit'}
                      </Button>
                    </div>
                    {output?.bias_audit_report ? (
                      <div className="bg-[#12151c] border border-[#252a38] rounded-xl p-6">
                        <BiasReport report={output.bias_audit_report} />
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <p className="text-[#7a839a] mb-2">No bias audit yet.</p>
                        <p className="text-xs text-[#3d4558] mb-4">Requires a merged document first.</p>
                        <Button onClick={runBiasAudit} loading={runningBias} disabled={!output?.merged_content}>
                          Run Bias Audit
                        </Button>
                      </Card>
                    )}
                  </div>
                )}

                {activeSection === 'credits' && (
                  <div>
                    <h2 className="text-lg font-bold text-[#e8eaf0] mb-6">Contributor Credits</h2>
                    <div className="bg-[#12151c] border border-[#252a38] rounded-xl p-6">
                      {logs.length === 0 ? (
                        <p className="text-sm text-[#7a839a]">No contribution data yet.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {Object.entries(
                            logs.reduce((acc: any, log: any) => {
                              const name = log.user?.full_name || 'Unknown'
                              if (!acc[name]) acc[name] = []
                              acc[name].push(log)
                              return acc
                            }, {})
                          ).map(([name, userLogs]: [string, any]) => (
                            <div key={name} className="p-4 bg-[#0a0c10] rounded-lg border border-[#1a1f2e]">
                              <p className="font-semibold text-sm text-[#e8eaf0] mb-2">{name}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {['created', 'edited', 'ai_prompted', 'reviewed', 'merged'].map(action => {
                                  const count = userLogs.filter((l: any) => l.action === action).length
                                  if (!count) return null
                                  return (
                                    <Badge key={action} color={action === 'ai_prompted' ? 'gray' : action === 'merged' ? 'green' : 'blue'}>
                                      {count}× {action.replace('_', ' ')}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'visual' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-[#e8eaf0]">Visual Summary</h2>
                      <Button size="sm" onClick={generateVisual} loading={runningVisual} variant="secondary">
                        {output?.visual_summary_url ? 'Regenerate' : 'Generate'}
                      </Button>
                    </div>
                    {output?.visual_summary_url ? (
                      <div className="bg-[#12151c] border border-[#252a38] rounded-xl overflow-hidden">
                        <img src={output.visual_summary_url} alt="Visual summary" className="w-full" />
                        <div className="p-4 flex justify-end">
                          <Button size="sm" variant="ghost" onClick={() => window.open(output.visual_summary_url, '_blank')}>
                            Open Full Size
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <p className="text-[#7a839a] mb-4">Generate an AI infographic for your research.</p>
                        <Button onClick={generateVisual} loading={runningVisual} disabled={!output?.merged_content}>
                          Generate Visual Summary
                        </Button>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
