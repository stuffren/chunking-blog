// src/main.js
// 应用入口：初始化路由、Hydration

import { router } from './router.js';
import { Home } from './pages/Home.js';
import { Categories } from './pages/Categories.js';
import { CategoryDetail } from './pages/CategoryDetail.js';
import { Tags } from './pages/Tags.js';
import { TagDetail } from './pages/TagDetail.js';
import { About } from './pages/About.js';
import { PostDetail } from './pages/PostDetail.js';

// 注册路由
// 每个 handler 接收两个参数：
//   - params：动态路由参数（如 /posts/:id 中的 { id: '5' }）
//   - query：URL 查询参数（如 /?page=2 中的 { page: '2' }）
// handler 将这两个参数传给对应页面组件，并直接 return 组件生成的 DOM 元素
// router.js 内部的 resolve 方法会负责把返回的 DOM 挂载到页面上
router
  .register('/', async (params, query) => {
    return await Home(params, query);
  })
  .register('/categories', async (params, query) => {
    return await Categories(params, query);
  })
  .register('/categories/:slug', async (params, query) => {
    return await CategoryDetail(params, query);
  })
  .register('/tags', async (params, query) => {
    return await Tags(params, query);
  })
  .register('/tags/:slug', async (params, query) => {
    return await TagDetail(params, query);
  })
  .register('/about', async (params, query) => {
    return await About(params, query);
  })
  .register('/posts/:id', async (params, query) => {
    return await PostDetail(params, query);
  });

function init() {
  const app = document.getElementById('app');
  
  // 检测是否为预渲染页面（构建后的静态 HTML）
  const isPrerendered = app.querySelector('.site-wrapper') !== null;
  
  if (isPrerendered) {
    // 预渲染页面：执行 Hydration，接管导航
    hydrate();
  } else {
    // 开发模式：客户端完整渲染
    // 先告诉 router 应该把内容渲染到哪个容器里
    router.setContainer('#app');
    // 然后启动 router，解析当前 URL 并渲染对应页面
    router.init();
  }
}

function hydrate() {
  // 绑定导航点击事件拦截
  // 点击内部链接时阻止默认跳转，交给 router 处理
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    
    // 跳过外部链接、锚点、特殊协议
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // 跳过新窗口链接
    if (link.target === '_blank' || e.ctrlKey || e.metaKey) {
      return;
    }

    e.preventDefault();
    router.navigate(href);
  });
}

// 启动应用
init();