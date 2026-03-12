'use client'
// app/project/[id]/reflect/page.tsx
// Feature 6 — Private Reflection Space
// PRIVACY: All entries are user-private. No entry from another user is ever fetched or displayed.

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { ReflectionInput } from '../../../../components/belonging/ReflectionInput'
import { ReflectionHistory } from '../../../../components/belonging/ReflectionHistory'

interface ReflectionEntry {
  id: string
  content: string
  promptIndex: number
  isShared: boolean
  createdAt: string
}

export default function ReflectPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [entries, setEntries] = useState<ReflectionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/reflection`)
        if (res.ok) {
          const data: ReflectionEntry[] = await res.json()
          setEntries(data)
        }
      } catch {
        // Non-critical — show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  function handleSaved(entry: ReflectionEntry) {
    // Prepend the new entry so it appears at the top of history
    setEntries((prev) => [entry, ...prev])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="Reflect" />

      <main className="mx-auto px-4 py-10" style={{ maxWidth: '640px' }}>
        {/* Page title */}
        <div className="mb-8">
          <h1
            className="text-[26px] font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            Reflect
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--color-muted)' }}>
            A private space for your thoughts. No one else sees this.
          </p>
        </div>

        {/* Today's prompt + input */}
        <div className="mb-8">
          <ReflectionInput projectId={projectId} onSaved={handleSaved} />
        </div>

        {/* Past entries */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-border-2)', borderTopColor: 'var(--color-violet)' }}
            />
          </div>
        ) : (
          <ReflectionHistory entries={entries} />
        )}
      </main>
    </div>
  )
}
