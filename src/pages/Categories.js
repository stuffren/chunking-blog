import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { api } from '../api/github.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function Categories(params = {}, query = {}) {
  const [categories, posts] = await Promise.all([
    api.getCategories(),
    api.getDiscussions(1, 100)
  ]);
  
  const container = document.createElement('div');
  container.className = 'page-categories container';
  
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: 'Categories' }
  ]));
  
  const h1 = document.createElement('h1');
  h1.textContent = 'Categories';
  container.appendChild(h1);
  
  const grid = document.createElement('div');
  grid.className = 'category-grid';
  
  categories.forEach(cat => {
    const count = posts.filter(p => p.category?.id === cat.id).length;
    
    const card = document.createElement('a');
    card.href = `/categories/${slugify(cat.name)}`;
    card.className = 'category-card';
    
    const h2 = document.createElement('h2');
    h2.textContent = cat.name;
    card.appendChild(h2);
    
    if (cat.description) {
      const desc = document.createElement('p');
      desc.className = 'category-desc';
      desc.textContent = cat.description;
      card.appendChild(desc);
    }
    
    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = `${count} articles`;
    card.appendChild(countSpan);
    
    grid.appendChild(card);
  });
  
  container.appendChild(grid);
  
  return Layout(container);
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}