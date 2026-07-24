import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { api } from '../api/github.js';
import { formatDate } from '../utils/helpers.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function CategoryDetail(params = {}, query = {}) {
  const { slug } = params;
  
  const [categories, posts] = await Promise.all([
    api.getCategories(),
    api.getDiscussions(1, 100)
  ]);
  
  const category = categories.find(c => slugify(c.name) === slug);
  if (!category) {
    throw new Error('Category not found');
  }
  
  const catPosts = posts.filter(p => p.category?.id === category.id);
  
  const container = document.createElement('div');
  container.className = 'page-category-detail container';
  
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: 'Categories', href: '/categories' },
    { text: category.name }
  ]));
  
  const header = document.createElement('header');
  header.className = 'category-header';
  
  const h1 = document.createElement('h1');
  h1.textContent = category.name;
  header.appendChild(h1);
  
  const stats = document.createElement('p');
  stats.className = 'stats';
  stats.textContent = `${catPosts.length} articles`;
  header.appendChild(stats);
  
  if (category.description) {
    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = category.description;
    header.appendChild(desc);
  }
  
  container.appendChild(header);
  
  const list = document.createElement('div');
  list.className = 'post-list';
  
  catPosts.forEach(post => {
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