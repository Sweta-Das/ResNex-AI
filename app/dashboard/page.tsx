'use client'
// app/dashboard/page.tsx — Main dashboard with sidebar + project tabs

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AggregateDashboard } from '../../components/dashboard/AggregateDashboard'
import { Sidebar } from '../../components/layout/Sidebar'
import { Modal, Button, Input, Textarea, ToastProvider, useToast } from '../../components/ui'
import { Project } from '../../types'

function CreateProjectModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (p: Project) => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdProject, setCreatedProject] = useState<Project | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [invites, setInvites] = useState<string[]>([])
  const [inviting, setInviting] = useState(false)
  const { error: showError, success } = useToast()

  function handleClose() {
    onClose()
    setTimeout(() => { setStep(1); setTitle(''); setDescription(''); setTopic(''); setInvites([]); setEmailInput(''); setCreatedProject(null) }, 300)
  }

  async function handleCreate() {
    if (!title || !description || !topic) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, topic }),
      })
      if (!res.ok) throw new Error(await res.text())
      const project = await res.json()
      setCreatedProject(project)
      onCreated(project)
      setStep(2)
    } catch (e: any) {
      showError(e.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  function addEmail() {
    const email = emailInput.trim().toLowerCase()
    if (!email || !email.includes('@') || invites.includes(email)) return
    setInvites(prev => [...prev, email])
    setEmailInput('')
  }

  async function handleInviteAndGo() {
    if (!createdProject) return
    setInviting(true)
    try {
      await Promise.all(invites.map(email =>
        fetch(`/api/projects/${createdProject.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role: 'member' }),
        })
      ))
      if (invites.length > 0) success(`Invited ${invites.length} member${invites.length > 1 ? 's' : ''}`)
    } catch { showError('Some invites may have failed — you can add more from Admin settings') }
    finally {
      setInviting(false)
      handleClose()
      router.push(`/project/${createdProject.id}`)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={step === 1 ? 'Create New Project' : 'Invite Team Members'}>
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-1.5 mb-1">
            <div className="h-1 flex-1 rounded-full bg-[#4f8ef7]" />
            <div className="h-1 flex-1 rounded-full bg-[#252a38]" />
          </div>
          <Input
            label="Project Title"
            placeholder="e.g. AI Ethics in STEM Education"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            label="Research Topic"
            placeholder="e.g. Bias in AI Assessment Tools"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the research goals..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCreate} loading={loading} disabled={!title || !description || !topic}>
              Next: Invite Members
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-1.5 mb-1">
            <div className="h-1 flex-1 rounded-full bg-[#4f8ef7]" />
            <div className="h-1 flex-1 rounded-full bg-[#4f8ef7]" />
          </div>
          <p className="text-xs text-[#7a839a]">
            Add team members by email. They'll be able to log in and join <span className="text-[#e8eaf0] font-medium">{title}</span>. You can also add more later from Admin settings.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
              placeholder="teammate@university.edu"
              className="flex-1 bg-[#0a0c10] border border-[#252a38] rounded-lg px-3 py-2 text-sm
                text-[#e8eaf0] placeholder:text-[#3d4558] focus:outline-none focus:border-[#4f8ef7] transition-all"
            />
            <Button variant="secondary" size="sm" onClick={addEmail} disabled={!emailInput.trim()}>Add</Button>
          </div>
          {invites.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {invites.map(email => (
                <div key={email} className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-[#4f8ef7]/20 flex items-center justify-center text-[10px] font-bold text-[#4f8ef7]">
                    {email[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-[#c8cad0] truncate">{email}</span>
                  <button onClick={() => setInvites(prev => prev.filter(e => e !== email))}
                    className="text-[#3d4558] hover:text-[#f87171] transition-colors text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 justify-between mt-2">
            <Button variant="ghost" onClick={() => { handleClose(); router.push(`/project/${createdProject!.id}`) }}>
              Skip, go to project
            </Button>
            <Button onClick={handleInviteAndGo} loading={inviting}>
              {invites.length > 0 ? `Invite ${invites.length} & Open` : 'Open Project'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

const REFLECT_PROMPTS = [
  "What felt hard today, and why do you think that is?",
  "Where did you feel out of your depth this week? What would help?",
  "Describe a moment you doubted yourself. What would you tell a friend in the same situation?",
  "What's one thing you've learned recently?",
  "What assumptions did you bring to your research that have been challenged?",
  "Who makes you feel most capable? What do they do?",
  "What would you have to believe about yourself to feel fully legitimate here?",
  "When do you feel most like a researcher? When least?",
  "Write about a small win this week — no matter how small.",
  "What would you regret not saying in this project?",
  "What are you still figuring out, and is that okay?",
  "What does 'good enough' look like in your contribution?",
]

function PersonalReflect() {
  const today = new Date().toISOString().slice(0, 10)
  const storageKey = `reflect_${today}`
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  )
  const prompt = REFLECT_PROMPTS[dayOfYear % REFLECT_PROMPTS.length]

  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) { setText(stored); setSaved(true) }
  }, [storageKey])

  const handleSave = useCallback(() => {
    localStorage.setItem(storageKey, text)
    setSaved(true)
  }, [storageKey, text])

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
    >
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: 'rgba(124,106,245,0.12)', border: '1px solid rgba(124,106,245,0.2)' }}
          >
            🔮
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
              Daily Reflect
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
              {saved ? <span style={{ color: 'var(--color-green)' }}>Saved today ✓</span> : 'Click to write'}
            </p>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5">
          <div
            className="rounded-xl px-3 py-2.5 mb-3"
            style={{ background: 'rgba(124,106,245,0.06)', border: '1px solid rgba(124,106,245,0.15)' }}
          >
            <p className="text-[12px] italic leading-relaxed" style={{ color: 'var(--color-text)' }}>
              &ldquo;{prompt}&rdquo;
            </p>
          </div>

          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false) }}
            placeholder="Write freely — this is just for you…"
            rows={4}
            autoFocus
            className="w-full resize-none rounded-xl px-3 py-2.5 text-[12px] leading-relaxed outline-none transition-colors"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
            }}
          />

          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              This device only
            </p>
            {saved ? (
              <span className="text-[11px]" style={{ color: 'var(--color-green)' }}>Saved today ✓</span>
            ) : (
              <button
                onClick={handleSave}
                disabled={text.length < 5}
                className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-40"
                style={{ background: 'var(--color-violet)', color: '#fff' }}
              >
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [saving, setSaving] = useState(false)
  const { success, error } = useToast()

  async function handleSave() {
    if (!fullName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, affiliation }),
      })
      if (!res.ok) throw new Error()
      success('Profile saved!')
      onClose()
    } catch { error('Failed to save profile') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete your profile">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[#7a839a]">Tell us a bit about yourself to get started.</p>
        <Input
          label="Full Name"
          placeholder="e.g. Priya Sharma"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
        <Input
          label="University / Affiliation"
          placeholder="e.g. IIT Delhi"
          value={affiliation}
          onChange={e => setAffiliation(e.target.value)}
        />
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <Button onClick={handleSave} loading={saving} disabled={!fullName.trim()}>
            Save Profile
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [myRoles, setMyRoles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoaded) return
    fetchProjects()
    // Check if profile needs completion
    fetch('/api/user').then(r => r.ok ? r.json() : null).then(u => {
      if (u && !u.affiliation) setShowProfile(true)
    }).catch(() => {})
  }, [isLoaded])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      const text = await res.text()
      if (!text) { console.error('[fetchProjects] empty response'); return }
      const data = JSON.parse(text)
      if (!Array.isArray(data)) { console.error('[fetchProjects] server error:', data); return }
      setProjects(data)
      const roles: Record<string, string> = {}
      data.forEach((p: any) => { if (p.myRole) roles[p.id] = p.myRole })
      setMyRoles(roles)
    } catch (e) {
      console.error('[fetchProjects]', e)
    } finally {
      setLoadingProjects(false)
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    router.push(`/project/${id}`)
  }

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
      <div className="animate-spin w-6 h-6 border-2 border-[#4f8ef7] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <>
      <ToastProvider />
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          projects={projects}
          loading={loadingProjects}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreateProject={() => setShowCreate(true)}
          myRole={myRoles}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 bg-[#0a0c10] overflow-y-auto"
          style={{ padding: '28px 36px' }}
        >
          <div className="flex gap-8 items-start">
            <div className="flex-1 min-w-0">
              <AggregateDashboard
                userId={user?.id ?? ''}
                userName={user?.fullName || user?.firstName || 'Researcher'}
                onCreateProject={() => setShowCreate(true)}
              />
            </div>
            <div className="w-72 flex-shrink-0">
              <PersonalReflect />
            </div>
          </div>
        </main>
      </div>
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(p) => { setProjects(prev => [p, ...prev]); handleSelect(p.id) }}
      />
      <ProfileSetupModal open={showProfile} onClose={() => setShowProfile(false)} />
    </>
  )
}
