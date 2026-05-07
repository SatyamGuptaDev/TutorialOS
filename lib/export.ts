import { remark } from 'remark'
import html from 'remark-html'
import { db } from './db/schema'
import type { Session } from '@/types'

// Helper to download blob
function downloadBlob(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitize(title: string): string {
  return title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

export function exportMarkdown(session: Session) {
  const filename = `${sanitize(session.title)}.md`
  downloadBlob(session.notesMarkdown, filename, 'text/markdown')
}

export async function exportHTML(session: Session) {
  const filename = `${sanitize(session.title)}.html`
  
  // Convert markdown to HTML
  const processed = await remark().use(html).process(session.notesMarkdown)
  const contentHtml = processed.toString()

  // Wrap in standalone HTML with basic styling
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${session.title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
      background: #fff;
    }
    h1, h2, h3 { color: #111; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 4px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e5e5; background: #121212; }
      h1, h2, h3 { color: #fff; }
      pre, code { background: #1e1e1e; }
      blockquote { border-left-color: #333; color: #a3a3a3; }
      a { color: #60a5fa; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`

  downloadBlob(fullHtml, filename, 'text/html')
}

export async function exportJSON(session: Session) {
  const filename = `${sanitize(session.title)}.json`
  
  // Fetch associated timestamps
  const timestamps = await db.timestamps.where('sessionId').equals(session.id).toArray()
  
  const payload = {
    ...session,
    timestamps
  }

  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json')
}

export async function exportFullBackup(userId: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0]
  const filename = `tutorialos-backup-${date}.json`

  const [sessions, timestamps, doubts, commands, reviewItems, settings] = await Promise.all([
    db.sessions.where('userId').equals(userId).toArray(),
    db.timestamps.where('userId').equals(userId).toArray(),
    db.doubts.where('userId').equals(userId).toArray(),
    db.commandSnippets.where('userId').equals(userId).toArray(),
    db.reviewItems.where('userId').equals(userId).toArray(),
    db.userSettings.get(userId)
  ])

  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sessions,
    timestamps,
    doubts,
    commands,
    reviewItems,
    settings
  }

  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json')
}
