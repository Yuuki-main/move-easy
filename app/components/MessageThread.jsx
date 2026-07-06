'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MessageThread({ jobId, currentUserId, receiverId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
      setLoading(false)
    }

    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        },
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [jobId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim()) return
    const body = text.trim()
    setText('')
    await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: currentUserId,
      receiver_id: receiverId,
      body,
    })
  }

  return (
    <div className="bg-white rounded-xl border flex flex-col h-96">
      <div className="px-4 py-3 border-b font-semibold text-sm">Messages</div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">
            No messages yet.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.body}
                <p
                  className={`text-[10px] mt-1 ${m.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-400'}`}
                >
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={send}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}

// 'use client'
// import { useState, useEffect, useRef, useCallback } from 'react'

// export default function MessageThread({ jobId, currentUserId, receiverId }) {
//   const [messages, setMessages] = useState([])
//   const [text, setText] = useState('')
//   const [loading, setLoading] = useState(true)
//   const bottomRef = useRef(null)

//   const fetchMessages = useCallback(async () => {
//     const res = await fetch(`/api/messages/${jobId}`)
//     const data = await res.json()
//     setMessages(data.messages ?? [])
//     setLoading(false)
//   }, [jobId])

//   useEffect(() => {
//     let active = true

//     const load = async () => {
//       const res = await fetch(`/api/messages/${jobId}`)
//       const data = await res.json()
//       if (active) {
//         setMessages(data.messages ?? [])
//         setLoading(false)
//       }
//     }

//     load()
//     const interval = setInterval(load, 10000) // poll every 10s

//     return () => {
//       active = false
//       clearInterval(interval)
//     }
//   }, [jobId])

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages])

//   const send = async () => {
//     if (!text.trim()) return
//     const body = text
//     setText('')
//     await fetch('/api/messages/send', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ jobId, receiverId, body }),
//     })
//     fetchMessages()
//   }

//   return (
//     <div className="bg-white rounded-xl border flex flex-col h-96">
//       <div className="px-4 py-3 border-b font-semibold text-sm">Messages</div>
//       <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
//         {loading ? (
//           <p className="text-xs text-gray-400 text-center">Loading...</p>
//         ) : messages.length === 0 ? (
//           <p className="text-xs text-gray-400 text-center py-10">
//             No messages yet. Say hello!
//           </p>
//         ) : (
//           messages.map((m) => (
//             <div
//               key={m.id}
//               className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
//             >
//               <div
//                 className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
//                   m.sender_id === currentUserId
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-gray-100 text-gray-800'
//                 }`}
//               >
//                 {m.body}
//                 <p
//                   className={`text-[10px] mt-1 ${m.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-400'}`}
//                 >
//                   {new Date(m.created_at).toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}
//                 </p>
//               </div>
//             </div>
//           ))
//         )}
//         <div ref={bottomRef} />
//       </div>
//       <div className="border-t p-3 flex gap-2">
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && send()}
//           placeholder="Type a message..."
//           className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <button
//           onClick={send}
//           className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   )
// }
