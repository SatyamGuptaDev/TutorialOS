'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import React from 'react'
import { formatSeconds } from '@/lib/utils'

function TimestampNodeView({ node, extension }: NodeViewProps) {
  const timeSeconds = node.attrs['timeSeconds'] as number ?? 0
  const label = node.attrs['label'] as string ?? ''
  const onSeek = (extension.options as { onSeek?: (s: number) => void }).onSeek

  const handleClick = () => onSeek?.(timeSeconds)

  return (
    <NodeViewWrapper as="span" className="inline-block select-none">
      <button
        onClick={handleClick}
        contentEditable={false}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-semibold cursor-pointer select-none mx-0.5 transition-colors"
        style={{
          background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
          color: 'var(--color-accent)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
        }}
        title={label ? `Seek to ${formatSeconds(timeSeconds)} — ${label}` : `Seek to ${formatSeconds(timeSeconds)}`}
      >
        ⏱ {formatSeconds(timeSeconds)}
        {label && <span className="font-sans font-normal opacity-80">· {label}</span>}
      </button>
    </NodeViewWrapper>
  )
}

export const TimestampExtension = Node.create({
  name: 'timestamp',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return { onSeek: undefined as ((seconds: number) => void) | undefined }
  },

  addAttributes() {
    return {
      timeSeconds: { default: 0 },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-timestamp]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-timestamp': '' }), 0]
  },

  renderText({ node }) {
    return `[ts:${node.attrs['timeSeconds']}:${node.attrs['label']}]`
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimestampNodeView)
  },
})
