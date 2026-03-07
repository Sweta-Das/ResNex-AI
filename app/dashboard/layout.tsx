'use client'
// app/dashboard/layout.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '../../components/layout/Sidebar'
import { Modal, Button, Input, Textarea, ToastProvider, useToast } from '../../components/ui'
import { Project } from '../../types'

function CreateProjectModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (p: Project) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const { error: showError, success } = useToast()

  async function handleCreate() {
    if (!title || !description || !topic) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, topic }),
      })
      if (!res.ok) throw new Error()
      const project = await res.json()
      success('Project created!')
      onCreated(project)
      onClose()
      setTitle(''); setDescription(''); setTopic('')
    } catch { showError('Failed to create project') } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Project">
      <div className="flex flex-col gap-4">
        <Input label="Project Title" placeholder="e.g. AI Ethics in STEM Education" value={title} onChange={e => setTitle(e.target.value)} />
        <Input label="Research Topic" placeholder="e.g. Bias in AI Assessment" value={topic} onChange={e => setTopic(e.target.value)} />
        <Textarea label="Description" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={loading} disabled={!title||!description||!topic}>Create Project</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [myRoles, setMyRoles] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.text())
      .then(text => {
        if (!text) return
        const data = JSON.parse(text)
        if (!Array.isArray(data)) { console.error('[layout fetchProjects]', data); return }
        setProjects(data)
        const roles: Record<string, string> = {}
        data.forEach((p: any) => { if (p.myRole) roles[p.id] = p.myRole })
        setMyRoles(roles)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <ToastProvider />
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          projects={projects}
          loading={loading}
          onSelect={id => router.push(`/project/${id}`)}
          onCreateProject={() => setShowCreate(true)}
          myRole={myRoles}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={p => { setProjects(prev => [p, ...prev]); router.push(`/project/${p.id}`) }}
      />
    </>
  )
}
