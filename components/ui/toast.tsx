'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { toast as sonnerToast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
        },
        classNames: {
          toast: 'shadow-[0_8px_32px_rgba(0,0,0,0.32)]',
          title: 'font-medium text-[var(--color-text)]',
          description: 'text-[var(--color-text-muted)]',
          actionButton: 'bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium',
          cancelButton: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] rounded-[var(--radius-sm)] px-3 py-1 text-xs',
          success: 'border-l-2 border-[var(--color-success)]',
          error: 'border-l-2 border-[var(--color-error)]',
          warning: 'border-l-2 border-[var(--color-warning)]',
          info: 'border-l-2 border-[var(--color-accent)]',
        },
      }}
      gap={8}
      richColors={false}
    />
  )
}

export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
