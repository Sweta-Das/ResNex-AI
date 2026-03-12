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

const skeletonDays = Array.from({ length: 392 }, (_, index) => index)
const DAY_MS = 24 * 60 * 60 * 1000

function buildEmptyResponse(): ContributionResponse {
  const today = new Date()
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 391 * DAY_MS)

  return {
    days: Array.from({ length: 392 }, (_, index) => {
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
  if (count >= 11) return '#39d353'
  if (count >= 6)  return '#26a641'
  if (count >= 3)  return '#006d32'
  if (count >= 1)  return '#0e4429'
  return '#161b22'
}

const LEGEND_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']

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

  const activeDays = data?.totalActiveDays ?? 0

  return (
    <section
      className="rounded-xl border p-3"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-2">
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
          Past 56 weeks · {activeDays} active day{activeDays === 1 ? '' : 's'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 10px)', gridAutoFlow: 'column', gap: 3 }}>
        {(loading ? skeletonDays : data?.days ?? []).map((day, index) => {
          if (loading) {
            return (
              <div
                key={index}
                style={{ width: 10, height: 10, borderRadius: 2, background: '#161b22', border: '1px solid rgba(255,255,255,0.05)' }}
              />
            )
          }
          const item = day as ContributionDay
          return (
            <div
              key={item.date}
              style={{ width: 10, height: 10, borderRadius: 2, background: getHeatmapColor(item.count), border: '1px solid rgba(255,255,255,0.05)' }}
            />
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>Less</span>
        {LEGEND_COLORS.map((color) => (
          <div key={color} style={{ width: 8, height: 8, borderRadius: 2, background: color, border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>More</span>
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
