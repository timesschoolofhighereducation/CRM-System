'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

interface SanitizedHtmlProps {
  html: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}

/**
 * Renders HTML content sanitized with DOMPurify to prevent XSS.
 * Use this instead of dangerouslySetInnerHTML with user- or admin-editable content.
 */
export function SanitizedHtml({ html, className, as: Tag = 'div' }: SanitizedHtmlProps) {
  const [sanitized, setSanitized] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && html) {
      setSanitized(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }))
    } else {
      setSanitized('')
    }
  }, [html])

  // Server or before sanitization: render empty to avoid unsanitized HTML
  if (!sanitized) {
    return <Tag className={className} suppressHydrationWarning />
  }

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
      suppressHydrationWarning
    />
  )
}
