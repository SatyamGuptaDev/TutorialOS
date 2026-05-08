'use client'

import { useState, useRef, useEffect } from 'react'
import { AIClient } from '@/lib/ai/AIClient'
import { loadKey } from '@/lib/ai/keyStore'
import { useAuthStore } from '@/stores/authStore'
import { useStudioStore } from '@/stores/studioStore'
import { db } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, Sparkles, Settings2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import type { AIProvider } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AIPanel() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const currentSession = useStudioStore((s) => s.currentSession)
  const sessionId = currentSession?.id || 'default'
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [client, setClient] = useState<AIClient | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize client
  useEffect(() => {
    async function initAI() {
      if (!user) return
      
      const providers: AIProvider[] = ['openai', 'gemini', 'claude', 'groq', 'mistral']
      let activeClient = null

      for (const p of providers) {
        const key = await loadKey(p)
        if (key) {
          activeClient = new AIClient({
            provider: p,
            apiKey: key,
            model: '', 
            enabled: true,
          })
          break
        }
      }

      if (activeClient) {
        setClient(activeClient)
      }
    }
    initAI()
  }, [user])

  // Handle external AI queries (from context menu or slash menu)
  useEffect(() => {
    const handleExternalQuery = (e: any) => {
      const text = e.detail?.text
      if (text) {
        setInput(`Explain this part of my notes: "${text}"`)
        // Auto-send if it's a specific query
        setTimeout(() => {
          const btn = document.getElementById('ai-send-button')
          btn?.click()
        }, 100)
      } else {
        setInput('')
      }
    }

    window.addEventListener('ai-panel-query', handleExternalQuery)
    return () => window.removeEventListener('ai-panel-query', handleExternalQuery)
  }, [])

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`ai_chat_${sessionId}`)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse chat history', e)
      }
    } else {
      setMessages([])
    }
  }, [sessionId])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_chat_${sessionId}`, JSON.stringify(messages))
    } else {
      localStorage.removeItem(`ai_chat_${sessionId}`)
    }
  }, [messages, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !client) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Sliding window: last 10 messages for context
      const historyWindow = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await client.complete({
        prompt: userMessage.content,
        systemPrompt: 'You are TutorialOS AI, a helpful learning assistant. Provide clear, concise answers. Format with Markdown.',
        messages: historyWindow,
      })

      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response }
      setMessages((prev) => [...prev, aiMessage])
    } catch (e: any) {
      toast.error('AI response failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    localStorage.removeItem(`ai_chat_${sessionId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[var(--color-text-muted)]">
        <Sparkles className="h-8 w-8 mb-3 opacity-50" />
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">AI Not Configured</h3>
        <p className="text-xs mb-4">Please set up an AI provider in Settings to use the learning assistant.</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
          <Settings2 className="h-4 w-4 mr-2" />
          Configure AI
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-l border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 text-[var(--color-text)] font-medium text-sm">
          <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
          Learning Assistant
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear} title="Clear chat">
          <Trash2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--color-text-muted)] space-y-2 opacity-50">
            <Sparkles className="h-8 w-8 mb-2" />
            <p className="text-sm">How can I help you learn today?</p>
            <p className="text-xs max-w-[200px]">Ask questions, request summaries, or generate flashcards from your notes.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex flex-col gap-1 max-w-[90%]',
                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              )}
            >
              <div
                className={cn(
                  'px-3 py-2 rounded-lg text-sm prose prose-sm dark:prose-invert',
                  m.role === 'user'
                    ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-bl-sm border border-[var(--color-border-subtle)]'
                )}
              >
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs mr-auto bg-[var(--color-surface-2)] px-3 py-2 rounded-lg rounded-bl-sm border border-[var(--color-border-subtle)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border-subtle)]">
        <div className="relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI..."
            className="pr-10 rounded-full bg-[var(--color-surface-2)] border-[var(--color-border-subtle)] focus-visible:ring-1"
            disabled={isLoading}
          />
          <Button
            id="ai-send-button"
            size="icon"
            variant="ghost"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1 h-7 w-7 rounded-full text-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
