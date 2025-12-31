"use client"

import { useTheme } from "@/lib/theme-provider"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const updateTheme = () => {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light")
      }
      
      updateTheme()
      mediaQuery.addEventListener("change", updateTheme)
      
      return () => mediaQuery.removeEventListener("change", updateTheme)
    } else {
      setResolvedTheme(theme as "light" | "dark")
    }
  }, [theme])

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(142, 76%, 36%)",
          "--success-text": "hsl(355, 7%, 97%)",
          "--success-border": "hsl(142, 76%, 36%)",
          "--error-bg": "hsl(0, 84%, 60%)",
          "--error-text": "hsl(355, 7%, 97%)",
          "--error-border": "hsl(0, 84%, 60%)",
          "--warning-bg": "hsl(38, 92%, 50%)",
          "--warning-text": "hsl(355, 7%, 97%)",
          "--warning-border": "hsl(38, 92%, 50%)",
          "--info-bg": "hsl(199, 89%, 48%)",
          "--info-text": "hsl(355, 7%, 97%)",
          "--info-border": "hsl(199, 89%, 48%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          success: "bg-green-600 text-white border-green-600 dark:bg-green-500",
          error: "bg-red-600 text-white border-red-600 dark:bg-red-500",
          warning: "bg-orange-500 text-white border-orange-500 dark:bg-orange-400",
          info: "bg-blue-600 text-white border-blue-600 dark:bg-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
