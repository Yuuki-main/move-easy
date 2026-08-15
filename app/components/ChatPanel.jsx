'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

export default function ChatPanel({ conversationId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const supabase = createClient()

  // Initial fetch
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[ChatPanel] Fetch failed:', error)
      } else {
        setMessages(data ?? [])
      }
      setLoading(false)
    }

    fetchMessages()
  }, [conversationId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return

    setSending(true)
    setText('')

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: body,
    })

    if (error) {
      toast.error('Failed to send message')
      setText(body) // restore text on failure
    }

    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[420px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-sm text-gray-800">Messages</p>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-10">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isMine
                      ? 'bg-teal-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <p className="leading-relaxed">{m.content}</p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      isMine ? 'text-teal-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg px-3.5 py-2.5 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
