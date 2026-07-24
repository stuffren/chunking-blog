export function Footer() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  
  const container = document.createElement('div');
  container.className = 'container';
  
  const p = document.createElement('p');
  p.textContent = '© 2026 Vanilla JS Development - All rights reserved.';
  
  container.appendChild(p);
  footer.appendChild(container);
  
  return footer;
}