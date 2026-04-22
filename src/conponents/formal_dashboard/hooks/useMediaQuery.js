import { useEffect, useState } from 'react'

export function useMediaQuery(query, defaultValue = false) {
  const getInitialMatch = () => {
    if (typeof window === 'undefined' || !query) {
      return defaultValue
    }

    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState(getInitialMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || !query) {
      return undefined
    }

    const mediaQuery = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQuery.matches)

    updateMatch()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatch)
      return () => mediaQuery.removeEventListener('change', updateMatch)
    }

    mediaQuery.addListener(updateMatch)
    return () => mediaQuery.removeListener(updateMatch)
  }, [query])

  return matches
}

export function useCompactLayout() {
  return useMediaQuery('(max-width: 639px)')
}
