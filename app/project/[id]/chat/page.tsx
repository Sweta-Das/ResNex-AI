'use client'
// app/project/[id]/chat/page.tsx — Full-page Group Chat (Firebase Firestore real-time)

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Avatar, Spinner, ToastProvider, useToast } from '../../../../components/ui'

interface Msg {
  id: string
  content: string
  userId: string
  userFullName: string
  userAvatarUrl?: string
  createdAt: Date
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending || !user) return
    setSending(true)
    setFlagged('')
    const content = input
    setInput('')
    try {
      // 1. Moderate + save to Postgres
      const res = await fetch(`/api/projects/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.status === 422) {
        const data = await res.json()
        setFlagged(data.message)
        setInput(content)
        return
      }
      if (!res.ok) throw new Error()

      const saved = await res.json()

      // 2. Broadcast to Firestore for real-time delivery to other users
      await addDoc(collection(db, 'projects', id, 'messages'), {
        content,
        userId: user.id,
        userFullName: user.fullName || user.firstName || 'Unknown',
        userAvatarUrl: user.imageUrl || null,
        createdAt: serverTimestamp(),
      })

      // 3. Show immediately for sender (don't wait for Firestore snapshot)
      setMessages(prev => [...prev, {
        id: saved.id,
        content,
        userId: user.id,
        userFullName: user.fullName || user.firstName || 'Unknown',
        userAvatarUrl: user.imageUrl,
        createdAt: new Date(),
      }])
    } catch { error('Failed to send message'); setInput(content) }
    finally { setSending(false) }
  }

  const tabs = [
    { label: 'Overview', href: `/project/${id}` },
    { label: 'Chat', href: `/project/${id}/chat` },
    { label: 'Workspace', href: `/project/${id}/workspace` },
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
        />

        <div className="flex-1 flex flex-col overflow-hidden max-w-3xl w-full mx-auto px-4 pb-4 pt-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-14 h-14 rounded-2xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#e8eaf0]">No messages yet</p>
                <p className="text-xs text-[#3d4558]">Start the team conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === user?.id
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
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

          <form onSubmit={sendMessage} className="flex gap-3 items-end">
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setFlagged('') }}
              placeholder="Message the team..."
              className="flex-1 bg-[#1a1f2e] border border-[#252a38] rounded-2xl px-4 py-3 text-sm
                text-[#e8eaf0] placeholder:text-[#3d4558] focus:outline-none focus:border-[#4f8ef7] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-2xl bg-[#4f8ef7] hover:bg-[#3d7de8] disabled:opacity-40
                flex items-center justify-center transition-all flex-shrink-0"
            >
              {sending ? <Spinner size={14} color="white" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
