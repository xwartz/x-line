function toHttps(url: string) {
  return url.replace(/^http:\/\//i, 'https://')
}

function decodeNitterProxyPath(url: string) {
  try {
    const parsed = new URL(toHttps(url))
    const match = parsed.pathname.match(/^\/pic\/(?:orig\/)?(.+)$/)
    if (!match) {
      return null
    }

    const decodedPath = decodeURIComponent(match[1])
    if (!decodedPath) {
      return null
    }

    if (/^https?:\/\//i.test(decodedPath)) {
      return toHttps(decodedPath)
    }

    return `https://pbs.twimg.com/${decodedPath.replace(/^\/+/, '')}`
  } catch {
    return null
  }
}

export function normalizeImageUrl(url?: string) {
  if (!url) {
    return undefined
  }

  const secureUrl = toHttps(url)
  return decodeNitterProxyPath(secureUrl) ?? secureUrl
}

export function buildImageFallbackChain(url?: string, fallbackUrl?: string) {
  const candidates = [
    normalizeImageUrl(url),
    url ? toHttps(url) : undefined,
    fallbackUrl,
  ]

  return candidates.filter((candidate, index, items): candidate is string => {
    return Boolean(candidate) && items.indexOf(candidate) === index
  })
}
