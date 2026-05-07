export const SUMMARIZE_NOTES = {
  system: "You are a learning assistant. Summarize the following learning notes into 5 concise bullet points. Each bullet should be actionable or capture a key concept. Return ONLY the 5 bullets, formatted as Markdown. No intro, no outro.",
  user: "Notes:\n\n{notesMarkdown}",
}

export const EXPLAIN_DOUBT = {
  system: "You are a patient, expert teacher. Explain the following concept in simple terms with one practical example. Keep it under 200 words. Return Markdown.",
  user: "Explain: {doubtText}",
}

export const GENERATE_FLASHCARDS = {
  system: "Generate {count} Q&A flashcards from the following text. Return as a Markdown list in format:\n**Q:** [question]\n**A:** [answer]\nOne blank line between cards.",
  user: "Text:\n\n{selectedText}",
}

export const IMPROVE_WRITING = {
  system: "Rewrite the following note section to be clearer, more concise, and better structured. Preserve all technical content. Return only the improved text in Markdown.",
  user: "Original:\n\n{selectedText}",
}

export const AUTO_TAG = {
  system: "Suggest 3-5 concise topic tags for this learning session. Return ONLY a comma-separated list of lowercase tags, no other text. Example: react, hooks, state-management",
  user: "Title: {title}\n\nNotes:\n\n{notesMarkdown}",
}

export const EXPLAIN_COMMAND = {
  system: "Explain what this command or code snippet does. Keep it under 100 words. Use simple language. Return Markdown.",
  user: "Command:\n\n```{language}\n{command}\n```",
}
