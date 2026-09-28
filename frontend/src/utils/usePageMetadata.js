import { useEffect } from 'react';

const SITE_URL = 'https://ammotors-lb.web.app';

function getOrCreateMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    document.head.appendChild(element);
  }
  return element;
}

export function usePageMetadata({ title, description, path = '/', robots = 'index, follow' }) {
  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();
    document.title = title;

    getOrCreateMeta('meta[name="description"]', { name: 'description' }).setAttribute('content', description);
    getOrCreateMeta('meta[name="robots"]', { name: 'robots' }).setAttribute('content', robots);
    getOrCreateMeta('meta[property="og:title"]', { property: 'og:title' }).setAttribute('content', title);
    getOrCreateMeta('meta[property="og:description"]', { property: 'og:description' }).setAttribute('content', description);
    getOrCreateMeta('meta[property="og:url"]', { property: 'og:url' }).setAttribute('content', canonicalUrl);
    getOrCreateMeta('meta[name="twitter:title"]', { name: 'twitter:title' }).setAttribute('content', title);
    getOrCreateMeta('meta[name="twitter:description"]', { name: 'twitter:description' }).setAttribute('content', description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [description, path, robots, title]);
}
