'use client'

import { useEffect, useState } from 'react'

type ContributionDay = {
  date: string
  count: number
}

type ContributionResponse = {
  days: ContributionDay[]
  currentStreak: number
  totalActiveDays: number
}

type ContributionHeatmapProps = {
  projectId: string | null
}

const skeletonDays = Array.from({ length: 112 }, (_, index) => index)
const DAY_MS = 24 * 60 * 60 * 1000

function buildEmptyResponse(): ContributionResponse {
  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 111 * DAY_MS)

  return {
    days: Array.from({ length: 112 }, (_, index) => {
      const date = new Date(start.getTime() + index * DAY_MS)
      return {
        date: date.toISOString().slice(0, 10),
        count: 0,
      }
    }),
    currentStreak: 0,
    totalActiveDays: 0,
  }
}

function getHeatmapColor(count: number) {
  if (count >= 10) return 'var(--color-heatmap-4)'
  if (count >= 6) return 'var(--color-heatmap-3)'
  if (count >= 3) return 'var(--color-heatmap-2)'
  if (count >= 1) return 'var(--color-heatmap-1)'
  return 'var(--color-heatmap-0)'
}

export function ContributionHeatmap({ projectId }: ContributionHeatmapProps) {
  const [data, setData] = useState<ContributionResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadContributions() {
      setLoading(true)
      try {
        const url = projectId
          ? `/api/projects/${projectId}/contributions/me`
          : '/api/dashboard/contributions'
        const response = await fetch(url)
        if (!response.ok) {
          if (!cancelled) setData(buildEmptyResponse())
          return
        }

        const payload = await response.json() as ContributionResponse
        if (!cancelled) setData(payload)
      } catch (error) {
        if (!cancelled) {
          console.warn('[contribution-heatmap] using zero-state fallback:', error)
          setData(buildEmptyResponse())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadContributions()

    return () => {
      cancelled = true
    }
  }, [projectId])

  return (
    <section
      className="rounded-xl border p-3"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
          >
            Your Contributions
          </p>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
          >
            Past 16 weeks · {data?.totalActiveDays ?? 0} active day{(data?.totalActiveDays ?? 0) === 1 ? '' : 's'}
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-1.5 text-right"
          style={{
            background: 'linear-gradient(135deg, var(--color-violet-14), var(--color-violet-20))',
            borderColor: 'var(--color-blue-26)',
          }}
        >
          <div
            className="text-base font-bold leading-none"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}
          >
            {data?.currentStreak ?? 0}
          </div>
          <div
            className="mt-0.5 text-[11px]"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
          >
            day streak
          </div>
        </div>
      </div>

      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: 'repeat(16, 8px)' }}
      >
        {(loading ? skeletonDays : data?.days ?? []).map((day, index) => {
          if (loading) {
            return <div key={index} className="skeleton rounded-[2px]" style={{ width: 8, height: 8 }} />
          }

          const item = day as ContributionDay
          const title = item.count > 0
            ? `${item.count} contribution(s) on ${item.date}`
            : `No activity on ${item.date}`

          return (
            <div
              key={item.date}
              title={title}
              className="rounded-[2px]"
              style={{ width: 8, height: 8, background: getHeatmapColor(item.count) }}
            />
          )
        })}
      </div>

      <div
        className="mt-2 rounded-lg border px-3 py-1.5 text-[11px]"
        style={{
          background: 'var(--color-green-07)',
          borderColor: 'var(--color-green-19)',
          color: 'var(--color-green)',
          fontFamily: 'var(--font-body)',
        }}
      >
        ✦ Every commit, comment, and edit counts. Research is built in small steps.
      </div>
    </section>
  )
}
