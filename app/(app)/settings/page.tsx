'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettings, ensureDefaultSettings } from '@/lib/db/hooks'
import { saveSettings } from '@/lib/db/mutations'
import { useTheme } from 'next-themes'
import { exportFullBackup } from '@/lib/export'
import { useAppStore } from '@/stores/appStore'
import { useSyncStore } from '@/stores/syncStore'
import { AIKeySetup } from '@/components/ai/AIKeySetup'
import { Button } from '@/components/ui/button'
import { ImportModal } from '@/components/studio/ImportModal'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Palette,
  Layout,
  Cloud,
  Sparkles,
  Database,
  Keyboard,
  User,
  Monitor,
  Moon,
  Sun,
  Loader2,
  Download,
  Upload
} from 'lucide-react'
import type { UserSettings, AccentColor, EditorMode } from '@/types'

type Tab = 'appearance' | 'editor' | 'sync' | 'ai' | 'data' | 'shortcuts' | 'account'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: Layout },
  { id: 'sync', label: 'Cloud Sync', icon: Cloud },
  { id: 'ai', label: 'AI Provider', icon: Sparkles },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'account', label: 'Account', icon: User },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('appearance')
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { theme, setTheme } = useTheme()
  const syncStatus = useAppStore((s) => s.syncStatus)
  const triggerSync = useSyncStore((s) => s.triggerSync)

  const settings = useSettings(user?.id ?? '')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Ensure settings row exists — creates defaults if this is the first time
  useEffect(() => {
    if (user?.id) {
      ensureDefaultSettings(user.id)
    }
  }, [user?.id])

  // Show spinner only while auth is still loading (user === null means not logged in yet)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
      </div>
    )
  }

  // If settings is still undefined (DB loading), show skeleton — not a permanent spinner
  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
      </div>
    )
  }

  const updateSetting = (key: keyof UserSettings, value: any) => {
    saveSettings({ ...settings, [key]: value, updatedAt: new Date().toISOString() })
  }

  const handleExport = async () => {
    await exportFullBackup(user.id)
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col md:flex-row gap-6 p-2 pb-20">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none',
                isActive
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon 
                className={cn(
                  'h-4.5 w-4.5 transition-colors', 
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'
                )} 
              />
              {tab.label}
              
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 md:p-8 overflow-y-auto">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Theme Preference</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((t) => {
                    const isSelected = theme === t || settings.theme === t
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t)
                          updateSetting('theme', t)
                        }}
                        className={cn(
                          'flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 outline-none',
                          isSelected
                            ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-[var(--color-text)]'
                            : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                        )}
                      >
                        <div className={cn(
                          'p-3 rounded-full mb-3 transition-colors',
                          isSelected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]'
                        )}>
                          {t === 'light' ? <Sun className="h-6 w-6" /> : t === 'dark' ? <Moon className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                        </div>
                        <span className="text-sm font-semibold capitalize">{t}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Accent Color</h3>
                <div className="flex flex-wrap gap-4">
                  {([
                    { id: 'violet', hex: '#8b5cf6' },
                    { id: 'cyan', hex: '#06b6d4' },
                    { id: 'emerald', hex: '#10b981' },
                    { id: 'rose', hex: '#f43f5e' },
                    { id: 'amber', hex: '#f59e0b' },
                  ] as { id: AccentColor; hex: string }[]).map((c) => {
                    const isSelected = settings.accent === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          updateSetting('accent', c.id)
                          document.documentElement.setAttribute('data-accent', c.id)
                        }}
                        className={cn(
                          'group relative w-12 h-12 rounded-full transition-all duration-200 outline-none',
                          isSelected 
                            ? 'ring-2 ring-offset-4 ring-offset-[var(--color-bg)] ring-[var(--color-accent)]' 
                            : 'hover:scale-110 active:scale-95'
                        )}
                        title={c.id}
                      >
                        {/* Inner color circle */}
                        <div 
                          className="w-full h-full rounded-full shadow-sm flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-white shadow-sm animate-in zoom-in duration-300" />
                          )}
                        </div>
                        
                        {/* Hover ring (subtle) */}
                        <div className="absolute inset-0 rounded-full ring-2 ring-[var(--color-accent)] opacity-0 group-hover:opacity-20 transition-opacity" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Default Editor Mode</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['rich', 'split', 'write', 'preview'] as EditorMode[]).map((m) => {
                    const isSelected = settings.editorMode === m
                    return (
                      <button
                        key={m}
                        onClick={() => updateSetting('editorMode', m)}
                        className={cn(
                          'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all outline-none',
                          isSelected
                            ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-[var(--color-text)]'
                            : 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                        )}
                      >
                        <span className="text-xs font-semibold capitalize">{m}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--color-text)]">Studio Layout</h3>
                <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                    Restore all sidebar panels (Doubts, Timestamps, Commands, etc.) to their default visible state if you've hidden them.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => {
                      // We use window dispatch or similar if available, or just global store access
                      if (typeof window !== 'undefined') {
                        // The store might be exposed for debugging or we can use a custom event
                        window.dispatchEvent(new CustomEvent('restore-all-panels'))
                      }
                    }}
                  >
                    Restore All Panels
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Checkbox
                  checked={settings.autoSave}
                  onCheckedChange={(c) => updateSetting('autoSave', c)}
                  label="Enable Autosave"
                  description="Automatically save changes while typing"
                />
              </div>
            </div>
          )}

          {/* Cloud Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <Checkbox
                  checked={settings.cloudSyncEnabled}
                  onCheckedChange={(c) => updateSetting('cloudSyncEnabled', c)}
                  label="Enable Cloud Sync"
                  description="Sync your data securely with Supabase"
                />
              </div>
              
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]">
                <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Sync Status</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Cloud className={cn('h-5 w-5', syncStatus === 'syncing' ? 'text-[var(--color-warning)] animate-pulse' : syncStatus === 'synced' ? 'text-[var(--color-success)]' : syncStatus === 'error' ? 'text-[var(--color-error)]' : 'text-[var(--color-text-faint)]')} />
                    <span className="text-sm text-[var(--color-text-muted)] capitalize">{syncStatus}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => triggerSync()} disabled={syncStatus === 'syncing' || !settings.cloudSyncEnabled}>
                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* AI Provider Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm text-[var(--color-text-muted)]">
                Connect an AI provider to enable the Learning Assistant, automatic flashcard generation, and summaries.
              </p>
              <AIKeySetup />
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--color-surface-2)] rounded-lg">
                    <Download className="h-5 w-5 text-[var(--color-text)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Export Data</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                      Download a complete JSON backup of your local learning data, including sessions, notes, timestamps, doubts, and reviews.
                    </p>
                    <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                      Export Backup
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--color-surface-2)] rounded-lg">
                    <Upload className="h-5 w-5 text-[var(--color-text)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">Import Data</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                      Restore your learning data from a JSON backup file. This will merge with your existing data.
                    </p>
                    <Button onClick={() => setIsImportModalOpen(true)} className="w-full sm:w-auto">
                      Import Backup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { desc: 'Command Palette', keys: ['⌘', 'K'] },
                  { desc: 'Toggle Sidebar', keys: ['⌘', '\\'] },
                  { desc: 'New Session', keys: ['⌘', 'N'] },
                  { desc: 'Save Note', keys: ['⌘', 'S'] },
                  { desc: 'Focus Mode', keys: ['⌘', 'Shift', 'F'] },
                  { desc: 'Capture Timestamp', keys: ['⌘', 'T'] },
                ].map((s) => (
                  <div key={s.desc} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]">
                    <span className="text-sm text-[var(--color-text)]">{s.desc}</span>
                    <div className="flex gap-1.5">
                      {s.keys.map((k) => (
                        <kbd key={k} className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-xs font-sans font-medium text-[var(--color-text)] min-w-[24px] text-center">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-5 p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]">
                <div className="h-16 w-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold">
                  {user.user_metadata?.['full_name']?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">{user.user_metadata?.['full_name'] || 'Account'}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-error)]">Danger Zone</h3>
                <div className="p-5 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">Sign Out</h4>
                  <p className="text-xs text-[var(--color-text-muted)] mb-5">Sign out of this device securely.</p>
                  <Button variant="destructive" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} />
    </div>
  )
}
