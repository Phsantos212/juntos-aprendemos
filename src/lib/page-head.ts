export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Aprender Juntos` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} — Aprender Juntos` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
