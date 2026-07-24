export function Breadcrumb(items) {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'breadcrumb');
  
  items.forEach((item, index) => {
    if (index > 0) {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '/';
      nav.appendChild(sep);
    }
    
    if (item.href) {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.text;
      nav.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = item.text;
      nav.appendChild(span);
    }
  });
  
  return nav;
}