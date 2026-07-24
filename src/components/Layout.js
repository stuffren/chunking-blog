import { Header } from './Header.js';
import { Footer } from './Footer.js';

export function Layout(content) {
  const container = document.createElement('div');
  container.className = 'site-wrapper';
  
  container.appendChild(Header());
  
  const main = document.createElement('main');
  main.className = 'site-main';
  if (content instanceof HTMLElement) {
    main.appendChild(content);
  }
  container.appendChild(main);
  
  container.appendChild(Footer());
  
  return container;
}