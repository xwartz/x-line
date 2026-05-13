import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowUpRight, FileText, Link2, Repeat2 } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import type { Tweet } from '../types'
import { Avatar } from './Avatar'
import { SmartImage } from './SmartImage'

interface TweetCardProps {
  tweet: Tweet
}

interface ContentRenderContext {
  authorName: string
  username: string
  sharedByName?: string
}

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' '
}

const INLINE_TOKEN_REGEX = /([#@][^\s#@，。！？、；：,.!?()[\]{}<>]+)/gu

function decodeHtmlEntities(text: string) {
  return text.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    entity => HTML_ENTITY_MAP[entity] ?? entity
  )
}

function normalizeContentHref(href: string) {
  const secureHref = href.replace(/^http:\/\//i, 'https://')

  if (secureHref.startsWith('/search')) {
    try {
      const searchUrl = new URL(`https://nitter.net${secureHref}`)
      const query = searchUrl.searchParams.get('q')
      if (query) {
        return `https://x.com/search?q=${encodeURIComponent(query)}`
      }
    } catch {
      return `https://x.com/search`
    }
  }

  if (secureHref.startsWith('/')) {
    return `https://x.com${secureHref}`
  }

  try {
    const url = new URL(secureHref)
    if (url.hostname === 'nitter.net' && url.pathname.includes('/status/')) {
      return `https://x.com${url.pathname}${url.search}`
    }
    if (url.hostname === 'nitter.net' && url.pathname.startsWith('/search')) {
      const query = url.searchParams.get('q')
      if (query) {
        return `https://x.com/search?q=${encodeURIComponent(query)}`
      }
      return 'https://x.com/search'
    }
    if (url.hostname === 'nitter.net') {
      return `https://x.com${url.pathname}${url.search}`
    }
    return url.toString()
  } catch {
    return secureHref
  }
}

function isOpaqueArticleLabel(text: string) {
  return /(^|\/\/)(x|twitter)\.com\/i\/article\//i.test(text)
}

function getContentLinkVariant(href: string, label: string) {
  if (label.trim().startsWith('#') || label.trim().startsWith('@')) {
    return 'entity'
  }

  if (/x\.com\/search\?/i.test(href)) {
    return 'entity'
  }

  if (/x\.com\/i\/article\//i.test(href)) {
    return 'article'
  }

  if (/(x\.com|twitter\.com)\/.+\/status\//i.test(href)) {
    return 'status'
  }

  if (/\/i\/broadcasts\//i.test(href) || /piped\.video\/live\//i.test(href)) {
    return 'broadcast'
  }

  return 'link'
}

function getContentLinkLabel(href: string, fallbackText: string) {
  const variant = getContentLinkVariant(href, fallbackText)

  if (variant === 'article') {
    return '长文'
  }

  if (variant === 'status') {
    return '相关推文'
  }

  if (variant === 'broadcast') {
    return '直播回放'
  }

  return fallbackText || href
}

function getArticleTitle(
  label: string,
  context: ContentRenderContext | undefined
) {
  const trimmedLabel = label.trim()
  if (trimmedLabel && !isOpaqueArticleLabel(trimmedLabel)) {
    return trimmedLabel
  }

  if (context?.authorName) {
    return `${context.authorName} 的长文`
  }

  return '长文入口'
}

function getArticleMeta(context: ContentRenderContext | undefined) {
  const parts = ['X Articles']

  if (context?.username) {
    parts.unshift(`@${context.username}`)
  }

  if (context?.sharedByName && context.sharedByName !== context.authorName) {
    parts.push(`${context.sharedByName} 转发`)
  }

  return parts.join(' · ')
}

function getMediaFrameClass(mediaCount: number, isQuote = false) {
  if (mediaCount === 1) {
    return ''
  }

  return isQuote ? 'h-[92px] sm:h-[120px]' : 'h-[132px] sm:h-[180px]'
}

function getMediaImageClass(mediaCount: number, isQuote = false) {
  if (mediaCount === 1) {
    return isQuote
      ? 'w-full max-h-[180px] sm:max-h-[250px]'
      : 'w-full max-h-[300px] sm:max-h-[400px]'
  }

  return 'h-full w-full'
}

function renderInlineText(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let tokenIndex = 0

  for (const match of text.matchAll(INLINE_TOKEN_REGEX)) {
    const token = match[0]
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${tokenIndex}`}>
          {text.slice(lastIndex, matchIndex)}
        </Fragment>
      )
    }

    nodes.push(
      <span
        key={`${keyPrefix}-token-${tokenIndex}`}
        className="inline-block whitespace-nowrap font-medium text-[var(--foreground)]"
      >
        {token}
      </span>
    )

    lastIndex = matchIndex + token.length
    tokenIndex += 1
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</Fragment>
    )
  }

  if (nodes.length === 0) {
    return [<Fragment key={`${keyPrefix}-plain`}>{text}</Fragment>]
  }

  return nodes
}

function renderContentLink(
  href: string,
  label: string,
  key: string,
  context?: ContentRenderContext
) {
  const variant = getContentLinkVariant(href, label)

  if (variant === 'entity') {
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline whitespace-nowrap font-medium text-[var(--foreground)] underline decoration-[var(--border)] decoration-1 underline-offset-4 hover:decoration-[var(--foreground)]"
        title={href}
      >
        {label}
      </a>
    )
  }

  if (variant === 'article') {
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="my-4 flex w-full max-w-full items-start justify-between gap-3 border border-[var(--foreground)] bg-[var(--background)] px-4 py-4 text-[var(--foreground)] no-underline transition-colors hover:bg-[var(--muted)]"
        title={href}
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Longform
            </span>
            <span className="mt-1 block text-[17px] leading-7 text-[var(--foreground)] sm:text-[18px]">
              {getArticleTitle(label, context)}
            </span>
            <span className="mt-2 block [font-family:var(--font-sans)] text-xs text-[var(--muted-foreground)]">
              {getArticleMeta(context)}
            </span>
          </span>
        </span>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
      </a>
    )
  }

  if (variant === 'status' || variant === 'broadcast') {
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="my-3 inline-flex max-w-full items-center gap-2 border border-[var(--foreground)] px-3 py-2 [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] no-underline transition-colors hover:bg-[var(--muted)]"
        title={href}
      >
        <Link2 className="h-4 w-4 shrink-0" />
        <span>{getContentLinkLabel(href, label)}</span>
      </a>
    )
  }

  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-[var(--link)] underline-offset-4 hover:underline"
      title={href}
    >
      {label || href}
    </a>
  )
}

function renderTweetContent(
  content: string,
  contentHtml: string | undefined,
  context?: ContentRenderContext
): ReactNode {
  const source = contentHtml?.trim()
  if (!source) {
    return renderInlineText(content, 'content-fallback')
  }

  const normalizedHtml = source.replace(/<br\s*\/?>/gi, '\n')
  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let linkIndex = 0

  for (const match of normalizedHtml.matchAll(linkRegex)) {
    const [fullMatch, rawHref = '', rawLabel = ''] = match
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      const text = decodeHtmlEntities(
        normalizedHtml.slice(lastIndex, matchIndex)
      )
      if (text) {
        nodes.push(...renderInlineText(text, `content-text-${linkIndex}`))
      }
    }

    const href = normalizeContentHref(decodeHtmlEntities(rawHref))
    const label = decodeHtmlEntities(rawLabel)

    nodes.push(
      renderContentLink(href, label, `content-link-${linkIndex}`, context)
    )

    lastIndex = matchIndex + fullMatch.length
    linkIndex += 1
  }

  if (lastIndex < normalizedHtml.length) {
    const text = decodeHtmlEntities(normalizedHtml.slice(lastIndex))
    if (text) {
      nodes.push(...renderInlineText(text, `content-tail-${linkIndex}`))
    }
  }

  if (nodes.length === 0) {
    return renderInlineText(content, 'content-plain')
  }

  return nodes
}

export function TweetCard({ tweet }: TweetCardProps) {
  const publishedDate = new Date(tweet.publishedAt)
  const timeAgo = formatDistanceToNow(publishedDate, {
    addSuffix: true,
    locale: zhCN
  })

  // 格式化具体时间：年-月-日 时:分:秒 +时区
  const formattedTime = format(publishedDate, 'yyyy-MM-dd HH:mm:ss XX')
  const quoteLabel = tweet.retweet ? '转评原帖' : '引用推文'

  return (
    <article className="animate-fade-in card-hover relative px-0 py-4 first:pt-6 sm:py-7">
      {tweet.retweet && (
        <div className="mb-3 flex items-center gap-1.5 [font-family:var(--font-sans)] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)] sm:mb-4 sm:text-[11px]">
          <Repeat2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{tweet.retweet.displayName} 转发</span>
        </div>
      )}

      <div className="flex gap-2.5 sm:gap-4">
        <a
          href={`https://x.com/${tweet.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 pt-0.5 sm:pt-1"
        >
          <Avatar
            src={tweet.avatar}
            alt={tweet.displayName}
            size="sm"
            className="sm:hidden"
          />
          <Avatar
            src={tweet.avatar}
            alt={tweet.displayName}
            size="md"
            className="hidden sm:block"
          />
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 [font-family:var(--font-sans)] sm:gap-x-2">
            <a
              href={`https://x.com/${tweet.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[13px] font-bold uppercase leading-5 tracking-[0.12em] text-[var(--foreground)] hover:underline sm:text-[15px]"
            >
              {tweet.displayName}
            </a>
            <span className="text-[11px] leading-5 text-[var(--muted-foreground)] sm:text-sm">
              @{tweet.username}
            </span>
            <span className="text-[11px] leading-5 text-[var(--muted-foreground)] sm:text-sm">
              ·
            </span>
            <a
              href={tweet.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] leading-5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:text-sm"
              title={formattedTime}
            >
              {timeAgo}
            </a>
          </div>

          <div className="tweet-content mt-2.5 text-[15px] leading-[1.65] text-[var(--foreground)] sm:mt-3 sm:text-[18px] sm:leading-[1.55]">
            {renderTweetContent(tweet.content, tweet.contentHtml, {
              authorName: tweet.displayName,
              username: tweet.username,
              sharedByName: tweet.retweet?.displayName
            })}
          </div>

          {tweet.media && tweet.media.length > 0 && (
            <div className="mt-4 overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:mt-5">
              <div
                className={`grid gap-0.5 sm:gap-1 ${
                  tweet.media.length === 1
                    ? 'grid-cols-1'
                    : tweet.media.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2'
                }`}
              >
                {tweet.media.slice(0, 4).map((media, index) => (
                  <a
                    key={index}
                    href={tweet.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative block overflow-hidden bg-[var(--background)] ${getMediaFrameClass(
                      tweet.media!.length
                    )} ${
                      tweet.media!.length === 3 && index === 0
                        ? 'row-span-2'
                        : ''
                    }`}
                  >
                    <SmartImage
                      src={media.thumbnail || media.url}
                      alt={media.alt || 'Tweet media'}
                      className={`${getMediaImageClass(tweet.media!.length)} object-cover hover:opacity-95 transition-opacity duration-200`}
                      loading="lazy"
                    />
                    {(media.type === 'video' || media.type === 'gif') && (
                      <div className="absolute left-2 top-2 border border-[var(--foreground)] bg-[var(--background)] px-2 py-1 sm:left-3 sm:top-3">
                        <span className="[font-family:var(--font-sans)] text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] sm:text-xs">
                          {media.type === 'video' ? '▶ Video' : 'GIF'}
                        </span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {tweet.quote && (
            <div className="mt-4 border-t border-[var(--border)] pt-4 sm:mt-5 sm:pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="[font-family:var(--font-sans)] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)] sm:text-[11px]">
                  {quoteLabel}
                </div>
                <a
                  href={tweet.quote.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="[font-family:var(--font-sans)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:text-[11px]"
                >
                  查看原帖
                </a>
              </div>
              <div className="mt-2.5 border border-[var(--border)] bg-[var(--background)] p-3 transition-colors duration-150 hover:bg-[var(--muted)] sm:mt-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 [font-family:var(--font-sans)]">
                  <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--foreground)] sm:text-sm">
                    {tweet.quote.displayName}
                  </span>
                  <span className="text-[13px] text-[var(--muted-foreground)] sm:text-sm">
                    @{tweet.quote.username}
                  </span>
                </div>

                {tweet.quote.content && (
                  <div className="tweet-content mt-2.5 text-[14px] leading-6 text-[var(--foreground)] sm:mt-3 sm:text-[16px] sm:leading-7">
                    {renderTweetContent(
                      tweet.quote.content,
                      tweet.quote.contentHtml,
                      {
                        authorName: tweet.quote.displayName,
                        username: tweet.quote.username
                      }
                    )}
                  </div>
                )}

                {tweet.quote.media && tweet.quote.media.length > 0 && (
                  <div className="mt-3 overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:mt-4">
                    <div
                      className={`grid gap-0.5 sm:gap-1 ${
                        tweet.quote.media.length === 1
                          ? 'grid-cols-1'
                          : tweet.quote.media.length === 2
                            ? 'grid-cols-2'
                            : tweet.quote.media.length === 3
                              ? 'grid-cols-2'
                              : 'grid-cols-2'
                      }`}
                    >
                      {tweet.quote.media.map((media, i) => (
                        <a
                          key={i}
                          href={tweet.quote!.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`relative block overflow-hidden bg-[var(--background)] ${getMediaFrameClass(
                            tweet.quote!.media!.length,
                            true
                          )} ${
                            tweet.quote!.media!.length === 3 && i === 0
                              ? 'row-span-2'
                              : ''
                          }`}
                        >
                          <SmartImage
                            src={media.thumbnail || media.url}
                            alt={media.alt || ''}
                            className={`${getMediaImageClass(
                              tweet.quote!.media!.length,
                              true
                            )} object-cover hover:opacity-95 transition-opacity duration-200`}
                            loading="lazy"
                          />
                          {(media.type === 'video' || media.type === 'gif') && (
                            <div className="absolute left-2 top-2 border border-[var(--foreground)] bg-[var(--background)] px-2 py-1 sm:left-3 sm:top-3">
                              <span className="[font-family:var(--font-sans)] text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)] sm:text-xs">
                                {media.type === 'video' ? '▶' : 'GIF'}
                              </span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!tweet.quote.content &&
                  (!tweet.quote.media || tweet.quote.media.length === 0) && (
                    <div className="mt-3 [font-family:var(--font-sans)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                      查看原帖
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
