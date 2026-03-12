'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContributionHeatmap } from '@/components/contributors/ContributionHeatmap'
import { Button, Card } from '@/components/ui'

type DashboardStats = {
  totalActions: number
  activeProjects: number
  currentStreak: number
}

type ContributionDay = {
  date: string
  count: number
}

type ContributionResponse = {
  days: ContributionDay[]
  currentStreak: number
  totalActiveDays: number
}

type ProjectSummary = {
  id: string
  title: string
  status: string
  myRole?: string
}

type AggregateDashboardProps = {
  userId: string
  userName: string
  onCreateProject: () => void
}

const STATUS_MAP: Record<string, { symbol: string; color: string; srLabel: string }> = {
  active: { symbol: '●', color: 'var(--color-success)', srLabel: 'active project' },
  draft: { symbol: '◦', color: 'var(--color-warning)', srLabel: 'draft project' },
  review: { symbol: '⚠', color: 'var(--color-blue)', srLabel: 'project in review' },
  merged: { symbol: '✓', color: 'var(--color-blue)', srLabel: 'merged project' },
  done: { symbol: '✓', color: 'var(--color-muted)', srLabel: 'completed project' },
}

function statDisplay(value: number, fallback: string) {
  return value === 0 ? fallback : value.toString()
}

function projectActivityLevel(days: ContributionDay[]) {
  const recentTotal = days.slice(-7).reduce((sum, day) => sum + day.count, 0)
  return Math.min(10, recentTotal)
}

function statTileAria(label: string, value: number, fallback: string) {
  return value === 0 ? `${fallback} ${label}` : `${value} ${label}`
}

function MiniBar({ level }: { level: number }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-[3px]">
      {Array.from({ length: 6 }, (_, index) => {
        const filled = index < Math.ceil(level / 2)
        return (
          <span
            key={index}
            className="h-2 w-4 rounded-full"
            style={{
              background: filled ? 'var(--color-blue)' : 'var(--color-border)',
              opacity: filled ? 1 : 0.85,
            }}
          />
        )
      })}
    </div>
  )
}

function StatTile({
  value,
  label,
  fallback,
}: {
  value: number
  label: string
  fallback: string
}) {
  const display = statDisplay(value, fallback)
  return (
    <Card
      className="flex min-h-[132px] flex-col justify-between"
      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
    >
      <div
        role="img"
        aria-label={statTileAria(label, value, fallback)}
        className="flex h-full flex-col justify-between"
      >
        <div
          className="text-[13px] font-medium"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
        >
          ✦ {label}
        </div>
        <div
          className="mt-4 text-[28px] font-bold leading-tight"
          style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
        >
          {display}
        </div>
      </div>
    </Card>
  )
}

export function AggregateDashboard({ userId: _userId, userName, onCreateProject }: AggregateDashboardProps) {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectActivity, setProjectActivity] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const firstName = useMemo(() => userName.trim().split(' ')[0] || 'Researcher', [userName])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      try {
        const [statsRes, projectsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/projects'),
        ])

        const statsData = statsRes.ok ? (await statsRes.json() as DashboardStats) : null
        const projectsData = projectsRes.ok ? (await projectsRes.json() as ProjectSummary[]) : []

        if (cancelled) return

        setStats(statsData)
        setProjects(Array.isArray(projectsData) ? projectsData : [])

        if (!Array.isArray(projectsData) || projectsData.length === 0) {
          setProjectActivity({})
          return
        }

        const contributionRows = await Promise.all(
          projectsData.map(async (project) => {
            try {
              const response = await fetch(`/api/projects/${project.id}/contributions/me`)
              if (!response.ok) return [project.id, 0] as const
              const data = await response.json() as ContributionResponse
              return [project.id, projectActivityLevel(data.days)] as const
            } catch {
              return [project.id, 0] as const
            }
          })
        )

        if (!cancelled) setProjectActivity(Object.fromEntries(contributionRows))
      } catch (error) {
        if (!cancelled) console.error('[aggregate-dashboard]', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      aria-label="Your research activity summary"
      aria-busy={loading}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className="text-[30px] font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            Your Research Activity
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
          >
            A quiet record of the work you&apos;re doing, {firstName}.
          </p>
        </div>
        <Button onClick={onCreateProject}>✦ New Project</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile value={stats?.totalActions ?? 0} label="contributions" fallback="Nothing recorded yet ✦" />
        <StatTile value={stats?.activeProjects ?? 0} label="active projects" fallback="Open a project to begin ✦" />
        <StatTile value={stats?.currentStreak ?? 0} label="day streak" fallback="Start today ✦" />
      </div>

      <Card style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mb-5">
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            Past 16 weeks
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
          >
            Past 16 weeks across all your projects
          </p>
        </div>
        <ContributionHeatmap projectId={null} />
      </Card>

      <Card style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
            >
              Your Projects
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
            >
              Open any project to keep moving the work forward.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="skeleton h-[72px] rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div
            className="rounded-xl border px-5 py-6 text-sm"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            ✦ No projects yet — create one to get started
          </div>
        ) : (
          <div role="list" className="flex flex-col gap-3">
            {projects.map((project) => {
              const statusMeta = STATUS_MAP[project.status] ?? {
                symbol: '◦',
                color: 'var(--color-muted)',
                srLabel: 'project status unavailable',
              }
              const roleText = project.myRole === 'admin' ? '✦ admin' : '◦ member'

              return (
                <button
                  key={project.id}
                  type="button"
                  role="listitem"
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="flex min-h-[72px] items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                  style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="text-base"
                    style={{ color: statusMeta.color }}
                  >
                    {statusMeta.symbol}
                  </span>
                  <span className="sr-only">{statusMeta.srLabel}</span>

                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-semibold"
                      style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
                    >
                      {project.title}
                    </div>
                    <div
                      className="mt-1 text-xs"
                      style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      {projectActivity[project.id] && projectActivity[project.id] > 0
                        ? '✦ Activity in the last 7 days'
                        : '◦ Quiet this week'}
                    </div>
                  </div>

                  <MiniBar level={projectActivity[project.id] ?? 0} />

                  <span
                    className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: project.myRole === 'admin' ? 'var(--color-blue)' : 'var(--color-border-2)',
                      color: project.myRole === 'admin' ? 'var(--color-blue)' : 'var(--color-muted)',
                      background: project.myRole === 'admin' ? 'var(--color-blue-12)' : 'var(--color-surface)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {roleText}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Card>
    </section>
  )
}
