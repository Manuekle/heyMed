import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: [
        '*',
        'Googlebot',
        'Bingbot',
        'PerplexityBot',
        'ChatGPT-User',
        'ClaudeBot',
        'anthropic-ai',
        'GPTBot',
      ],
      allow: '/',
    },
    sitemap: 'https://heymed.app/sitemap.xml',
  }
}
