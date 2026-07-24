import { Layout } from '../components/Layout.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { Giscus } from '../components/Giscus.js';
import { api } from '../api/github.js';
import { renderMarkdown } from '../utils/markdown.js';
import { formatDate } from '../utils/helpers.js';

// 修改：函数签名增加 query 参数，兼容 router 新接口
export async function PostDetail(params = {}, query = {}) {
  const { id } = params;
  
  // 获取文章详情
  const post = await api.getDiscussion(id);
  
  const container = document.createElement('article');
  container.className = 'page-post container';
  
  // 面包屑
  container.appendChild(Breadcrumb([
    { text: 'Home', href: '/' },
    { text: post.title }
  ]));
  
  // 文章头部
  const header = document.createElement('header');
  header.className = 'post-header';
  
  const h1 = document.createElement('h1');
  h1.textContent = post.title;
  header.appendChild(h1);
  
  const meta = document.createElement('div');
  meta.className = 'post-meta';
  
  const time = document.createElement('time');
  time.dateTime = post.created_at;
  time.textContent = formatDate(post.created_at);
  meta.appendChild(time);
  
  if (post.category) {
    const catLink = document.createElement('a');
    catLink.href = `/categories/${slugify(post.category.name)}`;
    catLink.className = 'category-link';
    catLink.textContent = post.category.name;
    meta.appendChild(catLink);
  }
  
  (post.labels || []).forEach(label => {
    const tag = document.createElement('a');
    tag.href = `/tags/${slugify(label.name)}`;
    tag.className = 'tag';
    tag.textContent = label.name;
    meta.appendChild(tag);
  });
  
  header.appendChild(meta);
  container.appendChild(header);
  
  // 文章内容
  const content = document.createElement('div');
  content.className = 'post-content';
  content.innerHTML = renderMarkdown(post.body);
  container.appendChild(content);
  
  // Giscus 评论
  container.appendChild(Giscus(post.number));
  
  return Layout(container);
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}