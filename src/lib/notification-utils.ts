'use client'

// Safe wrapper for Notification API to prevent SSR errors
// Enhanced for cross-browser and cross-OS compatibility
export class SafeNotification {
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check for standard Notification API
    if ('Notification' in window) return true
    
    // Check for service worker registration (for PWA support)
    if ('serviceWorker' in navigator) return true
    
    return false
  }

  static get permission(): NotificationPermission | null {
    if (!this.isSupported()) return null
    
    try {
      // Check standard Notification API
      if ('Notification' in window) {
        return Notification.permission
      }
    } catch (error) {
      console.warn('Error checking notification permission:', error)
    }
    
    return 'default'
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied'
    
    try {
      // Request permission using standard API
      if ('Notification' in window) {
        // Some browsers require user interaction, so we check first
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          return permission
        }
        return Notification.permission
      }
    } catch (error) {
      console.warn('Error requesting notification permission:', error)
    }
    
    return 'denied'
  }

  static create(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported()) return null
    
    try {
      // Use standard Notification API
      if ('Notification' in window) {
        // Enhanced options for better cross-browser support
        // Build options object with only standard NotificationOptions properties
        const enhancedOptions: NotificationOptions = {
          icon: options?.icon || '/fav.png',
          body: options?.body || '',
          tag: options?.tag || `notification-${Date.now()}`,
          requireInteraction: options?.requireInteraction || false,
          silent: options?.silent || false,
          data: options?.data,
          dir: options?.dir || 'auto',
          lang: options?.lang,
        }

        // Add badge if supported (some browsers support it)
        if ('badge' in Notification.prototype) {
          (enhancedOptions as any).badge = '/fav.png'
        }

        // Remove undefined values to avoid browser issues
        Object.keys(enhancedOptions).forEach(key => {
          const value = enhancedOptions[key as keyof NotificationOptions]
          if (value === undefined || value === null) {
            delete enhancedOptions[key as keyof NotificationOptions]
          }
        })

        const notification = new Notification(title, enhancedOptions)
        
        // Add click handler for better UX
        // onclick is a property of the Notification object, not NotificationOptions
        if (options?.data?.url) {
          notification.onclick = (event) => {
            event.preventDefault()
            
            // Focus the window
            if (window.focus) {
              window.focus()
            }
            
            // Navigate to URL if provided
            if (options.data?.url) {
              window.location.href = options.data.url
            }
            
            notification.close()
          }
        }
        
        // Auto-close after 5 seconds for non-critical notifications
        if (!options?.requireInteraction && !options?.data?.persistent) {
          setTimeout(() => {
            notification.close()
          }, 5000)
        }
        
        return notification
      }
    } catch (error) {
      console.warn('Error creating notification:', error)
      // Fallback: try with minimal options
      try {
        return new Notification(title, {
          body: options?.body || '',
          icon: '/fav.png'
        })
      } catch (fallbackError) {
        console.error('Failed to create notification even with fallback:', fallbackError)
      }
    }
    
    return null
  }

  // Helper method to check if notifications are enabled and request if needed
  static async ensurePermission(): Promise<boolean> {
    if (!this.isSupported()) return false
    
    const currentPermission = this.permission
    if (currentPermission === 'granted') return true
    if (currentPermission === 'denied') return false
    
    // Request permission
    const permission = await this.requestPermission()
    return permission === 'granted'
  }
}
