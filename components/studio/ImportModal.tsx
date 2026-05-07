'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { importFullBackup } from '@/lib/import'
import type { ImportResult } from '@/lib/import'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setIsImporting(true)
    setResult(null)
    
    try {
      const res = await importFullBackup(file)
      setResult(res)
    } catch (err) {
      setResult({ success: false, errors: [{ code: 'custom', path: [], message: (err as Error).message } as any] })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setFile(null)
      setResult(null)
      setIsImporting(false)
    }, 200)
  }

  return (
    <Modal
      title="Import Backup"
      description="Restore your sessions, doubts, commands, and review items from a JSON backup file."
      open={open}
      onOpenChange={(val) => { if (!val) handleClose() }}
    >
      <div className="space-y-4">
        {!result?.success && (
          <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-8 text-center transition-colors hover:border-[var(--color-accent)] cursor-pointer relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <Upload className="h-8 w-8 mb-2" />
              {file ? (
                <span className="font-medium text-[var(--color-text)]">{file.name}</span>
              ) : (
                <>
                  <span className="font-medium text-[var(--color-text)]">Click or drag file to upload</span>
                  <span className="text-sm text-[var(--color-text-faint)]">JSON backup files only</span>
                </>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-[var(--radius-sm)] text-sm">
            {result.success ? (
              <div className="text-[var(--color-success)] flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Import successful!</p>
                  <ul className="mt-2 space-y-1 text-[var(--color-text-muted)]">
                    <li>{result.imported.sessions} Sessions</li>
                    <li>{result.imported.timestamps} Timestamps</li>
                    <li>{result.imported.doubts} Doubts</li>
                    <li>{result.imported.commands} Commands</li>
                    <li>{result.imported.reviewItems} Review Items</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-danger)] flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Import failed. Invalid backup file.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err.path.join('.')} - {err.message}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={handleClose}>
            {result?.success ? 'Close' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              loading={isImporting}
            >
              Start Import
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
