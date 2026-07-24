import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { api } from '../api/github.js';
import { formatDate } from '../utils/helpers.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function TagDetail(params = {}, query = {}) {
  const { slug } = params;
  
  const [labels, posts] = await Promise.all([
    api.getLabels(),
    api.getDiscussions(1, 100)
  ]);
  
  const label = labels.find(l => slugify(l.name) === slug);
  if (!label) {
    throw new Error('Tag not found');
  }
  
  const tagPosts = posts.filter(p => p.labels?.some(l => l.id === label.id));
  
  const container = document.createElement('div');
  container.className = 'page-tag-detail container';
  
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: 'Tags', href: '/tags' },
    { text: label.name }
  ]));
  
  const header = document.createElement('header');
  header.className = 'tag-header';
  
  const h1 = document.createElement('h1');
  h1.textContent = label.name;
  header.appendChild(h1);
  
  const stats = document.createElement('p');
  stats.className = 'stats';
  stats.textContent = `${tagPosts.length} articles`;
  header.appendChild(stats);
  
  container.appendChild(header);
  
  const list = document.createElement('div');
  list.className = 'post-list';
  
  tagPosts.forEach(post => {
    const article = document.createElement('article');
    article.className = 'post-card';
    
    const h2 = document.createElement('h2');
    const link = document.createElement('a');
    link.href = `/posts/${post.number}`;
    link.textContent = post.title;
    h2.appendChild(link);
    article.appendChild(h2);
    
    const time = document.createElement('time');
    time.dateTime = post.created_at;
    time.textContent = formatDate(post.created_at);
    article.appendChild(time);
    
    list.appendChild(article);
  });
  
  container.appendChild(list);
  
  return Layout(container);
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}