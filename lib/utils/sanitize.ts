/**
 * Basic sanitization utility for TutorialOS
 * Primarily used before saving rich text or markdown to the database
 * to prevent basic injection attacks if rendered raw elsewhere.
 * 
 * Note: React and ReactMarkdown already handle XSS natively when rendering,
 * but this provides defense-in-depth for stored data.
 */

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Basic script tag removal
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline event handlers
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    // Remove javascript: pseudo-protocol
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/href='javascript:[^']*'/gi, "href='#'")
}

export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return ''
  
  // Basic stripping of inline HTML from markdown to enforce pure markdown
  // (Optional depending on how strict you want to be)
  return markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
