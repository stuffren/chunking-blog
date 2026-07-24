import { Layout } from '../components/Layout.js';
import { PostCard } from '../components/PostCard.js';
import { Pagination } from '../components/Pagination.js';
import { api } from '../api/github.js';
import { router } from '../router.js'; // 新增：导入 router 用于分页导航

const POSTS_PER_PAGE = 10;

export async function Home(params = {}, query = {}) {
  const page = parseInt(query.page) || 1;
  
  // 获取文章列表（当前页，已按 POSTS_PER_PAGE 切片）
  const posts = await api.getDiscussions(page, POSTS_PER_PAGE);
  // 修改：通过独立 API 获取全量文章总数，用于准确计算总页数
  // 修复原 posts.length 在第2页时仅为3，导致分页组件总页数计算错误的问题
  const totalPosts = await api.getTotalDiscussions();
  
  const container = document.createElement('div');
  container.className = 'page-home container';
  
  const title = document.createElement('h1');
  title.textContent = 'Latest Posts';
  container.appendChild(title);
  
  const list = document.createElement('div');
  list.className = 'post-list';
  
  posts.forEach(post => {
    list.appendChild(PostCard(post));
  });
  
  container.appendChild(list);
  
  // 分页（基于全量文章总数计算，确保第1页和第2页均正确显示分页按钮）
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE) || 1;
  if (totalPages > 1) {
    container.appendChild(Pagination({
      current: page,
      total: totalPages,
      onPageChange: (newPage) => {
        const url = new URL(location.href);
        url.searchParams.set('page', newPage);
        // 修改：统一使用 router.navigate 进行导航，确保 router 状态与 URL 同步
        // 修复从第2页点击 Logo 回首页无反应的问题（Bug 3）
        router.navigate(url.pathname + url.search);
      }
    }));
  }
  
  return Layout(container);
}

// 删除：renderHome 辅助函数
// 分页切换现在由 router.navigate -> resolve -> Home handler 完整链路驱动，
// 无需手动操作 DOM，避免与 router 的渲染逻辑重复。