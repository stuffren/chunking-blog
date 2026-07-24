import { Octokit } from '@octokit/core';
import { cache } from './cache.js';

const octokit = new Octokit({ auth: __GITHUB_TOKEN__ });
const OWNER = __GITHUB_OWNER__;
const REPO = __GITHUB_REPO__;

async function fetchWithCache(type, key, fetcher, ttl) {
  const cached = cache.get(`${type}_${key}`);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(`${type}_${key}`, data, ttl);
  return data;
}

export const api = {
  // 修改：缓存键纳入 perPage，避免不同分页参数之间缓存冲突
  // 例如：getDiscussions(1, 10) 与 getDiscussions(1, 100) 将使用独立缓存
  getDiscussions(page = 1, perPage = 10) {
    return fetchWithCache('discussions', `p${page}_pp${perPage}`, async () => {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/discussions',
        { owner: OWNER, repo: REPO, per_page: perPage, page }
      );
      return data;
    });
  },

  getDiscussion(number) {
    return fetchWithCache('discussion', number, async () => {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/discussions/{discussion_number}',
        { owner: OWNER, repo: REPO, discussion_number: number }
      );
      return data;
    }, 10 * 60 * 1000); // 10分钟
  },

  // 修改：增加降级处理（分类页空白问题修复成果，保持不变）
  async getCategories() {
    try {
      return await fetchWithCache('categories', 'all', async () => {
        const { data } = await octokit.request(
          'GET /repos/{owner}/{repo}/discussions/categories',
          { owner: OWNER, repo: REPO }
        );
        return data;
      }, 30 * 60 * 1000); // 30分钟
    } catch (error) {
      console.warn('Failed to fetch categories, falling back to discussions:', error);
      // 降级：从 discussions 中提取唯一分类
      const discussions = await this.getDiscussions(1, 100);
      const categoryMap = new Map();
      discussions.forEach(d => {
        if (d.category && !categoryMap.has(d.category.id)) {
          categoryMap.set(d.category.id, d.category);
        }
      });
      return Array.from(categoryMap.values());
    }
  },

  getLabels() {
    return fetchWithCache('labels', 'all', async () => {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/labels',
        { owner: OWNER, repo: REPO }
      );
      return data;
    }, 30 * 60 * 1000); // 30分钟
  },

  // 新增：获取全部文章总数，用于首页分页计算总页数
  // 通过 per_page: 100 获取全量文章后返回数组长度，缓存键独立为 discussions_total
  getTotalDiscussions() {
    return fetchWithCache('discussions', 'total', async () => {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/discussions',
        { owner: OWNER, repo: REPO, per_page: 100, page: 1 }
      );
      return data.length;
    });
  }
};