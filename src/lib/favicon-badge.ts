/**
 * Favicon Badge Utility
 * Dynamically updates the browser tab favicon with a red notification badge
 * Works across all browsers (Chrome, Firefox, Safari, Edge) and all OS platforms
 */

let originalFavicon: string | null = null
let canvas: HTMLCanvasElement | null = null

/**
 * Initialize the canvas for drawing favicon badges
 */
function getCanvas(): HTMLCanvasElement {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
  }
  return canvas
}

/**
 * Get the original favicon URL
 */
function getOriginalFavicon(): string {
  if (originalFavicon) {
    return originalFavicon
  }

  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
  if (link) {
    originalFavicon = link.href
  } else {
    originalFavicon = '/fav.png' // Fallback to default
  }
  
  return originalFavicon
}

/**
 * Update the favicon link element
 */
function updateFaviconLink(dataURL: string) {
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  
  link.href = dataURL
  link.type = 'image/png'
}

/**
 * Draw a badge on the favicon
 */
function drawBadge(count: number, faviconImg: HTMLImageElement): string {
  const canvas = getCanvas()
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    return faviconImg.src
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw the original favicon
  ctx.drawImage(faviconImg, 0, 0, canvas.width, canvas.height)
  
  if (count > 0) {
    // Badge configuration
    const badgeSize = count > 99 ? 24 : count > 9 ? 20 : 16
    const badgeX = canvas.width - badgeSize / 2 - 2
    const badgeY = badgeSize / 2 + 2
    const badgeRadius = badgeSize / 2
    
    // Draw red circle badge
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI)
    ctx.fillStyle = '#EF4444' // Tailwind red-500
    ctx.fill()
    
    // Add white border for better visibility
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw count text
    const displayCount = count > 99 ? '99+' : count.toString()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${count > 99 ? 9 : count > 9 ? 11 : 13}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayCount, badgeX, badgeY)
  }
  
  return canvas.toDataURL('image/png')
}

/**
 * Update the favicon with a notification badge
 * @param count - Number of unread notifications (0 to remove badge)
 */
export function updateFaviconBadge(count: number): void {
  // Skip in server-side rendering
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const originalSrc = getOriginalFavicon()
  
  // If count is 0, restore original favicon
  if (count === 0) {
    updateFaviconLink(originalSrc)
    return
  }

  // Load the original favicon and draw badge
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  img.onload = () => {
    const badgedFavicon = drawBadge(count, img)
    updateFaviconLink(badgedFavicon)
  }
  
  img.onerror = () => {
    // If loading fails, try to create a simple badge without the base image
    const canvas = getCanvas()
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw a simple red circle as fallback
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, 2 * Math.PI)
    ctx.fillStyle = '#EF4444'
    ctx.fill()
    
    // Draw count
    const displayCount = count > 99 ? '99+' : count.toString()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 16px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayCount, canvas.width / 2, canvas.height / 2)
    
    updateFaviconLink(canvas.toDataURL('image/png'))
  }
  
  img.src = originalSrc
}

/**
 * Update the document title with notification count
 * @param baseTitle - Base title (e.g., "TSHE CRM")
 * @param count - Number of unread notifications
 */
export function updateDocumentTitle(baseTitle: string, count: number): void {
  if (typeof document === 'undefined') {
    return
  }

  if (count > 0) {
    const displayCount = count > 99 ? '99+' : count.toString()
    document.title = `(${displayCount}) ${baseTitle}`
  } else {
    document.title = baseTitle
  }
}

/**
 * Update both favicon badge and document title
 * @param count - Number of unread notifications
 * @param baseTitle - Base title for the document (default: "TSHE CRM")
 */
export function updateNotificationBadge(count: number, baseTitle: string = 'TSHE CRM'): void {
  updateFaviconBadge(count)
  updateDocumentTitle(baseTitle, count)
}

/**
 * Reset favicon and title to original state
 */
export function resetNotificationBadge(baseTitle: string = 'TSHE CRM'): void {
  updateNotificationBadge(0, baseTitle)
}

