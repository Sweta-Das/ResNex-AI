'use client'
// components/layout/PageHeader.tsx

import React from 'react'
import { useRouter } from 'next/navigation'
import { StatusPill } from '../ui'

interface Tab { label: string; href: string; icon?: string }

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
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
                  activeTab === tab.href
                    ? 'text-[#4f8ef7] border-[#4f8ef7]'
                    : 'text-[#7a839a] border-transparent hover:text-[#e8eaf0] hover:border-[#2e3548]'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
