'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        'markdown-preview overflow-auto px-8 py-6 h-full',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-[var(--color-text)] mt-6 mb-3 pb-2 border-b border-[var(--color-border-subtle)]">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-[var(--color-text)] mt-5 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-[var(--color-text)] mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-[var(--color-text)] leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-[var(--color-text)]">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-[var(--color-text)]">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--color-accent)] pl-4 py-1 my-3 text-[var(--color-text-muted)] italic text-sm">
              {children}
            </blockquote>
          ),
          code: ({ inline, className: cls, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono text-xs bg-[var(--color-surface-2)] text-[var(--color-accent)] border border-[var(--color-border-subtle)]">
                  {children}
                </code>
              )
            }
            return (
              <pre className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 overflow-x-auto my-3">
                <code className="font-mono text-xs text-[var(--color-text)] leading-relaxed">{children}</code>
              </pre>
            )
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[var(--color-border)] px-3 py-1.5 text-left font-semibold text-[var(--color-text)] bg-[var(--color-surface-2)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)]">
              {children}
            </td>
          ),
          hr: () => <hr className="border-[var(--color-border-subtle)] my-4" />,
          strong: ({ children }) => <strong className="font-semibold text-[var(--color-text)]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[var(--color-text-muted)]">{children}</em>,
        }}
      >
        {content || '*No content yet. Switch to Write or Rich mode to start.*'}
      </ReactMarkdown>
    </div>
  )
}
