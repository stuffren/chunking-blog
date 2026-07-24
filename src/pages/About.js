import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { api } from '../api/github.js';
import { renderMarkdown } from '../utils/markdown.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function About(params = {}, query = {}) {
  // 获取 About 文章（category 为 About 的 discussion）
  const posts = await api.getDiscussions(1, 100);
  const aboutPost = posts.find(p => p.category?.name === 'About');
  
  const container = document.createElement('div');
  container.className = 'page-about container';
  
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: 'About' }
  ]));
  
  const h1 = document.createElement('h1');
  h1.textContent = 'About';
  container.appendChild(h1);
  
  const content = document.createElement('div');
  content.className = 'about-content';
  
  if (aboutPost) {
    content.innerHTML = renderMarkdown(aboutPost.body);
  } else {
    content.innerHTML = '<p>No about content found.</p>';
  }
  
  container.appendChild(content);
  
  return Layout(container);
}