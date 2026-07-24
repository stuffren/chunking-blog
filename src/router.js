// SPA Router - 原生 JavaScript 实现
class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.beforeHooks = [];
    this.container = null;
  }

  // 注册路由
  register(path, handler) {
    // 将路径转换为正则表达式
    const keys = [];
    const regexPath = path.replace(/:([^/]+)/g, (match, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    
    this.routes.push({
      path,
      regex: new RegExp(`^${regexPath}$`),
      keys,
      handler
    });
    return this;
  }

  // 导航到指定路径
  // 修改：path 现在为完整路径（pathname + search），currentRoute 同步存储完整路径
  // 确保 pathname 相同但 query string 不同的导航（如 /?page=2 -> /）能被正确处理
  // 修改：改为 async，确保 resolve（含异步页面组件渲染）完成后再继续
  async navigate(path, replace = false) {
    if (this.currentRoute === path) return;
    
    // 执行 before hooks
    for (const hook of this.beforeHooks) {
      const result = hook(path);
      if (result === false) return;
    }

    // 更新历史
    if (replace) {
      history.replaceState({ path }, '', path);
    } else {
      history.pushState({ path }, '', path);
    }

    this.currentRoute = path;
    // 修改：await resolve，等待异步页面组件完全渲染
    await this.resolve(path);
  }

  // 解析并渲染路由
  // 修改：接收完整路径（含 search），分离 pathname 与 query string
  // 将 query 对象作为第二个参数传给页面 handler
  // 修改：改为 async，支持 await 异步页面组件（如 Home.js）
  async resolve(path = location.pathname + location.search) {
    this.currentRoute = path;
    
    // 解析完整 URL，分离 pathname 与 query string
    const url = new URL(path, location.origin);
    const pathname = url.pathname;
    const query = Object.fromEntries(url.searchParams);
    
    // 查找匹配的路由（基于 pathname）
    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 提取参数
        const params = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });

        // 滚动到顶部
        window.scrollTo(0, 0);

        // 执行处理器，传入 params 与 query
        // 修改：await 异步页面组件，确保 Promise 解析为 HTMLElement 后再挂载
        const result = await route.handler(params, query);
        
        // 渲染到容器
        if (this.container && result) {
          this.container.innerHTML = '';
          if (result instanceof HTMLElement) {
            this.container.appendChild(result);
          } else if (typeof result === 'string') {
            this.container.innerHTML = result;
          }
        }

        // 更新标题（如果处理器返回了标题）
        if (result && result._title) {
          document.title = result._title;
        }

        return;
      }
    }

    // 404 处理
    this.handle404();
  }

  // 404 页面
  handle404() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="page-404 container">
          <h1>404</h1>
          <p>Page not found</p>
          <a href="/">Go Home</a>
        </div>
      `;
    }
    document.title = '404 | Chunking';
  }

  // 添加导航前钩子
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  // 设置渲染容器
  setContainer(selector) {
    this.container = document.querySelector(selector);
    return this;
  }

  // 初始化：绑定事件
  init() {
    // 处理浏览器前进/后退
    window.addEventListener('popstate', (e) => {
      // 修改：优先使用 state.path，否则回退到 pathname + search
      const path = e.state?.path || (location.pathname + location.search);
      this.resolve(path);
    });

    // 拦截链接点击
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
      // 修改：传递完整 href（含 search），由 navigate 统一处理
      this.navigate(href);
    });

    // 初始解析当前路由
    // 修改：传递完整路径（pathname + search）
    this.resolve(location.pathname + location.search);

    return this;
  }
}

// 创建单例
export const router = new Router();