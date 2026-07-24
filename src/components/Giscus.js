// src/components/Giscus.js
// Giscus 评论组件 - 官方推荐方式
// 修改：将 data-* 属性直接设置在 script 标签上，而非容器 div 上
// 原因：Giscus 客户端优先读取 script 标签的 data-* 属性

export function Giscus(discussionNumber) {
  // 创建 Giscus 渲染容器
  const container = document.createElement('div');
  container.className = 'giscus';
  
  // 修改：创建带有正确 data-* 属性的 script 标签
  // 原代码：先创建容器，再由 main.js 的 MutationObserver 动态加载脚本
  // 现在：将 script 直接嵌入容器，属性设置在 script 上（官方推荐方式）
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.crossOrigin = 'anonymous';
  script.async = true;
  
  // 关键修改：所有配置属性直接设置在 script 标签上
  // Giscus 客户端会优先读取这些属性
  script.setAttribute('data-repo', `${__GITHUB_OWNER__}/${__GITHUB_REPO__}`);
  script.setAttribute('data-repo-id', __GISCUS_REPO_ID__);
  script.setAttribute('data-category', 'Comments');
  script.setAttribute('data-category-id', __GISCUS_CATEGORY_ID__);
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', String(discussionNumber));
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'bottom');
  script.setAttribute('data-theme', 'preferred_color_scheme');
  script.setAttribute('data-lang', 'zh-CN');
  
  // 将 script 附加到容器内
  // 当容器挂载到 DOM 时，script 会立即执行并读取自身属性
  container.appendChild(script);
  
  return container;
}

// 修改：移除 loadGiscusScript 函数
// 原代码：导出 loadGiscusScript 供 main.js 调用
// 现在：script 随容器一起创建，无需外部触发加载