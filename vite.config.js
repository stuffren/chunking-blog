import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => {
  const env = loadEnv(command === 'build' ? 'production' : 'development', process.cwd(), '');

  console.log('Env check:', {
    hasOwner: !!env.VITE_GITHUB_OWNER,
    hasRepo: !!env.VITE_GITHUB_REPO,
    hasToken: !!env.VITE_GITHUB_TOKEN,
    hasRepoId: !!env.VITE_GISCUS_REPO_ID,
    hasCatId: !!env.VITE_GISCUS_CATEGORY_ID
  });

  return {
    // 修改：仅在生产构建时根据 CI 注入的 BASE_PATH 设置资源前缀
    // 本地开发 (npm run dev) 和预览 (npm run preview) 始终使用根路径 '/'
    base: command === 'build' ? (process.env.BASE_PATH || '/') : '/',
    root: '.',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    define: {
      __GITHUB_OWNER__: JSON.stringify(env.VITE_GITHUB_OWNER || ''),
      __GITHUB_REPO__: JSON.stringify(env.VITE_GITHUB_REPO || ''),
      __GITHUB_TOKEN__: JSON.stringify(env.VITE_GITHUB_TOKEN || ''),
      __GISCUS_REPO_ID__: JSON.stringify(env.VITE_GISCUS_REPO_ID || ''),
      __GISCUS_CATEGORY_ID__: JSON.stringify(env.VITE_GISCUS_CATEGORY_ID || '')
    }
  };
});