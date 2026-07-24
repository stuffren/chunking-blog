export function Header() {
  const header = document.createElement('header');
  header.className = 'site-header';
  
  const container = document.createElement('div');
  container.className = 'container';
  
  const nav = document.createElement('nav');
  nav.className = 'main-nav';
  
  const logo = document.createElement('a');
  logo.href = '/';
  logo.className = 'logo';
  logo.textContent = 'chunking';
  
  const navLinks = document.createElement('div');
  navLinks.className = 'nav-links';
  
  const links = [
    { href: '/categories', text: 'Categories' },
    { href: '/tags', text: 'Tags' },
    { href: '/about', text: 'About' }
  ];
  
  links.forEach(({ href, text }) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    navLinks.appendChild(a);
  });
  
  nav.appendChild(logo);
  nav.appendChild(navLinks);
  container.appendChild(nav);
  header.appendChild(container);
  
  return header;
}