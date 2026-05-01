'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe hook that returns true when the app is running as an installed PWA
 * (standalone display mode). Checks both the CSS media query and the iOS
 * Safari-specific navigator.standalone property.
 *
 * Always returns false on the server and on the first client render to avoid
 * hydration mismatches.
 */
export function useStandalonePWA(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const mediaMatch = window.matchMedia('(display-mode: standalone)').matches
    const navStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(mediaMatch || navStandalone)
  }, [])

  return isStandalone
}
