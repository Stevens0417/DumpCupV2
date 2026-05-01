'use client'

import { useEffect } from 'react'

/**
 * Renders nothing. On mount, checks whether the app is running as an installed
 * PWA and adds `is-standalone` to <body> if so. This lets CSS rules keyed on
 * `body.is-standalone` activate as a fallback alongside the
 * `@media (display-mode: standalone)` media query (needed for iOS Safari <13
 * and as a belt-and-suspenders measure).
 */
export default function StandaloneDetector() {
  useEffect(() => {
    const mediaMatch = window.matchMedia('(display-mode: standalone)').matches
    const navStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (mediaMatch || navStandalone) {
      document.body.classList.add('is-standalone')
    }
  }, [])

  return null
}
