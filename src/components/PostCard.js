import { formatDate } from '../utils/helpers.js';

export function PostCard(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  
  const title = document.createElement('h2');
  const link = document.createElement('a');
  link.href = `/posts/${post.number}`;
  link.textContent = post.title;
  title.appendChild(link);
  
  const meta = document.createElement('div');
  meta.className = 'post-meta';
  
  const time = document.createElement('time');
  time.dateTime = post.created_at;
  time.textContent = formatDate(post.created_at);
  
  const category = document.createElement('span');
  category.className = 'category-tag';
  category.textContent = post.category?.name || '';
  
  meta.appendChild(time);
  meta.appendChild(category);
  
  const excerpt = document.createElement('p');
  excerpt.className = 'post-excerpt';
  excerpt.textContent = extractExcerpt(post.body, 200);
  
  const tags = document.createElement('div');
  tags.className = 'post-tags';
  (post.labels || []).forEach(label => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = label.name;
    tags.appendChild(tag);
  });
  
  article.appendChild(title);
  article.appendChild(meta);
  article.appendChild(excerpt);
  article.appendChild(tags);
  
  return article;
}

function extractExcerpt(body, maxLength = 200) {
  if (!body) return '';
  const text = body.replace(/[#*`[\]()]/g, '').replace(/\n+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}