'use client'
// app/project/[id]/chat/page.tsx — Full-page Group Chat with @agent panel

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Avatar, Spinner, ToastProvider, useToast } from '../../../../components/ui'
import { ChatInput, Attachment } from '../../../../components/chat/ChatInput'
import { AgentPanel } from '../../../../components/chat/AgentPanel'
import { useAgentStore } from '../../../../store/agentStore'

interface Msg {
  id: string
  content: string
  userId: string
  userFullName: string
  userAvatarUrl?: string
  createdAt: Date
  attachments?: Attachment[]
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [flagged, setFlagged] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadTimeRef = useRef<Date>(new Date())
  const { error } = useToast()
  const { isOpen: agentPanelOpen, togglePanel, addItem } = useAgentStore()

  // Fetch project title
  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(p => setProjectTitle(p.title || 'Group Chat'))
      .catch(() => {})
  }, [id])

  // Load history from Postgres on mount
  useEffect(() => {
    fetch(`/api/projects/${id}/chat`)
      .then(r => r.json())
      .then((msgs: any[]) => {
        setMessages(msgs.map(m => ({
          id: m.id,
          content: m.content,
          userId: m.user_id,
          userFullName: m.user?.full_name || 'Unknown',
          userAvatarUrl: m.user?.avatar_url,
          createdAt: new Date(m.created_at),
          attachments: Array.isArray(m.attachments) ? m.attachments : [],
        })))
        loadTimeRef.current = new Date()
      })
      .catch(console.error)
  }, [id])

  // Subscribe to Firestore for real-time new messages
  useEffect(() => {
    const q = query(
      collection(db, 'projects', id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const d = change.doc.data()
          const createdAt = d.createdAt instanceof Timestamp
            ? d.createdAt.toDate()
            : new Date(d.createdAt)
          // Only add if it's newer than page load (to avoid duplicating Postgres history)
          if (createdAt > loadTimeRef.current) {
            const msg: Msg = {
              id: change.doc.id,
              content: d.content,
              userId: d.userId,
              userFullName: d.userFullName,
              userAvatarUrl: d.userAvatarUrl,
              createdAt,
            }
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev
              return [...prev, msg]
            })
          }
        }
      })
    })
    return () => unsub()
  }, [id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessageContent(content: string, attachments: Attachment[] = []) {
    if (!content.trim() && attachments.length === 0) return
    if (sending || !user) return
    setSending(true)
    setFlagged('')
    try {
      const res = await fetch(`/api/projects/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachments }),
      })
      if (res.status === 422) {
        const data = await res.json()
        setFlagged(data.message)
        return
      }
      if (!res.ok) throw new Error()

      const saved = await res.json()

      await addDoc(collection(db, 'projects', id, 'messages'), {
        content,
        attachments,
        userId: user.id,
        userFullName: user.fullName || user.firstName || 'Unknown',
        userAvatarUrl: user.imageUrl || null,
        createdAt: serverTimestamp(),
      })

      setMessages(prev => [...prev, {
        id: saved.id,
        content,
        attachments,
        userId: user.id,
        userFullName: user.fullName || user.firstName || 'Unknown',
        userAvatarUrl: user.imageUrl,
        createdAt: new Date(),
      }])
    } catch { error("Couldn't send — your message is still here. Try again.") }
    finally { setSending(false) }
  }

  async function handleAgentAction(message: string, action: string, attachments: Attachment[] = []) {
    try {
      const res = await fetch(`/api/projects/${id}/chat/agent-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, action, attachments }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Agent action failed')
      addItem(data)
    } catch (e: any) {
      error(e.message || 'Agent action failed')
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending || !user) return
    const content = input
    setInput('')
    await sendMessageContent(content)
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
    { label: 'LaTeX', href: `/project/${id}/latex` },
  ]

  return (
    <>
      <ToastProvider />
      <div className="flex flex-col h-screen overflow-hidden">
        <PageHeader
          title={projectTitle}
          subtitle="Group Chat"
          tabs={tabs}
          activeTab={tabs[1].href}
          actions={
            <button
              type="button"
              onClick={togglePanel}
              aria-label={agentPanelOpen ? 'Close AI agent panel' : 'Open AI agent panel'}
              aria-expanded={agentPanelOpen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                agentPanelOpen
                  ? 'bg-[#7c6af5] text-white border-[#7c6af5]'
                  : 'bg-[#1a1f2e] text-[#7a839a] border-[#252a38] hover:text-[#e8eaf0]'
              }`}
            >
              <span aria-hidden="true">🤖</span> Agent Panel
            </button>
          }
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden max-w-3xl w-full mx-auto px-4 pb-4 pt-6">
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              aria-relevant="additions"
            >
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                  <div className="w-14 h-14 rounded-2xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#e8eaf0]">No messages yet</p>
                  <p className="text-xs text-[#3d4558]">Start the team conversation! Type <span className="text-[#7c6af5] font-mono">@agent</span> for AI actions.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.userId === user?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                      aria-label={`${isMe ? 'You' : msg.userFullName}: ${msg.content}`}
                    >
                      <Avatar name={msg.userFullName} src={msg.userAvatarUrl} size={32} className="flex-shrink-0" />
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2">
                          {!isMe && <p className="text-xs font-medium text-[#7a839a]">{msg.userFullName}</p>}
                          <p className="text-[10px] text-[#3d4558]">
                            {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                          ? 'bg-[#4f8ef7] text-white rounded-tr-sm'
                          : 'bg-[#1a1f2e] text-[#c8cad0] rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {msg.attachments.map((att, i) =>
                              att.type === 'image' ? (
                                <img
                                  key={i}
                                  src={att.url}
                                  alt={att.fileName}
                                  className="max-w-[200px] max-h-[160px] rounded-xl object-cover border border-[#252a38]"
                                />
                              ) : (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1018] border border-[#252a38] text-[#7a839a] hover:text-[#e8eaf0] text-xs transition-colors"
                                >
                                  <span>{att.type === 'pdf' ? '📄' : '📊'}</span>
                                  <span className="max-w-[120px] truncate">{att.fileName}</span>
                                </a>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {flagged && (
              <p className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl px-4 py-2.5 mb-3">
                ⚠ {flagged}
              </p>
            )}

            <ChatInput
              onSend={sendMessageContent}
              onAgentAction={handleAgentAction}
              sending={sending}
              placeholder="Message the team… (type @agent for AI actions)"
            />
          </div>

          <AgentPanel
            projectId={id}
            onShareToChat={async (result, action) => {
              await sendMessageContent(`🤖 Agent (${action}):\n\n${result}`)
            }}
          />
        </div>
      </div>
    </>
  )
}
