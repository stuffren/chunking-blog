import { Octokit } from '@octokit/core';
import { marked } from 'marked';
import hljs from 'highlight.js';
// 修改：新增 readFile 导入,用于读取 Vite 构建后的 dist/index.html 提取 assets 路径
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(__dirname, 'dist');

// 新增：从环境变量读取部署子路径前缀，本地为空字符串，GitHub Pages CI 为 /chunking-blog
const BASE_PATH = process.env.BASE_PATH ? process.env.BASE_PATH.replace(/\/$/, '') : '';

// 配置 marked 使用 highlight.js
marked.use({
  renderer: {
    code(code, language) {
      const validLang = language && hljs.getLanguage(language);
      const highlighted = validLang 
        ? hljs.highlight(code, { language }).value 
        : hljs.highlightAuto(code).value;
      return `<pre><code class="hljs language-${language || 'plaintext'}">${highlighted}</code></pre>`;
    }
  }
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN });
const OWNER = process.env.VITE_GITHUB_OWNER;
const REPO = process.env.VITE_GITHUB_REPO;

// 修改：从环境变量读取 BASE_URL,默认使用 GitHub Pages 地址
const BASE_URL = process.env.VITE_BASE_URL || `https://${OWNER}.github.io/${REPO}`;

// HTML 模板
// 修改：pageTemplate 函数新增 assets 参数,用于接收 Vite 构建后的 assets 路径
function pageTemplate({ title, description, body, type = 'website', url, image, assets }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Chunking</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image || BASE_URL + '/og-default.png'}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <!-- 修改：移除开发环境路径的独立样式引用,改用 Vite 构建后的 CSS assets -->
  <link rel="stylesheet" crossorigin href="${assets.css}">
</head>
<body>
  <div id="app">
    <header class="site-header">
      <div class="container">
        <nav class="main-nav">
          <!-- 修改：所有内部导航链接自动拼上 BASE_PATH，适配 GitHub Pages 子路径部署 -->
          <a href="${BASE_PATH}/" class="logo">chunking</a>
          <div class="nav-links">
            <a href="${BASE_PATH}/categories">Categories</a>
            <a href="${BASE_PATH}/tags">Tags</a>
            <a href="${BASE_PATH}/about">About</a>
          </div>
        </nav>
      </div>
    </header>
    <main class="site-main">
      ${body}
    </main>
    <footer class="site-footer">
      <div class="container">
        <p>© 2026 Vanilla JS Development - All rights reserved.</p>
      </div>
    </footer>
  </div>
  <!-- 修改：移除开发环境路径的 /src/main.js,改用 Vite 构建后的 JS assets -->
  <script type="module" crossorigin src="${assets.js}"></script>
