'use client'
// components/layout/PageHeader.tsx

import React from 'react'
import { useRouter } from 'next/navigation'
import { StatusPill } from '../ui'

interface Tab { label: string; href: string; icon?: string }

// Canonical tab order — import this wherever you need the project tab list
export const PROJECT_TABS = (id: string) => [
  { id: 'overview',  label: 'Overview',  href: `/project/${id}`            },
  { id: 'reflect',   label: 'Reflect',   href: `/project/${id}/reflect`    },
  { id: 'chat',      label: 'Chat',      href: `/project/${id}/chat`       },
  { id: 'discover',  label: 'Discover',  href: `/project/${id}/discover`   },
  { id: 'library',   label: 'Library',   href: `/project/${id}/library`    },
  { id: 'compare',   label: 'Compare',   href: `/project/${id}/compare`    },
  { id: 'agents',    label: 'Agents',    href: `/project/${id}/agents`     },
  { id: 'review',    label: 'Review',    href: `/project/${id}/review`     },
  { id: 'output',    label: 'Output',    href: `/project/${id}/output`     },
  { id: 'latex',     label: 'LaTeX',     href: `/project/${id}/latex`      },
] as const

interface PageHeaderProps {
  title: string
  subtitle?: string
  status?: string
  tabs?: Tab[]
  activeTab?: string
  actions?: React.ReactNode
  back?: string
}

export function PageHeader({ title, subtitle, status, tabs, activeTab, actions, back }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-[#0d1018] border-b border-[#1a1f2e]">
      <div className="px-8 pt-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {back && (
              <button
                onClick={() => router.push(back)}
                className="mt-1 text-[#7a839a] hover:text-[#e8eaf0] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-[#e8eaf0]">{title}</h1>
                {status && <StatusPill status={status} />}
              </div>
              {subtitle && <p className="text-sm text-[#7a839a]">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {tabs && (
          <div
            className="hide-scrollbar -mb-px"
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <nav aria-label="Page sections">
              <div role="tablist" className="flex items-center gap-1">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.href
                  return (
                    <button
                      key={tab.href}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => router.push(tab.href)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'text-[#4f8ef7] border-[#4f8ef7]'
                          : 'text-[#7a839a] border-transparent hover:text-[#e8eaf0] hover:border-[#2e3548]'
                      }`}
                    >
                      {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
