'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React from 'react'

type CalloutType = 'info' | 'warning' | 'success' | 'error'

const CALLOUT_CONFIG: Record<CalloutType, { emoji: string; color: string; bg: string; border: string }> = {
  info: { emoji: 'ℹ️', color: 'var(--color-accent)', bg: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: 'var(--color-accent)' },
  warning: { emoji: '⚠️', color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', border: 'var(--color-warning)' },
  success: { emoji: '✅', color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 8%, transparent)', border: 'var(--color-success)' },
  error: { emoji: '❌', color: 'var(--color-error)', bg: 'color-mix(in srgb, var(--color-error) 8%, transparent)', border: 'var(--color-error)' },
}

function CalloutNodeView({ node }: NodeViewProps) {
  const type = (node.attrs['type'] as CalloutType) ?? 'info'
  const cfg = CALLOUT_CONFIG[type]!

  return (
    <NodeViewWrapper>
      <div
        className="flex gap-3 p-4 rounded-[var(--radius-md)] my-2"
        style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
      >
        <span className="text-base shrink-0 mt-0.5 select-none">{cfg.emoji}</span>
        <NodeViewContent className="flex-1 text-sm leading-relaxed focus:outline-none" />
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