</body>
</html>`;
}

export async function generateSSG() {
  // 修改：不再删除整个 dist/ 目录,避免删除 Vite 构建的 assets/
  // 原代码：try { await rm(DIST_DIR, { recursive: true }); } catch {}
  // 原代码：await mkdir(DIST_DIR, { recursive: true });
  await mkdir(DIST_DIR, { recursive: true });

  // 新增：读取 Vite 构建后的 index.html,提取 assets 路径
  // 放置位置：在 mkdir 之后,数据拉取之前
  let assets = { js: '/assets/main.js', css: '/assets/main.css' };
  try {
    const indexHtml = await readFile(join(DIST_DIR, 'index.html'), 'utf-8');
    const jsMatch = indexHtml.match(/src="(\/[^"]+\.js)"/);
    const cssMatch = indexHtml.match(/href="(\/[^"]+\.css)"/);
    if (jsMatch) assets.js = jsMatch[1];
    if (cssMatch) assets.css = cssMatch[1];
    console.log('Assets found:', assets);
  } catch (e) {
    console.warn('Could not read dist/index.html, using default asset paths');
  }

  // 并行拉取数据
  // 修改：移除不存在的 discussions/categories 端点
  const [discussionsRes, labelsRes] = await Promise.all([
    octokit.request('GET /repos/{owner}/{repo}/discussions', { 
      owner: OWNER, repo: REPO, per_page: 100 
    }),
    octokit.request('GET /repos/{owner}/{repo}/labels', { 
      owner: OWNER, repo: REPO 
    })
  ]);

  const discussions = discussionsRes.data;

  // 修改：从 discussions 中提取分类,而不是调用不存在的 API
  const categoryMap = new Map();
  discussions.forEach(d => {
    if (d.category && !categoryMap.has(d.category.id)) {
      categoryMap.set(d.category.id, d.category);
    }
  });
  const categories = Array.from(categoryMap.values());

  const labels = labelsRes.data;

  // 分类数据
  const posts = discussions.filter(d => d.category?.name !== 'About' && d.category?.name !== 'Draft');
  const aboutDiscussion = discussions.find(d => d.category?.name === 'About');

  // 1. 生成首页
  // 修改：传入 assets 参数
  await writePage('index.html', {
    title: 'Chunking',
    description: 'A blog powered by GitHub Discussions',
    body: renderHomeBody(posts),
    url: BASE_URL,
    assets  // 新增：传入 Vite 构建后的 assets 路径
  });

  // 2. 生成文章详情页
  for (const post of posts) {
    // 修改：传入 assets 参数
    await writePage(`posts/${post.number}.html`, {
      title: post.title,
      description: extractExcerpt(post.body),
      type: 'article',
      url: `${BASE_URL}/posts/${post.number}`,
      image: extractFirstImage(post.body),
      body: renderPostBody(post),
      assets  // 新增：传入 Vite 构建后的 assets 路径
    });
  }

  // 3. 生成分类列表页
  // 修改：传入 assets 参数
  await writePage('categories.html', {
    title: 'Categories',
    description: 'Browse all categories',
    body: renderCategoriesListBody(categories, posts),
    url: `${BASE_URL}/categories`,
    assets  // 新增：传入 Vite 构建后的 assets 路径
  });

  // 4. 生成分类详情页
  for (const cat of categories) {
    const catPosts = posts.filter(p => p.category?.id === cat.id);
    // 修改：传入 assets 参数
    await writePage(`categories/${slugify(cat.name)}.html`, {
      title: `${cat.name} - Categories`,
      description: `${catPosts.length} articles in ${cat.name}`,
      body: renderCategoryBody(cat, catPosts),
      url: `${BASE_URL}/categories/${slugify(cat.name)}`,
      assets  // 新增：传入 Vite 构建后的 assets 路径
    });
  }

  // 5. 生成标签列表页
  // 修改：传入 assets 参数
  await writePage('tags.html', {
    title: 'Tags',
    description: 'Browse all tags',
    body: renderTagsListBody(labels, posts),
    url: `${BASE_URL}/tags`,
    assets  // 新增：传入 Vite 构建后的 assets 路径
  });

  // 6. 生成标签详情页
  for (const label of labels) {
    const tagPosts = posts.filter(p => p.labels?.some(l => l.id === label.id));
    // 修改：传入 assets 参数
    await writePage(`tags/${slugify(label.name)}.html`, {
      title: `${label.name} - Tags`,
      description: `${tagPosts.length} articles tagged with ${label.name}`,
      body: renderTagBody(label, tagPosts),
      url: `${BASE_URL}/tags/${slugify(label.name)}`,
      assets  // 新增：传入 Vite 构建后的 assets 路径
    });
  }

  // 7. 生成 About 页
  if (aboutDiscussion) {
    // 修改：传入 assets 参数
    await writePage('about.html', {
      title: 'About',
      description: 'About Chunking blog',
      body: renderAboutBody(aboutDiscussion),
      url: `${BASE_URL}/about`,
      assets  // 新增：传入 Vite 构建后的 assets 路径
    });
  }

  // 8. 生成 sitemap.xml
  await generateSitemap(posts, categories, labels);

  console.log(`✅ SSG complete: ${posts.length} posts, ${categories.length} categories, ${labels.length} tags`);
}

// 页面渲染函数
function renderHomeBody(posts) {
  const postList = posts.map(post => `
    <article class="post-card">
      <!-- 修改：内部链接拼上 BASE_PATH -->
      <h2><a href="${BASE_PATH}/posts/${post.number}">${escapeHtml(post.title)}</a></h2>
      <div class="post-meta">
        <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
        <span class="category-tag">${escapeHtml(post.category?.name || '')}</span>
      </div>
      <p class="post-excerpt">${escapeHtml(extractExcerpt(post.body, 200))}</p>
      <div class="post-tags">
        ${(post.labels || []).map(l => `<span class="tag">${escapeHtml(l.name)}</span>`).join('')}
      </div>
    </article>
  `).join('');

  return `
    <div class="page-home container">
      <h1>Latest Posts</h1>
      <div class="post-list">
        ${postList}
      </div>
    </div>
  `;
}

function renderPostBody(post) {
  const htmlContent = marked(post.body || '');

  return `
    <article class="page-post container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <span>${escapeHtml(post.title)}</span>
      </nav>
      <header class="post-header">
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
          <!-- 修改：内部链接拼上 BASE_PATH -->
          <a href="${BASE_PATH}/categories/${slugify(post.category?.name || '')}" class="category-link">${escapeHtml(post.category?.name || '')}</a>
          ${(post.labels || []).map(l => `<a href="${BASE_PATH}/tags/${slugify(l.name)}" class="tag">${escapeHtml(l.name)}</a>`).join('')}
        </div>
      </header>
      <div class="post-content">
        ${htmlContent}
      </div>
      <div class="giscus" 
        data-repo="${OWNER}/${REPO}"
        data-repo-id="${process.env.VITE_GISCUS_REPO_ID}"
        data-category="Comments"
        data-category-id="${process.env.VITE_GISCUS_CATEGORY_ID}"
        data-mapping="specific"
        data-term="${post.number}"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN">
      </div>
    </article>
  `;
}

function renderCategoriesListBody(categories, posts) {
  return `
    <div class="page-categories container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <span>Categories</span>
      </nav>
      <h1>Categories</h1>
      <div class="category-grid">
        ${categories.map(cat => {
          const count = posts.filter(p => p.category?.id === cat.id).length;
          return `
            <!-- 修改：内部链接拼上 BASE_PATH -->
            <a href="${BASE_PATH}/categories/${slugify(cat.name)}" class="category-card">
              <h2>${escapeHtml(cat.name)}</h2>
              <p class="category-desc">${escapeHtml(cat.description || '')}</p>
              <span class="count">${count} articles</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderCategoryBody(cat, catPosts) {
  return `
    <div class="page-category-detail container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <a href="${BASE_PATH}/categories">Categories</a>
        <span class="sep">/</span>
        <span>${escapeHtml(cat.name)}</span>
      </nav>
      <header class="category-header">
        <h1>${escapeHtml(cat.name)}</h1>
        <p class="stats">${catPosts.length} articles</p>
        <p class="description">${escapeHtml(cat.description || '')}</p>
      </header>
      <div class="post-list">
        ${catPosts.map(post => `
          <article class="post-card">
            <!-- 修改：内部链接拼上 BASE_PATH -->
            <h2><a href="${BASE_PATH}/posts/${post.number}">${escapeHtml(post.title)}</a></h2>
            <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTagsListBody(labels, posts) {
  const maxCount = Math.max(...labels.map(l => posts.filter(p => p.labels?.some(pl => pl.id === l.id)).length), 1);

  return `
    <div class="page-tags container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <span>Tags</span>
      </nav>
      <h1>Tags</h1>
      <div class="tag-cloud">
        ${labels.map(label => {
          const count = posts.filter(p => p.labels?.some(l => l.id === label.id)).length;
          const size = 0.8 + (count / maxCount) * 1.2;
          return `
            <!-- 修改：内部链接拼上 BASE_PATH -->
            <a href="${BASE_PATH}/tags/${slugify(label.name)}" class="tag-item" style="font-size: ${size.toFixed(2)}rem">
              ${escapeHtml(label.name)}
              <span class="count">${count}</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTagBody(label, tagPosts) {
  return `
    <div class="page-tag-detail container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <a href="${BASE_PATH}/tags">Tags</a>
        <span class="sep">/</span>
        <span>${escapeHtml(label.name)}</span>
      </nav>
      <header class="tag-header">
        <h1>${escapeHtml(label.name)}</h1>
        <p class="stats">${tagPosts.length} articles</p>
      </header>
      <div class="post-list">
        ${tagPosts.map(post => `
          <article class="post-card">
            <!-- 修改：内部链接拼上 BASE_PATH -->
            <h2><a href="${BASE_PATH}/posts/${post.number}">${escapeHtml(post.title)}</a></h2>
            <time datetime="${post.created_at}">${formatDate(post.created_at)}</time>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAboutBody(about) {
  const htmlContent = marked(about.body || '');
  return `
    <div class="page-about container">
      <nav class="breadcrumb" aria-label="breadcrumb">
        <!-- 修改：内部链接拼上 BASE_PATH -->
        <a href="${BASE_PATH}/">Home</a>
        <span class="sep">/</span>
        <span>About</span>
      </nav>
      <h1>About</h1>
      <div class="about-content">
        ${htmlContent}
      </div>
    </div>
  `;
}

// 辅助函数
async function writePage(path, data) {
  const fullPath = join(DIST_DIR, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, pageTemplate(data));
}

async function generateSitemap(posts, categories, labels) {
  const urls = [
    { loc: BASE_URL, priority: '1.0' },
    { loc: `${BASE_URL}/categories`, priority: '0.8' },
    { loc: `${BASE_URL}/tags`, priority: '0.8' },
    { loc: `${BASE_URL}/about`, priority: '0.8' },
    ...posts.map(p => ({ loc: `${BASE_URL}/posts/${p.number}`, priority: '0.9' })),
    ...categories.map(c => ({ loc: `${BASE_URL}/categories/${slugify(c.name)}`, priority: '0.7' })),
    ...labels.map(l => ({ loc: `${BASE_URL}/tags/${slugify(l.name)}`, priority: '0.7' }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;

  await writeFile(join(DIST_DIR, 'sitemap.xml'), xml);
}

function extractExcerpt(body, maxLength = 160) {
  if (!body) return '';
  const text = body.replace(/[#*`[\]()]/g, '').replace(/\n+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function extractFirstImage(body) {
  if (!body) return null;
  const match = body.match(/!\[.*?\]\((.*?)\)/);
  return match ? match[1] : null;
}

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function escapeHtml(text) {
  const div = { toString: () => '' };
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// 自动执行 SSG
generateSSG().catch(err => {
  console.error('❌ SSG failed:', err);
  process.exit(1);
});