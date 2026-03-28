import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  sendChatMessage,
  confirmAction,
  fetchAISettings,
  updateAISettings,
  type ChatMessage,
  type AIAction,
} from '@/api/ai'
import {
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: AIAction | null
  result?: { success: boolean; message: string; session_id?: string } | null
  pending?: boolean
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: "Hey! How's your day going? I'm your workout assistant — I can create sessions, look up your history, or help plan your next workout. What can I do for you?",
}

const STORAGE_KEY = 'ai-chat-messages'

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Message[]
      if (parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return [GREETING]
}

interface AISidebarProps {
  onSessionCreated?: (sessionId: string) => void
  onSessionDeleted?: () => void
}

export default function AISidebar({ onSessionCreated, onSessionDeleted }: AISidebarProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [toggling, setToggling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAISettings()
      .then((s) => setAiEnabled(s.ai_enabled))
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleToggleAI = async () => {
    setToggling(true)
    try {
      const result = await updateAISettings(!aiEnabled)
      setAiEnabled(result.ai_enabled)
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    // Build chat history for context
    const chatHistory: ChatMessage[] = messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role, content: m.content }))
    chatHistory.push({ role: 'user', content: text })

    try {
      const response = await sendChatMessage(chatHistory)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        action: response.action,
        result: response.result,
      }
      setMessages((prev) => [...prev, assistantMsg])

      // If a session was created, notify parent
      if (response.result?.success && response.result.session_id) {
        onSessionCreated?.(response.result.session_id)
      }
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleConfirm = async (msg: Message) => {
    if (!msg.action) return
    setSending(true)
    try {
      const result = await confirmAction(msg.action.type, msg.action.session_id)
      // Update the message with the result
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                result,
                action: m.action ? { ...m.action, requires_confirmation: false } : null,
              }
            : m
        )
      )
      // Notify parent so pages refresh
      if (result.success && msg.action.type === 'delete_session') {
        onSessionDeleted?.()
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                result: {
                  success: false,
                  message: err instanceof Error ? err.message : 'Failed to confirm',
                },
              }
            : m
        )
      )
    } finally {
      setSending(false)
    }
  }

  const handleDismiss = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.action
          ? {
              ...m,
              action: { ...m.action, requires_confirmation: false },
              result: { success: false, message: 'Action cancelled' },
            }
          : m
      )
    )
  }

  const chatContent = (
    <div className="flex h-full flex-col">
      {/* Header with settings */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warm/10">
            <Sparkles className="h-3.5 w-3.5 text-warm" />
          </div>
          <span className="font-heading text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI Features</p>
              <p className="text-xs text-muted-foreground">
                {aiEnabled ? 'AI assistant is active' : 'AI assistant is disabled'}
              </p>
            </div>
            <button
              onClick={handleToggleAI}
              disabled={toggling}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                aiEnabled ? 'bg-warm' : 'bg-secondary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  aiEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-warm text-white'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Confirmation dialog */}
                {msg.action?.requires_confirmation && !msg.result && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Confirmation required
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This will {msg.action.type.replace('_', ' ')}
                      {msg.action.session_id
                        ? ` (${msg.action.session_id.slice(0, 8)}...)`
                        : ''}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-warm text-xs text-white hover:bg-warm/90"
                        onClick={() => handleConfirm(msg)}
                        disabled={sending}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleDismiss(msg.id)}
                        disabled={sending}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action result — skip for info actions (same text as bubble) */}
                {msg.result && msg.action?.type !== 'info' && (
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                      msg.result.success ? 'text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {msg.result.success ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {msg.result.message}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            {/* Quick suggestions after greeting */}
            {messages.length === 1 && messages[0].id === 'greeting' && (
              <div className="space-y-1.5 pt-1">
                {[
                  'Create a push day workout',
                  'Start a leg session with squats',
                  'What did I do last workout?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="block w-full rounded-lg border border-border/50 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-warm/30 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-3">
        {!aiEnabled ? (
          <p className="text-center text-xs text-muted-foreground">
            AI is disabled. Enable it in settings above.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workouts..."
              className="flex-1 rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-warm/30 focus:ring-1 focus:ring-warm/20"
              disabled={sending}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 w-9 shrink-0 bg-warm p-0 text-white hover:bg-warm/90"
              disabled={!input.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Floating toggle button — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-warm shadow-lg shadow-warm/20 text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-warm/30"
      >
        <Bot className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-full p-0 sm:max-w-[380px]">
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
            <SheetDescription>Chat with your workout AI assistant</SheetDescription>
          </SheetHeader>
          {chatContent}
        </SheetContent>
      </Sheet>
    </>
  )
}
