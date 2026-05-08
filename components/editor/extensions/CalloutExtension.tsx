'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React from 'react'

import { Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

type CalloutType = 'info' | 'warning' | 'success' | 'error'

const CALLOUT_CONFIG: Record<CalloutType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  info: { icon: Info, color: 'var(--color-accent)', bg: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: 'var(--color-accent)' },
  warning: { icon: AlertCircle, color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', border: 'var(--color-warning)' },
  success: { icon: CheckCircle2, color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: 'var(--color-success)' },
  error: { icon: XCircle, color: 'var(--color-error)', bg: 'color-mix(in srgb, var(--color-error) 8%, transparent)', border: 'var(--color-error)' },
}

function CalloutNodeView({ node }: NodeViewProps) {
  const type = (node.attrs['type'] as CalloutType) ?? 'info'
  const cfg = CALLOUT_CONFIG[type]!
  const Icon = cfg.icon

  return (
    <NodeViewWrapper>
      <div
        className="flex gap-3 p-4 rounded-[var(--radius-md)] my-4 border border-transparent"
        style={{ 
          background: cfg.bg, 
          borderLeft: `4px solid ${cfg.color}`,
          boxShadow: '0 2px 12px -4px rgba(0,0,0,0.1)'
        }}
      >
        <div className="shrink-0 mt-0.5 select-none" style={{ color: cfg.color }}>
          <Icon className="h-5 w-5" />
        </div>
        <NodeViewContent className="flex-1 text-[0.95rem] leading-relaxed focus:outline-none" />
      </div>
    </NodeViewWrapper>
  )
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      type: { default: 'info' as CalloutType },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]', getAttrs: (el) => ({ type: (el as HTMLElement).dataset['callout'] }) }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': HTMLAttributes['type'] as string }), 0]
  },

  renderText({ node }) {
    return `:::callout-${node.attrs['type']}\n`
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})
