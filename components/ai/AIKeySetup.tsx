'use client'

import { useState, useEffect } from 'react'
import { AIProvider } from '@/types'
import { saveKey, loadKey, deleteKey, hasKey } from '@/lib/ai/keyStore'
import { AIClient } from '@/lib/ai/AIClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROVIDERS: { id: AIProvider; name: string; url: string; models: string[] }[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/app/apikey',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'],
  },
  {
    id: 'groq',
    name: 'Groq',
    url: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama3-8b-8192'],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    url: 'https://console.anthropic.com/settings/keys',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    url: 'https://console.mistral.ai/api-keys/',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
  },
]

export function AIKeySetup({ onSetupComplete }: { onSetupComplete?: () => void }) {
  const [activeProvider, setActiveProvider] = useState<AIProvider>('openai')
  const [keyInput, setKeyInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [hasExistingKey, setHasExistingKey] = useState(false)

  const provider = PROVIDERS.find((p) => p.id === activeProvider)!

  useEffect(() => {
    setSelectedModel(provider.models[0])
    setKeyInput('')
    setTestResult(null)
    
    // Check if key exists
    hasKey(activeProvider).then(setHasExistingKey)
  }, [activeProvider, provider])

  const handleTest = async () => {
    if (!keyInput.trim() && !hasExistingKey) return

    setIsTesting(true)
    setTestResult(null)

    // If keyInput is empty but we have an existing key, we must load it first to test
    let keyToTest = keyInput.trim()
    if (!keyToTest && hasExistingKey) {
       const stored = await loadKey(activeProvider)
       if (stored) keyToTest = stored
    }

    const client = new AIClient({
      provider: activeProvider,
      apiKey: keyToTest,
      model: selectedModel,
      enabled: true,
    })

    const res = await client.testConnection()
    setIsTesting(false)

    if (res.success) {
      setTestResult({ success: true, message: 'Connection successful!' })
    } else {
      setTestResult({ success: false, message: res.error || 'Connection failed' })
    }
  }

  const handleSave = async () => {
    if (!keyInput.trim() && !hasExistingKey) return
    
    setIsSaving(true)
    try {
      if (keyInput.trim()) {
        await saveKey(activeProvider, keyInput.trim())
        setHasExistingKey(true)
      }
      
      // We also need to save the selected model and active provider to UserSettings
      // For simplicity in this component, we just fire the callback. The parent (Settings) can save the provider preference.
      toast.success(`${provider.name} key saved securely`)
      setKeyInput('')
      onSetupComplete?.()
    } catch (e) {
      toast.error('Failed to save key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteKey(activeProvider)
    setHasExistingKey(false)
    setKeyInput('')
    setTestResult(null)
    toast.success(`${provider.name} key deleted`)
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden flex flex-col md:flex-row">
      {/* Tabs */}
      <div className="w-full md:w-48 bg-[var(--color-surface-2)] border-r border-[var(--color-border)] flex flex-row md:flex-col overflow-x-auto">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProvider(p.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium text-left whitespace-nowrap md:whitespace-normal transition-colors focus-ring outline-none',
              activeProvider === p.id
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] border-b-2 md:border-b-0 md:border-r-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">{provider.name} Setup</h3>
            <a
              href={provider.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 focus-ring rounded"
            >
              Get API key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Configure your {provider.name} API key. We recommend using {provider.models[0]} for best results.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text)]">API Key</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={hasExistingKey ? '•••••••••••••••••••••••• (Key saved)' : 'Enter API key...'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-ring rounded-sm p-0.5"
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text)]">Model Selection</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-text)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
            >
              {provider.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {testResult && (
            <div
              className={cn(
                'text-sm p-3 rounded-md flex items-start gap-2',
                testResult.success
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={(!keyInput && !hasExistingKey) || isTesting}
              className="flex-1"
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={(!keyInput && !hasExistingKey) || isSaving}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Key'}
            </Button>
            {hasExistingKey && (
              <Button variant="destructive" onClick={handleDelete} className="px-3" title="Delete key">
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 bg-[var(--color-surface-2)] p-3 rounded-md flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔒</span>
          <p className="text-xs text-[var(--color-text-muted)]">
            Your API keys are stored locally on this device only. They are encrypted using AES-GCM and never sent to TutorialOS servers.
          </p>
        </div>
      </div>
    </div>
  )
}
