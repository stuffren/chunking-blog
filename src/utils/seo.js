// src/utils/seo.js
export function setPageMeta({ title, description, type = 'website', url, image }) {
  document.title = title ? `${title} | Chunking` : 'Chunking';
  
  const metas = [
    { name: 'description', content: description || '' },
    { property: 'og:title', content: title || 'Chunking' },
    { property: 'og:description', content: description || '' },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url || location.href },
    { property: 'og:image', content: image || '/og-default.png' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ];

  metas.forEach(meta => {
    const selector = meta.name 
      ? `meta[name="${meta.name}"]` 
      : `meta[property="${meta.property}"]`;
    let el = document.querySelector(selector);
    
    if (!el) {
      el = document.createElement('meta');
      if (meta.name) el.setAttribute('name', meta.name);
      else el.setAttribute('property', meta.property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', meta.content);
  });
}