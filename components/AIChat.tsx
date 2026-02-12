'use client'

import { useState } from 'react'

export default function AIChat() {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! I\'m here to help answer your questions about Warmchain. What would you like to know?' }
  ])
  const [chatInput, setChatInput] = useState('')

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setChatInput('')

    setTimeout(() => {
      const response = getAIResponse(userMessage)
      setChatMessages(prev => [...prev, { role: 'assistant', text: response }])
    }, 1000)
  }

  const getAIResponse = (question: string) => {
    const q = question.toLowerCase()
    
    if (q.includes('cost') || q.includes('price') || q.includes('free')) {
      return "Warmchain is currently free during our beta phase! No credit card required. We plan to introduce paid plans in the future, but the core profile creation will remain free."
    }
    if (q.includes('how') && (q.includes('work') || q.includes('use'))) {
      return "It's simple: (1) Create your profile in ~10 minutes. (2) Get a shareable link like warmchain.com/yourname. (3) Share that link when asking for intros. That's it!"
    }
    if (q.includes('who') || q.includes('for')) {
      return "Warmchain is for founders raising capital, hiring cofounders, finding partners, or getting customers. If you need warm intros, Warmchain is for you."
    }
    if (q.includes('profile') || q.includes('create')) {
      return "Creating a profile takes less than 10 minutes. Just fill out 7 fields: company name, one-liner, stage, traction, ask, team, and links. No design work needed!"
    }
    if (q.includes('private') || q.includes('secure') || q.includes('data')) {
      return "Your profile is private by default—only people you share the link with can see it. We use industry-standard encryption and never sell your data."
    }
    
    return "Hey buddy — great question. The founders forgot to connect me to any APIs, so I'm basically unemployed right now. Ping support@warmchain.co and a human will save the day. Cheers!"
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="group relative px-6 py-4 bg-emerald-500 text-black font-bold rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-3"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span>Ask AI Assistant</span>
        </button>
      )}

      {chatOpen && (
        <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-96 max-h-[600px] flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-green-500/10">
            <div>
              <h3 className="font-bold text-lg">AI Assistant</h3>
              <p className="text-sm text-gray-400">Ask me anything about Warmchain</p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-white/5 text-white border border-white/10'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-3 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}