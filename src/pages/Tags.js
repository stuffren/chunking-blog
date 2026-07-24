import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { api } from '../api/github.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function Tags(params = {}, query = {}) {
  const [labels, posts] = await Promise.all([
    api.getLabels(),
    api.getDiscussions(1, 100)
  ]);
  
  const container = document.createElement('div');
  container.className = 'page-tags container';
  
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: 'Tags' }
  ]));
  
  const h1 = document.createElement('h1');
  h1.textContent = 'Tags';
  container.appendChild(h1);
  
  const maxCount = Math.max(
    ...labels.map(l => posts.filter(p => p.labels?.some(pl => pl.id === l.id)).length),
    1
  );
  
  const cloud = document.createElement('div');
  cloud.className = 'tag-cloud';
  
  labels.forEach(label => {
    const count = posts.filter(p => p.labels?.some(l => l.id === label.id)).length;
    const size = 0.8 + (count / maxCount) * 1.2;
    
    const item = document.createElement('a');
    item.href = `/tags/${slugify(label.name)}`;
    item.className = 'tag-item';
    item.style.fontSize = `${size.toFixed(2)}rem`;
    item.innerHTML = `${escapeHtml(label.name)} <span class="count">${count}</span>`;
    
    cloud.appendChild(item);
  });
  
  container.appendChild(cloud);
  
  return Layout(container);
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}