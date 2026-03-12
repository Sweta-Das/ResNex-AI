'use client'
// components/layout/Sidebar.tsx

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import { Avatar, StatusPill, Button, Spinner } from '../ui'
import { Project } from '../../types'

interface SidebarProps {
  projects: Project[]
  loading?: boolean
  selectedId?: string
  onSelect: (id: string) => void
  onCreateProject: () => void
  myRole?: Record<string, string>
}

export function Sidebar({ projects, loading, selectedId, onSelect, onCreateProject, myRole = {} }: SidebarProps) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  const STATUS_MAP: Record<string, { symbol: string; color: string }> = {
    active:    { symbol: '●', color: 'var(--color-success)' },
    draft:     { symbol: '◦', color: 'var(--color-muted)'   },
    review:    { symbol: '⚠', color: 'var(--color-warning)' },
    merged:    { symbol: '✓', color: 'var(--color-green)'   },
    done:      { symbol: '✓', color: 'var(--color-green)'   },
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col bg-[#0d1018] border-r border-[#1a1f2e]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#1a1f2e]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4f8ef7] to-[#7c6af5] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-bold text-[#e8eaf0] text-sm tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            ResearchCollab
          </span>
        </div>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#3d4558] uppercase tracking-widest">Projects</span>
          <button
            type="button"
            onClick={onCreateProject}
            aria-label="Create new project"
            className="touch-target-expand w-5 h-5 rounded flex items-center justify-center text-[#7a839a] hover:text-[#4f8ef7] hover:bg-[#4f8ef7]/10 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={16} />
          </div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-[#3d4558]">No projects yet.</p>
            <button onClick={onCreateProject} className="text-xs text-[#4f8ef7] mt-1 hover:underline">
              Create your first
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-2">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                aria-current={selectedId === p.id ? 'page' : undefined}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group animate-fade-up delay-${Math.min(i + 1, 5)}`}
                style={{
                  background: selectedId === p.id ? 'rgba(79,142,247,0.1)' : 'transparent',
                  border: selectedId === p.id ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-medium truncate ${selectedId === p.id ? 'text-[#e8eaf0]' : 'text-[#7a839a] group-hover:text-[#e8eaf0]'} transition-colors`}>
                    {p.title}
                  </span>
                  {(() => {
                    const s = STATUS_MAP[p.status] ?? STATUS_MAP.draft
                    return (
                      <>
                        <span aria-hidden="true" className="flex-shrink-0 ml-2 text-[10px]" style={{ color: s.color }}>{s.symbol}</span>
                        <span className="sr-only">{p.status}</span>
                      </>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] capitalize ${selectedId === p.id ? 'text-[#4f8ef7]' : 'text-[#3d4558]'}`}>
                    {p.status}
                  </span>
                  {myRole[p.id] === 'admin' && (
                    <span className="text-[9px] bg-[#4f8ef7]/10 text-[#4f8ef7] px-1 py-0.5 rounded font-medium">
                      admin
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-[#1a1f2e]">
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName || user?.firstName || 'User'} src={user?.imageUrl} size={30} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#e8eaf0] truncate">{user?.fullName || user?.firstName}</p>
            <p className="text-[10px] text-[#3d4558] truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut(() => router.push('/login'))}
            aria-label="Sign out"
            className="touch-target-expand text-[#3d4558] hover:text-[#ef4444] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
